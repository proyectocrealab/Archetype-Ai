import React from 'react';
import { ResearchFramework } from '../types';
import { FileText, Calendar, Users, Briefcase, Trash2, ArrowRight } from 'lucide-react';

interface FrameworkCardProps {
  framework: ResearchFramework;
  archetypeCount: number;
  onDelete?: (id: string) => void;
  onViewArchetypes?: (id: string) => void;
  isSelected?: boolean;
}

const FrameworkCard: React.FC<FrameworkCardProps> = ({ 
  framework, 
  archetypeCount, 
  onDelete, 
  onViewArchetypes,
  isSelected 
}) => {
  return (
    <div 
      className={`bg-slate-900/60 border-2 rounded-2xl p-6 transition-all duration-300 group
        ${isSelected ? 'border-brand-500 shadow-brand-500/10' : 'border-slate-800 hover:border-slate-700 shadow-xl'}
      `}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400 group-hover:scale-110 transition-transform">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">{framework.title}</h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              <Calendar size={12} />
              {new Date(framework.savedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        {onDelete && (
          <button 
            onClick={() => onDelete(framework.id)}
            className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Stakeholder</p>
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
            <Briefcase size={12} /> {framework.stakeholderTag}
          </div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Synthesis</p>
          <div className="flex items-center gap-2 text-brand-300 font-semibold text-xs">
            <Users size={12} /> {archetypeCount} Archetypes
          </div>
        </div>
      </div>

      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-6">
        {framework.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="text-[10px] text-slate-500 font-medium">
          By <span className="text-slate-300">{framework.researcherName}</span>
        </div>
        {onViewArchetypes && (
          <button 
            onClick={() => onViewArchetypes(framework.id)}
            className="flex items-center gap-2 text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors group/btn"
          >
            Explore Related
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FrameworkCard;