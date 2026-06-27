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
  ChevronRight,
  Download,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { apiPost, apiPostForm, api } from '../lib/apiClient';
import SiteFooter from '../components/SiteFooter';

const LOADING_MESSAGES = [
  'Analyzing ATS Score...',
  'Finding Missing Keywords...',
  'Optimizing Experience...',
  'Thinking like a Recruiter...',
  'Rewriting Bullet Points...',
  'Checking ATS Compatibility...',
  'Reviewing as Hiring Manager...',
  'Generating Final Resume...',
];

const TEMPLATES = [
  { id: 'modern', label: 'Modern' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'google', label: 'Google Style' },
  { id: 'faang', label: 'FAANG Style' },
  { id: 'startup', label: 'Startup Style' },
];

function CircularScore({ score, size = 160, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(250,250,250,0.9)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <motion.span
          className="text-4xl font-bold tracking-tight"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-[#737373] mt-1">ATS Match</span>
      </div>
    </div>
  );
}

function UploadZone({ onFileUploaded, isLoading }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await apiPostForm('/resume-ai/upload', formData);
      const data = response.data;
      setUploadedFile({ name: data.filename, pages: data.pages, text: data.resumeText });
      onFileUploaded(data.resumeText);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed. Try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }, [onFileUploaded]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleClick = () => inputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  if (uploadedFile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 bg-[#111111]"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(57,211,83,0.1)] flex items-center justify-center">
            <CheckCircle size={20} className="text-[#39d353]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
            <p className="text-xs text-[#737373]">
              {uploadedFile.pages} {uploadedFile.pages === 1 ? 'page' : 'pages'} · {uploadedFile.text.length.toLocaleString()} characters
            </p>
          </div>
          <button
            onClick={() => { setUploadedFile(null); onFileUploaded(null); }}
            className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            <X size={16} className="text-[#737373]" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
        dragOver
          ? 'border-[rgba(250,250,250,0.3)] bg-[rgba(250,250,250,0.03)]'
          : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] bg-[#111111]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={handleFileChange}
        className="hidden"
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={32} className="text-[#737373] animate-spin" />
          <p className="text-sm text-[#737373]">Extracting resume text...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
            <Upload size={24} className="text-[#737373]" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {dragOver ? 'Drop your resume here' : 'Upload your resume'}
            </p>
            <p className="text-xs text-[#737373] mt-1">
              Drag & drop or click to browse · PDF, DOCX, DOC
            </p>
          </div>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-400 mt-3">{error}</p>
      )}
    </div>
  );
}

function KeywordPill({ keyword }) {
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.04)] text-[#A3A3A3] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-default"
    >
      {keyword}
    </motion.span>
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
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-start gap-3 p-4 rounded-xl bg-[#111111] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-colors cursor-default"
    >
      <Sparkles size={16} className="text-[#A3A3A3] mt-0.5 shrink-0" />
      <p className="text-sm text-[#A3A3A3]">{suggestion}</p>
    </motion.div>
  );
}

function DiffView({ original, optimized }) {
  const [view, setView] = useState('optimized');

  return (
    <div>
      <div className="flex gap-1 mb-4 p-1 rounded-xl bg-[rgba(255,255,255,0.03)] w-fit">
        <button
          onClick={() => setView('optimized')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            view === 'optimized'
              ? 'bg-[rgba(250,250,250,0.08)] text-[#FAFAFA]'
              : 'text-[#737373] hover:text-[#A3A3A3]'
          }`}
        >
          Optimized
        </button>
        <button
          onClick={() => setView('original')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            view === 'original'
              ? 'bg-[rgba(250,250,250,0.08)] text-[#FAFAFA]'
              : 'text-[#737373] hover:text-[#A3A3A3]'
          }`}
        >
          Original
        </button>
      </div>

      <div className="p-5 rounded-xl bg-[#111111] border border-[rgba(255,255,255,0.06)] max-h-[500px] overflow-y-auto">
        <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-[#A3A3A3]">
          {view === 'optimized' ? optimized : original}
        </pre>
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-5 rounded-2xl bg-[#111111] border border-[rgba(255,255,255,0.06)]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-[#737373]">{label}</p>
        <p className="text-sm font-semibold mt-0.5" style={{ color }}>{value}</p>
      </div>
    </motion.div>
  );
}

export default function ResumeAIPage() {
  const { user } = useAuth();
  const textareaRef = useRef(null);

  const [resumeText, setResumeText] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await apiPost('/resume-ai/analyze', {
        resumeText,
        jobDescription,
      });
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
      const response = await api.post(
        '/resume-ai/download',
        { resumeText: result.finalResume, format },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          responseType: 'blob',
        }
      );
      const blob = response.data;
      const ext = format === 'pdf' ? 'pdf' : format === 'docx' ? 'docx' : 'txt';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optimized-resume.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const canAnalyze = resumeText && jobDescription.trim().length > 20 && !isAnalyzing;
  const analysis = result?.analysis;
  const score = analysis?.atsScore ?? 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-[1100px] mx-auto px-6 pt-28 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold tracking-tight text-[#FAFAFA] mb-4">
              AI Resume Optimizer
            </h1>
            <p className="text-lg text-[#737373] max-w-[600px] mx-auto leading-relaxed">
              Generate ATS-friendly resumes tailored to every job description using AI.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-[#737373]" />
                <h2 className="text-sm font-medium text-[#A3A3A3]">Upload Resume</h2>
              </div>
              <UploadZone onFileUploaded={setResumeText} isLoading={isAnalyzing} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-[#737373]" />
                  <h2 className="text-sm font-medium text-[#A3A3A3]">Job Description</h2>
                </div>
                {jobDescription && (
                  <span className="text-xs text-[#737373]">{jobDescription.length} characters</span>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete Job Description here..."
                rows={6}
                className="w-full bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 text-sm text-[#A3A3A3] placeholder:text-[#525252] resize-none focus:outline-none focus:border-[rgba(255,255,255,0.12)] transition-colors"
                style={{ minHeight: '120px', height: 'auto' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={canAnalyze ? { scale: 1.02 } : {}}
              whileTap={canAnalyze ? { scale: 0.98 } : {}}
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={`px-10 py-3.5 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all duration-200 ${
                canAnalyze
                  ? 'bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#e5e5e5] cursor-pointer'
                  : 'bg-[rgba(255,255,255,0.04)] text-[#525252] cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Analyze Resume
                </>
              )}
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-8"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#FAFAFA]"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#737373]">Running AI analysis pipeline...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {result && analysis && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex gap-1 p-1 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] w-fit mx-auto">
                {[
                  { id: 'dashboard', label: 'Dashboard' },
                  { id: 'diff', label: 'Resume Diff' },
                  { id: 'suggestions', label: 'Suggestions' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[rgba(250,250,250,0.08)] text-[#FAFAFA]'
                        : 'text-[#737373] hover:text-[#A3A3A3]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col items-center py-6">
                      <div className="relative flex items-center justify-center">
                        <CircularScore score={score} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <AnalyticsCard
                        label="Missing Keywords"
                        value={analysis.missingKeywords?.length ?? 0}
                        icon={Target}
                        color="#ff5757"
                      />
                      <AnalyticsCard
                        label="Recruiter Red Flags"
                        value={analysis.redFlags?.length ?? 0}
                        icon={AlertTriangle}
                        color="#ffa500"
                      />
                      <AnalyticsCard
                        label="Interview Chance"
                        value={analysis.estimatedInterviewChance || 'N/A'}
                        icon={CheckCircle}
                        color="#39d353"
                      />
                      <AnalyticsCard
                        label="Resume Quality"
                        value={analysis.resumeQuality || 'N/A'}
                        icon={Sparkles}
                        color="#A3A3A3"
                      />
                    </div>

                    {analysis.missingKeywords?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-[#A3A3A3] mb-3">Missing Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.missingKeywords.map((kw, i) => (
                            <KeywordPill key={i} keyword={kw} />
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.redFlags?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-[#A3A3A3] mb-3">Recruiter Red Flags</h3>
                        <div className="space-y-2">
                          {analysis.redFlags.map((flag, i) => (
                            <RedFlagCard key={i} flag={flag} />
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.suggestions?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-[#A3A3A3] mb-3">
                          AI Suggestions
                        </h3>
                        <div className="space-y-2">
                          {analysis.suggestions.map((s, i) => (
                            <SuggestionCard key={i} suggestion={s} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col items-center gap-4 pt-4">
                      <p className="text-xs text-[#525252]">Choose a template style</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {TEMPLATES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTemplate(t.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                              selectedTemplate === t.id
                                ? 'bg-[rgba(250,250,250,0.08)] text-[#FAFAFA] border border-[rgba(255,255,255,0.1)]'
                                : 'bg-[rgba(255,255,255,0.02)] text-[#737373] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)]'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDownload('pdf')}
                          className="px-6 py-3 rounded-xl bg-[#FAFAFA] text-[#0A0A0A] text-sm font-semibold flex items-center gap-2 hover:bg-[#e5e5e5] transition-colors"
                        >
                          <Download size={16} />
                          Download PDF
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDownload('docx')}
                          className="px-6 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] text-[#A3A3A3] text-sm font-semibold flex items-center gap-2 border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                        >
                          <Download size={16} />
                          Download DOCX
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'diff' && (
                  <motion.div
                    key="diff"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <DiffView
                      original={resumeText || ''}
                      optimized={result.finalResume || result.rewrittenResume || ''}
                    />
                  </motion.div>
                )}

                {activeTab === 'suggestions' && (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {result.review?.explainChanges?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-[#A3A3A3] mb-3">
                          Changes Made
                        </h3>
                        <div className="space-y-2">
                          {result.review.explainChanges.map((change, i) => (
                            <SuggestionCard key={i} suggestion={change} />
                          ))}
                        </div>
                      </div>
                    )}

                    {result.review?.formattingSuggestions?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-[#A3A3A3] mb-3">
                          Formatting Suggestions
                        </h3>
                        <div className="space-y-2">
                          {result.review.formattingSuggestions.map((s, i) => (
                            <SuggestionCard key={i} suggestion={s} />
                          ))}
                        </div>
                      </div>
                    )}

                    {result.review?.hiringManagerNotes?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-[#A3A3A3] mb-3">
                          Hiring Manager Notes
                        </h3>
                        {result.review.hiringManagerNotes.map((note, i) => (
                          <RedFlagCard key={i} flag={note} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-xs text-[#525252]">
            <Clock size={12} />
            <span>Your resume is processed securely and never stored permanently</span>
          </div>
        </motion.div>
      </div>

      <SiteFooter />
    </div>
  );
}
