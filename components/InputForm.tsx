import React, { useState, useEffect } from 'react';
import { Sparkles, X, Save, FolderOpen, GraduationCap, Trophy, Target, Lightbulb, AlertTriangle, ArrowRight, Tags, Download, RefreshCcw, Briefcase, Calendar, Info, Frown, CheckCircle2, Users, FileText, Zap } from 'lucide-react';
import { ResearchData, TeacherFeedback } from '../types';
import { generateTeacherFeedback } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface InputFormProps {
  data: ResearchData;
  onChange: (data: ResearchData) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ data, onChange, onSubmit, isLoading }) => {
  const [showSaved, setShowSaved] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  
  // Feedback State
  const [feedback, setFeedback] = useState<TeacherFeedback | null>(null);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isExportingReport, setIsExportingReport] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('archetype_research_draft');
    if (saved) {
        setHasSavedDraft(true);
    }
  }, []);
  
  const handleChange = (field: keyof ResearchData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to clear the form?")) {
        onChange({
            title: '',
            researcherName: '',
            teamName: '',
            stakeholderTag: '',
            description: '',
            painPoints: '',
            needs: '',
            goals: '',
            actions: ''
        });
        setFeedback(null);
    }
  };

  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem('archetype_research_draft', JSON.stringify(data));
    setHasSavedDraft(true);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleLoadDraft = (e: React.MouseEvent) => {
     e.preventDefault();
     const saved = localStorage.getItem('archetype_research_draft');
     if (saved) {
         if (isFormEmpty || window.confirm("This will overwrite your current inputs with the saved draft. Continue?")) {
            try {
                const parsed = JSON.parse(saved);
                onChange(parsed);
                setFeedback(null);
            } catch (e) {
                console.error("Failed to load draft");
            }
         }
     }
  };

  const handleGetFeedback = async () => {
      setIsGettingFeedback(true);
      try {
          // Pass current feedback to model for "improvement tracking"
          const result = await generateTeacherFeedback(data, feedback);
          setFeedback(result);
      } catch (e: any) {
          console.error("Failed to get feedback", e);
          let msg = "Professor Archetype is currently unavailable. Please try again.";
          const errStr = e.toString().toLowerCase();
          
          if (e.message?.includes("429") || e.status === 429 || errStr.includes("quota") || errStr.includes("resource_exhausted")) {
             msg = "Professor Archetype is overwhelmed right now (Quota Exceeded). Please try again in a minute.";
          }
          alert(msg);
      } finally {
          setIsGettingFeedback(false);
      }
  };

  const handleExportReportPdf = async () => {
    const template = document.getElementById('professor-report-export-template');
    if (!template || !feedback) return;
    
    setIsExportingReport(true);
    try {
        const canvas = await html2canvas(template, {
            scale: 2.5,
            useCORS: true,
            backgroundColor: '#0f172a',
            logging: false,
            onclone: (clonedDoc) => {
                const temp = clonedDoc.getElementById('professor-report-export-template');
                if (temp) {
                    temp.style.left = '0';
                    temp.style.top = '0';
                    temp.style.position = 'relative';
                    temp.style.display = 'block';
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

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`Professor-Audit-Report-${data.title || 'Draft'}.pdf`);
    } catch (err) {
        console.error("Report PDF Export failed", err);
    } finally {
        setIsExportingReport(false);
    }
  };

  const isFormEmpty = !Object.values(data).some(val => (val as string).trim() !== '');

  const getGradeColor = (grade: string) => {
      if (grade.startsWith('A')) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10';
      if (grade.startsWith('B')) return 'text-brand-400 border-brand-500/50 bg-brand-500/10';
      if (grade.startsWith('C')) return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      return 'text-rose-400 border-rose-500/50 bg-rose-500/10';
  };

  return (
    <div className={`w-full mx-auto animate-fade-in-up transition-all duration-500 ease-in-out ${feedback ? 'max-w-[95%]' : 'max-w-6xl'}`}>
      
      {/* High-Fidelity Export Template (Off-screen) */}
      {feedback && (
          <div id="professor-report-export-template" className="fixed -left-[5000px] w-[1000px] bg-[#0f172a] text-white p-12 space-y-10 rounded-none" style={{ fontFamily: 'Inter, sans-serif' }}>
              
              {/* Report Header */}
              <div className="flex items-start justify-between border-b-4 border-slate-800 pb-10">
                  <div className="space-y-4">
                      <div className="flex items-center gap-3 px-4 py-1.5 bg-brand-500/20 border border-brand-500/30 rounded-lg text-brand-400 text-[14px] font-black uppercase tracking-widest w-fit">
                          Official Quality Audit Report
                      </div>
                      <h1 className="text-6xl font-black text-white leading-tight break-words">{data.title || 'Untitled Research Project'}</h1>
                      <div className="flex flex-wrap items-center gap-8">
                        <p className="text-slate-400 text-lg font-bold flex items-center gap-3"><Users size={24} className="text-brand-500"/> {data.researcherName || 'Lead Researcher'}</p>
                        <p className="text-slate-400 text-lg font-bold flex items-center gap-3"><Briefcase size={24} className="text-brand-500"/> {data.stakeholderTag || 'Internal Department'}</p>
                        <p className="text-slate-500 text-lg font-bold flex items-center gap-3"><Calendar size={24} className="text-brand-500"/> {new Date().toLocaleDateString()}</p>
                      </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                        <div className={`w-28 h-28 rounded-full border-[8px] flex items-center justify-center text-5xl font-black bg-slate-950 shadow-2xl ${getGradeColor(feedback.grade)}`}>
                            {feedback.grade}
                        </div>
                        <p className="text-brand-400 text-sm font-black uppercase tracking-widest mt-2">{feedback.score} Synthesized XP</p>
                  </div>
              </div>

              {/* Section 01: Source Data */}
              <div className="space-y-12 pt-4">
                  <div className="flex items-center gap-4 text-3xl font-black text-white uppercase tracking-tighter">
                      <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-lg">01</div>
                      Source Framework Data
                  </div>

                  <div className="grid grid-cols-12 gap-10 items-stretch">
                      <div className="col-span-4 space-y-8">
                          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 h-full">
                              <h3 className="text-xs font-black uppercase text-brand-500 tracking-widest mb-4 flex items-center gap-2">
                                  <Info size={16}/> Project Description
                              </h3>
                              <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap break-words">{data.description || 'No description provided.'}</p>
                          </div>
                      </div>

                      <div className="col-span-8 grid grid-cols-2 gap-8">
                          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                              <h3 className="text-xs font-black uppercase text-rose-500 tracking-widest mb-4 flex items-center gap-2">
                                  <Frown size={18}/> Pain Points
                              </h3>
                              <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap break-words">{data.painPoints || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                              <h3 className="text-xs font-black uppercase text-brand-400 tracking-widest mb-4 flex items-center gap-2">
                                  <Target size={18}/> User Needs
                              </h3>
                              <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap break-words">{data.needs || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                              <h3 className="text-xs font-black uppercase text-emerald-500 tracking-widest mb-4 flex items-center gap-2">
                                  <CheckCircle2 size={18}/> Core Goals
                              </h3>
                              <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap break-words">{data.goals || 'N/A'}</p>
                          </div>
                          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                              <h3 className="text-xs font-black uppercase text-amber-500 tracking-widest mb-4 flex items-center gap-2">
                                  <Zap size={18}/> Key Actions
                              </h3>
                              <p className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap break-words">{data.actions || 'N/A'}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Section 02: Audit Assessment */}
              <div className="space-y-12 pt-16 border-t-2 border-slate-800">
                  <div className="flex items-center gap-4 text-3xl font-black text-white uppercase tracking-tighter">
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-lg">02</div>
                      Professional Audit Assessment
                  </div>
                  
                  <div className="bg-indigo-600/10 border-l-8 border-indigo-600 p-10 rounded-r-3xl shadow-2xl">
                      <h4 className="font-black text-indigo-400 text-xl mb-4 uppercase tracking-widest flex items-center gap-3">
                          <Sparkles size={28} className="text-indigo-500" />
                          Executive Summary
                      </h4>
                      <p className="text-indigo-50 text-3xl font-bold italic leading-tight whitespace-pre-wrap break-words">"{feedback.overallComment}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-12 pt-4">
                      <div className="space-y-6">
                          <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-emerald-400">
                              <Trophy size={22} /> Research Strengths
                          </h4>
                          <div className="bg-slate-900/30 p-8 rounded-3xl border border-emerald-500/20">
                            <ul className="space-y-6">
                                {feedback.strengths.map((s, i) => (
                                    <li key={i} className="text-xl text-slate-200 flex items-start gap-4">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0"></div>
                                        <span className="whitespace-pre-wrap break-words">{s}</span>
                                    </li>
                                ))}
                            </ul>
                          </div>
                      </div>
                      <div className="space-y-6">
                          <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-amber-400">
                              <Target size={22} /> Optimization Areas
                          </h4>
                          <div className="bg-slate-900/30 p-8 rounded-3xl border border-amber-500/20">
                            <ul className="space-y-6">
                                {feedback.improvements.map((s, i) => (
                                    <li key={i} className="text-xl text-slate-200 flex items-start gap-4">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2.5 flex-shrink-0"></div>
                                        <span className="whitespace-pre-wrap break-words">{s}</span>
                                    </li>
                                ))}
                            </ul>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-8 pt-8">
                      <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-wider text-brand-400">
                          <Lightbulb size={24} /> Critical Inquiry Questions
                      </h4>
                      <div className="grid grid-cols-1 gap-6">
                          {feedback.thoughtProvokingQuestions.map((q, i) => (
                              <div key={i} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                                  <p className="text-2xl text-white font-medium leading-relaxed italic whitespace-pre-wrap break-words">"{q}"</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* PDF Footer */}
              <div className="pt-24 text-slate-600 text-[14px] uppercase font-black text-center border-t border-slate-900/50 flex items-center justify-between">
                  <span>Archetype AI Synthesis Framework v1.0</span>
                  <span>Confidential Research Audit</span>
                  <span>Generated: {new Date().toLocaleTimeString()}</span>
              </div>
          </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className={`
            bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-500
            ${feedback ? 'xl:w-2/3 w-full' : 'w-full'}
        `}>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                Archetype Framework
                </h2>
                <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
                Focusing on user behaviours, this framework highlights needs, motivations, and pain points. 
                </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                {hasSavedDraft && !isLoading && (
                    <button 
                    type="button"
                    onClick={handleLoadDraft}
                    className="text-slate-500 hover:text-white transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-700/50"
                    title="Load saved draft from local storage"
                    >
                    <FolderOpen size={16} /> Load Draft
                    </button>
                )}
                
                {!isFormEmpty && !isLoading && (
                    <button 
                    type="button"
                    onClick={handleSaveDraft}
                    className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${showSaved ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                    title="Save current progress to local storage"
                    >
                    <Save size={16} /> {showSaved ? "Saved!" : "Save Progress"}
                    </button>
                )}

                {!isFormEmpty && !isLoading && (
                <button 
                    type="button"
                    onClick={handleClear}
                    className="text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-rose-950/20"
                >
                    <X size={16} /> Clear Form
                </button>
                )}
            </div>
            </div>

            <div className={`grid grid-cols-1 ${feedback ? 'lg:grid-cols-2' : 'md:grid-cols-3'} gap-6 mb-8 transition-all duration-500`}>
                <div className="space-y-6">
                    <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 hover:border-brand-500/30 transition-colors group">
                        <div className="px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-brand-200">Context / Title</label>
                        </div>
                        <input type="text" className="w-full bg-transparent border-none text-white p-4 focus:ring-0 placeholder-slate-600 text-lg font-medium" placeholder="e.g. Student Study Habits" value={data.title} onChange={(e) => handleChange('title', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 hover:border-brand-500/30 transition-colors group">
                        <div className="px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-brand-200">Researcher Name</label>
                        </div>
                        <input type="text" className="w-full bg-transparent border-none text-white p-4 focus:ring-0 placeholder-slate-600 text-lg font-medium" placeholder="e.g. Jamie Rivera" value={data.researcherName} onChange={(e) => handleChange('researcherName', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 hover:border-brand-500/30 transition-colors group">
                        <div className="px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-brand-200">Team Name</label>
                        </div>
                        <input type="text" className="w-full bg-transparent border-none text-white p-4 focus:ring-0 placeholder-slate-600 text-lg font-medium" placeholder="e.g. Team Alpha" value={data.teamName} onChange={(e) => handleChange('teamName', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 transition-colors group">
                        <div className="px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5"><Tags size={12}/> Stakeholder / Dept</label>
                        </div>
                        <input type="text" className="w-full bg-transparent border-none text-white p-4 focus:ring-0 placeholder-slate-600 text-lg font-medium" placeholder="e.g. Product Design" value={data.stakeholderTag} onChange={(e) => handleChange('stakeholderTag', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="bg-white p-1 rounded-2xl h-48 flex flex-col group shadow-lg">
                        <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-200 px-2 py-0.5 rounded">Description</label>
                        </div>
                        <textarea className="w-full h-full bg-transparent border-none text-slate-800 p-4 focus:ring-0 placeholder-slate-400 resize-none text-sm leading-relaxed" placeholder="Describe the situation..." value={data.description} onChange={(e) => handleChange('description', e.target.value)} disabled={isLoading} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-1 rounded-2xl h-64 flex flex-col group shadow-lg">
                        <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                            <label className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800 px-2 py-0.5 rounded">Pain Points</label>
                        </div>
                        <textarea className="w-full h-full bg-transparent border-none text-slate-800 p-4 focus:ring-0 placeholder-slate-400 resize-none text-sm leading-relaxed" placeholder="Barriers or frustrations?" value={data.painPoints} onChange={(e) => handleChange('painPoints', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="bg-white p-1 rounded-2xl h-48 flex flex-col group shadow-lg">
                        <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                            <label className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800 px-2 py-0.5 rounded">Goals</label>
                        </div>
                        <textarea className="w-full h-full bg-transparent border-none text-slate-800 p-4 focus:ring-0 placeholder-slate-400 resize-none text-sm leading-relaxed" placeholder="Ultimate outcomes?" value={data.goals} onChange={(e) => handleChange('goals', e.target.value)} disabled={isLoading} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-1 rounded-2xl h-64 flex flex-col group shadow-lg">
                        <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                            <label className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800 px-2 py-0.5 rounded">Needs</label>
                        </div>
                        <textarea className="w-full h-full bg-transparent border-none text-slate-800 p-4 focus:ring-0 placeholder-slate-400 resize-none text-sm leading-relaxed" placeholder="Essential requirements?" value={data.needs} onChange={(e) => handleChange('needs', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="bg-white p-1 rounded-2xl h-48 flex flex-col group shadow-lg">
                        <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
                            <label className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800 px-2 py-0.5 rounded">Actions</label>
                        </div>
                        <textarea className="w-full h-full bg-transparent border-none text-slate-800 p-4 focus:ring-0 placeholder-slate-400 resize-none text-sm leading-relaxed" placeholder="Observed behaviors?" value={data.actions} onChange={(e) => handleChange('actions', e.target.value)} disabled={isLoading} />
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
                <button type="button" onClick={handleGetFeedback} disabled={isFormEmpty || isLoading || isGettingFeedback} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all border border-indigo-500/30 ${isFormEmpty ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:-translate-y-0.5'}`}>
                    {isGettingFeedback ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <GraduationCap size={20} />}
                    <span>{isGettingFeedback ? "Grading..." : "Get Teacher Feedback"}</span>
                </button>
                <button type="button" onClick={onSubmit} disabled={isFormEmpty || isLoading} className={`flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform ${isFormEmpty || isLoading ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 hover:scale-[1.02] hover:shadow-brand-500/25'}`}>
                    {isLoading ? <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Synthesizing...</span></> : <><Sparkles size={20} /><span>Generate Archetypes</span></>}
                </button>
            </div>
        </div>
        
        {feedback && (
             <div id="professor-report-panel" className="xl:w-1/3 w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl animate-fade-in flex flex-col gap-6 sticky top-24">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><GraduationCap className="text-indigo-400" /> Professor's Report</h3>
                        <p className="text-slate-400 text-sm mt-1">Research Quality Assessment</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-3xl font-black bg-slate-950 ${getGradeColor(feedback.grade)}`}>{feedback.grade}</div>
                        <button onClick={handleExportReportPdf} disabled={isExportingReport} className="ui-only text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                            {isExportingReport ? <RefreshCcw size={10} className="animate-spin" /> : <Download size={10} />}
                            {isExportingReport ? 'Saving Full Audit...' : 'Export Full Report'}
                        </button>
                    </div>
                </div>
                <div>
                     <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-1"><span>Research Level</span><span>{feedback.score}/100 XP</span></div>
                     <div className="w-full bg-slate-800 rounded-full h-3"><div className="bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${feedback.score}%` }}></div></div>
                </div>
                <div className="bg-indigo-500/20 border-l-4 border-indigo-500 p-5 rounded-r-xl shadow-lg shadow-indigo-500/5">
                    <h4 className="font-black text-indigo-300 text-sm mb-2 uppercase tracking-wide flex items-center gap-2"><Sparkles size={14} className="text-indigo-400" /> {feedback.feedbackTitle}</h4>
                    <p className="text-indigo-50 text-base font-medium italic leading-relaxed">"{feedback.overallComment}"</p>
                </div>
                <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2"><Trophy size={14} /> Strengths</h4>
                    <ul className="space-y-2">{feedback.strengths.map((s, i) => (<li key={i} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> {s}</li>))}</ul>
                </div>
                <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2"><Target size={14} /> Areas to Improve</h4>
                    <ul className="space-y-2">{feedback.improvements.map((s, i) => (<li key={i} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span> {s}</li>))}</ul>
                </div>
                <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400 mb-2"><Lightbulb size={14} /> Professor asks...</h4>
                    <div className="space-y-3">{feedback.thoughtProvokingQuestions.map((q, i) => (<div key={i} className="bg-slate-800 p-3 rounded-lg border border-slate-700"><p className="text-sm text-brand-100 font-medium">{q}</p></div>))}</div>
                </div>
                <div className="text-center pt-2"><p className="text-xs text-slate-500">Edit your data on the left to improve your grade!</p></div>
             </div>
        )}
      </div>
    </div>
  );
};

export default InputForm;