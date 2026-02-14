import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import InputForm from './components/InputForm';
import ArchetypeCard from './components/ArchetypeCard';
import ComparisonView from './components/ComparisonView';
import SavedArchetypesView from './components/SavedArchetypesView';
import BootcampView from './components/BootcampView';
import { generateArchetypesFromData } from './services/geminiService';
import { UserArchetype, ViewState, ResearchData, ResearchFramework } from './types';
import { ArrowLeft, RefreshCcw, Sparkles, GraduationCap, AlertCircle, Users, BookOpen, Library, Key, ArrowRight, CheckCircle2, X } from 'lucide-react';
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

// Polyfill process.env for runtime usage of manually entered keys
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
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

  useEffect(() => {
    const checkKey = async () => {
      // 1. Check local storage first (User's manual entry)
      const savedKey = localStorage.getItem('ARCHETYPE_AI_GEMINI_KEY');
      if (savedKey && savedKey.trim().length > 10 && savedKey !== 'undefined') {
        window.process.env.API_KEY = savedKey.trim();
        setManualKey(savedKey.trim());
        setApiKeySelected(true);
        return;
      }

      // 2. Check for a valid-looking injected process.env key
      const envKey = process.env.API_KEY;
      if (envKey && typeof envKey === 'string' && envKey.length > 10 && envKey !== 'undefined' && envKey !== 'null') {
        setApiKeySelected(true);
        return;
      }

      // 3. Check AI Studio specialized environment
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        if (selected) {
            setApiKeySelected(true);
            return;
        }
      }

      // Default to asking for a key
      setApiKeySelected(false);
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
    if (!key || key.trim().length < 10) {
        setValidationResult({ success: false, message: "Key looks too short." });
        return false;
    }
    setIsValidating(true);
    setValidationResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: key.trim() });
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Connection test",
        config: { maxOutputTokens: 2 }
      });
      setValidationResult({ success: true, message: "Key accepted and active!" });
      return true;
    } catch (e: any) {
      console.error("Key validation failed", e);
      setValidationResult({ 
        success: false, 
        message: e.message?.includes("403") || e.message?.includes("invalid") ? "Invalid API Key." : "Connection failed. Check your network." 
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
        // Add a small delay so user can see the "Verified" feedback
        setTimeout(() => setIsKeyModalOpen(false), 800);
      }
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('ARCHETYPE_AI_GEMINI_KEY');
    if (window.process) window.process.env.API_KEY = undefined;
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
      const msg = err.message || "";
      if (msg.includes("API_KEY_INVALID") || msg.includes("403") || msg.includes("invalid_key")) {
        setApiKeySelected(false);
        setIsKeyModalOpen(true);
        setError("Invalid API Key. Please update it to continue.");
      } else {
        setError(msg.includes("429") ? "Free tier quota exceeded. Please wait a minute." : "Generation failed.");
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

  const KeyManagementUI = ({ isFullPage = false }) => (
    <div className={`${isFullPage ? 'max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-8 shadow-2xl animate-fade-in-up' : 'w-full space-y-6 text-center'}`}>
      <div className="bg-brand-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/20">
        <Key size={32} className="text-white" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white tracking-tight">Archetype <span className="text-brand-400">AI</span></h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Unlock AI synthesis by providing your own Gemini API key. 
          Free keys work perfectly for this application.
        </p>
      </div>

      <form onSubmit={handleManualKeySubmit} className="space-y-4 text-left">
        <div className="relative">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Your Gemini API Key</label>
          <input 
            type="password" 
            placeholder="AIzaSy..." 
            className={`w-full bg-slate-950 border rounded-xl px-4 py-3.5 text-white placeholder-slate-600 transition-all outline-none 
              ${validationResult?.success ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'}`}
            value={manualKey}
            onChange={(e) => {
                setManualKey(e.target.value);
                setValidationResult(null);
            }}
            required
          />
          {validationResult && (
            <div className={`mt-2 text-xs font-bold flex items-center gap-1.5 ${validationResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
              {validationResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {validationResult.message}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
           <button 
            type="submit"
            disabled={isValidating}
            className="flex-1 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isValidating ? <RefreshCcw className="animate-spin" size={18} /> : (apiKeySelected ? 'Update Key' : 'Unlock Application')}
            {!isValidating && <ArrowRight size={18} />}
          </button>
          {apiKeySelected && (
            <button 
              type="button"
              onClick={handleClearKey}
              className="px-4 py-3.5 bg-slate-800 hover:bg-rose-900/20 text-slate-400 hover:text-rose-400 rounded-xl transition-all border border-slate-700"
              title="Logout Key"
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
            Or use AI Studio Selection
          </button>
        </div>
      )}

      <div className="pt-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          Don't have a key? Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">Google AI Studio</a>.
        </p>
      </div>
    </div>
  );

  // Initial setup view if no key is present
  if (apiKeySelected === false && !isKeyModalOpen) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <KeyManagementUI isFullPage={true} />
      </div>
    );
  }

  // Loading state while checking keys
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
      {/* Key Settings Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl relative">
            <button 
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-2"
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
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping mr-1"></div>
                    Synthesis Agent Active
                </div>
                
                <div className="text-center">
                    <h2 className="text-4xl font-black text-white">Research <span className="text-brand-400">Synthesis</span></h2>
                    <p className="text-slate-400 max-w-xl mx-auto mt-3">Synthesize raw observations into behavioral clusters and evocative archetypes.</p>
                </div>

                <div className="w-full flex flex-wrap gap-4 justify-start pt-2">
                    <button 
                      onClick={() => setView(ViewState.BOOTCAMP)}
                      className="inline-flex items-center gap-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 px-6 py-3 rounded-xl text-base font-bold transition-all group"
                    >
                      <GraduationCap size={22} className="group-hover:rotate-12 transition-transform" />
                      Start the Bootcamp
                    </button>

                    <button 
                      onClick={() => setInputData(SAMPLE_DATA)}
                      className="inline-flex items-center gap-3 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/30 px-6 py-3 rounded-xl text-base font-bold transition-all group"
                    >
                      <BookOpen size={20} className="group-hover:scale-110 transition-transform" />
                      Load Example Data
                    </button>
                    
                    <button 
                      onClick={() => setView(ViewState.SAVED)}
                      className="inline-flex items-center gap-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-6 py-3 rounded-xl text-base font-bold transition-all group"
                    >
                      <Library size={20} className="group-hover:scale-110 transition-transform" />
                      Library
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
                <p className="text-xs text-slate-500 italic">Polish and save your generated archetypes.</p>
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
                 <button onClick={() => setSelectedArchetypeIds(new Set())} className="text-xs text-slate-400 hover:text-white">Clear</button>
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