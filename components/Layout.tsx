import React, { ReactNode } from 'react';
import { Users, GraduationCap, Library, LayoutGrid, Key } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  onNavigate?: (view: any) => void;
  onOpenKeySettings?: () => void;
  isKeyActive?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate, onOpenKeySettings, isKeyActive }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans selection:bg-brand-500/30 selection:text-brand-100">
      
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => onNavigate && onNavigate('INPUT')} className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left">
            <div className="bg-brand-600 p-2 rounded-lg">
                <Users size={20} className="text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-none">
                Archetype<span className="text-brand-400">AI</span>
                </h1>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5 tracking-tight">made by Arturo Zamora</span>
            </div>
          </button>

          {/* User Requested API Key Button Area */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <button 
              onClick={onOpenKeySettings}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-xs font-bold uppercase tracking-wider
                ${isKeyActive 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                }`}
            >
              <Key size={14} />
              <span>{isKeyActive ? 'API Key Active' : 'Configure API Key'}</span>
              <div className={`w-2 h-2 rounded-full ${isKeyActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            </button>
          </div>
          
          <nav className="flex items-center gap-2 sm:gap-6">
            <button 
                onClick={() => onNavigate && onNavigate('INPUT')}
                className="text-xs sm:text-sm font-medium text-slate-400 hover:text-brand-400 transition-colors flex items-center gap-2 px-2 py-1"
            >
                <LayoutGrid size={16} /> <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button 
                onClick={() => onNavigate && onNavigate('BOOTCAMP')}
                className="text-xs sm:text-sm font-medium text-slate-400 hover:text-brand-400 transition-colors flex items-center gap-2 px-2 py-1"
            >
                <GraduationCap size={16} /> <span className="hidden sm:inline">Bootcamp</span>
            </button>
            <button 
                onClick={() => onNavigate && onNavigate('SAVED')}
                className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2 px-2 py-1"
            >
                <Library size={16} /> <span className="hidden sm:inline">Library</span>
            </button>
            {/* Mobile API Key Trigger */}
            <button 
                onClick={onOpenKeySettings}
                className="md:hidden p-2 text-slate-400 hover:text-white"
            >
                <Key size={18} />
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>

      <footer className="border-t border-slate-800 py-8 mt-auto bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Archetype AI. Built by Arturo Zamora.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;