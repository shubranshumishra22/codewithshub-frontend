import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  FilePenLine,
  Search,
  Save,
  X,
  Brain,
  ExternalLink,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { apiDelete, apiGet, apiPost } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';
import LogicCheckModal from '../components/LogicCheckModal';

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
  const [logicCheckQuestion, setLogicCheckQuestion] = useState(null);

  const toggleRevisionView = (questionId) => {
    setRevisionViewQuestionId((prev) => (prev === questionId ? null : questionId));
  };

  const sheetsQuery = useQuery({
    queryKey: ['sheets'],
    queryFn: async () => {
      const response = await apiGet('/sheets');
      return response.data.sheets || [];
    },
  });

  const allSheets = sheetsQuery.data || [];

  const [activeSheetId, setActiveSheetId] = useState(() => localStorage.getItem('activeSheetId') || null);
  const [activeSheetName, setActiveSheetName] = useState(() => localStorage.getItem('activeSheetName') || STRIVER_SHEET_NAME);

  useEffect(() => {
    if (allSheets.length > 0) {
      let currentSheet = allSheets.find((s) => s.id === activeSheetId || s.name === activeSheetName);
      if (!currentSheet) {
        currentSheet = allSheets.find((s) => s.name === STRIVER_SHEET_NAME) || allSheets[0];
      }
      if (currentSheet) {
        if (currentSheet.id !== activeSheetId || currentSheet.name !== activeSheetName) {
          setActiveSheetId(currentSheet.id);
          setActiveSheetName(currentSheet.name);
          localStorage.setItem('activeSheetId', currentSheet.id);
          localStorage.setItem('activeSheetName', currentSheet.name);
        }
      }
    }
  }, [allSheets, activeSheetId, activeSheetName]);

  const sheetId = activeSheetId || allSheets.find((s) => s.name === activeSheetName)?.id;

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

  const isLoading = sheetsQuery.isLoading || topicsQuery.isLoading || progressQuery.isLoading;
  const hasError = sheetsQuery.error || topicsQuery.error || progressQuery.error;

  return (
    <main
      style={{
        maxWidth: '960px',
        margin: '80px auto 40px',
        padding: '0 20px',
        background: 'transparent',
        color: 'var(--text-secondary)',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
      }}
    >
      {/* Zone 1 — Hero */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderBottom: '0.5px solid var(--border)',
          background: 'transparent',
          margin: 0,
        }}
      >
        {/* Left Column */}
        <div
          style={{
            padding: '28px',
            borderRight: '0.5px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Eyebrow Label */}
          <div
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
            }}
          >
            <span>{activeSheetName}</span>
            <span
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'var(--blue-500)',
                display: 'inline-block',
              }}
            />
            <span>Active</span>
          </div>
          {/* Solved Count Typographic Number */}
          <div
            style={{
              fontSize: '50px',
              fontWeight: 500,
              letterSpacing: '-2px',
              color: 'var(--text-primary)',
              lineHeight: '1.1',
            }}
          >
            {stats.solvedCount}
            <span
              style={{
                fontSize: '20px',
                fontWeight: 400,
                color: 'var(--text-muted)',
                letterSpacing: 'normal',
                marginLeft: '4px',
              }}
            >
              /{stats.totalCount}
            </span>
          </div>
          {/* Secondary Label */}
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: '8px',
              fontWeight: 400,
            }}
          >
            Problems solved in active quest map
          </div>
        </div>

        {/* Right Column */}
        <div
          style={{
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          {/* Completion Percentage */}
          <div
            style={{
              paddingBottom: '12px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: '1.2',
              }}
            >
              {stats.totalCount > 0 ? Math.round((stats.solvedCount / stats.totalCount) * 100) : 0}%
            </span>
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginTop: '4px',
                fontWeight: 500,
              }}
            >
              Completion
            </span>
          </div>

          {/* Number of Sheets Available */}
          <div
            style={{
              paddingBottom: '12px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: '1.2',
              }}
            >
              {allSheets.length}
            </span>
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginTop: '4px',
                fontWeight: 500,
              }}
            >
              Sheets Available
            </span>
          </div>

          {/* Leaderboard Rank */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: '1.2',
              }}
            >
              —
            </span>
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginTop: '4px',
                fontWeight: 500,
              }}
            >
              Leaderboard Rank
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2 — Sheet list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'transparent',
        }}
      >
        {/* Search Input Field */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '0.5px solid var(--border)',
            background: 'transparent',
          }}
        >
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '10px' }} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions across topics..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              width: '100%',
              padding: '4px 0',
              fontWeight: 400,
            }}
          />
        </div>

        {/* Sheet rows */}
        {allSheets.map((s) => {
          const isActive = s.id === activeSheetId;
          const getSheetTotal = (name) => {
            if (name.includes('Striver')) return 455;
            if (name.includes('Rising Brain')) return 100;
            if (name.includes('Coder Army')) return 67;
            if (name.includes('Neetcode')) return 150;
            if (name.includes('LeetCode')) return 149;
            return 0;
          };

          const totalQ = isActive ? stats.totalCount : getSheetTotal(s.name);
          const solvedQ = isActive ? stats.solvedCount : 0;
          const progressPercent = totalQ > 0 ? (solvedQ / totalQ) * 100 : 0;
          const domainTag = s.name.includes('SQL') ? 'SQL' : s.name.includes('Web') ? 'Web' : 'DSA';

          return (
            <div
              key={s.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderBottom: '0.5px solid var(--border)',
              }}
            >
              {/* Row Header */}
              <div
                onClick={() => {
                  if (s.id !== activeSheetId) {
                    setActiveSheetId(s.id);
                    setActiveSheetName(s.name);
                    localStorage.setItem('activeSheetId', s.id);
                    localStorage.setItem('activeSheetName', s.name);
                    toast.success(`Switched focus to: ${s.name}`);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 20px',
                  background: isActive ? 'var(--surface-1)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--blue-500)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                {/* 28px square icon container */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    border: '0.5px solid var(--border)',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                  }}
                >
                  <BookOpen size={14} color="var(--text-muted)" />
                </div>

                {/* Sheet name and domain tag */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {s.name}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 500,
                    }}
                  >
                    {domainTag}
                  </span>
                </div>

                {/* Inline progress bar and x/total count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '16px' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '2px',
                      background: 'var(--surface-2)',
                      borderRadius: '99px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        background: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontFamily: 'monospace',
                      fontWeight: 400,
                    }}
                  >
                    {solvedQ}/{totalQ}
                  </span>
                </div>

                {/* Chevron */}
                <ChevronDown
                  size={13}
                  style={{
                    transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>

              {/* Active Sheet Expanded Topics Accordion */}
              {isActive && (
                <div
                  style={{
                    background: 'var(--surface-2)',
                    padding: '20px',
                    borderTop: '0.5px solid var(--border)',
                  }}
                >
                  {isLoading ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '20px 0',
                      }}
                    >
                      <div className="auth-loading-spinner" />
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Loading your quest map...
                      </p>
                    </div>
                  ) : hasError ? (
                    <div style={{ color: 'red', fontSize: '13px', padding: '20px 0' }}>
                      {hasError.message || 'Failed to load sheet topics.'}
                    </div>
                  ) : (
                    <div className="topics-accordion" style={{ border: 'none', background: 'transparent' }}>
                      {topics.map((topic, index) => {
                        const isOpen = openTopicId === topic.id;
                        const totalCount = topic.questions.length;
                        const visibleQuestions = topic.filteredQuestions;

                        return (
                          <section
                            key={topic.id}
                            className={`topic-card ${isOpen ? 'is-open' : ''}`}
                            style={{
                              borderRadius: '0',
                              border: 'none',
                              borderBottom: '0.5px solid var(--border)',
                              background: 'transparent',
                              marginBottom: 0,
                              boxShadow: 'none',
                            }}
                          >
                            <button
                              className="topic-header"
                              type="button"
                              onClick={() => setOpenTopicId(isOpen ? null : topic.id)}
                              style={{
                                padding: '12px 0',
                                border: 'none',
                                background: 'transparent',
                                display: 'flex',
                                width: '100%',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div
                                className="topic-header-left"
                                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                              >
                                <div
                                  className="topic-xp-badge"
                                  style={{
                                    border: '0.5px solid var(--border)',
                                    borderRadius: '4px',
                                    background: 'var(--surface-1)',
                                    padding: '4px 8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: '1',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '8px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.1em',
                                      color: 'var(--text-muted)',
                                      fontWeight: 500,
                                    }}
                                  >
                                    Level
                                  </span>
                                  <strong
                                    style={{
                                      fontSize: '12px',
                                      color: 'var(--text-primary)',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {String(index + 1).padStart(2, '0')}
                                  </strong>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                  <h2
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      margin: 0,
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    {topic.name}
                                  </h2>
                                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                                    {visibleQuestions.length} question{visibleQuestions.length === 1 ? '' : 's'} shown
                                  </p>
                                </div>
                              </div>

                              <div
                                className="topic-header-right"
                                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                              >
                                <span
                                  className="topic-solved-badge"
                                  style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}
                                >
                                  {topic.solvedCount}/{totalCount} solved
                                </span>
                                <ChevronDown
                                  size={14}
                                  style={{
                                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                    color: 'var(--text-muted)',
                                  }}
                                />
                              </div>
                            </button>

                            <div
                              className="topic-body-shell"
                              style={{
                                gridTemplateRows: isOpen ? '1fr' : '0fr',
                                transition: 'grid-template-rows 0.2s ease',
                              }}
                            >
                              <div className="topic-body" style={{ overflow: 'hidden' }}>
                                <div
                                  className="question-table-wrap"
                                  style={{ border: 'none', background: 'transparent', margin: '8px 0 16px' }}
                                >
                                  <table
                                    className="question-table"
                                    style={{ width: '100%', borderCollapse: 'collapse' }}
                                  >
                                    <thead>
                                      <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                                        <th
                                          className="checkbox-column"
                                          style={{
                                            width: '48px',
                                            padding: '8px 0',
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            color: 'var(--text-muted)',
                                            fontWeight: 500,
                                            textAlign: 'center',
                                          }}
                                        >
                                          Done
                                        </th>
                                        <th
                                          style={{
                                            padding: '8px 12px',
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            color: 'var(--text-muted)',
                                            fontWeight: 500,
                                            textAlign: 'left',
                                          }}
                                        >
                                          Problem
                                        </th>
                                        <th
                                          style={{
                                            padding: '8px 12px',
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            color: 'var(--text-muted)',
                                            fontWeight: 500,
                                            textAlign: 'left',
                                          }}
                                        >
                                          Difficulty
                                        </th>
                                        <th
                                          style={{
                                            padding: '8px 12px',
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            color: 'var(--text-muted)',
                                            fontWeight: 500,
                                            textAlign: 'left',
                                          }}
                                        >
                                          Notes
                                        </th>
                                        <th
                                          style={{
                                            padding: '8px 12px',
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            color: 'var(--text-muted)',
                                            fontWeight: 500,
                                            textAlign: 'left',
                                          }}
                                        >
                                          Logic Check
                                        </th>
                                        <th
                                          style={{
                                            padding: '8px 12px',
                                            fontSize: '11px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            color: 'var(--text-muted)',
                                            fontWeight: 500,
                                            textAlign: 'left',
                                          }}
                                        >
                                          Revision
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {visibleQuestions.map((question) => {
                                        const difficulty = difficultyMeta[question.difficulty] || difficultyMeta.medium;
                                        const noteCount = (question.notes || '').trim().length;
                                        const isSolved = question.isSolved;

                                        return (
                                          <tr
                                            key={question.id}
                                            style={{
                                              borderBottom: '0.5px solid var(--border)',
                                              background: isSolved ? 'rgba(255,255,255,0.01)' : 'transparent',
                                              opacity: isSolved ? 0.85 : 1,
                                            }}
                                          >
                                            <td className="checkbox-column" style={{ padding: '10px 0', textAlign: 'center' }}>
                                              <Checkbox
                                                checked={isSolved}
                                                disabled={progressMutationPending}
                                                onChange={() => {
                                                  if (isSolved) {
                                                    unmarkSolvedMutation.mutate(question.id);
                                                  } else {
                                                    markSolvedMutation.mutate(question.id);
                                                  }
                                                }}
                                              />
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <Link
                                                  to={`/question/${slugify(question.title)}`}
                                                  style={{ fontWeight: 500, color: 'var(--text-primary)' }}
                                                >
                                                  {question.title}
                                                </Link>
                                                <div
                                                  style={{
                                                    display: 'flex',
                                                    gap: '8px',
                                                    fontSize: '11px',
                                                    marginTop: '2px',
                                                    flexWrap: 'wrap',
                                                  }}
                                                >
                                                  {question.leetcode_url ? (
                                                    <a
                                                      href={question.leetcode_url}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        color: 'var(--text-secondary)',
                                                        background: 'var(--surface-1)',
                                                        border: '0.5px solid var(--border)',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 400,
                                                        transition: 'border-color 0.2s ease, background 0.2s ease',
                                                      }}
                                                      onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                                                        e.currentTarget.style.background = 'var(--surface-2)';
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.background = 'var(--surface-1)';
                                                      }}
                                                    >
                                                      <img
                                                        src="https://leetcode.com/favicon.ico"
                                                        alt="Leetcode"
                                                        style={{ width: '10px', height: '10px', objectFit: 'contain' }}
                                                      />
                                                      <span>Leetcode</span>
                                                    </a>
                                                  ) : (
                                                    <a
                                                      href={`https://www.geeksforgeeks.org/problems/${slugify(question.title)}`}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        color: 'var(--text-secondary)',
                                                        background: 'var(--surface-1)',
                                                        border: '0.5px solid var(--border)',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 400,
                                                        transition: 'border-color 0.2s ease, background 0.2s ease',
                                                      }}
                                                      onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                                                        e.currentTarget.style.background = 'var(--surface-2)';
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.background = 'var(--surface-1)';
                                                      }}
                                                    >
                                                      <img
                                                        src="https://www.geeksforgeeks.org/favicon.ico"
                                                        alt="GFG"
                                                        style={{ width: '10px', height: '10px', objectFit: 'contain' }}
                                                      />
                                                      <span>GFG</span>
                                                    </a>
                                                  )}

                                                  {question.video_url && (
                                                    <a
                                                      href={question.video_url}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        color: '#ff4b4b',
                                                        background: 'var(--surface-1)',
                                                        border: '0.5px solid var(--border)',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 400,
                                                        transition: 'border-color 0.2s ease, background 0.2s ease',
                                                      }}
                                                      onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(255,75,75,0.4)';
                                                        e.currentTarget.style.background = 'rgba(255,75,75,0.05)';
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.background = 'var(--surface-1)';
                                                      }}
                                                    >
                                                      <Play size={10} fill="#ff4b4b" color="#ff4b4b" />
                                                      <span>Video</span>
                                                    </a>
                                                  )}
                                                </div>
                                              </div>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                              <span
                                                style={{
                                                  fontSize: '11px',
                                                  padding: '2px 6px',
                                                  border: '0.5px solid var(--border)',
                                                  borderRadius: '3px',
                                                  color: 'var(--text-secondary)',
                                                  textTransform: 'capitalize',
                                                  fontWeight: 400,
                                                }}
                                              >
                                                {difficulty.label}
                                              </span>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                              <button
                                                type="button"
                                                onClick={() => openNotes(question)}
                                                style={{
                                                  background: 'transparent',
                                                  border: 'none',
                                                  cursor: 'pointer',
                                                  color: 'var(--text-secondary)',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '4px',
                                                  fontSize: '11px',
                                                  padding: 0,
                                                  fontWeight: 400,
                                                }}
                                              >
                                                <FilePenLine size={12} color="var(--text-muted)" />
                                                <span>{noteCount > 0 ? 'Edit' : 'Add'}</span>
                                              </button>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                              <button
                                                type="button"
                                                onClick={() => setLogicCheckQuestion(question)}
                                                style={{
                                                  background: 'transparent',
                                                  border: 'none',
                                                  cursor: 'pointer',
                                                  color: 'var(--text-secondary)',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '4px',
                                                  fontSize: '11px',
                                                  padding: 0,
                                                  fontWeight: 400,
                                                }}
                                              >
                                                <Brain size={12} color="var(--text-muted)" />
                                                <span>{isSolved ? 'Verify' : 'Unlock'}</span>
                                              </button>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                              <RevisionCell
                                                question={question}
                                                onComplete={(revId) => completeRevisionMutation.mutate(revId)}
                                                onUncomplete={(revId) => uncompleteRevisionMutation.mutate(revId)}
                                                onSyncRevision={(qId) => syncRevisionMutation.mutate(qId)}
                                                isExpanded={revisionViewQuestionId === question.id}
                                                onToggle={toggleRevisionView}
                                              />
                                            </td>
                                          </tr>
                                        );
                                      })}
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
                </div>
              )}
            </div>
          );
        })}
      </div>

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

      <LogicCheckModal
        open={Boolean(logicCheckQuestion)}
        question={logicCheckQuestion}
        onClose={() => setLogicCheckQuestion(null)}
      />
    </main>
  );
}
