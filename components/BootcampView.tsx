import React, { useState, useEffect } from 'react';
import { BookOpen, Target, Brain, ShieldCheck, ArrowRight, CheckCircle2, Trophy, GraduationCap, Zap, Star, AlertTriangle, Lightbulb } from 'lucide-react';

const BOOTCAMP_STEPS = [
  {
    id: 'intro',
    title: 'Level 1: The Core Concept',
    icon: <Brain className="text-brand-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed">
          In user research, an <span className="text-brand-400 font-bold">Archetype</span> is NOT a specific person. It is a model of <span className="text-white font-bold">behavioral patterns</span>.
        </p>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" /> Archetypes vs. Personas
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Standard personas often focus on "Who" (demographics: age, gender). Archetypes focus on "How" and "Why" (goals and motivations). Use archetypes to predict what users will do.
          </p>
        </div>
      </div>
    ),
    quiz: {
      question: "What is the primary focus of an Archetype?",
      options: [
        "Demographic data like zip codes and income",
        "Behavioral patterns and underlying motivations",
        "The creative imagination of the design team"
      ],
      correct: 1
    }
  },
  {
    id: 'framework',
    title: 'Level 2: The Framework Mastery',
    icon: <Target className="text-brand-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 text-sm">Our framework splits your notes into 6 key pillars. Master these for an <span className="text-emerald-400 font-bold">A+ grade</span>:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <h5 className="text-[10px] font-bold text-brand-300 uppercase mb-1">Pain Points</h5>
            <p className="text-[11px] text-slate-400">Barriers stopping the user from their goal. (e.g. "Too slow", "Confusing").</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <h5 className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Needs</h5>
            <p className="text-[11px] text-slate-400">The functional requirement. (e.g. "Needs a way to track data offline").</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <h5 className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Actions</h5>
            <p className="text-[11px] text-slate-400">Specific behaviors observed. (e.g. "Calls support 3x a week").</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <h5 className="text-[10px] font-bold text-amber-400 uppercase mb-1">Goals</h5>
            <p className="text-[11px] text-slate-400">The ultimate outcome. (e.g. "Save 2 hours on payroll per month").</p>
          </div>
        </div>
      </div>
    ),
    quiz: {
      question: "Which field captures what the user actually DOES during their day?",
      options: ["Needs", "Pain Points", "Actions"],
      correct: 2
    }
  },
  {
    id: 'traps',
    title: 'Level 3: Avoiding Traps',
    icon: <Zap className="text-brand-400" />,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 text-sm">Don't fall for the <span className="text-rose-400 font-bold">Stereotype Trap</span>. Good archetypes are data-driven, not based on cliches.</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3 bg-rose-500/5 p-3 rounded-lg border border-rose-500/20">
            <AlertTriangle size={18} className="text-rose-400 flex-shrink-0" />
            <p className="text-xs text-rose-200">Avoid assuming tech-literacy based purely on age (The "Old People Can't Use Apps" trope).</p>
          </div>
          <div className="flex items-start gap-3 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-emerald-200">Focus on the context: "Busy professional in a loud environment" vs "The Corporate Guy".</p>
          </div>
        </div>
      </div>
    ),
    quiz: {
      question: "How do you avoid creating stereotypes?",
      options: [
        "By focusing on observed behaviors and specific data",
        "By using high-quality AI images for portraits",
        "By giving every persona a catchy alliterative name"
      ],
      correct: 0
    }
  },
  {
    id: 'complete',
    title: 'Graduation: Research Master',
    icon: <Trophy className="text-amber-400" />,
    content: (
      <div className="text-center py-4 space-y-6">
        <div className="relative inline-block">
          <div className="absolute inset-0 animate-ping bg-amber-400/20 rounded-full" />
          <div className="relative bg-slate-900 border-4 border-amber-400 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-2xl">
            <Star size={40} className="text-amber-400 fill-amber-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-2xl font-black text-white">Bootcamp Completed!</h4>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            You've mastered the behavioral framework. Your synthesized archetypes will now be more accurate and useful.
          </p>
        </div>
        <div className="pt-4">
           <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
             <ShieldCheck size={14} /> Archetype Expert Badge Earned
           </div>
        </div>
      </div>
    ),
    quiz: null
  }
];

const BootcampView: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [xp, setXp] = useState(0);

  const step = BOOTCAMP_STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / BOOTCAMP_STEPS.length) * 100;

  const handleAnswer = (index: number) => {
    if (isAnswerCorrect) return;
    setSelectedAnswer(index);
    if (index === step.quiz?.correct) {
      setIsAnswerCorrect(true);
      setXp(prev => prev + 250);
    } else {
      setIsAnswerCorrect(false);
    }
  };

  const handleNext = () => {
    if (currentStepIndex === BOOTCAMP_STEPS.length - 1) {
      onFinish();
      return;
    }
    setCurrentStepIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4 animate-fade-in">
      {/* Header & Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg">
                <GraduationCap size={24} className="text-white" />
             </div>
             <div>
                <h2 className="text-2xl font-bold text-white">Researcher Bootcamp</h2>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Level {currentStepIndex + 1} of {BOOTCAMP_STEPS.length}</p>
             </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1 justify-end">
                <Star size={12} className="fill-amber-500" /> {xp} XP Earned
             </div>
             <div className="text-xs text-slate-400 font-medium">Rank: {xp < 500 ? 'Junior' : xp < 750 ? 'Senior' : 'Expert'}</div>
          </div>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
           <div 
            className="h-full bg-indigo-500 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
            style={{ width: `${progress}%` }} 
           />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 group-hover:w-2 transition-all" />
        
        <div className="flex items-start gap-6">
          <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-inner">
             {step.icon}
          </div>
          <div className="space-y-6 flex-1">
             <h3 className="text-2xl font-black text-white tracking-tight">{step.title}</h3>
             
             {step.content}

             {step.quiz && (
               <div className="mt-10 pt-8 border-t border-slate-800 space-y-6">
                 <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-400" /> Knowledge Check
                 </h4>
                 <p className="text-white font-medium text-lg">{step.quiz.question}</p>
                 <div className="space-y-3">
                    {step.quiz.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={isAnswerCorrect === true}
                        className={`
                          w-full text-left p-4 rounded-xl border transition-all text-sm font-medium
                          ${selectedAnswer === idx 
                            ? (isAnswerCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : 'bg-rose-500/20 border-rose-500 text-rose-200')
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}
                          ${isAnswerCorrect && idx === step.quiz?.correct ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3">
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                              ${selectedAnswer === idx 
                                ? (isAnswerCorrect ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500')
                                : 'border-slate-600'}
                              ${isAnswerCorrect && idx === step.quiz?.correct ? 'border-emerald-500 text-emerald-500' : ''}
                           `}>
                              {isAnswerCorrect && (idx === step.quiz?.correct || selectedAnswer === idx) ? <CheckCircle2 size={14} /> : (idx + 1)}
                           </div>
                           {option}
                        </div>
                      </button>
                    ))}
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex justify-end">
          <button
            onClick={handleNext}
            disabled={step.quiz ? !isAnswerCorrect : false}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all
              ${(step.quiz && !isAnswerCorrect) 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}
            `}
          >
            {currentStepIndex === BOOTCAMP_STEPS.length - 1 ? 'Finish Bootcamp' : 'Next Level'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      
      <p className="text-center text-xs text-slate-600 font-medium italic">
        "Good research isn't about finding the 'average' user, but understanding the diverse ways people solve problems."
      </p>
    </div>
  );
};

export default BootcampView;