import React, { useEffect, useState } from 'react';
import { UserArchetype } from '../types';
import { generatePersonaImage } from '../services/geminiService';
import { User, Target, Frown, Lightbulb, Zap, Download, Save, Edit2, Check, X, RefreshCcw, Circle, CheckCircle2, Tag, StickyNote, Trash2 } from 'lucide-react';
import { jsPDF } from "jspdf";

interface ArchetypeCardProps {
  archetype: UserArchetype;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
  isSavedView?: boolean;
  onUpdate?: (updated: UserArchetype) => void;
  onDelete?: (id: string) => void;
}

// Helper interface for the edit form state
interface EditState extends Omit<UserArchetype, 'goals' | 'frustrations' | 'motivations' | 'personalityTraits' | 'tags'> {
    goals: string;
    frustrations: string;
    motivations: string;
    personalityTraits: string;
    imagePrompt: string;
    tags: string;
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
  // Use local state to manage the archetype data (allows editing)
  const [currentArchetype, setCurrentArchetype] = useState<UserArchetype>(initialArchetype);
  const [imageUrl, setImageUrl] = useState<string | null>(initialArchetype.imageUrl || null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditState | null>(null);

  // Update local state if the prop changes (e.g. parent regeneration)
  useEffect(() => {
    setCurrentArchetype(initialArchetype);
    setImageUrl(initialArchetype.imageUrl || null);
  }, [initialArchetype]);

  useEffect(() => {
    let mounted = true;

    const fetchImage = async () => {
        if (currentArchetype.imagePrompt && !imageUrl && !loadingImage && !currentArchetype.imageUrl) {
            setLoadingImage(true);
            try {
                const url = await generatePersonaImage(currentArchetype.imagePrompt);
                if (mounted) setImageUrl(url);
            } catch (e) {
                console.error("Failed to load image for", currentArchetype.name);
            } finally {
                if (mounted) setLoadingImage(false);
            }
        }
    }
    
    fetchImage();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentArchetype.id, currentArchetype.imagePrompt]);

  // Enter edit mode
  const handleEditClick = () => {
    if (selectionMode) return; // Disable edit in selection mode
    setEditForm({
        ...currentArchetype,
        goals: currentArchetype.goals.join('\n'),
        frustrations: currentArchetype.frustrations.join('\n'),
        motivations: currentArchetype.motivations.join('\n'),
        personalityTraits: currentArchetype.personalityTraits.join(', '),
        imagePrompt: currentArchetype.imagePrompt || '',
        tags: currentArchetype.tags?.join(', ') || '',
        notes: currentArchetype.notes || ''
    });
    setIsEditing(true);
  };

  // Save changes from edit mode
  const handleSaveEdit = () => {
    if (!editForm) return;

    const updatedArchetype: UserArchetype = {
        ...editForm,
        goals: editForm.goals.split('\n').filter(s => s.trim()),
        frustrations: editForm.frustrations.split('\n').filter(s => s.trim()),
        motivations: editForm.motivations.split('\n').filter(s => s.trim()),
        personalityTraits: editForm.personalityTraits.split(',').map(s => s.trim()).filter(s => s),
        tags: editForm.tags.split(',').map(s => s.trim()).filter(s => s),
        notes: editForm.notes,
        // Keep the image URL if it was generated
        imageUrl: imageUrl || undefined
    };

    setCurrentArchetype(updatedArchetype);
    setIsEditing(false);
    setEditForm(null);

    if (onUpdate) {
        onUpdate(updatedArchetype);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };
  
  const handleRegenerateImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editForm?.imagePrompt) return;
    
    setLoadingImage(true);
    try {
        const url = await generatePersonaImage(editForm.imagePrompt);
        setImageUrl(url);
    } catch (e) {
        console.error("Failed to regenerate image", e);
        alert("Failed to generate image. Please try again.");
    } finally {
        setLoadingImage(false);
    }
  };

  // Tech literacy bar helper
  const renderTechLiteracy = (score: number) => {
    return (
      <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2">
        <div 
          className="bg-brand-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${score * 10}%` }}
        ></div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Low Tech</span>
            <span>High Tech</span>
        </div>
      </div>
    );
  };

  const handleSaveArchetype = () => {
    try {
        const savedRaw = localStorage.getItem('savedArchetypes');
        const savedList: UserArchetype[] = savedRaw ? JSON.parse(savedRaw) : [];
        
        // Check for duplicates based on ID
        const existingIndex = savedList.findIndex(a => a.id === currentArchetype.id);
        
        const archetypeToSave = {
            ...currentArchetype,
            imageUrl: imageUrl || currentArchetype.imageUrl,
            savedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            // Already exists
            if(window.confirm("This archetype already exists in your library. Update it?")) {
                 savedList[existingIndex] = archetypeToSave;
                 localStorage.setItem('savedArchetypes', JSON.stringify(savedList));
                 setSaveSuccess(true);
                 setTimeout(() => setSaveSuccess(false), 3000);
            }
        } else {
            // New save
            savedList.push(archetypeToSave);
            localStorage.setItem('savedArchetypes', JSON.stringify(savedList));
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        }
    } catch (e: any) {
        console.error("Failed to save", e);
        if (e.name === 'QuotaExceededError' || e.message?.toLowerCase().includes('quota')) {
            alert("Storage full! You cannot save more archetypes with images. Try deleting old ones or exporting a backup.");
        } else {
            alert("Failed to save archetype to local library.");
        }
    }
  };

  const handleDelete = () => {
      if (onDelete && window.confirm(`Are you sure you want to delete "${currentArchetype.name}"? This cannot be undone.`)) {
          onDelete(currentArchetype.id);
      }
  };

  const handleExportPdf = async () => {
    const doc = new jsPDF();
    const arch = currentArchetype;
    
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // Header Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Name
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(arch.name, margin, 25);
    
    // Role & Age
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`${arch.role}  •  ${arch.age} years old`, margin, 35);

    // Traits (as small tags in text)
    const traits = arch.personalityTraits.slice(0, 4).join("  •  ");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(traits.toUpperCase(), margin, 44);

    // Image
    if (imageUrl) {
        try {
            // Check if data URL
            if (imageUrl.startsWith('data:')) {
                 const format = imageUrl.includes('png') ? 'PNG' : 'JPEG';
                 doc.addImage(imageUrl, format, pageWidth - margin - 35, 10, 30, 30);
            } else {
                 const img = new Image();
                 img.crossOrigin = "Anonymous";
                 img.src = imageUrl;
                 await new Promise((resolve, reject) => {
                     img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0);
                        const dataUrl = canvas.toDataURL('image/jpeg');
                        doc.addImage(dataUrl, 'JPEG', pageWidth - margin - 35, 10, 30, 30);
                        resolve(true);
                     };
                     img.onerror = () => resolve(false); // Just skip if fails
                 });
            }
        } catch (e) {
            console.warn("Could not add image to PDF", e);
        }
    }

    y = 65;

    // Quote
    doc.setDrawColor(14, 165, 233); // brand-500
    doc.setLineWidth(1);
    doc.line(margin, y, margin, y + 12);
    
    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85); // slate-700
    const quoteLines = doc.splitTextToSize(`"${arch.quote}"`, contentWidth - 10);
    doc.text(quoteLines, margin + 5, y + 8);
    
    y += (quoteLines.length * 6) + 15;

    const printSection = (title: string, items: string[], color: [number, number, number]) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...color);
        doc.text(title.toUpperCase(), margin, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85); // slate-700
        
        items.forEach(item => {
             const lines = doc.splitTextToSize(`• ${item}`, contentWidth);
             doc.text(lines, margin, y);
             y += lines.length * 5;
        });
        y += 6; // spacing after section
    };

    // Bio
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("BIO", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const bioLines = doc.splitTextToSize(arch.bio, contentWidth);
    doc.text(bioLines, margin, y);
    y += bioLines.length * 5 + 10;

    printSection("Goals", arch.goals, [16, 185, 129]); // emerald-500
    printSection("Frustrations", arch.frustrations, [244, 63, 94]); // rose-500
    printSection("Motivations", arch.motivations, [245, 158, 11]); // amber-500
    
    // Notes if present
    if (arch.notes) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139); 
        doc.text("NOTES", margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        const noteLines = doc.splitTextToSize(arch.notes, contentWidth);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 5 + 10;
    }

    // Tech Literacy
    if (y > 270) {
        doc.addPage();
        y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(99, 102, 241); // indigo-500
    doc.text("TECH LITERACY", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`${arch.techLiteracy} / 10`, margin + 35, y);
    
    // Draw bar
    doc.setFillColor(226, 232, 240); // slate-200 background
    doc.rect(margin, y + 3, 100, 3, 'F');
    doc.setFillColor(99, 102, 241); // indigo-500 fill
    doc.rect(margin, y + 3, arch.techLiteracy * 10, 3, 'F');

    doc.save(`${arch.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleSelection = () => {
      if (onToggleSelect) {
          onToggleSelect(currentArchetype.id);
      }
  }

  return (
    <div 
        className={`
            bg-slate-800 rounded-2xl overflow-hidden shadow-xl border flex flex-col h-full animate-fade-in transition-all duration-300 group relative
            ${isSelected 
                ? 'border-brand-500 ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-900 transform scale-[1.02]' 
                : 'border-slate-700 hover:-translate-y-1 hover:border-slate-600'
            }
        `}
        onClick={selectionMode ? handleSelection : undefined}
    >
      {/* Selection Overlay for entire card in selection mode */}
      {selectionMode && (
          <div className="absolute inset-0 z-50 cursor-pointer bg-transparent" />
      )}

      {/* Header / Image Section */}
      <div className={`relative ${isEditing ? 'min-h-48 h-auto py-6' : 'h-48'} bg-gradient-to-r from-slate-700 to-slate-600 p-6 flex items-center justify-between transition-all duration-300`}>
         
         {/* Selection Checkbox */}
         {onToggleSelect && (
             <div className="absolute top-4 left-4 z-40">
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(currentArchetype.id);
                    }}
                    className={`
                        p-1 rounded-full transition-all duration-200 shadow-lg
                        ${isSelected ? 'bg-brand-500 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'}
                    `}
                 >
                     {isSelected ? <CheckCircle2 size={24} fill="currentColor" className="text-white" /> : <Circle size={24} />}
                 </button>
             </div>
         )}

         <div className={`flex ${isEditing ? 'flex-col sm:flex-row items-start' : 'items-center'} gap-6 z-10 relative w-full`}>
            
            {/* Image Column */}
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-28 h-28 rounded-full border-4 border-slate-800 shadow-lg overflow-hidden flex-shrink-0 bg-slate-600">
                    {imageUrl ? (
                        <img src={imageUrl} alt={currentArchetype.name} className="w-full h-full object-cover animate-fade-in" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            {loadingImage ? (
                                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            ) : (
                                <User size={40} />
                            )}
                        </div>
                    )}
                </div>

                {isEditing && editForm && (
                     <div className="w-full max-w-[200px] flex flex-col gap-2 animate-fade-in">
                         <div className="relative">
                             <textarea
                                 className="w-full bg-slate-800/90 border border-slate-500 rounded p-2 text-[10px] text-slate-200 focus:ring-2 focus:ring-brand-500 min-h-[60px]"
                                 value={editForm.imagePrompt}
                                 onChange={(e) => setEditForm({...editForm, imagePrompt: e.target.value})}
                                 placeholder="Image prompt..."
                             />
                         </div>
                         <button
                             onClick={handleRegenerateImage}
                             disabled={loadingImage || !editForm.imagePrompt}
                             className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-1.5 px-3 rounded shadow transition-colors"
                         >
                             <RefreshCcw size={12} className={loadingImage ? "animate-spin" : ""} />
                             {loadingImage ? "Generating..." : "Regenerate Image"}
                         </button>
                     </div>
                 )}
            </div>

            <div className="flex-1 min-w-0 w-full pl-8 sm:pl-0">
                {isEditing && editForm ? (
                    <div className="space-y-2">
                        <input 
                            className="w-full bg-slate-800/80 border border-slate-500 rounded px-2 py-1 text-white font-bold text-xl focus:ring-2 focus:ring-brand-500"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            placeholder="Name"
                        />
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-slate-800/80 border border-slate-500 rounded px-2 py-1 text-brand-300 font-medium text-sm focus:ring-2 focus:ring-brand-500"
                                value={editForm.role}
                                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                placeholder="Role"
                            />
                            <input 
                                className="w-16 bg-slate-800/80 border border-slate-500 rounded px-2 py-1 text-slate-300 text-sm focus:ring-2 focus:ring-brand-500"
                                type="number"
                                value={editForm.age}
                                onChange={(e) => setEditForm({...editForm, age: parseInt(e.target.value) || 0})}
                                placeholder="Age"
                            />
                        </div>
                         <input 
                            className="w-full bg-slate-800/80 border border-slate-500 rounded px-2 py-1 text-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                            value={editForm.personalityTraits}
                            onChange={(e) => setEditForm({...editForm, personalityTraits: e.target.value})}
                            placeholder="Traits (comma separated)"
                        />
                         <input 
                            className="w-full bg-slate-800/80 border border-slate-500 rounded px-2 py-1 text-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                            value={editForm.tags}
                            onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                            placeholder="Tags (comma separated)..."
                        />
                    </div>
                ) : (
                    <>
                        <h3 className="text-2xl font-bold text-white truncate pr-8">{currentArchetype.name}</h3>
                        <p className="text-brand-300 font-medium truncate">{currentArchetype.role}</p>
                        <p className="text-slate-300 text-sm mt-1">{currentArchetype.age} years old</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {currentArchetype.personalityTraits.slice(0, 3).map((trait, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-full bg-slate-900/40 text-xs text-slate-200 border border-slate-600/50">
                                    {trait}
                                </span>
                            ))}
                            {currentArchetype.tags?.map((tag, i) => (
                                <span key={`tag-${i}`} className="px-2 py-0.5 rounded-full bg-brand-900/40 text-xs text-brand-200 border border-brand-600/50 flex items-center gap-1">
                                    <Tag size={10} /> {tag}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>
         </div>
         
         {/* Edit/Save Controls */}
         <div className="absolute top-4 right-4 z-20 flex gap-2">
             {isEditing ? (
                 <>
                    <button 
                        onClick={handleSaveEdit}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-colors"
                        title="Save Changes"
                    >
                        <Check size={16} />
                    </button>
                    <button 
                        onClick={handleCancelEdit}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full shadow-lg transition-colors"
                        title="Cancel"
                    >
                        <X size={16} />
                    </button>
                 </>
             ) : (
                 <>
                    <button 
                        onClick={handleEditClick}
                        className={`
                            p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors backdrop-blur-sm
                            ${selectionMode ? 'hidden' : ''}
                        `}
                        title="Edit Archetype"
                    >
                        <Edit2 size={16} />
                    </button>
                 </>
             )}
         </div>

         {/* Decorative background pattern */}
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
      </div>

      {/* Quote */}
      <div className="bg-brand-900/20 px-6 py-4 border-b border-slate-700 italic text-brand-200 text-center font-serif text-lg">
        {isEditing && editForm ? (
            <textarea
                className="w-full bg-slate-800/50 border border-slate-600 rounded p-2 text-center focus:ring-2 focus:ring-brand-500 focus:outline-none"
                value={editForm.quote}
                onChange={(e) => setEditForm({...editForm, quote: e.target.value})}
                rows={2}
            />
        ) : (
            `"${currentArchetype.quote}"`
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 flex-1 text-sm">
        
        {/* Bio */}
        <section>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Bio</h4>
            {isEditing && editForm ? (
                <textarea
                    className="w-full bg-slate-900/50 border border-slate-700 rounded p-3 text-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    rows={4}
                />
            ) : (
                <p className="text-slate-300 leading-relaxed">
                    {currentArchetype.bio}
                </p>
            )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Goals */}
            <section className="flex flex-col h-full">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    <Target size={14} /> Goals
                </h4>
                {isEditing && editForm ? (
                     <textarea
                        className="w-full flex-grow bg-slate-900/50 border border-slate-700 rounded p-3 text-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                        value={editForm.goals}
                        onChange={(e) => setEditForm({...editForm, goals: e.target.value})}
                        placeholder="One goal per line"
                        rows={5}
                    />
                ) : (
                    <ul className="space-y-1.5">
                        {currentArchetype.goals.map((g, i) => (
                            <li key={i} className="text-slate-300 flex items-start gap-2">
                                <span className="text-emerald-500/50 mt-1">•</span>
                                <span>{g}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Frustrations */}
            <section className="flex flex-col h-full">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                    <Frown size={14} /> Frustrations
                </h4>
                {isEditing && editForm ? (
                     <textarea
                        className="w-full flex-grow bg-slate-900/50 border border-slate-700 rounded p-3 text-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                        value={editForm.frustrations}
                        onChange={(e) => setEditForm({...editForm, frustrations: e.target.value})}
                        placeholder="One frustration per line"
                        rows={5}
                    />
                ) : (
                    <ul className="space-y-1.5">
                        {currentArchetype.frustrations.map((f, i) => (
                            <li key={i} className="text-slate-300 flex items-start gap-2">
                                <span className="text-rose-500/50 mt-1">•</span>
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Motivations */}
             <section className="flex flex-col h-full">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    <Lightbulb size={14} /> Motivations
                </h4>
                {isEditing && editForm ? (
                     <textarea
                        className="w-full flex-grow bg-slate-900/50 border border-slate-700 rounded p-3 text-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                        value={editForm.motivations}
                        onChange={(e) => setEditForm({...editForm, motivations: e.target.value})}
                        placeholder="One motivation per line"
                        rows={5}
                    />
                ) : (
                    <ul className="space-y-1.5">
                        {currentArchetype.motivations.map((m, i) => (
                            <li key={i} className="text-slate-300 flex items-start gap-2">
                                <span className="text-amber-500/50 mt-1">•</span>
                                <span>{m}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
            
            {/* Tech Literacy */}
            <section>
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                    <Zap size={14} /> Tech Literacy
                </h4>
                {isEditing && editForm ? (
                    <div className="mt-4 px-2">
                        <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={editForm.techLiteracy}
                            onChange={(e) => setEditForm({...editForm, techLiteracy: parseInt(e.target.value)})}
                            className="w-full accent-indigo-500"
                        />
                        <div className="text-center text-slate-300 font-bold mt-2">{editForm.techLiteracy} / 10</div>
                    </div>
                ) : (
                    renderTechLiteracy(currentArchetype.techLiteracy / 10)
                )}
            </section>
        </div>

        {/* Notes Section (Always visible if editing or has notes) */}
        {(isEditing || currentArchetype.notes) && (
            <section className="pt-4 border-t border-slate-700/50">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    <StickyNote size={14} /> Notes
                </h4>
                {isEditing && editForm ? (
                    <textarea
                        className="w-full bg-slate-900/50 border border-slate-700 rounded p-3 text-slate-300 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        placeholder="Add private notes about this archetype..."
                        rows={3}
                    />
                ) : (
                    <p className="text-slate-400 italic text-sm whitespace-pre-line bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                        {currentArchetype.notes}
                    </p>
                )}
            </section>
        )}

      </div>
      
      {/* Footer / Actions */}
      <div className="p-4 bg-slate-900/30 border-t border-slate-700 flex justify-end gap-3">
        {isSavedView && (
             <button 
                className="flex items-center gap-2 text-xs font-medium text-rose-500 hover:text-rose-400 hover:bg-rose-950/30 px-3 py-1.5 rounded transition-colors disabled:opacity-50 mr-auto"
                onClick={handleDelete}
                disabled={isEditing || selectionMode}
            >
                <Trash2 size={14} /> Delete
            </button>
        )}

        {!isSavedView && (
            <button 
                className={`flex items-center gap-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                    saveSuccess 
                    ? 'text-emerald-400 hover:text-emerald-300' 
                    : 'text-slate-400 hover:text-white'
                }`}
                onClick={handleSaveArchetype}
                disabled={isEditing || selectionMode}
            >
                {saveSuccess ? <Check size={14} /> : <Save size={14} />}
                {saveSuccess ? 'Saved to Library' : 'Save to Library'}
            </button>
        )}
        
        <button 
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            onClick={handleExportPdf}
            disabled={isEditing || selectionMode}
        >
            <Download size={14} /> Export PDF
        </button>
      </div>
    </div>
  );
};

export default ArchetypeCard;