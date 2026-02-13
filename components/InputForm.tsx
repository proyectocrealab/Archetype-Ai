import React, { useState, useEffect } from 'react';
import { Sparkles, X, Save, FolderOpen, GraduationCap, Trophy, Target, Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';
import { ResearchData, TeacherFeedback } from '../types';
import { generateTeacherFeedback } from '../services/geminiService';

interface InputFormProps {
  data: ResearchData;
  onChange: (data: ResearchData) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ data, onChange, onSubmit, isLoading }) => {
  const [showSaved, setShowSaved] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  
  // Feedback State
  const [feedback, setFeedback] = useState<TeacherFeedback | null>(null);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('archetype_research_draft');
    if (saved) {
        setHasSavedDraft(true);
    }
  }, []);
  
  const handleChange = (field: keyof ResearchData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to clear the form?")) {
        onChange({
            title: '',
            studentName: '',
            teamName: '',
            description: '',
            painPoints: '',
            needs: '',
            goals: '',
            actions: ''
        });
        setFeedback(null); // Clear feedback on reset
    }
  };

  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem('archetype_research_draft', JSON.stringify(data));
    setHasSavedDraft(true);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleLoadDraft = (e: React.MouseEvent) => {
     e.preventDefault();
     const saved = localStorage.getItem('archetype_research_draft');
     if (saved) {
         if (isFormEmpty || window.confirm("This will overwrite your current inputs with the saved draft. Continue?")) {
            try {
                const parsed = JSON.parse(saved);
                onChange(parsed);
                setFeedback(null); // Clear old feedback when loading new data
            } catch (e) {
                console.error("Failed to load draft");
            }
         }
     }
  };

  const handleGetFeedback = async () => {
      setIsGettingFeedback(true);
      try {
          const result = await generateTeacherFeedback(data);
          setFeedback(result);
      } catch (e) {
          console.error("Failed to get feedback", e);
          alert("Professor Archetype is currently unavailable. Please try again.");
      } finally {
          setIsGettingFeedback(false);
      }
  };

  const isFormEmpty = !Object.values(data).some(val => (val as string).trim() !== '');

  // Helper to determine color based on grade
  const getGradeColor = (grade: string) => {
      if (grade.startsWith('A')) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
      if (grade.startsWith('B')) return 'text-brand-400 border-brand-500/50 bg-brand-500/10';
      if (grade.startsWith('C')) return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      return 'text-rose-400 border-rose-500/50 bg-rose-500/10';
  };

  return (
    <div className={`w-full mx-auto animate-fade-in-up transition-all duration-500 ease-in-out ${feedback ? 'max-w-[95%]' : 'max-w-6xl'}`}>
      
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* Main Form Section */}
        <div className={`
            bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-500
            ${feedback ? 'xl:w-2/3 w-full' : 'w-full'}
        `}>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                Archetype Framework
                </h2>
                <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
                Focusing on user behaviours, this framework highlights needs, motivations, and pain points. 
                </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                {hasSavedDraft && !isLoading && (
                    <button 
                    type="button"
                    onClick={handleLoadDraft}
                    className="text-slate-500 hover:text-white transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-700/50"
                    title="Load saved draft from local storage"
                    >
                    <FolderOpen size={16} /> Load Draft
                    </button>
                )}
                
                {!isFormEmpty && !isLoading && (
                    <button 
                    type="button"
                    onClick={handleSaveDraft}
                    className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${showSaved ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                    title="Save current progress to local storage"
                    >
                    <Save size={16} /> {showSaved ? "Saved!" : "Save Progress"}
                    </button>
                )}

                {!isFormEmpty && !isLoading && (
                <button 
                    type="button"
                    onClick={handleClear}
                    className="text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-rose-950/20"
                >
                    <X size={16} /> Clear Form
                </button>
                )}
            </div>
            </div>

            <div className={`grid grid-cols-1 ${feedback ? 'lg:grid-cols-2' : 'md:grid-cols-3'} gap-6 mb-8 transition-all duration-500`}>
            
            {/* Column 1 */}
            <div className="space-y-6">
                {/* Title / Context */}
                <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 hover:border-brand-500/30 transition-colors group">
                    <div className="px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-200">Context / Title</label>
                    </div>
                    <input 
                        type="text"
                        className="w-full bg-transparent border-none text-white p-4 focus:ring-0 placeholder-slate-600 text-lg font-medium"
                        placeholder="e.g. Student Study Habits"
                        value={data.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* Student Name */}
                <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 hover:border-brand-500/30 transition-colors group">
                    <div className="px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-200">Student Name</label>
                    </div>
                    <input 
                        type="text"
                        className="w-full bg-transparent border-none text-white p-4 focus:ring-0 placeholder-slate-600 text-lg font-medium"
                        placeholder="e.g. Jamie Rivera"
                        value={data.studentName}
                        onChange={(e) => handleChange('studentName', e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* Team Name */}
                <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 hover:border-brand-500/30 transition-colors group">
                    <div className="px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-200">Team Name</label>
                    </div>
                    <input 
                        type="text"
                        className="w-full bg-transparent border-none text-white p-4 focus:ring-0 placeholder-slate-600 text-lg font-medium"
                        placeholder="e.g. Team Alpha"
                        value={data.teamName}
                        onChange={(e) => handleChange('teamName', e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* Description */}
                <div className="bg-white p-1 rounded-2xl h-48 flex flex-col group shadow-lg">
                    <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-200 px-2 py-0.5 rounded">Description</label>
                    </div>
                    <textarea 
                        className="w-full h-full bg-transparent border-none text-slate-800 p-4 focus:ring-0 placeholder-slate-400 resize-none text-sm leading-relaxed"
                        placeholder="Describe the general situation, demographics, or environment..."
                        value={data.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
                {/* Pain Points */}
                <div className="bg-white p-1 rounded-2xl h-64 flex flex-col group shadow-lg">
                    <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                        <label className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800 px-2 py-0.5 rounded">Pain Points</label>
                    </div>
                    <textarea 
                        className="w-full h-full bg-transparent border-none text-slate-800 p-4 focus:ring-0 placeholder-slate-400 resize-none text-sm leading-relaxed"
                        placeholder="What barriers or frustrations do users face?"
                        value={data.painPoints}
                        onChange={(e) => handleChange('painPoints', e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* Goals */}
                <div className="bg-white p-1 rounded-2xl h-48 flex flex-col group shadow-lg">
                    <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                        <label className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800 px-2 py-0.5 rounded">Goals</label>
                    </div>
                    <textarea 
                        className="w-full h-full bg-transparent border-none text-slate-800 p-4 focus:ring-0 placeholder-slate-400 resize-none text-sm leading-relaxed"
                        placeholder="What are they trying to achieve?"
                        value={data.goals}
                        onChange={(e) => handleChange('goals', e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-6">
                {/* Needs */}
                <div className="bg-white p-1 rounded-2xl h-64 flex flex-col group shadow-lg">
                    <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                        <label className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800 px-2 py-0.5 rounded">Needs</label>
                    </div>
                    <textarea 
                        className="w-full h-full bg-transparent border-none text-slate-800 p-4 focus:ring-0 placeholder-slate-400 resize-none text-sm leading-relaxed"
                        placeholder="What is essential for them to succeed?"
                        value={data.needs}
                        onChange={(e) => handleChange('needs', e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {/* Actions */}
                <div className="bg-white p-1 rounded-2xl h-48 flex flex-col group shadow-lg">
                    <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                        <label className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800 px-2 py-0.5 rounded">Actions</label>
                    </div>
                    <textarea 
                        className="w-full h-full bg-transparent border-none text-slate-800 p-4 focus:ring-0 placeholder-slate-400 resize-none text-sm leading-relaxed"
                        placeholder="Specific behaviors or tasks they perform..."
                        value={data.actions}
                        onChange={(e) => handleChange('actions', e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            </div>

            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
                {/* Professor Feedback Button */}
                <button
                    type="button"
                    onClick={handleGetFeedback}
                    disabled={isFormEmpty || isLoading || isGettingFeedback}
                    className={`
                        flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all border border-indigo-500/30
                        ${isFormEmpty 
                            ? 'bg-slate-700 opacity-50 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:-translate-y-0.5'}
                    `}
                >
                    {isGettingFeedback ? (
                         <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                        <GraduationCap size={20} />
                    )}
                    <span>{isGettingFeedback ? "Grading..." : "Get Teacher Feedback"}</span>
                </button>

                {/* Main Generate Button */}
                <button
                type="button"
                onClick={onSubmit}
                disabled={isFormEmpty || isLoading}
                className={`
                    flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform
                    ${isFormEmpty || isLoading 
                    ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 hover:scale-[1.02] hover:shadow-brand-500/25'}
                `}
                >
                {isLoading ? (
                    <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Synthesizing...</span>
                    </>
                ) : (
                    <>
                    <Sparkles size={20} />
                    <span>Generate Archetypes</span>
                    </>
                )}
                </button>
            </div>
        </div>
        
        {/* Professor Report Card (Side Panel) */}
        {feedback && (
             <div className="xl:w-1/3 w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl animate-fade-in flex flex-col gap-6 sticky top-24">
                {/* Header with Grade */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <GraduationCap className="text-indigo-400" /> 
                            Professor's Report
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">Research Quality Assessment</p>
                    </div>
                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-3xl font-black bg-slate-950 ${getGradeColor(feedback.grade)}`}>
                        {feedback.grade}
                    </div>
                </div>

                {/* Score Bar */}
                <div>
                     <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-1">
                         <span>Research Level</span>
                         <span>{feedback.score}/100 XP</span>
                     </div>
                     <div className="w-full bg-slate-800 rounded-full h-3">
                         <div 
                            className="bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${feedback.score}%` }}
                        ></div>
                     </div>
                </div>

                {/* Overall Comment */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
                    <h4 className="font-bold text-indigo-300 text-sm mb-1">{feedback.feedbackTitle}</h4>
                    <p className="text-indigo-100 text-sm italic leading-relaxed">"{feedback.overallComment}"</p>
                </div>

                {/* Strengths */}
                <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                        <Trophy size={14} /> Strengths
                    </h4>
                    <ul className="space-y-2">
                        {feedback.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-emerald-500 mt-0.5">•</span> {s}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Improvements */}
                <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                        <Target size={14} /> Areas to Improve
                    </h4>
                    <ul className="space-y-2">
                        {feedback.improvements.map((s, i) => (
                            <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">•</span> {s}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Questions */}
                <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400 mb-2">
                        <Lightbulb size={14} /> Professor asks...
                    </h4>
                    <div className="space-y-3">
                        {feedback.thoughtProvokingQuestions.map((q, i) => (
                            <div key={i} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <p className="text-sm text-brand-100 font-medium">{q}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="text-center pt-2">
                     <p className="text-xs text-slate-500">Edit your data on the left to improve your grade!</p>
                </div>
             </div>
        )}

      </div>
    </div>
  );
};

export default InputForm;