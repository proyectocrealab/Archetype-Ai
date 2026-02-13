import React from 'react';
import { UserArchetype } from '../types';
import { Target, Frown, Lightbulb, Zap, User } from 'lucide-react';

interface ComparisonViewProps {
  archetypes: UserArchetype[];
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ archetypes }) => {
  if (archetypes.length === 0) return null;

  // Render tech literacy bar
  const renderTechLiteracy = (score: number) => (
    <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
      <div 
        className="bg-brand-500 h-2.5 rounded-full" 
        style={{ width: `${score * 10}%` }}
      ></div>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{score}/10</span>
      </div>
    </div>
  );

  return (
    <div className="overflow-x-auto pb-8 animate-fade-in">
      <div className="min-w-max grid gap-6" style={{ gridTemplateColumns: `repeat(${archetypes.length}, minmax(320px, 1fr))` }}>
        
        {/* Row 1: Header (Fixed Identity) */}
        {archetypes.map((arch) => (
          <div key={`header-${arch.id}`} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col items-center text-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-b from-slate-700/50 to-transparent opacity-50 pointer-events-none" />
             <div className="relative z-10">
                <div className="w-24 h-24 rounded-full border-4 border-slate-700 mx-auto mb-4 overflow-hidden bg-slate-600 shadow-lg">
                    {arch.imageUrl ? (
                        <img src={arch.imageUrl} alt={arch.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User size={32} />
                        </div>
                    )}
                </div>
                <h3 className="text-xl font-bold text-white">{arch.name}</h3>
                <p className="text-brand-300 font-medium">{arch.role}</p>
                <p className="text-slate-400 text-sm mt-1">{arch.age} years old</p>
             </div>
          </div>
        ))}

        {/* Row 2: Quote */}
        {archetypes.map((arch) => (
          <div key={`quote-${arch.id}`} className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex items-center justify-center">
             <p className="text-center italic text-brand-200 font-serif">"{arch.quote}"</p>
          </div>
        ))}

        {/* Row 3: Bio */}
        {archetypes.map((arch) => (
          <div key={`bio-${arch.id}`} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
             <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Bio</h4>
             <p className="text-slate-300 text-sm leading-relaxed">{arch.bio}</p>
          </div>
        ))}

        {/* Row 4: Traits */}
        {archetypes.map((arch) => (
          <div key={`traits-${arch.id}`} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
             <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Personality Traits</h4>
             <div className="flex flex-wrap gap-2">
                {arch.personalityTraits.map((trait, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-900 rounded border border-slate-600 text-xs text-slate-300">
                        {trait}
                    </span>
                ))}
             </div>
          </div>
        ))}

        {/* Row 5: Goals */}
        {archetypes.map((arch) => (
          <div key={`goals-${arch.id}`} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
             <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                <Target size={14} /> Goals
             </h4>
             <ul className="space-y-2">
                {arch.goals.map((goal, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-emerald-500/50 mt-1">•</span>
                        <span>{goal}</span>
                    </li>
                ))}
             </ul>
          </div>
        ))}

        {/* Row 6: Frustrations */}
        {archetypes.map((arch) => (
          <div key={`frustrations-${arch.id}`} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
             <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-3">
                <Frown size={14} /> Frustrations
             </h4>
             <ul className="space-y-2">
                {arch.frustrations.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-rose-500/50 mt-1">•</span>
                        <span>{item}</span>
                    </li>
                ))}
             </ul>
          </div>
        ))}
        
        {/* Row 7: Motivations */}
        {archetypes.map((arch) => (
          <div key={`motivations-${arch.id}`} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
             <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                <Lightbulb size={14} /> Motivations
             </h4>
             <ul className="space-y-2">
                {arch.motivations.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-amber-500/50 mt-1">•</span>
                        <span>{item}</span>
                    </li>
                ))}
             </ul>
          </div>
        ))}

        {/* Row 8: Tech Literacy */}
        {archetypes.map((arch) => (
          <div key={`tech-${arch.id}`} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
             <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
                <Zap size={14} /> Tech Literacy
             </h4>
             {renderTechLiteracy(arch.techLiteracy / 10)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonView;