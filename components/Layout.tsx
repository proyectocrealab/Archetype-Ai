import React, { ReactNode } from 'react';
import { Users, LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  onNavigate?: (view: any) => void;
  onClearKey?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate, onClearKey }) => {
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
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">made by Arturo Zamora</span>
            </div>
          </button>
          <nav className="flex items-center gap-6">
            <button 
                onClick={() => onNavigate && onNavigate('SAVED')}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
                My Library
            </button>
            {onClearKey && (
                <button 
                    onClick={() => {
                        if(confirm('Remove API Key from this device?')) onClearKey();
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1.5 border border-slate-800 hover:border-rose-500/30 px-2 py-1 rounded bg-slate-900"
                    title="Change API Key"
                >
                    <LogOut size={12} /> Key
                </button>
            )}
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