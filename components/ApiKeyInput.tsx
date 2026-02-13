import React, { useState } from 'react';
import { Key, Lock, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';

interface ApiKeyInputProps {
  onSetKey: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onSetKey }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      onSetKey(inputKey.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 animate-fade-in-up">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mb-4 border border-brand-500/20">
            <Key className="text-brand-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Archetype AI</h1>
          <p className="text-slate-400 text-sm">
            To get started, please enter your Google Gemini API Key. 
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-slate-500" />
              </div>
              <input
                id="apiKey"
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end">
                <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                >
                    Get a key from Google AI Studio <ExternalLink size={10} />
                </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputKey.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
          >
            <span>Start Researching</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800">
           <div className="flex items-start gap-3">
               <ShieldCheck size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
               <p className="text-xs text-slate-500 leading-relaxed">
                   Your API key is stored locally in your browser and used directly to communicate with Google's servers. It is never sent to any other backend.
               </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyInput;