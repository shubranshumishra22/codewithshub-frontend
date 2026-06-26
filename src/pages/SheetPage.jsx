import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronDown,
  FilePenLine,
  Search,
  Save,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { apiDelete, apiGet, apiPost } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

const STRIVER_SHEET_NAME = 'Striver A-Z';
const REVISION_DAYS = [1, 3, 7, 15, 30, 60, 120];

const difficultyMeta = {
  easy: { label: 'Common', className: 'difficulty-easy' },
  medium: { label: 'Rare', className: 'difficulty-medium' },
  hard: { label: 'Legendary', className: 'difficulty-hard' },
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

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDueDate(dateString) {
  if (!dateString) return null;
  const dueDate = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const label = `${dueDate.getDate()} ${MONTHS_SHORT[dueDate.getMonth()]}`;
  if (dueDate.getTime() === today.getTime()) return `Due today • ${label}`;
  if (dueDate < today) return `Overdue • ${label}`;
  return `Next • ${label}`;
}

function RevisionCell({ question, onComplete, onUncomplete, onSyncRevision, isExpanded, onToggle }) {
  const dueLabel = formatDueDate(question.nextRevisionDue);
  const hasRevisions = question.allRevisions.length > 0;
  const needsSync = question.isSolved && !hasRevisions;
  const showButton = hasRevisions || needsSync;

  const handleToggle = () => {
    if (needsSync && !isExpanded) {
      onSyncRevision(question.id);
    }
    onToggle(question.id);
  };

  return (
    <div className="revision-cell">
      <div className="revision-cell-header">
        {dueLabel ? (
          <span className="revision-chip">{dueLabel}</span>
        ) : (
          <span className="revision-chip revision-chip-empty">No revision due</span>
        )}
        {showButton && (
          <button
            className="revision-expand-btn"
            type="button"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown size={14} className={`revision-chevron ${isExpanded ? 'is-open' : ''}`} />
          </button>
        )}
      </div>
      {isExpanded && (
        <div className="revision-cell-body">
          {hasRevisions ? (
            <RevisionCheckboxes revisions={question.allRevisions} onComplete={onComplete} onUncomplete={onUncomplete} />
          ) : (
            <span className="revision-syncing-text">Generating revision schedule...</span>
          )}
        </div>
      )}
    </div>
  );
}

function RevisionCheckboxes({ revisions, onComplete, onUncomplete }) {
  const sortedRevisions = useMemo(() => {
    return [...(revisions || [])].sort((a, b) => a.revision_day - b.revision_day);
  }, [revisions]);

  return (
    <div className="revision-checkboxes">
      {sortedRevisions.map((revision) => {
        const day = revision.revision_day;
        const checked = revision.is_completed;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDate = new Date(revision.due_date + 'T00:00:00');
        const canInteract = checked || now >= dueDate;

        return (
          <label
            key={revision.id}
            className={`revision-cb${checked ? ' revision-cb-done' : ''}${canInteract && !checked ? ' revision-cb-ready' : ''}${!canInteract ? ' revision-cb-disabled' : ''}`}
            title={`Due: ${revision.due_date} (day +${day})`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={!canInteract}
              onChange={() => {
                if (checked) {
                  onUncomplete(revision.id);
                } else {
                  onComplete(revision.id);
                }
              }}
            />
            <span>+{day}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function SheetPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [openTopicId, setOpenTopicId] = useState(null);
  const [revisionViewQuestionId, setRevisionViewQuestionId] = useState(null);
  const [notesQuestion, setNotesQuestion] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  const toggleRevisionView = (questionId) => {
    setRevisionViewQuestionId((prev) => (prev === questionId ? null : questionId));
  };

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
    queryKey: ['sheet-revisions', sheetId, user?.id],
    enabled: Boolean(sheetId && user?.id && questionIds.length > 0),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revision_schedule')
        .select('id, question_id, due_date, is_completed, revision_day')
        .eq('user_id', user.id)
        .in('question_id', questionIds)
        .order('revision_day', { ascending: true });

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
      await queryClient.cancelQueries({ queryKey: ['sheet-revisions', sheetId, user?.id] });

      const previousProgress = queryClient.getQueryData(['sheet-progress', sheetId, user?.id]);
      const previousRevisions = queryClient.getQueryData(['sheet-revisions', sheetId, user?.id]);

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
        queryClient.setQueryData(['sheet-revisions', sheetId, user?.id], context.previousRevisions);
      }

      toast.error(error.message || 'Could not mark the question as solved.');
    },
    onSuccess: (response, questionId) => {
      const revisionRows = response.data.revision_schedule || [];

      queryClient.setQueryData(['sheet-revisions', sheetId, user?.id], (current) => {
        const rows = Array.isArray(current) ? current : [];
        const remainingRows = rows.filter((row) => row.question_id !== questionId);
        return [...remainingRows, ...revisionRows];
      });

      toast.success('🎯 Quest Complete! Revision scheduled.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['sheet-revisions', sheetId, user?.id] });
    },
  });

  const unmarkSolvedMutation = useMutation({
    mutationFn: async (questionId) => apiDelete(`/progress/${questionId}`),
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });
      await queryClient.cancelQueries({ queryKey: ['sheet-revisions', sheetId, user?.id] });

      const previousProgress = queryClient.getQueryData(['sheet-progress', sheetId, user?.id]);
      const previousRevisions = queryClient.getQueryData(['sheet-revisions', sheetId, user?.id]);

      queryClient.setQueryData(['sheet-progress', sheetId, user?.id], (current) => {
        const rows = Array.isArray(current) ? current : [];
        const existingRow = rows.find((row) => row.question_id === questionId);

        if (!existingRow?.is_solved) {
          return rows;
        }

        const nextRow = {
          ...existingRow,
          is_solved: false,
          solved_at: null,
        };

        const filteredRows = rows.filter((row) => row.question_id !== questionId);
        return [...filteredRows, nextRow];
      });

      queryClient.setQueryData(['sheet-revisions', sheetId, user?.id], (current) => {
        const rows = Array.isArray(current) ? current : [];
        return rows.filter((row) => row.question_id !== questionId);
      });

      return { previousProgress, previousRevisions };
    },
    onError: (error, _questionId, context) => {
      if (context?.previousProgress) {
        queryClient.setQueryData(['sheet-progress', sheetId, user?.id], context.previousProgress);
      }

      if (context?.previousRevisions) {
        queryClient.setQueryData(['sheet-revisions', sheetId, user?.id], context.previousRevisions);
      }

      toast.error(error.message || 'Could not mark the question as unsolved.');
    },
    onSuccess: () => {
      toast.success('Question marked as unsolved.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-progress', sheetId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['sheet-revisions', sheetId, user?.id] });
    },
  });

  const completeRevisionMutation = useMutation({
    mutationFn: async (revisionScheduleId) => {
      const response = await apiPost('/revision/complete', { revision_schedule_id: revisionScheduleId });
      return response.data.revision;
    },
    onMutate: async (revisionScheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['sheet-revisions', sheetId, user?.id] });
      const previous = queryClient.getQueryData(['sheet-revisions', sheetId, user?.id]);
      queryClient.setQueryData(['sheet-revisions', sheetId, user?.id], (current) => {
        if (!Array.isArray(current)) return current;
        return current.map((r) =>
          r.id === revisionScheduleId
            ? { ...r, is_completed: true, completed_at: new Date().toISOString() }
            : r
        );
      });
      return { previous };
    },
    onError: (error, _revisionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['sheet-revisions', sheetId, user?.id], context.previous);
      }
      toast.error(error.message || 'Could not complete revision.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-revisions', sheetId, user?.id] });
    },
  });

  const uncompleteRevisionMutation = useMutation({
    mutationFn: async (revisionScheduleId) => {
      const response = await apiPost('/revision/uncomplete', { revision_schedule_id: revisionScheduleId });
      return response.data.revision;
    },
    onMutate: async (revisionScheduleId) => {
      await queryClient.cancelQueries({ queryKey: ['sheet-revisions', sheetId, user?.id] });
      const previous = queryClient.getQueryData(['sheet-revisions', sheetId, user?.id]);
      queryClient.setQueryData(['sheet-revisions', sheetId, user?.id], (current) => {
        if (!Array.isArray(current)) return current;
        return current.map((r) =>
          r.id === revisionScheduleId
            ? { ...r, is_completed: false, completed_at: null }
            : r
        );
      });
      return { previous };
    },
    onError: (error, _revisionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['sheet-revisions', sheetId, user?.id], context.previous);
      }
      toast.error(error.message || 'Could not uncomplete revision.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-revisions', sheetId, user?.id] });
    },
  });

  const progressMutationPending =
    markSolvedMutation.isPending || unmarkSolvedMutation.isPending;

  const saveNotesMutation = useMutation({
    mutationFn: async ({ questionId, notes }) => {
      const { error } = await supabase.from('user_progress').upsert(
        {
          user_id: user.id,
          question_id: questionId,
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
      queryClient.invalidateQueries({ queryKey: ['sheet-revisions', sheetId, user?.id] });
    },
  });

  const syncRevisionMutation = useMutation({
    mutationFn: async (questionId) => {
      const response = await apiPost('/revision/sync-question', { question_id: questionId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-revisions', sheetId, user?.id] });
      toast.success('Revision schedule generated.');
    },
    onError: (error) => {
      toast.error(error.message || 'Could not sync revision schedule.');
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
      if (!acc[revision.question_id]) {
        acc[revision.question_id] = [];
      }
      acc[revision.question_id].push(revision);
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
          const allRevisions = revisionByQuestion[question.id] || [];
          const allRevisionsCompleted =
            allRevisions.length > 0 && allRevisions.every((rev) => rev.is_completed);

          const pendingRevisions = allRevisions.filter((r) => !r.is_completed);
          const nextRevisionDue =
            pendingRevisions.length > 0
              ? pendingRevisions.sort((a, b) => a.due_date.localeCompare(b.due_date))[0].due_date
              : question.isSolved && question.solvedAt
                ? new Date(
                    new Date(question.solvedAt).getTime() +
                      REVISION_DAYS[0] * 24 * 60 * 60 * 1000
                  )
                    .toISOString()
                    .split('T')[0]
                : null;

          return {
            ...question,
            isSolved: Boolean(progress?.is_solved),
            notes: progress?.notes || '',
            solvedAt: progress?.solved_at || null,
            allRevisions,
            allRevisionsCompleted,
            nextRevisionDue,
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
                              const rowClass = `${question.isSolved ? 'is-solved' : ''}${question.allRevisionsCompleted ? ' is-revision-done' : ''}`;

                              return (
                                <tr key={question.id} className={rowClass}>
                                  <td className="checkbox-column" data-label="Done">
                                    <Checkbox
                                      checked={question.isSolved}
                                      disabled={progressMutationPending}
                                      onChange={() => {
                                        if (question.isSolved) {
                                          unmarkSolvedMutation.mutate(question.id);
                                          return;
                                        }

                                        markSolvedMutation.mutate(question.id);
                                      }}
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
                                    <RevisionCell
                                      question={question}
                                      onComplete={(id) => completeRevisionMutation.mutate(id)}
                                      onUncomplete={(id) => uncompleteRevisionMutation.mutate(id)}
                                      onSyncRevision={(id) => syncRevisionMutation.mutate(id)}
                                      isExpanded={revisionViewQuestionId === question.id}
                                      onToggle={toggleRevisionView}
                                    />
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
      <SiteFooter />

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
