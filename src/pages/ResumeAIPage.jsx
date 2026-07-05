import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  Clock,
  RefreshCw,
  Sparkles,
  FileBadge,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { apiPost, apiPostForm, api } from '../lib/apiClient';
import SiteFooter from '../components/SiteFooter';

const ANALYSIS_STEPS = [
  { id: 'extract', label: 'Extracting resume text & metadata', detail: 'Running parser, stripping styling blocks, converting document layers...' },
  { id: 'ats', label: 'Analyzing ATS compliance & keyword match', detail: 'Comparing resume terms against job description token matrices...' },
  { id: 'redflags', label: 'Scanning for hiring manager red flags', detail: 'Evaluating formatting structure, layout flows, and duration gaps...' },
  { id: 'rewrite', label: 'Applying Google XYZ formula to bullet points', detail: 'Re-engineering accomplishments: OUTCOME by ACTION using METHOD...' },
  { id: 'review', label: 'Reviewing formatting and rendering PDF', detail: 'Finalizing typography spacing, grid alignments, and line-breaks...' },
];

const TEMPLATES = [
  { id: 'modern', label: 'Modern' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'google', label: 'Google Style' },
  { id: 'faang', label: 'FAANG Style' },
  { id: 'startup', label: 'Startup Style' },
];

const SPRING = [0.34, 1.56, 0.64, 1];
const STD = [0.16, 1, 0.3, 1];

function CircularScore({ score, size = 160, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#232327" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} stroke="#d4a843" strokeWidth={strokeWidth}
          fill="none" strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <motion.span className="text-4xl font-bold tracking-tight text-[#f2f2f4]" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
          {score}
        </motion.span>
        <span className="text-xs text-[#93939c] mt-1">ATS Match</span>
      </div>
    </div>
  );
}

function KeywordPill({ keyword }) {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#131316] text-[#93939c] border border-[#232327]">
      {keyword}
    </span>
  );
}

function RedFlagCard({ flag }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-[rgba(255,87,87,0.06)] border border-[rgba(255,87,87,0.1)]">
      <AlertTriangle size={16} className="text-[#ff5757] mt-0.5 shrink-0" />
      <p className="text-sm text-[#ff5757]">{flag}</p>
    </div>
  );
}

function SuggestionCard({ suggestion }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#131316] border border-[#232327]">
      <Sparkles size={16} className="text-[#d4a843] mt-0.5 shrink-0" />
      <p className="text-sm text-[#93939c]">{suggestion}</p>
    </div>
  );
}

function DiffView({ original, optimized }) {
  const [view, setView] = useState('optimized');
  return (
    <div>
      <div className="flex gap-1 mb-4 p-1 rounded-xl border border-[#232327] bg-[#131316] w-fit">
        <button onClick={() => setView('optimized')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'optimized' ? 'bg-[#232327] text-[#f2f2f4]' : 'text-[#55555d] hover:text-[#93939c]'}`}>Optimized</button>
        <button onClick={() => setView('original')} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'original' ? 'bg-[#232327] text-[#f2f2f4]' : 'text-[#55555d] hover:text-[#93939c]'}`}>Original</button>
      </div>
      <div className="p-5 rounded-xl bg-[#131316] border border-[#232327] max-h-[500px] overflow-y-auto">
        <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-[#93939c]">{view === 'optimized' ? optimized : original}</pre>
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 p-5 rounded-2xl bg-[#131316] border border-[#232327]">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-[#55555d]">{label}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color }}>{value}</p>
      </div>
    </motion.div>
  );
}

export default function ResumeAIPage() {
  const { user } = useAuth();
  const inputRef = useRef(null);
  
  const [resumeText, setResumeText] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [result, setResult] = useState(null);
  
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  const canAnalyze = resumeText && jobDescription.trim().length > 40 && !isAnalyzing;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (canAnalyze) handleAnalyze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canAnalyze, resumeText, jobDescription]);

  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleUpload = async (file) => {
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10MB limit.");
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      setUploadError("Invalid format. Use PDF, DOC, or DOCX.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await apiPostForm('/resume-ai/upload', formData);
      const data = response.data;
      setUploadedFile({ name: data.filename, size: (file.size / 1024 / 1024).toFixed(1) });
      setResumeText(data.resumeText);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const response = await apiPost('/resume-ai/analyze', { resumeText, jobDescription });
      setResult(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = async (format) => {
    if (!result?.finalResume) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const response = await api.post('/resume-ai/download', { resumeText: result.finalResume, format }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optimized-resume.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const score = result?.analysis?.atsScore ?? 0;
  const analysis = result?.analysis;

  return (
    <div className="min-h-screen bg-[#0a0a0c] font-sans selection:bg-[#d4a843] selection:text-[#0a0a0c]">
      <div className="max-w-[1000px] mx-auto px-6 pt-32 pb-24">
        
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: STD }} className="text-center max-w-[540px] mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#f2f2f4] mb-4 leading-[1.1]">
            Tailor your resume for the <span className="text-[#d4a843]">perfect</span> match.
          </h1>
          <p className="text-[#93939c] text-sm md:text-base">
            Upload your existing resume and paste the job description. Our AI analyzes, rewrites, and formats a highly-targeted PDF designed to clear ATS filters.
          </p>
        </motion.div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          
          {/* Resume Panel */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.09, ease: STD }} className="flex flex-col bg-[#131316] border border-[#232327] rounded-2xl overflow-hidden hover:border-[#2f2f34] transition-colors duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#232327]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border border-[#232327] flex items-center justify-center bg-[#0a0a0c]">
                  <FileBadge size={14} className="text-[#93939c]" />
                </div>
                <span className="text-sm font-medium text-[#f2f2f4]">Resume</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${resumeText ? 'bg-[#6ee7b7]' : 'bg-[#55555d]'}`} />
                <span className={`text-xs ${resumeText ? 'text-[#6ee7b7]' : 'text-[#55555d]'}`}>{resumeText ? 'Ready' : 'Pending'}</span>
              </div>
            </div>
            
            <div className="h-[232px] p-5">
              {uploadedFile ? (
                <div className="h-full border border-[#232327] rounded-xl flex items-center justify-between p-4 bg-[#0a0a0c]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(212,168,67,0.12)] flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-[#d4a843]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#f2f2f4] truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-[#55555d]">{uploadedFile.size} MB</p>
                    </div>
                  </div>
                  <button onClick={() => { setUploadedFile(null); setResumeText(null); }} className="p-2 hover:bg-[#17171b] rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-[#d4a843]">
                    <Trash2 size={16} className="text-[#55555d] hover:text-[#ff5757]" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`h-full border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[#d4a843] ${dragOver ? 'border-[#d4a843] bg-[rgba(212,168,67,0.05)]' : 'border-[#2f2f34] hover:border-[#55555d] bg-[#0a0a0c]'}`}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
                >
                  <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" onChange={(e) => handleUpload(e.target.files[0])} className="hidden" />
                  {isUploading ? (
                    <RefreshCw size={24} className="text-[#55555d] animate-spin mb-3" />
                  ) : (
                    <motion.div whileHover={{ y: -4 }} transition={{ ease: SPRING }} className="mb-3">
                      <Upload size={24} className="text-[#55555d]" />
                    </motion.div>
                  )}
                  <p className="text-sm text-[#f2f2f4] font-medium">{isUploading ? 'Extracting...' : dragOver ? 'Drop file' : 'Click or drop file'}</p>
                  {uploadError && <p className="text-xs text-[#ff5757] mt-2">{uploadError}</p>}
                </div>
              )}
            </div>
            
            <div className="px-5 py-3 border-t border-[#232327] bg-[#0a0a0c]">
              <p className="text-xs text-[#55555d]">PDF, DOCX, DOC up to 10MB</p>
            </div>
          </motion.div>

          {/* JD Panel */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18, ease: STD }} className="flex flex-col bg-[#131316] border border-[#232327] rounded-2xl overflow-hidden hover:border-[#2f2f34] transition-colors duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#232327]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border border-[#232327] flex items-center justify-center bg-[#0a0a0c]">
                  <Target size={14} className="text-[#93939c]" />
                </div>
                <span className="text-sm font-medium text-[#f2f2f4]">Job Description</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${jobDescription.trim().length > 40 ? 'bg-[#6ee7b7]' : 'bg-[#55555d]'}`} />
                <span className={`text-xs ${jobDescription.trim().length > 40 ? 'text-[#6ee7b7]' : 'text-[#55555d]'}`}>{jobDescription.trim().length > 40 ? 'Ready' : 'Pending'}</span>
              </div>
            </div>
            
            <div className="h-[232px] p-5">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here..."
                className="w-full h-full bg-[#0a0a0c] border border-[#232327] rounded-xl p-4 text-sm text-[#f2f2f4] placeholder:text-[#55555d] resize-none focus:outline-none focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843] transition-colors overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#2f2f34 #0a0a0c' }}
              />
            </div>
            
            <div className="px-5 py-3 border-t border-[#232327] bg-[#0a0a0c]">
              <p className="text-xs text-[#55555d]">{jobDescription.length} characters</p>
            </div>
          </motion.div>
        </div>

        {/* Action Area */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.27, ease: STD }} className="flex flex-col items-center">
          <motion.button
            whileHover={canAnalyze ? { backgroundColor: '#e2bb59', boxShadow: '0 0 20px rgba(212,168,67,0.2)' } : {}}
            whileTap={canAnalyze ? { scale: 0.965, transition: { ease: SPRING } } : {}}
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className={`h-11 px-8 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#d4a843] focus:ring-offset-2 focus:ring-offset-[#0a0a0c] ${
              canAnalyze
                ? 'bg-[#d4a843] text-[#0a0a0c] cursor-pointer'
                : 'bg-[#17171b] text-[#55555d] cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? (
              <RefreshCw size={16} className="animate-spin text-[#0a0a0c]" />
            ) : (
              'Analyze Match'
            )}
          </motion.button>
          
          <div className="mt-4 h-6 flex items-center justify-center">
             <AnimatePresence mode="wait">
              {result && !isAnalyzing ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs text-[#6ee7b7]">
                  <CheckCircle size={12} />
                  <span>Match report ready</span>
                </motion.div>
              ) : (
                <p className="text-xs text-[#55555d]">Cmd/Ctrl + Enter to submit · Privacy preserved</p>
              )}
             </AnimatePresence>
          </div>
        </motion.div>

        {/* Agent Loading Execution Flow */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-16 w-full max-w-[600px] mx-auto p-6 rounded-2xl border border-[#232327] bg-[#131316] shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(212,168,67,0.02)] to-transparent animate-pulse pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#232327]">
              <div className="w-8 h-8 rounded-full border border-[#d4a843] border-t-transparent animate-spin flex items-center justify-center">
                <Sparkles size={14} className="text-[#d4a843]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f2f2f4]">Agent Execution Flow</h3>
                <p className="text-xs text-[#55555d]">Executing background analysis steps...</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {ANALYSIS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                const isPending = idx > currentStepIndex;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1 flex items-center justify-center shrink-0">
                      {isCompleted && (
                        <CheckCircle size={16} className="text-[#6ee7b7]" />
                      )}
                      {isActive && (
                        <div className="w-4 h-4 rounded-full border-2 border-[#d4a843] border-t-transparent animate-spin" />
                      )}
                      {isPending && (
                        <div className="w-4 h-4 rounded-full border border-[#232327] bg-[#0a0a0c]" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${isActive ? 'text-[#f2f2f4]' : isCompleted ? 'text-[#93939c]' : 'text-[#55555d]'}`}>
                        {step.label}
                      </span>
                      {(isActive || isCompleted) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="text-xs text-[#55555d] mt-1 font-mono leading-relaxed"
                        >
                          &gt; {step.detail}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Results Area */}
        {result && analysis && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: STD }} className="mt-16 space-y-8 pt-10 border-t border-[rgba(212,168,67,0.35)]">
            <div className="flex gap-1 p-1 rounded-xl bg-[#131316] border border-[#232327] w-fit mx-auto">
              {[{ id: 'dashboard', label: 'Dashboard' }, { id: 'diff', label: 'Resume Diff' }, { id: 'suggestions', label: 'Suggestions' }].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'bg-[#232327] text-[#f2f2f4]' : 'text-[#55555d] hover:text-[#93939c]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div className="flex flex-col items-center py-6">
                    <CircularScore score={score} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <AnalyticsCard label="Missing Keywords" value={analysis.missingKeywords?.length ?? 0} icon={Target} color="#ff5757" />
                    <AnalyticsCard label="Recruiter Red Flags" value={analysis.redFlags?.length ?? 0} icon={AlertTriangle} color="#d4a843" />
                    <AnalyticsCard label="Interview Chance" value={analysis.estimatedInterviewChance || 'N/A'} icon={CheckCircle} color="#6ee7b7" />
                    <AnalyticsCard label="Resume Quality" value={analysis.resumeQuality || 'N/A'} icon={Sparkles} color="#f2f2f4" />
                  </div>

                  {analysis.missingKeywords?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#93939c] mb-3">Missing Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.missingKeywords.map((kw, i) => <KeywordPill key={i} keyword={kw} />)}
                      </div>
                    </div>
                  )}

                  {analysis.redFlags?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#93939c] mb-3">Recruiter Red Flags</h3>
                      <div className="space-y-2">
                        {analysis.redFlags.map((flag, i) => <RedFlagCard key={i} flag={flag} />)}
                      </div>
                    </div>
                  )}

                  {analysis.suggestions?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#93939c] mb-3">AI Suggestions</h3>
                      <div className="space-y-2">
                        {analysis.suggestions.map((s, i) => <SuggestionCard key={i} suggestion={s} />)}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-4 pt-10 pb-4">
                    <div className="flex gap-3 mt-2">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDownload('pdf')} className="px-6 py-3 rounded-full bg-[#d4a843] text-[#0a0a0c] text-sm font-semibold flex items-center gap-2 hover:bg-[#e2bb59] transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a843] focus:ring-offset-2 focus:ring-offset-[#0a0a0c]">
                        <Download size={16} /> Download Professional PDF
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleDownload('docx')} className="px-6 py-3 rounded-full bg-[#131316] text-[#f2f2f4] text-sm font-semibold flex items-center gap-2 border border-[#232327] hover:border-[#2f2f34] transition-colors focus:outline-none focus:ring-2 focus:ring-[#55555d] focus:ring-offset-2 focus:ring-offset-[#0a0a0c]">
                        <Download size={16} /> Download DOCX
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'diff' && (
                <motion.div key="diff" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <DiffView original={resumeText || ''} optimized={result.finalResume || result.rewrittenResume || ''} />
                </motion.div>
              )}

              {activeTab === 'suggestions' && (
                <motion.div key="suggestions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  {result.review?.explainChanges?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#93939c] mb-3">Changes Made</h3>
                      <div className="space-y-2">
                        {result.review.explainChanges.map((change, i) => <SuggestionCard key={i} suggestion={change} />)}
                      </div>
                    </div>
                  )}
                  {result.review?.hiringManagerNotes?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-[#93939c] mb-3">Hiring Manager Notes</h3>
                      {result.review.hiringManagerNotes.map((note, i) => <RedFlagCard key={i} flag={note} />)}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
