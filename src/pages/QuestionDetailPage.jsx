import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Brain, Check, Copy, ExternalLink, ShieldAlert, X, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiGet, apiPost, apiDelete } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

const difficultyMeta = {
  easy: { label: 'Common', className: 'difficulty-easy' },
  medium: { label: 'Rare', className: 'difficulty-medium' },
  hard: { label: 'Legendary', className: 'difficulty-hard' },
};

export default function QuestionDetailPage() {
  const { questionSlug } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeLang, setActiveLang] = useState('cpp');
  const [copied, setCopied] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Fetch question and solution details
  const { data: qData, isLoading, error } = useQuery({
    queryKey: ['public-question', questionSlug],
    queryFn: async () => {
      const response = await apiGet(`/sheets/public/questions/by-slug/${questionSlug}`);
      return response.data;
    },
    enabled: Boolean(questionSlug),
  });

  const question = qData?.question;
  const details = qData?.details;
  const sheetId = question?.topics?.sheet_id;

  // Set SEO tags dynamically
  useEffect(() => {
    if (question) {
      document.title = `${question.title} Solution | C++, Java, Python, JS | CodeWithShub`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute(
        'content',
        `Find the optimized C++, Java, Python, and JavaScript code solutions for the "${question.title}" coding question. Learn time and space complexity explanations.`
      );
    }
    return () => {
      document.title = 'DSA Quest';
    };
  }, [question]);

  // Fetch user's progress if logged in
  const progressQuery = useQuery({
    queryKey: ['sheet-progress', sheetId, user?.id],
    enabled: Boolean(sheetId && user?.id),
    queryFn: async () => {
      const response = await apiGet(`/progress/${sheetId}`);
      return response.data.progress || [];
    },
  });

  const isSolved = progressQuery.data
    ? progressQuery.data.some((row) => row.question_id === question?.id && row.is_solved)
    : false;

  // Solved/Unsolved Mutations
  const markSolvedMutation = useMutation({
    mutationFn: async () => apiPost('/progress', { question_id: question.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });
      toast.success('🎯 Quest Complete! Progress updated.');
    },
    onError: (err) => {
      toast.error(err.message || 'Could not save progress.');
    },
  });

  const unmarkSolvedMutation = useMutation({
    mutationFn: async () => apiDelete(`/progress/${question.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });
      toast.success('Quest progress reset.');
    },
    onError: (err) => {
      toast.error(err.message || 'Could not reset progress.');
    },
  });

  const handleCheckboxChange = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (isSolved) {
      unmarkSolvedMutation.mutate();
    } else {
      markSolvedMutation.mutate();
    }
  };

  const copyToClipboard = () => {
    if (!details) return;
    const codeMap = {
      cpp: details.solution_cpp,
      java: details.solution_java,
      python: details.solution_python,
      javascript: details.solution_javascript,
    };
    navigator.clipboard.writeText(codeMap[activeLang] || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied solution code!');
  };

  if (isLoading) {
    return (
      <main className="sheet-shell">
        <div className="sheet-state-card" style={{ marginTop: '80px' }}>
          <div className="auth-loading-spinner" />
          <p>Decoding solution scrolls...</p>
        </div>
      </main>
    );
  }

  if (error || !question) {
    return (
      <main className="sheet-shell">
        <div className="sheet-state-card sheet-state-error" style={{ marginTop: '80px', maxWidth: '600px' }}>
          <ShieldAlert size={48} style={{ marginBottom: '16px', color: '#ff6b6b' }} />
          <h2>Question Not Found</h2>
          <p>{error?.message || 'We could not locate this coding quest. Check the link or explore our roadmap.'}</p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <Link to="/" className="sheet-progress-link">
              Back to Home
            </Link>
            <Link to="/roadmap/best-dsa-preparation-roadmap-for-beginners" className="auth-button">
              View Roadmap
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const difficulty = difficultyMeta[question.difficulty] || difficultyMeta.medium;

  return (
    <main className="sheet-shell" style={{ paddingTop: '100px' }}>
      <div className="sheet-card auth-entrance">
        {/* Back Navigation */}
        <div style={{ marginBottom: '24px' }}>
          <Link to="/" className="sheet-progress-link" style={{ display: 'inline-flex', padding: '6px 12px' }}>
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Back to Catalog
          </Link>
        </div>

        {/* Title Section */}
        <div className="sheet-header" style={{ flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span className={`difficulty-badge ${difficulty.className}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
              {difficulty.label}
            </span>
            <label className="quest-checkbox" style={{ transform: 'scale(1.15)', cursor: 'pointer' }} title="Mark solved">
              <input type="checkbox" checked={isSolved} onChange={handleCheckboxChange} />
              <span aria-hidden="true" />
            </label>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.45)' }}>
              {isSolved ? 'Quest Solved!' : 'Mark as Solved'}
            </span>
          </div>

          <h1 style={{ marginTop: '12px', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', color: '#fff' }}>
            {question.title}
          </h1>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
            {question.leetcode_url && (
              <a
                href={question.leetcode_url}
                target="_blank"
                rel="noreferrer"
                className="sheet-progress-link"
                style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} />
                Solve on LeetCode
              </a>
            )}
            {question.video_url && (
              <a
                href={question.video_url}
                target="_blank"
                rel="noreferrer"
                className="sheet-progress-link"
                style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ff4b4b' }}
              >
                <Play size={14} fill="#ff4b4b" color="#ff4b4b" />
                Watch Video Explanation
              </a>
            )}
            <Link
              to="/roadmap/best-dsa-preparation-roadmap-for-beginners"
              className="sheet-progress-link"
              style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <BookOpen size={14} />
              View Roadmap
            </Link>
          </div>
        </div>

        {/* Layout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          
          {/* Left Column: Problem & Complexity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Description Card */}
            <article className="topic-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '16px', borderBottom: '0.5px solid #242629', paddingBottom: '8px' }}>
                Problem Analysis
              </h2>
              <div style={{ color: 'rgba(255, 255, 255, 0.75)', lineHeight: '1.7', whiteSpace: 'pre-wrap', fontSize: '0.925rem' }}>
                {details.description}
              </div>
            </article>

            {/* Complexity Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <article className="topic-card" style={{ padding: '16px' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', textTransform: 'uppercase', tracking: '0.1em' }}>
                  Time Complexity
                </span>
                <strong style={{ display: 'block', fontSize: '1.25rem', color: '#39d353', marginTop: '6px', fontFamily: 'monospace' }}>
                  {details.time_complexity.split(' ')[0]}
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', lineHeight: '1.4' }}>
                  {details.time_complexity}
                </p>
              </article>

              <article className="topic-card" style={{ padding: '16px' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', textTransform: 'uppercase', tracking: '0.1em' }}>
                  Space Complexity
                </span>
                <strong style={{ display: 'block', fontSize: '1.25rem', color: '#8a6a2a', marginTop: '6px', fontFamily: 'monospace' }}>
                  {details.space_complexity.split(' ')[0]}
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', lineHeight: '1.4' }}>
                  {details.space_complexity}
                </p>
              </article>
            </div>
          </div>

          {/* Right Column: Code block with languages */}
          <div>
            <article className="topic-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '480px' }}>
              {/* Selector Tabs */}
              <div style={{ display: 'flex', borderBottom: '0.5px solid #242629', background: '#131518', padding: '12px 16px', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['cpp', 'java', 'python', 'javascript'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`sheet-progress-link ${activeLang === lang ? 'is-active' : ''}`}
                      style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '4px', textTransform: 'uppercase', border: activeLang === lang ? '0.5px solid rgba(255,255,255,0.4)' : '0.5px solid transparent' }}
                    >
                      {lang === 'cpp' ? 'C++' : lang === 'java' ? 'Java' : lang === 'python' ? 'Python' : 'JS'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="sheet-progress-link"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '4px' }}
                  title="Copy Solution Code"
                >
                  {copied ? <Check size={14} style={{ color: '#39d353' }} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Code Code Block */}
              <div style={{ flex: 1, padding: '16px', background: '#0e1012', overflow: 'auto', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                <pre style={{ margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.85rem', lineHeight: '1.6', color: '#c9d1d9' }}>
                  <code>
                    {activeLang === 'cpp' && details.solution_cpp}
                    {activeLang === 'java' && details.solution_java}
                    {activeLang === 'python' && details.solution_python}
                    {activeLang === 'javascript' && details.solution_javascript}
                  </code>
                </pre>
              </div>
            </article>
          </div>

        </div>
      </div>
      <SiteFooter />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowLoginPrompt(false)}>
          <div className="notes-modal auth-entrance" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="notes-modal-header">
              <div>
                <p className="notes-modal-kicker">Join the Quest</p>
                <h3 id="notes-modal-title">Track Your DSA Progress</h3>
              </div>
              <button className="icon-button" type="button" onClick={() => setShowLoginPrompt(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.55)', margin: '14px 0 24px', lineHeight: '1.6', fontSize: '0.9rem' }}>
              Create an account or sign in to mark problems as solved, save custom notes, access space-repetition revision schedules, and rank on the global leaderboard.
            </p>
            <div className="notes-modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="ghost-button" type="button" onClick={() => setShowLoginPrompt(false)} style={{ flex: 1 }}>
                Continue Guest
              </button>
              <Link to="/login" className="auth-button" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
                Sign In / Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
