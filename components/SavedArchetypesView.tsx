import React, { useState, useEffect, useRef } from 'react';
import { UserArchetype } from '../types';
import ArchetypeCard from './ArchetypeCard';
import { Search, Filter, Tag, Library, Download, Upload, FileJson, AlertCircle, X, Check, CopyPlus, RefreshCcw } from 'lucide-react';

const SavedArchetypesView: React.FC = () => {
  const [savedArchetypes, setSavedArchetypes] = useState<UserArchetype[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<string[]>([]);
  
  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{archetypes: UserArchetype[], draft?: any} | null>(null);

  useEffect(() => {
    loadArchetypes();
  }, []);

  const loadArchetypes = () => {
    try {
      const savedRaw = localStorage.getItem('savedArchetypes');
      if (savedRaw) {
        const parsed: UserArchetype[] = JSON.parse(savedRaw);
        setSavedArchetypes(parsed);
        updateTags(parsed);
      }
    } catch (e) {
      console.error("Failed to load saved archetypes", e);
    }
  };

  const updateTags = (archetypes: UserArchetype[]) => {
    const tags = new Set<string>();
    archetypes.forEach(a => a.tags?.forEach(t => tags.add(t)));
    setAllTags(Array.from(tags).sort());
  };

  const handleUpdate = (updated: UserArchetype) => {
    const newList = savedArchetypes.map(a => a.id === updated.id ? updated : a);
    setSavedArchetypes(newList);
    localStorage.setItem('savedArchetypes', JSON.stringify(newList));
    updateTags(newList);
  };

  const handleDelete = (id: string) => {
      const newList = savedArchetypes.filter(a => a.id !== id);
      setSavedArchetypes(newList);
      localStorage.setItem('savedArchetypes', JSON.stringify(newList));
      updateTags(newList);
  };

  const toggleTag = (tag: string) => {
      const newSet = new Set(selectedTags);
      if (newSet.has(tag)) {
          newSet.delete(tag);
      } else {
          newSet.add(tag);
      }
      setSelectedTags(newSet);
  };

  // --- Backup / Restore Logic ---

  const handleExport = () => {
    try {
        const draftData = localStorage.getItem('archetype_research_draft');
        const exportData = {
            version: 1,
            timestamp: new Date().toISOString(),
            archetypes: savedArchetypes,
            draft: draftData ? JSON.parse(draftData) : null
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `archetype-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Export failed", e);
        alert("Failed to export data.");
    }
  };

  const handleImportClick = () => {
      if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset
          fileInputRef.current.click();
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const content = event.target?.result as string;
              const data = JSON.parse(content);
              
              // Basic validation
              let archetypesToImport: UserArchetype[] = [];
              let draftToImport = null;

              if (Array.isArray(data)) {
                  // Legacy or raw array import
                  archetypesToImport = data;
              } else if (data.archetypes && Array.isArray(data.archetypes)) {
                  // New backup format
                  archetypesToImport = data.archetypes;
                  draftToImport = data.draft;
              } else {
                  throw new Error("Invalid format");
              }

              setPendingImport({
                  archetypes: archetypesToImport,
                  draft: draftToImport
              });

          } catch (err) {
              console.error("Import parsing error", err);
              alert("The file selected does not appear to be a valid Archetype AI backup.");
          }
      };
      reader.readAsText(file);
  };

  const handleMergeImport = () => {
      if (!pendingImport) return;

      // Merge Archetypes (Dedupe by ID)
      const currentIds = new Set(savedArchetypes.map(a => a.id));
      const newUnique = pendingImport.archetypes.filter(a => !currentIds.has(a.id));
      
      const merged = [...savedArchetypes, ...newUnique];
      setSavedArchetypes(merged);
      localStorage.setItem('savedArchetypes', JSON.stringify(merged));
      updateTags(merged);

      // We generally do NOT overwrite draft on merge unless explicitly asked, 
      // but to keep it simple, merge only adds archetypes.
      
      alert(`Imported ${newUnique.length} new archetypes.`);
      setPendingImport(null);
  };

  const handleReplaceImport = () => {
      if (!pendingImport) return;

      if (window.confirm("This will completely replace your current library and draft. Are you sure?")) {
          setSavedArchetypes(pendingImport.archetypes);
          localStorage.setItem('savedArchetypes', JSON.stringify(pendingImport.archetypes));
          updateTags(pendingImport.archetypes);

          if (pendingImport.draft) {
              localStorage.setItem('archetype_research_draft', JSON.stringify(pendingImport.draft));
          } else {
              // Optionally clear draft or leave it? "Replace" usually implies state restoration.
              // Let's clear it if the backup has no draft, to match exact state.
              localStorage.removeItem('archetype_research_draft');
          }

          alert("Library and draft restored from backup.");
          setPendingImport(null);
      }
  };

  // --- Rendering ---

  const filtered = savedArchetypes.filter(arch => {
      const matchesSearch = 
        arch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        arch.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        arch.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTags = selectedTags.size === 0 || arch.tags?.some(t => selectedTags.has(t));

      return matchesSearch && matchesTags;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-24 relative">
      <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json" 
          onChange={handleFileChange}
      />

      {/* Import Decision Modal */}
      {pendingImport && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-brand-500/20 rounded-full text-brand-400">
                          <FileJson size={28} />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-white">Import Backup</h3>
                          <p className="text-slate-400 mt-1">
                              Found {pendingImport.archetypes.length} archetypes {pendingImport.draft ? 'and 1 project draft' : ''} in this file.
                              How would you like to proceed?
                          </p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <button 
                          onClick={handleMergeImport}
                          className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all group"
                      >
                          <CopyPlus className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
                          <span className="font-bold text-slate-200">Merge</span>
                          <span className="text-xs text-slate-500 text-center mt-1">Add new items to my current library. Keep existing data.</span>
                      </button>

                      <button 
                          onClick={handleReplaceImport}
                          className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all group"
                      >
                          <RefreshCcw className="text-rose-400 mb-2 group-hover:scale-110 transition-transform" size={24} />
                          <span className="font-bold text-slate-200">Replace</span>
                          <span className="text-xs text-slate-500 text-center mt-1">Overwrite library with backup data. This cannot be undone.</span>
                      </button>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                      <button 
                          onClick={() => setPendingImport(null)}
                          className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2"
                      >
                          Cancel
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="border-b border-slate-800 pb-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
            <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Library className="text-brand-400" />
                    My Archetype Library
                </h2>
                <p className="text-slate-400 mt-1">Manage, organize, and revisit your saved personas.</p>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
                    title="Download a backup of your library and draft"
                >
                    <Download size={16} /> Export Backup
                </button>
                <button 
                    onClick={handleImportClick}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
                    title="Import data from a backup file"
                >
                    <Upload size={16} /> Import
                </button>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-slate-500" />
                </div>
                <input
                    type="text"
                    placeholder="Search library..."
                    className="pl-10 pr-4 py-2.5 w-full bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="text-sm text-slate-500 whitespace-nowrap px-2">
                {savedArchetypes.length} items
            </div>
        </div>
        
        {/* Tag Filters */}
        {allTags.length > 0 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Filter size={14} className="text-slate-500 mr-2 flex-shrink-0" />
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`
                            px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex items-center gap-1.5
                            ${selectedTags.has(tag) 
                                ? 'bg-brand-500/20 border-brand-500 text-brand-200' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'}
                        `}
                    >
                        <Tag size={10} />
                        {tag}
                    </button>
                ))}
                {selectedTags.size > 0 && (
                    <button 
                        onClick={() => setSelectedTags(new Set())}
                        className="text-xs text-slate-500 hover:text-white underline ml-2 whitespace-nowrap"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        )}
      </div>

      {savedArchetypes.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-800 border-dashed">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
                  <Library size={32} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-300">Your library is empty</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                  Generate archetypes from your research data and save them here, or import a backup file to get started.
              </p>
              <button 
                  onClick={handleImportClick}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-full font-medium transition-colors"
              >
                  <Upload size={16} /> Import Backup
              </button>
          </div>
      ) : filtered.length === 0 ? (
          <div className="text-center py-12">
              <p className="text-slate-400">No archetypes match your search filters.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
            {filtered.map(arch => (
                <ArchetypeCard 
                    key={arch.id} 
                    archetype={arch}
                    isSavedView={true}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            ))}
          </div>
      )}
    </div>
  );
};

export default SavedArchetypesView;