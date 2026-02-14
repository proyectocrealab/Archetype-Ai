import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserArchetype, ResearchFramework } from '../types';
import ArchetypeCard from './ArchetypeCard';
import FrameworkCard from './FrameworkCard';
import { Search, Filter, Tag, Library, Download, Upload, FileJson, RefreshCcw, ArrowLeft, Briefcase, LayoutGrid, FileText, CheckCircle2, Circle, Info, Layers, UserCircle, X, Frown, Target, Users, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface SavedArchetypesViewProps {
  onBackToDashboard?: () => void;
}

type LibraryViewMode = 'ALL_ARCHETYPES' | 'FRAMEWORKS';

const SavedArchetypesView: React.FC<SavedArchetypesViewProps> = ({ onBackToDashboard }) => {
  const [savedArchetypes, setSavedArchetypes] = useState<UserArchetype[]>([]);
  const [savedFrameworks, setSavedFrameworks] = useState<ResearchFramework[]>([]);
  const [viewMode, setViewMode] = useState<LibraryViewMode>('FRAMEWORKS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const [activeFrameworkId, setActiveFrameworkId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = () => {
    try {
      const archetypesRaw = localStorage.getItem('savedArchetypes');
      const frameworksRaw = localStorage.getItem('savedFrameworks');
      const archetypes: UserArchetype[] = archetypesRaw ? JSON.parse(archetypesRaw) : [];
      const frameworks: ResearchFramework[] = frameworksRaw ? JSON.parse(frameworksRaw) : [];
      setSavedArchetypes(archetypes);
      setSavedFrameworks(frameworks);
      updateMetadata(archetypes, frameworks);
    } catch (e) {
      console.error("Failed to load library", e);
    }
  };

  const updateMetadata = (archetypes: UserArchetype[], frameworks: ResearchFramework[]) => {
    const tags = new Set<string>();
    const categories = new Set<string>();
    archetypes.forEach(a => {
        a.tags?.forEach(t => tags.add(t));
        if (a.category) categories.add(a.category);
    });
    setAllTags(Array.from(tags).sort());
    setAllCategories(Array.from(categories).sort());
  };

  const handleUpdateArchetype = (updated: UserArchetype) => {
    const newList = savedArchetypes.map(a => a.id === updated.id ? updated : a);
    setSavedArchetypes(newList);
    localStorage.setItem('savedArchetypes', JSON.stringify(newList));
    updateMetadata(newList, savedFrameworks);
  };

  const handleDeleteArchetype = (id: string) => {
      const newList = savedArchetypes.filter(a => a.id !== id);
      setSavedArchetypes(newList);
      localStorage.setItem('savedArchetypes', JSON.stringify(newList));
      updateMetadata(newList, savedFrameworks);
      const nextSelected = new Set(selectedIds);
      nextSelected.delete(id);
      setSelectedIds(nextSelected);
  };

  const handleDeleteFramework = (id: string) => {
    if (!window.confirm("Deleting this framework will not delete its archetypes, but they will become 'unlinked'. Continue?")) return;
    const newList = savedFrameworks.filter(f => f.id !== id);
    setSavedFrameworks(newList);
    localStorage.setItem('savedFrameworks', JSON.stringify(newList));
    updateMetadata(savedArchetypes, newList);
    if (activeFrameworkId === id) setActiveFrameworkId(null);
  };

  const handleBatchPdfExport = async () => {
    if (selectedIds.size === 0) return;
    setIsExportingPdf(true);
    setExportProgress(0);

    try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const selectedArchetypes = savedArchetypes.filter(a => selectedIds.has(a.id));
        
        const groups: Map<string, { framework: ResearchFramework | any, archetypes: UserArchetype[] }> = new Map();
        
        selectedArchetypes.forEach(arch => {
            const fw = savedFrameworks.find(f => f.id === arch.frameworkId);
            const groupKey = arch.frameworkId || 'unlinked-' + arch.researcherName;
                
            if (!groups.has(groupKey)) {
                groups.set(groupKey, { 
                    framework: fw || arch.sourceResearch || {
                        title: 'General Research',
                        researcherName: arch.researcherName || 'Anonymous',
                        teamName: arch.teamName || 'Independent',
                        stakeholderTag: arch.category || 'General',
                        description: 'Archetypes synthesized from general research notes.',
                        painPoints: 'N/A', needs: 'N/A', goals: 'N/A', actions: 'N/A'
                    }, 
                    archetypes: [] 
                });
            }
            groups.get(groupKey)?.archetypes.push(arch);
        });

        const sortedGroupKeys = Array.from(groups.keys());
        let totalItems = 0;
        groups.forEach(g => totalItems += (1 + g.archetypes.length));
        let processedItems = 0;

        for (let i = 0; i < sortedGroupKeys.length; i++) {
            const key = sortedGroupKeys[i];
            const group = groups.get(key)!;
            const frameworkElement = document.getElementById('framework-summary-template');
            
            if (frameworkElement) {
                frameworkElement.querySelector('.pdf-fw-title')!.textContent = group.framework.title;
                frameworkElement.querySelector('.pdf-fw-stakeholder')!.textContent = group.framework.stakeholderTag;
                frameworkElement.querySelector('.pdf-fw-researcher')!.textContent = group.framework.researcherName;
                frameworkElement.querySelector('.pdf-fw-team')!.textContent = group.framework.teamName;
                frameworkElement.querySelector('.pdf-fw-desc')!.textContent = group.framework.description;
                frameworkElement.querySelector('.pdf-fw-pains')!.textContent = group.framework.painPoints;
                frameworkElement.querySelector('.pdf-fw-needs')!.textContent = group.framework.needs;
                frameworkElement.querySelector('.pdf-fw-actions')!.textContent = group.framework.actions;

                const fwCanvas = await html2canvas(frameworkElement, { 
                    scale: 2.5, 
                    useCORS: true, 
                    backgroundColor: '#0f172a' 
                });

                if (processedItems > 0) doc.addPage();
                const fwImgData = fwCanvas.toDataURL('image/png');
                doc.addImage(fwImgData, 'PNG', 10, 10, 190, (fwCanvas.height * 190) / fwCanvas.width);
                processedItems++;
                setExportProgress(Math.round((processedItems / totalItems) * 100));
            }

            for (const arch of group.archetypes) {
                const cardElement = document.getElementById(`archetype-card-${arch.id}`);
                if (cardElement) {
                    const cardCanvas = await html2canvas(cardElement, { 
                        scale: 2.5, 
                        useCORS: true, 
                        backgroundColor: '#0f172a',
                        onclone: (clonedDoc) => {
                            const card = clonedDoc.getElementById(`archetype-card-${arch.id}`);
                            if (card) {
                                card.classList.add('export-active');
                                const uiElements = card.querySelectorAll('.ui-only');
                                uiElements.forEach(el => (el as HTMLElement).style.display = 'none');
                            }
                        }
                    });

                    doc.addPage();
                    const cardImgData = cardCanvas.toDataURL('image/png');
                    doc.addImage(cardImgData, 'PNG', 10, 10, 190, (cardCanvas.height * 190) / cardCanvas.width);
                    processedItems++;
                    setExportProgress(Math.round((processedItems / totalItems) * 100));
                }
            }
        }
        doc.save(`archetype-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
        console.error("PDF Export failed", err);
    } finally {
        setIsExportingPdf(false);
        setExportProgress(0);
    }
  };

  const toggleTag = (tag: string) => {
      const next = new Set(selectedTags);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      setSelectedTags(next);
  };

  const filteredArchetypes = useMemo(() => {
    return savedArchetypes.filter(arch => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = arch.name.toLowerCase().includes(q) || arch.role.toLowerCase().includes(q) || arch.category?.toLowerCase().includes(q);
      const matchesTags = selectedTags.size === 0 || arch.tags?.some(t => selectedTags.has(t));
      const matchesCategory = !selectedCategory || arch.category === selectedCategory;
      const matchesFramework = !activeFrameworkId || arch.frameworkId === activeFrameworkId;
      return matchesSearch && matchesTags && matchesCategory && matchesFramework;
    });
  }, [savedArchetypes, searchQuery, selectedTags, selectedCategory, activeFrameworkId]);

  const filteredFrameworks = useMemo(() => {
    return savedFrameworks.filter(fw => {
      const q = searchQuery.toLowerCase();
      return fw.title.toLowerCase().includes(q) || fw.stakeholderTag.toLowerCase().includes(q) || fw.researcherName.toLowerCase().includes(q);
    });
  }, [savedFrameworks, searchQuery]);

  const activeFramework = useMemo(() => savedFrameworks.find(f => f.id === activeFrameworkId), [savedFrameworks, activeFrameworkId]);

  return (
    <div className="space-y-8 animate-fade-in pb-24 relative">
      <div id="framework-summary-template" className="fixed -left-[4000px] w-[1000px] bg-slate-900 text-white p-16 space-y-12 rounded-3xl" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="flex items-start justify-between border-b border-slate-700 pb-12">
              <div className="space-y-4">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-brand-500/20 border border-brand-500/30 rounded text-brand-400 text-[12px] font-black uppercase tracking-widest w-fit">Research Framework Data</div>
                  <h1 className="text-6xl font-black pdf-fw-title leading-tight">Project Title</h1>
                  <p className="text-indigo-400 text-2xl font-bold flex items-center gap-3"><Briefcase size={28}/> <span className="pdf-fw-stakeholder">Stakeholder</span></p>
              </div>
              <div className="text-right">
                   <p className="text-slate-500 text-[12px] font-black uppercase tracking-tighter">Synthesized By</p>
                   <p className="text-slate-200 text-2xl font-bold pdf-fw-researcher">Researcher Name</p>
                   <p className="text-brand-500 font-black pdf-fw-team uppercase text-sm mt-2">Team Name</p>
              </div>
          </div>
          
          <div className="space-y-6">
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Context & Objectives</h3>
              <p className="text-slate-300 text-2xl leading-relaxed italic pdf-fw-desc whitespace-pre-wrap">Description text...</p>
          </div>

          <div className="grid grid-cols-2 gap-16 pt-6">
              <div className="space-y-6">
                  <h3 className="flex items-center gap-3 text-sm font-black uppercase text-rose-500 tracking-widest"><Frown size={24}/> Observed Pain Points</h3>
                  <p className="text-slate-400 text-lg leading-relaxed pdf-fw-pains whitespace-pre-wrap"></p>
              </div>
              <div className="space-y-6">
                  <h3 className="flex items-center gap-3 text-sm font-black uppercase text-emerald-500 tracking-widest"><Target size={24}/> Core User Needs</h3>
                  <p className="text-slate-400 text-lg leading-relaxed pdf-fw-needs whitespace-pre-wrap"></p>
              </div>
          </div>

          <div className="pt-10 space-y-6 border-t border-slate-800">
              <h3 className="flex items-center gap-3 text-sm font-black uppercase text-brand-400 tracking-widest"><Users size={24}/> Behavioral Observations</h3>
              <p className="text-slate-300 text-xl leading-relaxed pdf-fw-actions whitespace-pre-wrap"></p>
          </div>

          <div className="pt-20 text-slate-600 text-[12px] uppercase font-bold text-center border-t border-slate-800">
              Generated by Archetype AI Synthesis Framework • Official Report
          </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {onBackToDashboard && (
                <button onClick={onBackToDashboard} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white border border-transparent hover:border-slate-700 transition-colors">
                    <ArrowLeft size={24} />
                </button>
            )}
            <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Library className="text-brand-400" />
                    Library
                </h2>
                <div className="flex items-center gap-4 mt-1">
                   <button 
                    onClick={() => { setViewMode('FRAMEWORKS'); setActiveFrameworkId(null); setSelectedCategory(null); }}
                    className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-2 py-0.5 rounded transition-all
                      ${viewMode === 'FRAMEWORKS' ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     <Layers size={12} /> Framework Cards
                   </button>
                   <button 
                    onClick={() => { setViewMode('ALL_ARCHETYPES'); setActiveFrameworkId(null); }}
                    className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-2 py-0.5 rounded transition-all
                      ${viewMode === 'ALL_ARCHETYPES' ? 'bg-brand-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     <UserCircle size={12} /> All Archetypes
                   </button>
                </div>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <button 
                onClick={handleBatchPdfExport}
                disabled={selectedIds.size === 0 || isExportingPdf}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-bold shadow-xl relative
                    ${selectedIds.size > 0 ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500' : 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed'}
                `}
            >
                {isExportingPdf ? <RefreshCcw className="animate-spin" size={16} /> : <FileText size={16} />}
                {isExportingPdf ? `Exporting ${exportProgress}%` : `Full Report PDF (${selectedIds.size})`}
            </button>
            <button onClick={() => {}} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-sm font-medium"><Download size={16} /> Backup</button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder={viewMode === 'FRAMEWORKS' ? "Search frameworks..." : "Search archetypes..."}
                    className="pl-10 pr-4 py-2.5 w-full bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                  />
              </div>

              {viewMode === 'ALL_ARCHETYPES' && allCategories.length > 0 && (
                  <div className="relative min-w-[240px]">
                      <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 pointer-events-none" />
                      <select 
                        value={selectedCategory || ""}
                        onChange={(e) => setSelectedCategory(e.target.value || null)}
                        className="appearance-none pl-10 pr-10 py-2.5 w-full bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm font-medium cursor-pointer"
                      >
                          <option value="">All Categories (Stakeholders)</option>
                          {allCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                          ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
              )}
          </div>

          {viewMode === 'ALL_ARCHETYPES' && allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-500 uppercase tracking-widest mr-2">
                      <Tag size={12} /> Behavioral Filter:
                  </div>
                  {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all border
                            ${selectedTags.has(tag) 
                                ? 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/20' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'}
                        `}
                      >
                          {tag}
                      </button>
                  ))}
                  {selectedTags.size > 0 && (
                      <button 
                        onClick={() => setSelectedTags(new Set())}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-400 transition-colors uppercase ml-2 flex items-center gap-1"
                      >
                        <X size={12} /> Clear
                      </button>
                  )}
              </div>
          )}
      </div>

      {activeFrameworkId && activeFramework && (
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-6 animate-fade-in-up">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><Layers size={20} /></div>
                      <div>
                          <h3 className="text-lg font-bold text-white">{activeFramework.title}</h3>
                          <p className="text-xs text-slate-400">Filtering archetypes linked to this research batch</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setActiveFrameworkId(null)}
                    className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
                  >
                    Show All Batches <X size={14} />
                  </button>
              </div>
          </div>
      )}

      {viewMode === 'FRAMEWORKS' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFrameworks.map(fw => (
                  <FrameworkCard 
                    key={fw.id} 
                    framework={fw} 
                    archetypeCount={savedArchetypes.filter(a => a.frameworkId === fw.id).length}
                    onDelete={handleDeleteFramework}
                    onViewArchetypes={(id) => {
                        setActiveFrameworkId(id);
                        setViewMode('ALL_ARCHETYPES');
                    }}
                  />
              ))}
              {filteredFrameworks.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-500 italic">No framework cards found matching your search.</div>
              )}
          </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredArchetypes.map(arch => (
                <ArchetypeCard 
                    key={arch.id} 
                    archetype={arch} 
                    isSavedView={true} 
                    onUpdate={handleUpdateArchetype} 
                    onDelete={handleDeleteArchetype} 
                    isSelected={selectedIds.has(arch.id)} 
                    onToggleSelect={(id) => {
                        const next = new Set(selectedIds);
                        next.has(id) ? next.delete(id) : next.add(id);
                        setSelectedIds(next);
                    }} 
                    selectionMode={true} 
                />
            ))}
            {filteredArchetypes.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-500 italic flex flex-col items-center gap-4">
                    <div className="p-4 bg-slate-900 rounded-full border border-slate-800"><Search size={32} className="text-slate-700" /></div>
                    <p>No archetypes found matching these filters.</p>
                    {(selectedTags.size > 0 || selectedCategory || searchQuery) && (
                        <button 
                            onClick={() => { setSelectedTags(new Set()); setSelectedCategory(null); setSearchQuery(''); }}
                            className="text-brand-400 font-bold hover:underline"
                        >
                            Reset All Filters
                        </button>
                    )}
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default SavedArchetypesView;