import { useEffect, useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Brain, ChevronRight, Eye, ExternalLink, ShieldAlert, Sparkles, X, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiGet, apiPost, apiDelete } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

const difficultyMeta = {
  easy: { label: 'Common', className: 'difficulty-easy' },
  medium: { label: 'Rare', className: 'difficulty-medium' },
  hard: { label: 'Legendary', className: 'difficulty-hard' },
};

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export default function PublicSheetLandingPage() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const isAmazonArray = pathname.includes('top-50-array-questions-asked-in-amazon-interviews');
  const pageTitle = isAmazonArray
    ? 'Top 50 Array Questions Asked in Amazon Interviews'
    : 'Sliding Window Pattern Problems with Solutions';

  // Dynamic SEO Configuration
  useEffect(() => {
    if (isAmazonArray) {
      document.title = 'Top 50 Amazon Array Questions with Solutions | CodeWithShub';
      
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute(
        'content',
        'Solve the top array coding interview questions asked in Amazon technical interviews. Access detailed solutions in C++, Java, Python, and JavaScript.'
      );
    } else {
      document.title = 'Sliding Window Pattern Problems with Solutions | CodeWithShub';
      
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute(
        'content',
        'Master the sliding window pattern with our curated coding problems. Includes copyable code solutions in C++, Java, Python, and JavaScript with complexity breakdowns.'
      );
    }

    return () => {
      document.title = 'CodeWithShub';
    };
  }, [isAmazonArray]);

  // Fetch all questions from the Quest Sheet dynamically
  const questionsQuery = useQuery({
    queryKey: ['public-landing-questions'],
    queryFn: async () => {
      const response = await apiGet('/sheets');
      const sheets = response.data.sheets || [];
      const questSheet = sheets.find((s) => s.name === 'Quest Sheet') || sheets[0];
      if (!questSheet) return [];

      const topicsResponse = await apiGet(`/sheets/${questSheet.id}/topics`);
      const topics = topicsResponse.data.topics || [];
      return {
        sheetId: questSheet.id,
        questions: topics.flatMap((t) =>
          t.questions.map((q) => ({
            ...q,
            topicName: t.name,
            sheetId: questSheet.id,
          }))
        ),
      };
    },
  });

  const sheetId = questionsQuery.data?.sheetId;
  const rawQuestions = questionsQuery.data?.questions || [];

  // Filter questions based on keyword strategy
  const filteredQuestions = useMemo(() => {
    if (rawQuestions.length === 0) return [];

    if (isAmazonArray) {
      const arrayKeywords = [
        'two sum',
        '2sum',
        'stock',
        'permutation',
        'intervals',
        'subarray',
        'zeros',
        'sorted array',
        'largest element',
        'rotate image',
        'rotate matrix',
        'second largest',
        'majority element',
        '3sum',
        '4sum',
        'merge sorted array',
        'consecutive sequence',
        'maximum product subarray',
      ];
      return rawQuestions
        .filter(
          (q) =>
            q.topicName.toLowerCase().includes('array') ||
            arrayKeywords.some((kw) => q.title.toLowerCase().includes(kw))
        )
        .slice(0, 15);
    } else {
      return rawQuestions.filter(
        (q) =>
          q.topicName.toLowerCase().includes('sliding window') ||
          q.title.toLowerCase().includes('sliding window') ||
          q.title.toLowerCase().includes('substring without repeating') ||
          q.title.toLowerCase().includes('max consecutive ones iii') ||
          q.title.toLowerCase().includes('fruit into baskets') ||
          q.title.toLowerCase().includes('longest repeating character replacement') ||
          q.title.toLowerCase().includes('minimum window substring')
      );
    }
  }, [rawQuestions, isAmazonArray]);

  // Fetch progress if logged in
  const progressQuery = useQuery({
    queryKey: ['sheet-progress', sheetId, user?.id],
    enabled: Boolean(sheetId && user?.id),
    queryFn: async () => {
      const response = await apiGet(`/progress/${sheetId}`);
      return response.data.progress || [];
    },
  });

  const solvedSet = useMemo(() => {
    return new Set(
      (progressQuery.data || [])
        .filter((row) => row.is_solved)
        .map((row) => row.question_id)
    );
  }, [progressQuery.data]);

  // Solve mutations
  const markSolvedMutation = useMutation({
    mutationFn: async (questionId) => apiPost('/progress', { question_id: questionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });
      toast.success('🎯 Question solved successfully!');
    },
  });

  const unmarkSolvedMutation = useMutation({
    mutationFn: async (questionId) => apiDelete(`/progress/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });
      toast.success('Progress reset.');
    },
  });

  const handleCheckboxClick = (questionId) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (solvedSet.has(questionId)) {
      unmarkSolvedMutation.mutate(questionId);
    } else {
      markSolvedMutation.mutate(questionId);
    }
  };

  const isLoading = questionsQuery.isLoading;

  return (
    <>
    <main className="sheet-shell" style={{ paddingTop: '100px' }}>
      <div className="sheet-card auth-entrance">
        {/* Header Section */}
        <div className="sheet-header" style={{ flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          <div className="sheet-kicker" style={{ display: 'inline-flex', padding: '6px 16px', background: 'rgba(28,30,33,0.6)' }}>
            <Sparkles size={14} style={{ marginRight: '6px', color: '#ffea79' }} />
            <span>CURATED LIST</span>
          </div>

          <h1 style={{ marginTop: '16px', fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', color: '#fff' }}>
            {pageTitle}
          </h1>

          <p className="sheet-subtitle" style={{ maxWidth: '700px', fontSize: '0.95rem' }}>
            {isAmazonArray
              ? 'Ace your Amazon technical rounds. Solve these hand-picked array problems and view detailed solutions with step-by-step complexity analysis.'
              : 'Master the sliding window technique. Learn how to optimize nested O(N²) loops into slick linear O(N) constraints using dual boundaries.'}
          </p>

          <div style={{ marginTop: '12px' }}>
            <Link to="/roadmap/best-dsa-preparation-roadmap-for-beginners" className="sheet-progress-link" style={{ fontSize: '0.85rem' }}>
              View Complete Roadmap
            </Link>
          </div>
        </div>

        {/* Loader */}
        {isLoading ? (
          <div className="sheet-state-card" style={{ minHeight: '300px' }}>
            <div className="auth-loading-spinner" />
            <p>Gathering standard coding questions...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="sheet-state-card sheet-state-error">
            <ShieldAlert size={36} />
            <p>Database synchronization pending. Please check back shortly.</p>
          </div>
        ) : (
          /* Question Sheet Layout */
          <div className="topic-card" style={{ overflow: 'hidden' }}>
            <div className="question-table-wrap">
              <table className="question-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">Done</th>
                    <th>Problem</th>
                    <th>Topic</th>
                    <th>Difficulty</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q) => {
                    const difficulty = difficultyMeta[q.difficulty] || difficultyMeta.medium;
                    const isSolved = solvedSet.has(q.id);
                    const slug = slugify(q.title);

                    return (
                      <tr key={q.id} className={isSolved ? 'is-solved' : ''}>
                        <td className="checkbox-column" data-label="Done">
                          <label className="quest-checkbox">
                            <input
                              type="checkbox"
                              checked={isSolved}
                              onChange={() => handleCheckboxClick(q.id)}
                            />
                            <span aria-hidden="true" />
                          </label>
                        </td>

                        <td data-label="Problem">
                          <Link to={`/question/${slug}`} className="question-title" style={{ fontWeight: '500' }}>
                            {q.title}
                          </Link>
                        </td>

                        <td data-label="Topic">
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            {q.topicName.split(':')[1]?.trim() || q.topicName}
                          </span>
                        </td>

                        <td data-label="Difficulty">
                          <span className={`difficulty-badge ${difficulty.className}`}>
                            {difficulty.label}
                          </span>
                        </td>

                        <td data-label="Actions" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {q.leetcode_url ? (
                              <a
                                href={q.leetcode_url}
                                target="_blank"
                                rel="noreferrer"
                                className="notes-button"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.8rem',
                                  padding: '6px 12px',
                                  border: '0.5px solid #242629',
                                  borderRadius: '6px',
                                  transition: 'border-color 0.2s ease, background 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                                  e.currentTarget.style.background = '#242629';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#242629';
                                  e.currentTarget.style.background = '#1c1e21';
                                }}
                              >
                                <img
                                  src="https://leetcode.com/favicon.ico"
                                  alt="Leetcode"
                                  style={{ width: '14px', height: '14px', objectFit: 'contain', verticalAlign: 'middle' }}
                                />
                                <span>Leetcode</span>
                              </a>
                            ) : (
                              <a
                                href={`https://www.geeksforgeeks.org/problems/${slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="notes-button"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.8rem',
                                  padding: '6px 12px',
                                  border: '0.5px solid #242629',
                                  borderRadius: '6px',
                                  transition: 'border-color 0.2s ease, background 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                                  e.currentTarget.style.background = '#242629';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#242629';
                                  e.currentTarget.style.background = '#1c1e21';
                                }}
                              >
                                <img
                                  src="https://www.geeksforgeeks.org/favicon.ico"
                                  alt="GFG"
                                  style={{ width: '14px', height: '14px', objectFit: 'contain', verticalAlign: 'middle' }}
                                />
                                <span>GFG</span>
                              </a>
                            )}

                            {q.video_url && (
                              <a
                                href={q.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="notes-button"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.8rem',
                                  padding: '6px 12px',
                                  border: '0.5px solid #242629',
                                  borderRadius: '6px',
                                  color: '#ff4b4b',
                                  transition: 'border-color 0.2s ease, background 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = 'rgba(255,75,75,0.4)';
                                  e.currentTarget.style.background = 'rgba(255,75,75,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#242629';
                                  e.currentTarget.style.background = '#1c1e21';
                                }}
                              >
                                <Play size={12} fill="#ff4b4b" color="#ff4b4b" />
                                <span>Video</span>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
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
      <SiteFooter />
    </>);
}
