import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  FilePenLine,
  Search,
  Save,
  X,
  Brain,
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

const sheetIconMap = {
  'Striver A-Z': 'ti-list-check',
  'Striver A–Z': 'ti-list-check',
  'Rising Brain Sheet': 'ti-brain',
  'Coder Army 180 Days': 'ti-calendar',
  'Neetcode 150': 'ti-layout-grid',
  'LeetCode Top Interview': 'ti-briefcase',
};

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
  
  const [hoveredSidebarId, setHoveredSidebarId] = useState(null);
  const [hoveredStepId, setHoveredStepId] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

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

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 220;
  });
  const [isDragging, setIsDragging] = useState(false);
  const MIN_SIDEBAR = 180;
  const MAX_SIDEBAR = 400;

  useEffect(() => {
    localStorage.setItem('sidebarWidth', String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleSidebarResize = useCallback((e) => {
    if (isSidebarCollapsed) {
      return;
    }

    const startX = e.clientX;
    const startWidth = sidebarWidth;
    setIsDragging(true);

    const onMove = (e) => {
      const w = startWidth + (e.clientX - startX);
      setSidebarWidth(Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, w)));
    };

    const onUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [isSidebarCollapsed, sidebarWidth]);

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

  const switchSheet = (s) => {
    if (s.id !== activeSheetId) {
      setActiveSheetId(s.id);
      setActiveSheetName(s.name);
      localStorage.setItem('activeSheetId', s.id);
      localStorage.setItem('activeSheetName', s.name);
      toast.success(`Switched focus to: ${s.name}`);
    }
  };

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        {/* ── Hero ── */}
        <div className="dh-hero">
          <h1 className="dh-title">{activeSheetName}</h1>
          <p className="dh-subtitle">Master data structures and algorithms one pattern at a time.</p>
          <div className="dh-meta">
            <span className="dh-count">{stats.solvedCount} solved</span>
            <span className="dh-divider">·</span>
            <span className="dh-count">{stats.totalCount} total problems</span>
          </div>
          <div className="dh-track">
            <div className="dh-track-fill" style={{ width: `${stats.totalCount > 0 ? (stats.solvedCount / stats.totalCount) * 100 : 0}%` }} />
          </div>
        </div>

        {/* ── Track Selector ── */}
        <div className="ts-shell">
          <div className="ts-list">
            {allSheets.map((s) => {
              const isActive = s.id === activeSheetId;
              return (
                <button
                  key={s.id}
                  className={`ts-item${isActive ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => switchSheet(s)}
                >
                  {s.name}
                  {isActive && <span className="ts-indicator" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Search ── */}
        <div className="ds-search-row">
          <label className="ds-search">
            <Search size={18} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search problems..."
            />
          </label>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="ds-empty">
            <div className="auth-loading-spinner" />
            <p>Loading your quest map...</p>
          </div>
        ) : hasError ? (
          <div className="ds-empty ds-empty-error">
            <p>{hasError.message || 'Failed to load the DSA sheet.'}</p>
          </div>
        ) : (
          <div className="ds-section-list">
            {topics.map((topic, index) => {
              const isOpen = openTopicId === topic.id;
              const totalCount = topic.questions.length;
              const visibleQuestions = topic.filteredQuestions;
              const topicProgress = totalCount > 0 ? (topic.solvedCount / totalCount) * 100 : 0;

              return (
                <section key={topic.id} className={`ds-section${isOpen ? ' is-open' : ''}`}>
                  <button
                    className="ds-section-row"
                    type="button"
                    onClick={() => setOpenTopicId(isOpen ? null : topic.id)}
                  >
                    <span className="ds-section-num">{String(index + 1).padStart(2, '0')}</span>
                    <div className="ds-section-info">
                      <span className="ds-section-name">{topic.name}</span>
                      <span className="ds-section-desc">Foundational concepts · Core patterns · Key techniques</span>
                    </div>
                    <span className="ds-section-progress">{topic.solvedCount} / {totalCount}</span>
                    <span className="ds-section-bar">
                      <span style={{ width: `${topicProgress}%` }} />
                    </span>
                    <ChevronDown size={16} className="ds-section-chevron" />
                  </button>

                  <div className="ds-section-body-shell" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                    <div className="ds-section-body">
                      <div className="ds-table-wrap">
                        <table className="ds-table">
                          <thead>
                            <tr>
                              <th className="checkbox-column">Done</th>
                              <th>Problem</th>
                              <th>Difficulty</th>
                              <th>Notes</th>
                              <th>Logic Check</th>
                              <th>Revision</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleQuestions.map((question) => {
                              const difficulty = difficultyMeta[question.difficulty] || difficultyMeta.medium;
                              const noteCount = (question.notes || '').trim().length;
                              const isSolved = question.isSolved;

                              return (
                                <tr key={question.id}>
                                  <td className="checkbox-column">
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
                                  <td>
                                    <div className="ds-q-group">
                                      <Link
                                        to={`/question/${slugify(question.title)}`}
                                        className="ds-q-link"
                                      >
                                        {question.title}
                                      </Link>
                                      <div className="ds-q-links">
                                        {question.leetcode_url ? (
                                          <a href={question.leetcode_url} target="_blank" rel="noreferrer" className="ds-q-chip">
                                            <img src="https://leetcode.com/favicon.ico" alt="Leetcode" className="ds-q-favicon" />
                                            <span>Leetcode</span>
                                          </a>
                                        ) : (
                                          <a href={`https://www.geeksforgeeks.org/problems/${slugify(question.title)}`} target="_blank" rel="noreferrer" className="ds-q-chip">
                                            <img src="https://www.geeksforgeeks.org/favicon.ico" alt="GFG" className="ds-q-favicon" />
                                            <span>GFG</span>
                                          </a>
                                        )}
                                        {question.video_url && (
                                          <a href={question.video_url} target="_blank" rel="noreferrer" className="ds-q-chip ds-q-chip-video">
                                            <Play size={10} />
                                            <span>Video</span>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`ds-diff-badge ${difficulty.className}`}>
                                      {difficulty.label}
                                    </span>
                                  </td>
                                  <td>
                                    <button className="ds-q-btn" type="button" onClick={() => openNotes(question)}>
                                      <FilePenLine size={12} />
                                      <span>{noteCount > 0 ? 'Edit' : 'Add'}</span>
                                    </button>
                                  </td>
                                  <td>
                                    <button className="ds-q-btn" type="button" onClick={() => setLogicCheckQuestion(question)}>
                                      <Brain size={12} />
                                      <span>{isSolved ? 'Verify' : 'Unlock'}</span>
                                    </button>
                                  </td>
                                  <td>
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
                            {visibleQuestions.length === 0 ? (
                              <tr>
                                <td colSpan={6}>
                                  <div className="ds-empty-row">No questions match your search.</div>
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

        <SiteFooter />
      </div>

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
