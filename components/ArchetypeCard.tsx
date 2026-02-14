import React, { useEffect, useState } from 'react';
import { UserArchetype } from '../types';
import { generatePersonaImage } from '../services/geminiService';
import { User, Target, Frown, Lightbulb, Zap, Download, Save, Edit2, Check, X, RefreshCcw, Circle, CheckCircle2, Tag, StickyNote, Trash2, PlusCircle, Briefcase } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';

interface ArchetypeCardProps {
  archetype: UserArchetype;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
  isSavedView?: boolean;
  onUpdate?: (updated: UserArchetype) => void;
  onDelete?: (id: string) => void;
}

interface EditState extends Omit<UserArchetype, 'goals' | 'frustrations' | 'motivations' | 'personalityTraits' | 'tags'> {
    goals: string;
    frustrations: string;
    motivations: string;
    personalityTraits: string;
    imagePrompt: string;
    category: string;
    tags: string[];
    notes: string;
}

const ArchetypeCard: React.FC<ArchetypeCardProps> = ({ 
    archetype: initialArchetype, 
    isSelected = false, 
    onToggleSelect,
    selectionMode = false,
    isSavedView = false,
    onUpdate,
    onDelete
}) => {
  const [currentArchetype, setCurrentArchetype] = useState<UserArchetype>(initialArchetype);
  const [imageUrl, setImageUrl] = useState<string | null>(initialArchetype.imageUrl || null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditState | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    setCurrentArchetype(initialArchetype);
    setImageUrl(initialArchetype.imageUrl || null);
  }, [initialArchetype]);

  const handleFetchImage = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (loadingImage) return;

    setLoadingImage(true);
    setImageError(null);
    try {
        const url = await generatePersonaImage(currentArchetype.imagePrompt || currentArchetype.name);
        setImageUrl(url);
        if (isSavedView && onUpdate) {
            onUpdate({ ...currentArchetype, imageUrl: url });
        }
    } catch (e: any) {
        console.error("Failed to load image", e);
        setImageError("Limit hit. Try again in 1 min.");
    } finally {
        setLoadingImage(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditForm({
        ...currentArchetype,
        goals: currentArchetype.goals.join('\n'),
        frustrations: currentArchetype.frustrations.join('\n'),
        motivations: currentArchetype.motivations.join('\n'),
        personalityTraits: currentArchetype.personalityTraits.join(', '),
        imagePrompt: currentArchetype.imagePrompt || '',
        category: currentArchetype.category || 'General',
        tags: currentArchetype.tags || [],
        notes: currentArchetype.notes || ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editForm) return;

    const updatedArchetype: UserArchetype = {
        ...editForm,
        goals: editForm.goals.split('\n').filter(s => s.trim()),
        frustrations: editForm.frustrations.split('\n').filter(s => s.trim()),
        motivations: editForm.motivations.split('\n').filter(s => s.trim()),
        personalityTraits: editForm.personalityTraits.split(',').map(s => s.trim()).filter(s => s),
        tags: editForm.tags,
        category: editForm.category,
        notes: editForm.notes,
        imageUrl: imageUrl || undefined
    };

    setCurrentArchetype(updatedArchetype);
    setIsEditing(false);
    setEditForm(null);

    if (onUpdate) onUpdate(updatedArchetype);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditForm(null);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim() || !editForm) return;
    const tag = newTagInput.trim().toLowerCase();
    if (!editForm.tags.includes(tag)) {
        setEditForm({
            ...editForm,
            tags: [...editForm.tags, tag]
        });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!editForm) return;
    setEditForm({
        ...editForm,
        tags: editForm.tags.filter(t => t !== tagToRemove)
    });
  };

  const renderTechLiteracy = (score: number) => (
    <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
      <div className="bg-brand-500 h-2.5 rounded-full transition-all duration-1000 ease-out tech-literacy-bar" style={{ width: `${score * 10}%` }}></div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>Low</span>
          <span>High Tech</span>
      </div>
    </div>
  );

  const handleSaveArchetype = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        const savedRaw = localStorage.getItem('savedArchetypes');
        const savedList: UserArchetype[] = savedRaw ? JSON.parse(savedRaw) : [];
        const existingIndex = savedList.findIndex(a => a.id === currentArchetype.id);
        
        const archetypeToSave = {
            ...currentArchetype,
            imageUrl: imageUrl || currentArchetype.imageUrl,
            savedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
             savedList[existingIndex] = archetypeToSave;
        } else {
            savedList.push(archetypeToSave);
        }
        localStorage.setItem('savedArchetypes', JSON.stringify(savedList));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
        alert("Local storage limit reached. Try deleting old archetypes.");
    }
  };

  const handleExportPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const element = document.getElementById(`archetype-card-${currentArchetype.id}`);
    if (!element) return;
    
    setIsExporting(true);
    try {
        // Use high scale for crisp text, onclone ensures state is set for capture
        const canvas = await html2canvas(element, {
            scale: 2.0,
            useCORS: true,
            backgroundColor: '#0f172a',
            logging: false,
            onclone: (clonedDoc) => {
                const card = clonedDoc.getElementById(`archetype-card-${currentArchetype.id}`);
                if (card) {
                    card.classList.add('export-active');
                    // Ensure the card has no max height during export
                    card.style.height = 'auto';
                    card.style.maxHeight = 'none';
                    card.style.width = '1000px';
                    card.style.position = 'relative';
                    card.style.left = '0';
                    card.style.top = '0';
                    
                    const uiOnly = card.querySelectorAll('.ui-only');
                    uiOnly.forEach(el => (el as HTMLElement).style.display = 'none');
                }
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        // Multi-page tiling: image is shifted up by pdfHeight on each new page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`${currentArchetype.name}-Behavioral-Archetype.pdf`);
    } catch (err) {
        console.error("PDF Export failed", err);
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div 
        id={`archetype-card-${currentArchetype.id}`}
        className={`bg-slate-800 rounded-2xl overflow-hidden shadow-xl border flex flex-col h-full transition-all duration-300 group relative archetype-card-container
            ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/50 transform scale-[1.01]' : 'border-slate-700 hover:border-slate-600'}
            ${selectionMode && !isEditing ? 'cursor-pointer' : ''}
        `}
        onClick={selectionMode && !isEditing ? () => onToggleSelect?.(currentArchetype.id) : undefined}
    >
      {selectionMode && !isEditing && (
          <div className="absolute top-4 left-4 z-30 ui-only">
              {isSelected ? (
                  <div className="bg-indigo-600 rounded-full p-1 shadow-lg border border-indigo-400">
                      <CheckCircle2 size={16} className="text-white" />
                  </div>
              ) : (
                  <div className="bg-slate-900/50 rounded-full p-1 backdrop-blur-sm border border-slate-700 hover:border-slate-500 transition-colors">
                      <Circle size={16} className="text-slate-500" />
                  </div>
              )}
          </div>
      )}

      <div className={`relative ${isEditing ? 'py-6' : 'h-48'} bg-gradient-to-r from-slate-700 to-slate-600 p-6 flex items-center justify-between card-header`}>
         <div className={`flex ${isEditing ? 'flex-col sm:flex-row items-start' : 'items-center'} gap-6 z-10 relative w-full`}>
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-28 h-28 rounded-full border-4 border-slate-800 shadow-lg overflow-hidden flex-shrink-0 bg-slate-900 group/img avatar-container">
                    {imageUrl ? (
                        <img src={imageUrl} alt={currentArchetype.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-2">
                            {loadingImage ? (
                                <RefreshCcw size={24} className="animate-spin text-brand-400" />
                            ) : (
                                <>
                                    <User size={32} className="mb-1 opacity-20" />
                                    <button 
                                        onClick={handleFetchImage}
                                        className="text-[9px] font-bold bg-brand-600 hover:bg-brand-500 text-white px-2 py-1 rounded shadow-lg uppercase tracking-tight ui-only"
                                    >
                                        Generate
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {imageUrl && !isEditing && (
                        <button 
                            onClick={handleFetchImage}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-[10px] font-bold text-white uppercase ui-only"
                        >
                            Regenerate
                        </button>
                    )}
                </div>
                {imageError && <p className="text-[9px] text-rose-400 font-bold animate-pulse ui-only">{imageError}</p>}
            </div>

            <div className="flex-1 min-w-0 w-full header-text-content">
                {isEditing && editForm ? (
                    <div className="space-y-2 ui-only">
                        <input className="w-full bg-slate-900/50 border border-slate-500 rounded px-2 py-1 text-white font-bold" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                        <input className="w-full bg-slate-900/50 border border-slate-500 rounded px-2 py-1 text-brand-300 text-sm" value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} />
                        <div className="flex gap-2">
                           <input type="number" className="w-20 bg-slate-900/50 border border-slate-500 rounded px-2 py-1 text-slate-400 text-xs" value={editForm.age} onChange={(e) => setEditForm({...editForm, age: parseInt(e.target.value) || 0})} />
                           <div className="flex-1 flex items-center gap-2 bg-slate-900/50 border border-slate-500 rounded px-2 py-1">
                               <Briefcase size={12} className="text-slate-500" />
                               <input className="bg-transparent border-none p-0 text-[10px] text-brand-200 uppercase font-bold focus:ring-0 w-full" value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} placeholder="Category..." />
                           </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-1 badge-container">
                             <div className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-[9px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-1 stakeholder-badge">
                                <Briefcase size={10} />
                                {currentArchetype.category || 'General'}
                             </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white truncate card-title leading-tight">{currentArchetype.name}</h3>
                        <p className="text-brand-300 font-medium truncate card-role">{currentArchetype.role}</p>
                        <p className="text-slate-400 text-xs mt-1 card-age">{currentArchetype.age} years old</p>
                    </>
                )}
            </div>
         </div>
         
         <div className="absolute top-4 right-4 z-20 flex gap-2 ui-only">
             {isEditing ? (
                 <>
                    <button onClick={handleSaveEdit} className="p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-500 transition-colors"><Check size={14} /></button>
                    <button onClick={handleCancelEdit} className="p-2 bg-slate-700 text-white rounded-full shadow-lg hover:bg-slate-600 transition-colors"><X size={14} /></button>
                 </>
             ) : (
                 <button onClick={handleEditClick} className="p-2 bg-slate-800/50 text-slate-300 hover:text-white rounded-full backdrop-blur-sm border border-slate-700 hover:border-slate-500 transition-all"><Edit2 size={14} /></button>
             )}
         </div>
      </div>

      <div className="bg-brand-900/10 px-6 py-3 border-b border-slate-700 italic text-brand-200 text-center font-serif text-base card-quote transition-all">
        {isEditing && editForm ? (
            <input className="w-full bg-transparent border-none text-center focus:ring-0 ui-only" value={editForm.quote} onChange={(e) => setEditForm({...editForm, quote: e.target.value})} placeholder="Inspirational quote..." />
        ) : `"${currentArchetype.quote}"`}
      </div>

      <div className="p-6 space-y-6 flex-1 text-sm overflow-y-auto max-h-[500px] scrollbar-hide card-body transition-all">
        <section className="section-tags">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><Tag size={10}/> Behavioral Tags</h4>
            <div className="flex flex-wrap gap-1.5 min-h-[24px] tags-list">
                {isEditing && editForm ? (
                    <>
                        {editForm.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-500/10 border border-brand-500/30 rounded-full text-[10px] font-bold text-brand-300">
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-rose-400 ui-only"><X size={10} /></button>
                            </span>
                        ))}
                        <div className="flex items-center gap-1 w-full mt-2 ui-only">
                            <input 
                                type="text"
                                className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-[10px] flex-1 text-slate-300 focus:border-brand-500 outline-none"
                                placeholder="Add new behavioral tag..."
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            />
                            <button onClick={handleAddTag} className="text-brand-400 hover:text-brand-300"><PlusCircle size={16} /></button>
                        </div>
                    </>
                ) : (
                    currentArchetype.tags?.length ? (
                        currentArchetype.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-900/50 border border-slate-700 rounded-full text-[10px] font-medium text-slate-400 uppercase tracking-tight tag-badge">
                                {tag}
                            </span>
                        ))
                    ) : <span className="text-[10px] text-slate-600 italic">No behavioral tags</span>
                )}
            </div>
        </section>

        <section className="section-bio">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Background</h4>
            {isEditing && editForm ? (
                <textarea className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-slate-300 leading-relaxed text-sm ui-only" value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} rows={4} />
            ) : <p className="text-slate-300 leading-relaxed bio-text transition-all whitespace-pre-wrap">{currentArchetype.bio}</p>}
        </section>

        <div className="grid grid-cols-2 gap-4 section-stats">
            <section className="section-goals">
                <h4 className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-500 mb-2"><Target size={12} /> Goals</h4>
                {isEditing && editForm ? (
                    <textarea className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-[11px] text-slate-400 ui-only" value={editForm.goals} onChange={(e) => setEditForm({...editForm, goals: e.target.value})} rows={3} placeholder="One per line..." />
                ) : (
                    <ul className="space-y-1 text-slate-400 text-[11px] goals-list transition-all">
                        {currentArchetype.goals.map((g, i) => <li key={i} className="list-item transition-all">• {g}</li>)}
                    </ul>
                )}
            </section>
            <section className="section-pains">
                <h4 className="flex items-center gap-1 text-[10px] font-bold uppercase text-rose-500 mb-2"><Frown size={12} /> Pains</h4>
                {isEditing && editForm ? (
                    <textarea className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-[11px] text-slate-400 ui-only" value={editForm.frustrations} onChange={(e) => setEditForm({...editForm, frustrations: e.target.value})} rows={3} placeholder="One per line..." />
                ) : (
                    <ul className="space-y-1 text-slate-400 text-[11px] pains-list transition-all">
                        {currentArchetype.frustrations.map((f, i) => <li key={i} className="list-item transition-all">• {f}</li>)}
                    </ul>
                )}
            </section>
        </div>

        <section className="pt-2 section-tech">
            <h4 className="flex items-center gap-1 text-[10px] font-bold uppercase text-indigo-400 mb-1"><Zap size={12} /> Tech Literacy</h4>
            {isEditing && editForm ? (
                <input type="range" min="1" max="10" className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500 ui-only" value={editForm.techLiteracy} onChange={(e) => setEditForm({...editForm, techLiteracy: parseInt(e.target.value)})} />
            ) : renderTechLiteracy(currentArchetype.techLiteracy / 10)}
        </section>

        {(currentArchetype.notes || (isEditing && editForm?.notes)) && (
            <section className="pt-2 border-t border-slate-700/30 section-notes">
                <h4 className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 mb-1"><StickyNote size={12} /> Researcher Notes</h4>
                {isEditing && editForm ? (
                    <textarea className="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-[11px] text-slate-400 ui-only" value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} rows={2} placeholder="Add private research notes..." />
                ) : (
                    <p className="text-slate-400 text-xs italic leading-relaxed whitespace-pre-wrap">{currentArchetype.notes}</p>
                )}
            </section>
        )}
      </div>

      <div className="px-6 py-2 bg-slate-900/20 border-t border-slate-700/50 flex flex-col gap-0.5 researcher-meta">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">By {currentArchetype.researcherName || 'Anonymous'}</p>
          <p className="text-[9px] text-brand-500/70 font-black uppercase tracking-tighter">{currentArchetype.teamName || 'Independent'}</p>
      </div>
      
      <div className="p-3 bg-slate-900/40 border-t border-slate-700 flex justify-end gap-3 card-footer ui-only">
        {isSavedView && onDelete && (
             <button onClick={(e) => { e.stopPropagation(); onDelete(currentArchetype.id); }} className="text-[10px] text-rose-500 hover:text-rose-400 flex items-center gap-1 mr-auto"><Trash2 size={12} /> Delete</button>
        )}
        <button onClick={handleSaveArchetype} disabled={saveSuccess} className={`text-[10px] flex items-center gap-1 ${saveSuccess ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'}`}>
            {saveSuccess ? <CheckCircle2 size={12} /> : <Save size={12} />} {saveSuccess ? 'Saved to Library' : 'Save'}
        </button>
        <button 
            onClick={handleExportPdf} 
            disabled={isExporting}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 disabled:opacity-50"
        >
            {isExporting ? <RefreshCcw size={12} className="animate-spin" /> : <Download size={12} />} 
            {isExporting ? 'Exporting...' : 'PDF'}
        </button>
      </div>

      <style>{`
        /* NORMAL DASHBOARD STYLES */
        .archetype-card-container:not(.export-active) .bio-text {
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .archetype-card-container:not(.export-active) .list-item {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .archetype-card-container:not(.export-active) .goals-list > *:nth-child(n+4),
        .archetype-card-container:not(.export-active) .pains-list > *:nth-child(n+4) {
            display: none;
        }

        /* HIGH-FIDELITY PDF EXPORT STYLES (Expanding to fit content) */
        .archetype-card-container.export-active {
            height: auto !important;
            max-height: none !important;
            width: 1000px !important; 
            transform: none !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            background-color: #0f172a !important;
        }
        
        .archetype-card-container.export-active .card-header {
            height: auto !important;
            min-height: 280px !important;
            padding: 50px !important;
            display: flex !important;
            align-items: center !important;
            gap: 40px !important;
            background: linear-gradient(to right, #334155, #475569) !important;
        }

        .archetype-card-container.export-active .card-title {
            white-space: normal !important;
            overflow: visible !important;
            -webkit-line-clamp: none !important;
            font-size: 52px !important;
            line-height: 1.1 !important;
            margin-bottom: 12px !important;
            display: block !important;
        }

        .archetype-card-container.export-active .card-role {
            font-size: 28px !important;
            white-space: normal !important;
            overflow: visible !important;
            -webkit-line-clamp: none !important;
            line-height: 1.3 !important;
            display: block !important;
            color: #7dd3fc !important;
        }

        .archetype-card-container.export-active .avatar-container {
            width: 200px !important;
            height: 200px !important;
            border-width: 6px !important;
            flex-shrink: 0 !important;
        }

        .archetype-card-container.export-active .card-body {
            max-height: none !important;
            overflow: visible !important;
            padding: 60px !important;
            display: block !important;
        }

        .archetype-card-container.export-active .bio-text,
        .archetype-card-container.export-active .section-notes p {
            display: block !important;
            white-space: pre-wrap !important;
            overflow: visible !important;
            -webkit-line-clamp: none !important;
            font-size: 22px !important;
            line-height: 1.6 !important;
            margin-bottom: 40px !important;
            color: #cbd5e1 !important;
        }

        .archetype-card-container.export-active .list-item {
            display: block !important;
            white-space: pre-wrap !important;
            overflow: visible !important;
            -webkit-line-clamp: none !important;
            font-size: 20px !important;
            line-height: 1.5 !important;
            margin-bottom: 16px !important;
            padding-left: 10px !important;
            text-indent: -10px !important;
        }
        
        .archetype-card-container.export-active .goals-list > *,
        .archetype-card-container.export-active .pains-list > * {
            display: block !important;
        }

        .archetype-card-container.export-active .card-quote {
            font-size: 28px !important;
            padding: 40px !important;
            line-height: 1.5 !important;
            border-bottom-width: 2px !important;
            background-color: rgba(14, 165, 233, 0.05) !important;
        }

        .archetype-card-container.export-active h4 {
            font-size: 20px !important;
            margin-bottom: 20px !important;
            font-weight: 800 !important;
            color: #94a3b8 !important;
        }

        .archetype-card-container.export-active .tag-badge {
            font-size: 18px !important;
            padding: 8px 16px !important;
        }

        .archetype-card-container.export-active .stakeholder-badge {
            font-size: 18px !important;
            padding: 10px 20px !important;
        }

        .archetype-card-container.export-active .researcher-meta p {
            font-size: 16px !important;
        }

        .archetype-card-container.export-active .tech-literacy-bar {
            height: 12px !important;
        }
      `}</style>
    </div>
  );
};

export default ArchetypeCard;