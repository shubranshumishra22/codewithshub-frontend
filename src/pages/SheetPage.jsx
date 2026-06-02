import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronDown,
  FilePenLine,
  LogOut,
  Search,
  Sparkles,
  Save,
  Trophy,
  X,
} from 'lucide-react';
import { format, isBefore, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { apiGet, apiPost } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';

const STRIVER_SHEET_NAME = 'Striver A-Z';

const difficultyMeta = {
  easy: { label: 'Common', className: 'difficulty-easy' },
  medium: { label: 'Rare', className: 'difficulty-medium' },
  hard: { label: 'Legendary', className: 'difficulty-hard' },
};

const formatDueDate = (dateString) => {
  if (!dateString) {
    return null;
  }

  const dueDate = parseISO(dateString);
  const today = new Date();
  const label = format(dueDate, 'd MMM');

  if (format(dueDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    return `Due today • ${label}`;
  }

  if (isBefore(dueDate, today)) {
    return `Overdue • ${label}`;
  }

  return `Next • ${label}`;
};

function Checkbox({ checked, onChange, disabled }) {
  return (
    <label className="quest-checkbox">
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span aria-hidden="true" />
    </label>
  );
}

function NotesModal({ open, questionTitle, value, onChange, onClose, onSave, saving }) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="notes-modal auth-entrance"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="notes-modal-header">
          <div>
            <p className="notes-modal-kicker">Quest Notes</p>
            <h3 id="notes-modal-title">{questionTitle}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close notes">
            <X size={18} />
          </button>
        </div>

        <textarea
          className="notes-textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write a hint, trick, or recap for your future self..."
          rows={6}
        />

        <div className="notes-modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="auth-button" type="button" onClick={onSave} disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RevisionBadge({ dueLabel }) {
  if (!dueLabel) {
    return <span className="revision-chip revision-chip-empty">No revision due</span>;
  }

  return <span className="revision-chip">{dueLabel}</span>;
}

export default function SheetPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [openTopicId, setOpenTopicId] = useState(null);
  const [notesQuestion, setNotesQuestion] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  const sheetQuery = useQuery({
    queryKey: ['sheet-catalog', STRIVER_SHEET_NAME],
    queryFn: async () => {
      const response = await apiGet('/sheets');
      const sheet = response.data.sheets.find((item) => item.name === STRIVER_SHEET_NAME);

      if (!sheet) {
        throw new Error('Striver A-Z sheet not found');
      }

      return sheet;
    },
  });

  const sheetId = sheetQuery.data?.id;

  const topicsQuery = useQuery({
    queryKey: ['sheet-topics', sheetId],
    enabled: Boolean(sheetId),
    queryFn: async () => {
      const response = await apiGet(`/sheets/${sheetId}/topics`);
      return response.data;
    },
  });

  const questionIds = useMemo(
    () => topicsQuery.data?.topics?.flatMap((topic) => topic.questions.map((question) => question.id)) || [],
    [topicsQuery.data]
  );

  const progressQuery = useQuery({
    queryKey: ['sheet-progress', sheetId, user?.id],
    enabled: Boolean(sheetId && user?.id),
    queryFn: async () => {
      const response = await apiGet(`/progress/${sheetId}`);
      return response.data.progress;
    },
  });

  const revisionQuery = useQuery({
    queryKey: ['sheet-revisions', sheetId, user?.id, questionIds.join(',')],
    enabled: Boolean(sheetId && user?.id && questionIds.length > 0),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revision_schedule')
        .select('question_id, due_date, is_completed, revision_day')
        .eq('user_id', user.id)
        .in('question_id', questionIds)
        .eq('is_completed', false)
        .order('due_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });

  const markSolvedMutation = useMutation({
    mutationFn: async (questionId) => apiPost('/progress', { question_id: questionId }),
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });
      await queryClient.cancelQueries({ queryKey: ['sheet-revisions', sheetId, user?.id, questionIds.join(',')] });

      const previousProgress = queryClient.getQueryData(['sheet-progress', sheetId, user?.id]);
      const previousRevisions = queryClient.getQueryData([
        'sheet-revisions',
        sheetId,
        user?.id,
        questionIds.join(','),
      ]);

      queryClient.setQueryData(['sheet-progress', sheetId, user?.id], (current) => {
        const rows = Array.isArray(current) ? current : [];
        const existingRow = rows.find((row) => row.question_id === questionId);

        if (existingRow?.is_solved) {
          return rows;
        }

        const nextRow = {
          question_id: questionId,
          is_solved: true,
          solved_at: new Date().toISOString(),
          notes: existingRow?.notes || null,
        };

        const filteredRows = rows.filter((row) => row.question_id !== questionId);
        return [...filteredRows, nextRow];
      });

      return { previousProgress, previousRevisions };
    },
    onError: (error, _questionId, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(['sheet-progress', sheetId, user?.id], context.previousProgress);
      }

      if (context?.previousRevisions) {
        queryClient.setQueryData(
          ['sheet-revisions', sheetId, user?.id, questionIds.join(',')],
          context.previousRevisions
        );
      }

      toast.error(error.message || 'Could not mark the question as solved.');
    },
    onSuccess: (response, questionId) => {
      const revisionRows = response.data.revision_schedule || [];

      queryClient.setQueryData(['sheet-revisions', sheetId, user?.id, questionIds.join(',')], (current) => {
        const rows = Array.isArray(current) ? current : [];
        const remainingRows = rows.filter((row) => row.question_id !== questionId);
        return [...remainingRows, ...revisionRows];
      });

      toast.success('🎯 Quest Complete! Revision scheduled.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['sheet-revisions', sheetId, user?.id, questionIds.join(',')] });
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: async ({ questionId, notes, isSolved, solvedAt }) => {
      const { error } = await supabase.from('user_progress').upsert(
        {
          user_id: user.id,
          question_id: questionId,
          is_solved: isSolved,
          solved_at: isSolved ? solvedAt || new Date().toISOString() : null,
          notes,
        },
        { onConflict: 'user_id,question_id' }
      );

      if (error) {
        throw error;
      }

      return { questionId, notes };
    },
    onMutate: async ({ questionId, notes }) => {
      await queryClient.cancelQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });

      const previousProgress = queryClient.getQueryData(['sheet-progress', sheetId, user?.id]);

      queryClient.setQueryData(['sheet-progress', sheetId, user?.id], (current) => {
        const rows = Array.isArray(current) ? current : [];
        const existingRow = rows.find((row) => row.question_id === questionId);
        const nextRows = rows.filter((row) => row.question_id !== questionId);

        nextRows.push({
          question_id: questionId,
          is_solved: existingRow?.is_solved || false,
          solved_at: existingRow?.solved_at || null,
          notes,
        });

        return nextRows;
      });

      return { previousProgress };
    },
    onError: (error, _payload, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(['sheet-progress', sheetId, user?.id], context.previousProgress);
      }

      toast.error(error.message || 'Unable to save notes.');
    },
    onSuccess: () => {
      toast.success('Notes saved.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });
    },
  });

  useEffect(() => {
    if (!topicsQuery.data?.topics?.length) {
      return;
    }

    if (!openTopicId) {
      setOpenTopicId(topicsQuery.data.topics[0].id);
    }
  }, [topicsQuery.data]);

  const progressByQuestion = useMemo(() => {
    return (progressQuery.data || []).reduce((acc, progress) => {
      acc[progress.question_id] = progress;
      return acc;
    }, {});
  }, [progressQuery.data]);

  const revisionByQuestion = useMemo(() => {
    return (revisionQuery.data || []).reduce((acc, revision) => {
      const current = acc[revision.question_id];

      if (!current || revision.due_date < current.due_date) {
        acc[revision.question_id] = revision;
      }

      return acc;
    }, {});
  }, [revisionQuery.data]);

  const topics = useMemo(() => {
    const rawTopics = topicsQuery.data?.topics || [];
    const normalizedSearch = search.trim().toLowerCase();

    return rawTopics
      .map((topic) => {
        const questions = topic.questions.map((question) => {
          const progress = progressByQuestion[question.id];
          const revision = revisionByQuestion[question.id];

          return {
            ...question,
            isSolved: Boolean(progress?.is_solved),
            notes: progress?.notes || '',
            solvedAt: progress?.solved_at || null,
            nextRevisionDue: revision?.due_date || null,
          };
        });

        const filteredQuestions = normalizedSearch
          ? questions.filter((question) =>
              question.title.toLowerCase().includes(normalizedSearch)
            )
          : questions;

        const solvedCount = questions.filter((question) => question.isSolved).length;

        return {
          ...topic,
          questions,
          filteredQuestions,
          solvedCount,
        };
      })
      .filter((topic) => topic.filteredQuestions.length > 0);
  }, [progressByQuestion, revisionByQuestion, search, topicsQuery.data]);

  const stats = useMemo(() => {
    const allQuestions = topicsQuery.data?.topics?.flatMap((topic) => topic.questions) || [];
    const solvedCount = allQuestions.filter((question) => progressByQuestion[question.id]?.is_solved).length;
    return {
      solvedCount,
      totalCount: allQuestions.length,
    };
  }, [progressByQuestion, topicsQuery.data]);

  const handleLogout = async () => {
    const { error } = await logout();

    if (error) {
      toast.error(error.message || 'Unable to log out right now.');
      return;
    }

    toast.success('Logged out successfully.');
  };

  const openNotes = (question) => {
    setNotesQuestion(question);
    setNotesDraft(question.notes || '');
  };

  const closeNotes = () => {
    setNotesQuestion(null);
    setNotesDraft('');
  };

  const saveNotes = async () => {
    if (!notesQuestion) {
      return;
    }

    await saveNotesMutation.mutateAsync({
      questionId: notesQuestion.id,
      notes: notesDraft.trim() || null,
      isSolved: notesQuestion.isSolved,
      solvedAt: notesQuestion.solvedAt,
    });

    closeNotes();
  };

  const isLoading = sheetQuery.isLoading || topicsQuery.isLoading || progressQuery.isLoading;
  const hasError = sheetQuery.error || topicsQuery.error || progressQuery.error;
  const displayName =
    user?.user_metadata?.username || user?.email?.split('@')[0] || 'Quest Player';

  return (
    <main className="sheet-shell">
      <section className="sheet-card auth-entrance">
        <div className="sheet-header">
          <div>
            <div className="sheet-kicker">
              <BookOpen size={16} />
              <span>STRIVER A-Z SHEET</span>
            </div>
            <h1>DSA QUEST</h1>
            <p className="sheet-subtitle">
              Track every topic, solve every problem, and keep your revision streak alive.
            </p>
          </div>

          <div className="sheet-header-actions">
            <Link className="sheet-progress-link" to="/progress">
              <Trophy size={18} />
              Progress Dashboard
            </Link>
            <div className="sheet-hero-badge">
              <Sparkles size={16} />
              <span>{displayName}</span>
            </div>
            <button className="auth-button auth-button-amber sheet-logout" type="button" onClick={handleLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        <div className="sheet-stats-grid">
          <article>
            <span>Progress</span>
            <strong>
              {stats.solvedCount}/{stats.totalCount}
            </strong>
          </article>
          <article>
            <span>Active Sheet</span>
            <strong>{STRIVER_SHEET_NAME}</strong>
          </article>
          <article>
            <span>Search Mode</span>
            <strong>{search.trim() ? 'Filtered' : 'All Topics'}</strong>
          </article>
        </div>

        <label className="sheet-search">
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions across the sheet..."
          />
        </label>

        {isLoading ? (
          <div className="sheet-state-card">
            <div className="auth-loading-spinner" />
            <p>Loading your quest map...</p>
          </div>
        ) : hasError ? (
          <div className="sheet-state-card sheet-state-error">
            <p>{hasError.message || 'Failed to load the DSA sheet.'}</p>
          </div>
        ) : (
          <div className="topics-accordion">
            {topics.map((topic, index) => {
              const isOpen = openTopicId === topic.id;
              const totalCount = topic.questions.length;
              const visibleQuestions = topic.filteredQuestions;

              return (
                <section key={topic.id} className={`topic-card ${isOpen ? 'is-open' : ''}`}>
                  <button
                    className="topic-header"
                    type="button"
                    onClick={() => setOpenTopicId(isOpen ? null : topic.id)}
                  >
                    <div className="topic-header-left">
                      <div className="topic-xp-badge">
                        <span>LEVEL</span>
                        <strong>{String(index + 1).padStart(2, '0')}</strong>
                      </div>
                      <div>
                        <h2>{topic.name}</h2>
                        <p>{visibleQuestions.length} question{visibleQuestions.length === 1 ? '' : 's'} shown</p>
                      </div>
                    </div>

                    <div className="topic-header-right">
                      <span className="topic-solved-badge">
                        {topic.solvedCount}/{totalCount} solved
                      </span>
                      <ChevronDown size={18} className="topic-chevron" />
                    </div>
                  </button>

                  <div className="topic-body-shell" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                    <div className="topic-body">
                      <div className="question-table-wrap">
                        <table className="question-table">
                          <thead>
                            <tr>
                              <th className="checkbox-column">Done</th>
                              <th>Problem</th>
                              <th>Difficulty</th>
                              <th>Notes</th>
                              <th>Revision</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleQuestions.map((question) => {
                              const difficulty = difficultyMeta[question.difficulty] || difficultyMeta.medium;
                              const noteCount = (question.notes || '').trim().length;
                              const dueLabel = formatDueDate(question.nextRevisionDue);

                              return (
                                <tr key={question.id} className={question.isSolved ? 'is-solved' : ''}>
                                  <td className="checkbox-column" data-label="Done">
                                    <Checkbox
                                      checked={question.isSolved}
                                      disabled={question.isSolved || markSolvedMutation.isPending}
                                      onChange={() => markSolvedMutation.mutate(question.id)}
                                    />
                                  </td>
                                  <td data-label="Problem">
                                    {question.leetcode_url ? (
                                      <a
                                        href={question.leetcode_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="question-title"
                                      >
                                        {question.title}
                                      </a>
                                    ) : (
                                      <span className="question-title question-title-static">{question.title}</span>
                                    )}
                                    {!question.leetcode_url ? <span className="question-link-hint">No LeetCode link provided</span> : null}
                                  </td>
                                  <td data-label="Difficulty">
                                    <span className={`difficulty-badge ${difficulty.className}`}>
                                      {difficulty.label}
                                    </span>
                                  </td>
                                  <td data-label="Notes">
                                    <button className="notes-button" type="button" onClick={() => openNotes(question)}>
                                      <FilePenLine size={16} />
                                      <span>{noteCount > 0 ? 'Edit' : 'Add'} Notes</span>
                                    </button>
                                  </td>
                                  <td data-label="Revision">
                                    <RevisionBadge dueLabel={dueLabel} />
                                  </td>
                                </tr>
                              );
                            })}
                            {visibleQuestions.length === 0 ? (
                              <tr>
                                <td colSpan={5}>
                                  <div className="sheet-empty-row">No questions match your search.</div>
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <NotesModal
        open={Boolean(notesQuestion)}
        questionTitle={notesQuestion?.title || ''}
        value={notesDraft}
        onChange={setNotesDraft}
        onClose={closeNotes}
        onSave={saveNotes}
        saving={saveNotesMutation.isPending}
      />
    </main>
  );
}
