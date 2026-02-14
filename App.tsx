import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import InputForm from './components/InputForm';
import ArchetypeCard from './components/ArchetypeCard';
import ComparisonView from './components/ComparisonView';
import SavedArchetypesView from './components/SavedArchetypesView';
import BootcampView from './components/BootcampView';
import { generateArchetypesFromData } from './services/geminiService';
import { UserArchetype, ViewState, ResearchData, ResearchFramework } from './types';
import { ArrowLeft, RefreshCcw, Search, Sparkles, GraduationCap, AlertCircle, Users, BookOpen, Edit3, Image as ImageIcon, Save, Info, Library, Key, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    process?: any;
  }
}

const SAMPLE_DATA: ResearchData = {
    title: "Eco-Conscious Urban Parents",
    researcherName: "Alex Rivera",
    teamName: "GreenUX",
    stakeholderTag: "Sustainability Product Team",
    description: "Urban parents (ages 28-45) living in high-density metropolitan areas. They are highly educated, tech-literate, and feel a deep sense of urgency regarding climate change for their children's future. They balance high-pressure careers with the chaos of young families, often shopping at a mix of premium organic co-ops and convenient neighborhood supermarkets.",
    painPoints: "Extreme 'choice paralysis' caused by greenwashing—hard to know which labels (B-Corp vs. Organic vs. Fair Trade) actually matter. Sustainable options are often priced 30-50% higher, creating guilt when budgeting. Urban apartments lack space for bulk-buying. Refill stations are often far away or have limited hours. High volume of plastic waste from children's snacks and toys is a source of daily frustration.",
    needs: "A 'BS-meter' for brands to quickly verify ethical claims while in a store aisle. Reliable, high-quality alternatives for everyday household items that don't compromise on performance. Hyper-local data on where to recycle specialty items (Type 5 plastics, batteries). Subscription-based refill models that fit into a 'busy parent' schedule.",
    goals: "Transition the family household to 80% zero-waste within the next 18 months. Support local regenerative farmers and ethical small-scale producers. Reduce the annual grocery carbon footprint without spending more than 2 hours a week on research. Model sustainable consumption habits for their children.",
    actions: "Frequently uses barcode scanning apps (like Yuka or EWG) to check product safety/ethics. Participates in local 'Buy Nothing' Facebook groups to re-home toys. Brings a full set of reusable mesh produce bags to every trip. Collects glass jars for DIY pantry storage. Researches 'DIY' cleaning recipes but often defaults to eco-brands due to time constraints."
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.INPUT);
  const [archetypes, setArchetypes] = useState<UserArchetype[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArchetypeIds, setSelectedArchetypeIds] = useState<Set<string>>(new Set());
  const [inputData, setInputData] = useState<ResearchData>({
      title: '', researcherName: '', teamName: '', stakeholderTag: '', description: '', painPoints: '', needs: '', goals: '', actions: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
  const [manualKey, setManualKey] = useState('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ success: boolean; message: string } | null>(null);

  // Setup process.env if it doesn't exist for runtime key injection
  useEffect(() => {
    if (!window.process) window.process = { env: {} };
    if (!window.process.env) window.process.env = {};
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      // Prioritize manually entered key in local storage
      const savedKey = localStorage.getItem('ARCHETYPE_AI_GEMINI_KEY');
      if (savedKey && savedKey !== 'undefined' && savedKey !== 'null') {
        window.process.env.API_KEY = savedKey;
        setManualKey(savedKey);
        setApiKeySelected(true);
        return;
      }

      // 1. Check build-time environment variable
      if (process.env.API_KEY && process.env.API_KEY !== 'undefined' && process.env.API_KEY !== 'null') {
        setApiKeySelected(true);
        return;
      }

      // 2. Check AI Studio specialized environment
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(selected);
      } else {
        // No key found anywhere, show the input screen
        setApiKeySelected(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKeyFromStudio = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
    }
  };

  const validateKey = async (key: string) => {
    if (!key.trim()) return;
    setIsValidating(true);
    setValidationResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: key.trim() });
      // Use a simple prompt to verify the key works
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "hi",
        config: { maxOutputTokens: 5 }
      });
      setValidationResult({ success: true, message: "Key verified successfully!" });
      return true;
    } catch (e: any) {
      setValidationResult({ 
        success: false, 
        message: e.message?.includes("403") ? "Invalid API Key." : "Connection error. Please try again." 
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = manualKey.trim();
    if (cleanKey) {
      const isValid = await validateKey(cleanKey);
      if (isValid) {
        localStorage.setItem('ARCHETYPE_AI_GEMINI_KEY', cleanKey);
        window.process.env.API_KEY = cleanKey;
        setApiKeySelected(true);
        setIsKeyModalOpen(false);
      }
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('ARCHETYPE_AI_GEMINI_KEY');
    window.process.env.API_KEY = undefined;
    setManualKey('');
    setApiKeySelected(false);
    setValidationResult(null);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await generateArchetypesFromData(inputData);
      setArchetypes(results);
      
      if (results.length > 0) {
        const frameworkId = results[0].frameworkId || `fw-${Date.now()}`;
        const newFramework: ResearchFramework = {
          ...inputData,
          id: frameworkId,
          savedAt: new Date().toISOString(),
          archetypeIds: results.map(a => a.id)
        };
        
        const existingFrameworksRaw = localStorage.getItem('savedFrameworks');
        const frameworks: ResearchFramework[] = existingFrameworksRaw ? JSON.parse(existingFrameworksRaw) : [];
        frameworks.push(newFramework);
        localStorage.setItem('savedFrameworks', JSON.stringify(frameworks));
      }

      setView(ViewState.RESULTS);
      window.scrollTo(0,0);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("API_KEY_INVALID")) {
        localStorage.removeItem('ARCHETYPE_AI_GEMINI_KEY');
        setApiKeySelected(false);
        setIsKeyModalOpen(true);
        setError("API Key invalid. Please check your settings.");
      } else {
        setError(err.message?.includes("429") ? "Free tier limit hit. Please wait a minute." : "Generation failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToView = (v: any) => {
    if (v === 'SAVED') setView(ViewState.SAVED);
    else if (v === 'INPUT') setView(ViewState.INPUT);
    else if (v === 'BOOTCAMP') setView(ViewState.BOOTCAMP);
    else setView(ViewState.RESULTS);
  };

  // Shared Key Modal / Setup UI
  const KeyManagementUI = ({ isFullPage = false }) => (
    <div className={`${isFullPage ? 'max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-8 shadow-2xl animate-fade-in-up' : 'w-full space-y-6 text-center'}`}>
      <div className="bg-brand-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/20">
        <Key size={32} className="text-white" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white tracking-tight">Archetype <span className="text-brand-400">AI</span></h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Please provide a Google Gemini API key to start synthesizing behavioral data.
        </p>
      </div>

      <form onSubmit={handleManualKeySubmit} className="space-y-4">
        <div className="relative">
          <input 
            type="password" 
            placeholder="Paste your Gemini API Key..." 
            className={`w-full bg-slate-950 border rounded-xl px-4 py-4 text-white placeholder-slate-600 transition-all outline-none 
              ${validationResult?.success ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'}`}
            value={manualKey}
            onChange={(e) => setManualKey(e.target.value)}
            required
          />
          {validationResult && (
            <div className={`mt-2 text-xs font-bold flex items-center justify-center gap-1.5 ${validationResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
              {validationResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {validationResult.message}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
           <button 
            type="submit"
            disabled={isValidating}
            className="flex-1 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isValidating ? <RefreshCcw className="animate-spin" size={18} /> : (apiKeySelected ? 'Update Key' : 'Get Started')}
            {!isValidating && <ArrowRight size={18} />}
          </button>
          {apiKeySelected && (
            <button 
              type="button"
              onClick={handleClearKey}
              className="px-4 py-4 bg-slate-800 hover:bg-rose-900/20 text-slate-400 hover:text-rose-400 rounded-xl transition-all border border-slate-700"
              title="Remove Key"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </form>

      {window.aistudio && (
        <div className="pt-2">
          <button 
            onClick={handleSelectKeyFromStudio}
            className="text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase tracking-widest"
          >
            Or use AI Studio Key Selection
          </button>
        </div>
      )}

      <div className="pt-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">Google AI Studio</a>. 
          Standard free tier limits apply.
        </p>
      </div>
    </div>
  );

  if (apiKeySelected === false && !isKeyModalOpen) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-brand-500/30">
        <KeyManagementUI isFullPage={true} />
      </div>
    );
  }

  if (apiKeySelected === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCcw size={40} className="text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <Layout 
      onNavigate={navigateToView} 
      onOpenKeySettings={() => setIsKeyModalOpen(true)}
      isKeyActive={apiKeySelected === true}
    >
      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl relative">
            <button 
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <KeyManagementUI />
          </div>
        </div>
      )}

      {view === ViewState.INPUT && (
        <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col items-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping mr-1"></div>
                    AI Researcher Active
                </div>
                
                <div className="text-center">
                    <h2 className="text-4xl font-black text-white">Research <span className="text-brand-400">Synthesis</span></h2>
                    <p className="text-slate-400 max-w-xl mx-auto mt-3">Input your observations below. ArchetypeAI will identify behavioral clusters and goals.</p>
                </div>

                <div className="w-full flex flex-wrap gap-4 justify-start pt-2">
                    <button 
                      onClick={() => setView(ViewState.BOOTCAMP)}
                      className="inline-flex items-center gap-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 px-6 py-3 rounded-xl text-base font-bold transition-all group shadow-lg shadow-brand-500/5"
                    >
                      <GraduationCap size={22} className="group-hover:rotate-12 transition-transform" />
                      New to archetypes? Start the Bootcamp
                    </button>

                    <button 
                      onClick={() => setInputData(SAMPLE_DATA)}
                      className="inline-flex items-center gap-3 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/30 px-6 py-3 rounded-xl text-base font-bold transition-all group shadow-lg shadow-slate-500/5"
                    >
                      <BookOpen size={20} className="group-hover:scale-110 transition-transform" />
                      Load Detailed Example
                    </button>
                    
                    <button 
                      onClick={() => setView(ViewState.SAVED)}
                      className="inline-flex items-center gap-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-6 py-3 rounded-xl text-base font-bold transition-all group shadow-lg shadow-indigo-500/5"
                    >
                      <Library size={20} className="group-hover:scale-110 transition-transform" />
                      Browse Library
                    </button>
                </div>
            </div>
            
            <InputForm data={inputData} onChange={setInputData} onSubmit={handleGenerate} isLoading={isLoading} />
            
            {error && <div className="bg-rose-500/10 border border-rose-500/50 text-rose-200 p-4 rounded-xl text-center text-sm flex items-center justify-center gap-2"><AlertCircle size={16}/>{error}</div>}
        </div>
      )}

      {view === ViewState.RESULTS && (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-6">
            <button onClick={() => setView(ViewState.INPUT)} className="flex items-center gap-2 text-slate-400 text-sm hover:text-white transition-colors"><ArrowLeft size={16}/> Back to Editor</button>
            <div className="text-right">
                <h3 className="text-2xl font-bold text-white">Synthesis Results</h3>
                <p className="text-xs text-slate-500 italic">Review and polish your archetypes.</p>
            </div>
          </div>

          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-xl">
             <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 flex-shrink-0">
                <Info size={28} />
             </div>
             <div className="flex-1 space-y-3">
                <h4 className="text-white font-bold text-lg">Batch Generation Complete</h4>
                <p className="text-xs text-slate-300">The <strong>Research Framework</strong> has been saved as a project card in your library. All archetypes below are linked to it.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {archetypes.map(arch => (
              <ArchetypeCard 
                key={arch.id} 
                archetype={arch} 
                isSelected={selectedArchetypeIds.has(arch.id)}
                onToggleSelect={(id) => {
                    const next = new Set(selectedArchetypeIds);
                    next.has(id) ? next.delete(id) : next.add(id);
                    setSelectedArchetypeIds(next);
                }}
                selectionMode={selectedArchetypeIds.size > 0}
              />
            ))}
          </div>

          {selectedArchetypeIds.size > 0 && (
             <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl backdrop-blur-xl z-40">
                 <span className="text-xs font-bold text-white uppercase">{selectedArchetypeIds.size} Selected</span>
                 <button onClick={() => setView(ViewState.COMPARE)} disabled={selectedArchetypeIds.size < 2} className="bg-brand-600 px-4 py-2 rounded-full text-xs font-bold disabled:opacity-50 hover:bg-brand-500 transition-colors">Compare Archetypes</button>
                 <button onClick={() => setSelectedArchetypeIds(new Set())} className="text-xs text-slate-400 hover:text-white">Clear Selection</button>
             </div>
          )}
        </div>
      )}

      {view === ViewState.COMPARE && <ComparisonView archetypes={archetypes.filter(a => selectedArchetypeIds.has(a.id))} />}
      {view === ViewState.SAVED && <SavedArchetypesView onBackToDashboard={() => setView(ViewState.INPUT)} />}
      {view === ViewState.BOOTCAMP && <BootcampView onFinish={() => setView(ViewState.INPUT)} />}
    </Layout>
  );
};

export default App;