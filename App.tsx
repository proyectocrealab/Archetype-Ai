import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import InputForm from './components/InputForm';
import ArchetypeCard from './components/ArchetypeCard';
import ComparisonView from './components/ComparisonView';
import SavedArchetypesView from './components/SavedArchetypesView';
import { generateArchetypesFromData, initializeGemini } from './services/geminiService';
import { UserArchetype, ViewState, ResearchData } from './types';
import { ArrowLeft, RefreshCcw, BookOpen, ArrowDown, Search, SplitSquareHorizontal, CheckCircle2, User, Users, Key, ExternalLink } from 'lucide-react';

const SAMPLE_DATA: ResearchData = {
    title: "Computer Science Students - Study Habits",
    studentName: "Jamie Rivera",
    teamName: "Team Alpha",
    description: "Interviewed 5 computer science students. Most juggle classwork with personal coding projects. They are tech-savvy but get overwhelmed.",
    painPoints: "Struggle with 'context switching' between classes and code. Group chats spamming them. Inconsistent environments.",
    needs: "Need a workflow that minimizes distraction. Tools that are powerful but simple.",
    goals: "Maintain high GPA. Build portfolio projects. Get good internships.",
    actions: "Turns off phone entirely to work. Uses Notion/Obsidian. Codes late at night."
};

const SAMPLE_ARCHETYPE: UserArchetype = {
  id: 'sample-1',
  name: "Alex the Optimizer",
  role: "Computer Science Student",
  age: 21,
  quote: "I just need a workflow that doesn't distract me every 5 minutes.",
  bio: "Alex balances a heavy course load with a part-time internship. They are tech-savvy but easily distracted by social media notifications. They constantly seek tools to automate tasks and block distractions during deep work sessions.",
  goals: ["Maintain a 3.8 GPA", "Build a portfolio project", "Reduce screen time"],
  frustrations: ["Constant notification interruptions", "Inconsistent study environments", "Group project coordination"],
  motivations: ["Career advancement", "Efficiency", "Mastery of skills"],
  techLiteracy: 9,
  personalityTraits: ["Analytical", "Ambitious", "Restless", "Organized"],
  imageUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
};

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState('');
  
  const [view, setView] = useState<ViewState>(ViewState.INPUT);
  const [archetypes, setArchetypes] = useState<UserArchetype[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Selection / Comparison State
  const [selectedArchetypeIds, setSelectedArchetypeIds] = useState<Set<string>>(new Set());

  // State for structured data
  const [inputData, setInputData] = useState<ResearchData>({
      title: '',
      studentName: '',
      teamName: '',
      description: '',
      painPoints: '',
      needs: '',
      goals: '',
      actions: ''
  });

  const [inputCache, setInputCache] = useState(''); // Stores the stringified prompt for regeneration
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Check for API Key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('archetype_ai_key');
    if (storedKey) {
      setApiKey(storedKey);
      initializeGemini(storedKey);
    }
  }, []);

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempKey.trim()) return;
    
    setApiKey(tempKey);
    localStorage.setItem('archetype_ai_key', tempKey);
    initializeGemini(tempKey);
  };

  const handleClearKey = () => {
    if (window.confirm("Are you sure you want to remove your API key? You will need to enter it again to use the app.")) {
      setApiKey(null);
      setTempKey('');
      localStorage.removeItem('archetype_ai_key');
      setView(ViewState.INPUT);
    }
  };

  const formatPrompt = (data: ResearchData): string => {
      return `
      Research Context / Title: ${data.title}
      Student Researcher: ${data.studentName}
      Team: ${data.teamName}
      General Description: ${data.description}
      Pain Points Observed: ${data.painPoints}
      Needs Identified: ${data.needs}
      User Goals: ${data.goals}
      Key Actions / Behaviors: ${data.actions}
      `;
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    const promptString = formatPrompt(inputData);
    setInputCache(promptString);
    setSearchQuery('');
    setSelectedArchetypeIds(new Set()); // Reset selections
    
    try {
      const results = await generateArchetypesFromData(promptString);
      setArchetypes(results);
      setView(ViewState.RESULTS);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError("Failed to generate archetypes. Please check your API key or ensure you've provided enough detail.");
      if (err.toString().includes("API key")) {
          // If key is invalid, maybe prompt to clear it
          setError("Invalid API Key. Please disconnect and try a different one.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (cachedPrompt: string) => {
    setIsLoading(true);
    setError(null);
    try {
        const results = await generateArchetypesFromData(cachedPrompt);
        setArchetypes(results);
        setSelectedArchetypeIds(new Set()); // Reset selections
    } catch (err: any) {
        setError("Failed to regenerate archetypes.");
    } finally {
        setIsLoading(false);
    }
  }

  const handleReset = () => {
    setView(ViewState.INPUT);
    setArchetypes([]);
    setError(null);
    setSearchQuery('');
    setSelectedArchetypeIds(new Set());
  };

  const loadSampleData = () => {
    setInputData(SAMPLE_DATA);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleArchetypeSelection = (id: string) => {
      const newSet = new Set(selectedArchetypeIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedArchetypeIds(newSet);
  };

  const clearSelection = () => {
      setSelectedArchetypeIds(new Set());
  };

  const getSelectedArchetypes = () => {
      return archetypes.filter(a => selectedArchetypeIds.has(a.id));
  };

  const filteredArchetypes = archetypes.filter(arch => 
    arch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    arch.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateToView = (newView: string) => {
      if (newView === 'INPUT') setView(ViewState.INPUT);
      if (newView === 'SAVED') setView(ViewState.SAVED);
      if (newView === 'RESULTS' && archetypes.length > 0) setView(ViewState.RESULTS);
  }

  // --- API KEY ENTRY VIEW ---
  if (!apiKey) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans">
        <div className="bg-ambience"></div>
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
           <div className="text-center">
              <div className="inline-flex p-3 bg-brand-600 rounded-xl mb-6 shadow-lg shadow-brand-500/20">
                <Users size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Archetype<span className="text-brand-400">AI</span>
              </h1>
              <p className="text-slate-400">
                Research synthesis assistant powered by Gemini.
              </p>
           </div>

           <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl">
              <form onSubmit={handleKeySubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300">
                    Enter your Gemini API Key
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={16} className="text-slate-500" />
                    </div>
                    <input
                      id="apiKey"
                      type="password"
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg leading-5 bg-slate-950 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm text-white transition-colors"
                      placeholder="AIzaSy..."
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!tempKey}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20"
                >
                  Start Synthesizing
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                <p className="text-xs text-slate-500 mb-3">Don't have a key?</p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
                >
                  Get a free key from Google AI Studio <ExternalLink size={12} />
                </a>
              </div>
           </div>
           
           <p className="text-center text-xs text-slate-600">
             Your key is stored locally in your browser and never sent to our servers.
           </p>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <Layout onNavigate={navigateToView} onClearKey={handleClearKey}>
      {view === ViewState.INPUT && (
        <div className="space-y-20">
            {/* Hero & Input Section */}
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-12 pt-8">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 pb-2">
                        Turn Raw Research into <br/>
                        <span className="text-brand-400">Vivid Personas</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed">
                         Use the framework below to organize your research notes. AI will synthesize these inputs into distinct user archetypes.
                    </p>
                </div>
                
                <InputForm 
                    data={inputData} 
                    onChange={setInputData} 
                    onSubmit={handleGenerate} 
                    isLoading={isLoading} 
                />
                
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-200 px-6 py-4 rounded-xl max-w-lg w-full text-center animate-fade-in flex items-center justify-center gap-2">
                        <span className="font-bold">Error:</span> {error}
                    </div>
                )}
            </div>

            {/* Educational / Template Section */}
            <div className="border-t border-slate-800 pt-16 pb-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <BookOpen className="text-indigo-400" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-white">How it works</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Description */}
                        <div className="space-y-6">
                            <div className="prose prose-invert prose-slate">
                                <h3 className="text-xl font-semibold text-slate-200">The Archetype Framework</h3>
                                <p className="text-slate-400">
                                    This tool uses a standard UX framework to organize observations. By separating <strong>Behaviors (Actions)</strong> from <strong>Drivers (Motivations/Goals)</strong>, we can create more accurate predictive models of users.
                                </p>
                                <p className="text-slate-400">
                                    Don't worry about perfect grammar—bullet points and raw notes work best.
                                </p>
                                
                                <h3 className="text-xl font-semibold text-slate-200 mt-8">Best Practices</h3>
                                <ul className="list-disc pl-5 space-y-2 text-slate-400">
                                    <li><strong>Pain Points:</strong> Focus on what stops them, not just what they dislike.</li>
                                    <li><strong>Needs:</strong> Focus on what is functional vs emotional.</li>
                                    <li><strong>Goals:</strong> What is the ultimate outcome they desire?</li>
                                </ul>
                            </div>

                            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                                <h4 className="font-semibold text-white mb-2">Want to see it in action?</h4>
                                <p className="text-sm text-slate-400 mb-4">
                                    Click the button below to load sample research data into the framework above.
                                </p>
                                <button 
                                    onClick={loadSampleData}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    <ArrowDown size={16} />
                                    Fill with Example Data
                                </button>
                            </div>
                        </div>

                        {/* Visual Reference */}
                        <div className="relative">
                            <div className="absolute -top-6 -left-6 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                                EXAMPLE OUTPUT
                            </div>
                            <div className="transform scale-95 lg:scale-100 opacity-90 hover:opacity-100 transition-opacity">
                                <ArchetypeCard archetype={SAMPLE_ARCHETYPE} />
                            </div>
                            <p className="text-center text-xs text-slate-500 mt-4">
                                The AI synthesizes your structured notes into cards like this.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {view === ViewState.RESULTS && (
        <div className="space-y-8 animate-fade-in relative pb-24">
          <div className="flex flex-col gap-6 border-b border-slate-800 pb-6">
             {/* Header Controls */}
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Back to Framework
                    </button>
                    <h2 className="text-3xl font-bold text-white">Generated Archetypes</h2>
                    <div className="flex items-center gap-4 text-slate-400 mt-2 text-sm bg-slate-900/50 p-2 rounded-lg inline-flex border border-slate-800">
                         {inputData.studentName && (
                            <span className="flex items-center gap-1.5 font-medium text-slate-300">
                                <User size={14} className="text-brand-400"/> {inputData.studentName}
                            </span>
                         )}
                         {inputData.studentName && inputData.teamName && (
                            <span className="text-slate-600">|</span>
                         )}
                         {inputData.teamName && (
                            <span className="flex items-center gap-1.5 font-medium text-slate-300">
                                <Users size={14} className="text-brand-400"/> {inputData.teamName}
                            </span>
                         )}
                         {(!inputData.studentName && !inputData.teamName) && (
                            <span className="text-slate-500 italic">Project: {inputData.title || "Untitled"}</span>
                         )}
                    </div>
                </div>
                
                <button
                    onClick={() => handleRegenerate(inputCache)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-all text-sm font-medium disabled:opacity-50"
                >
                    <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
                    {isLoading ? "Regenerating..." : "Regenerate Results"}
                </button>
             </div>

             {/* Search Bar */}
             <div className="w-full">
                <div className="relative max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filter by name or role..."
                        className="pl-10 pr-4 py-2.5 w-full bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
            {filteredArchetypes.map((arch) => (
              <ArchetypeCard 
                key={arch.id} 
                archetype={arch} 
                onToggleSelect={toggleArchetypeSelection}
                isSelected={selectedArchetypeIds.has(arch.id)}
                selectionMode={selectedArchetypeIds.size > 0}
              />
            ))}
            
            {filteredArchetypes.length === 0 && (
                <div className="col-span-full py-16 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-4">
                        <Search size={24} className="text-slate-500" />
                    </div>
                    <p className="text-slate-300 font-medium">No archetypes found</p>
                    <p className="text-slate-500 text-sm mt-1">Try adjusting your search for "{searchQuery}"</p>
                </div>
            )}
          </div>

          {/* Comparison Floating Bar */}
          <div className={`
                fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50
                bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-full shadow-2xl px-6 py-3
                flex items-center gap-6 transition-all duration-300
                ${selectedArchetypeIds.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}
          `}>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-brand-500" size={20} />
                    <span className="text-white font-medium">{selectedArchetypeIds.size} selected</span>
                </div>
                
                <div className="h-6 w-px bg-slate-700" />

                <div className="flex items-center gap-2">
                    <button 
                        onClick={clearSelection}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Clear
                    </button>
                    <button 
                        onClick={() => setView(ViewState.COMPARE)}
                        disabled={selectedArchetypeIds.size < 2}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:bg-slate-700 text-white px-4 py-2 rounded-full font-bold text-sm transition-all"
                    >
                        <SplitSquareHorizontal size={16} /> Compare
                    </button>
                </div>
          </div>

        </div>
      )}

      {view === ViewState.COMPARE && (
          <div className="space-y-8 animate-fade-in">
             <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
                <div>
                     <button 
                        onClick={() => setView(ViewState.RESULTS)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Back to Results
                    </button>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <SplitSquareHorizontal className="text-brand-400" />
                        Archetype Comparison
                    </h2>
                </div>
                
                <div className="text-right">
                    <p className="text-slate-400">Comparing <span className="text-white font-bold">{selectedArchetypeIds.size}</span> archetypes</p>
                </div>
             </div>

             <ComparisonView archetypes={getSelectedArchetypes()} />
          </div>
      )}

      {view === ViewState.SAVED && (
          <SavedArchetypesView />
      )}
    </Layout>
  );
};

export default App;