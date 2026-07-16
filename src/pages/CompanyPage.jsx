import { useCallback, useEffect, useMemo, useState } from 'react';
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
  LibraryBig,
  ArrowLeft,
  RefreshCw,
  Building,
  CheckCircle2,
  AlertCircle
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
  if (!open) return null;

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

const POPULAR_COMPANIES = [
  { name: 'Google', gradient: 'from-[#4285F4]/20 to-[#EA4335]/5', border: 'hover:border-[#4285F4]', color: '#4285F4', kicker: 'Search & Cloud Giant' },
  { name: 'Meta', gradient: 'from-[#0668E1]/20 to-[#00F2FE]/5', border: 'hover:border-[#0668E1]', color: '#0668E1', kicker: 'Social Infrastructure' },
  { name: 'Amazon', gradient: 'from-[#FF9900]/20 to-[#FF9900]/5', border: 'hover:border-[#FF9900]', color: '#FF9900', kicker: 'E-Commerce & AWS' },
  { name: 'Microsoft', gradient: 'from-[#F25022]/20 to-[#7FBA00]/5', border: 'hover:border-[#7FBA00]', color: '#7FBA00', kicker: 'Enterprise Software' },
  { name: 'Netflix', gradient: 'from-[#E50914]/20 to-[#B81D24]/5', border: 'hover:border-[#E50914]', color: '#E50914', kicker: 'Entertainment & Scale' },
  { name: 'Apple', gradient: 'from-[#555555]/20 to-[#AAAAAA]/5', border: 'hover:border-[#888888]', color: '#888888', kicker: 'Hardware & Ecosystem' },
  { name: 'Uber', gradient: 'from-[#222222]/40 to-[#000000]/40', border: 'hover:border-[#ffffff]/50', color: '#ffffff', kicker: 'Mobility & Logistics' },
  { name: 'Bloomberg', gradient: 'from-[#FF8C00]/20 to-[#FF8C00]/5', border: 'hover:border-[#FF8C00]', color: '#FF8C00', kicker: 'Financial Systems' },
  { name: 'Adobe', gradient: 'from-[#FF0000]/20 to-[#FF0000]/5', border: 'hover:border-[#FF0000]', color: '#FF0000', kicker: 'Creative Software' },
  { name: 'Atlassian', gradient: 'from-[#0052CC]/20 to-[#0052CC]/5', border: 'hover:border-[#0052CC]', color: '#0052CC', kicker: 'Collaboration Tools' },
  { name: 'ByteDance', gradient: 'from-[#00d2ff]/20 to-[#0066ff]/5', border: 'hover:border-[#0066ff]', color: '#0066ff', kicker: 'Short Video & AI' }
];

export default function CompanyPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companySearch, setCompanySearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [activeTopicName, setActiveTopicName] = useState('30 Days');
  const [customCompanyInput, setCustomCompanyInput] = useState('');
  const [isCustomFetching, setIsCustomFetching] = useState(false);

  const [revisionViewQuestionId, setRevisionViewQuestionId] = useState(null);
  const [notesQuestion, setNotesQuestion] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [logicCheckQuestion, setLogicCheckQuestion] = useState(null);

  const toggleRevisionView = (questionId) => {
    setRevisionViewQuestionId((prev) => (prev === questionId ? null : questionId));
  };

  // Queries
  const companiesQuery = useQuery({
    queryKey: ['company-sheets'],
    queryFn: async () => {
      const response = await apiGet('/sheets/companies');
      return response.data.sheets || [];
    },
  });

  const companyDetailsQuery = useQuery({
    queryKey: ['company-details', selectedCompany],
    enabled: Boolean(selectedCompany),
    queryFn: async () => {
      const response = await apiGet(`/sheets/companies/${selectedCompany}`);
      return response.data;
    },
  });

  const activeSheet = companyDetailsQuery.data?.sheet;
  const sheetId = activeSheet?.id;

  const questionIds = useMemo(
    () => companyDetailsQuery.data?.topics?.flatMap((topic) => topic.questions.map((question) => question.id)) || [],
    [companyDetailsQuery.data]
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
      const CHUNK_SIZE = 150;
      const chunks = [];
      for (let i = 0; i < questionIds.length; i += CHUNK_SIZE) {
        chunks.push(questionIds.slice(i, i + CHUNK_SIZE));
      }

      const queries = chunks.map(async (chunk) => {
        const { data, error } = await supabase
          .from('revision_schedule')
          .select('id, question_id, due_date, is_completed, revision_day')
          .eq('user_id', user.id)
          .in('question_id', chunk);

        if (error) throw error;
        return data ?? [];
      });

      const results = await Promise.all(queries);
      return results.flat().sort((a, b) => a.revision_day - b.revision_day);
    },
  });

  // Mutations
  const syncCompanyMutation = useMutation({
    mutationFn: async (companyName) => {
      const response = await apiPost(`/sheets/companies/${companyName}/sync`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Successfully synced company from GitHub!');
      queryClient.invalidateQueries({ queryKey: ['company-details', selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ['company-sheets'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to sync company questions.');
    }
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

        if (existingRow?.is_solved) return rows;

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
      toast.error(error.message || 'Could not mark question solved.');
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

        if (!existingRow?.is_solved) return rows;

        const nextRow = { ...existingRow, is_solved: false, solved_at: null };
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
      toast.error(error.message || 'Could not unmark solved.');
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

  const saveNotesMutation = useMutation({
    mutationFn: async ({ questionId, notes }) => {
      const { error } = await supabase.from('user_progress').upsert(
        { user_id: user.id, question_id: questionId, notes },
        { onConflict: 'user_id,question_id' }
      );
      if (error) throw error;
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

  // Handlers
  const handleCustomFetchSubmit = async (e) => {
    e.preventDefault();
    const company = customCompanyInput.trim();
    if (!company) return;

    setIsCustomFetching(true);
    const toastId = toast.loading(`Fetching ${company} questions from GitHub...`);

    try {
      const res = await apiPost(`/sheets/companies/${company}/sync`);
      toast.success(`Success! Seeded ${res.data.totalQuestions} questions for ${company}.`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['company-sheets'] });
      setSelectedCompany(company);
      setCustomCompanyInput('');
    } catch (err) {
      toast.error(err.message || `Failed to find company "${company}" in the repository. Check spelling!`, { id: toastId });
    } finally {
      setIsCustomFetching(false);
    }
  };

  const openNotes = (question) => {
    setNotesQuestion(question);
    setNotesDraft(question.notes || '');
  };

  const saveNotes = () => {
    if (!notesQuestion) return;
    saveNotesMutation.mutate({
      questionId: notesQuestion.id,
      notes: notesDraft.trim(),
    }, {
      onSuccess: () => setNotesQuestion(null)
    });
  };

  // Computations
  const syncedCompanies = companiesQuery.data || [];
  
  const popularGridItems = useMemo(() => {
    return POPULAR_COMPANIES.map(comp => {
      const dbMatch = syncedCompanies.find(sc => sc.name.toLowerCase() === comp.name.toLowerCase());
      return {
        ...comp,
        isSynced: Boolean(dbMatch),
        id: dbMatch?.id || null
      };
    });
  }, [syncedCompanies]);

  const customSyncedCompanies = useMemo(() => {
    return syncedCompanies.filter(sc => 
      !POPULAR_COMPANIES.some(pc => pc.name.toLowerCase() === sc.name.toLowerCase())
    );
  }, [syncedCompanies]);

  const filteredPopular = popularGridItems.filter(comp =>
    comp.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredCustom = customSyncedCompanies.filter(comp =>
    comp.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const progressByQuestion = useMemo(() => {
    return (progressQuery.data || []).reduce((acc, progress) => {
      acc[progress.question_id] = progress;
      return acc;
    }, {});
  }, [progressQuery.data]);

  const revisionByQuestion = useMemo(() => {
    return (revisionQuery.data || []).reduce((acc, revision) => {
      acc[revision.question_id] ||= [];
      acc[revision.question_id].push(revision);
      return acc;
    }, {});
  }, [revisionQuery.data]);

  // Selected company topics & questions filtering
  const companyTopics = useMemo(() => {
    const rawTopics = companyDetailsQuery.data?.topics || [];
    const searchVal = questionSearch.trim().toLowerCase();

    return rawTopics.map((topic) => {
      const questions = (topic.questions || []).map((question) => {
        const progress = progressByQuestion[question.id];
        const allRevisions = revisionByQuestion[question.id] || [];
        const pendingRevisions = allRevisions.filter((r) => !r.is_completed);

        const nextRevisionDue =
          pendingRevisions.length > 0
            ? pendingRevisions.sort((a, b) => a.due_date.localeCompare(b.due_date))[0].due_date
            : progress?.is_solved && progress?.solved_at
              ? new Date(
                  new Date(progress.solved_at).getTime() +
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
          nextRevisionDue,
        };
      });

      const filteredQuestions = questions.filter((q) =>
        q.title.toLowerCase().includes(searchVal)
      );

      return {
        ...topic,
        questions: filteredQuestions,
        totalQuestionsCount: questions.length,
        solvedQuestionsCount: questions.filter((q) => q.isSolved).length,
      };
    });
  }, [companyDetailsQuery.data, progressByQuestion, revisionByQuestion, questionSearch]);

  const activeTopic = companyTopics.find(t => t.name === activeTopicName) || companyTopics[0];

  const stats = useMemo(() => {
    if (!companyTopics.length) return { solvedCount: 0, totalCount: 0 };
    // Solve count and total count across "All" topic or the aggregate of all questions
    // Since "All" topic contains all questions, let's use the "All" topic or sum them up safely
    const allTopic = companyTopics.find(t => t.name === 'All');
    if (allTopic) {
      return {
        solvedCount: allTopic.solvedQuestionsCount,
        totalCount: allTopic.totalQuestionsCount
      };
    }
    const totalCount = companyTopics.reduce((acc, t) => acc + t.totalQuestionsCount, 0);
    const solvedCount = companyTopics.reduce((acc, t) => acc + t.solvedQuestionsCount, 0);
    return { solvedCount, totalCount };
  }, [companyTopics]);

  return (
    <>
      <main className="dashboard-shell" style={{ position: 'relative', minHeight: '100vh' }}>
        {/* Ambient background glows */}
        <div className="sheet-bg-glow-1" />
        <div className="sheet-bg-glow-2" />

        <style>{`
          .companies-layout {
            padding: 40px 0;
          }
          .companies-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 24px;
            margin-top: 32px;
          }
          .company-card {
            background: rgba(18, 18, 22, 0.45);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 24px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 180px;
          }
          .company-card:hover {
            transform: translateY(-5px);
            background: rgba(30, 30, 38, 0.65);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .company-logo-kicker {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #93939c;
            margin-bottom: 4px;
          }
          .company-card-title {
            font-size: 24px;
            font-weight: 700;
            color: #f2f2f4;
            margin-bottom: 12px;
          }
          .company-card-status {
            align-self: flex-start;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            color: #93939c;
            border: 1px solid rgba(255, 255, 255, 0.05);
            margin-top: auto;
          }
          .status-synced {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border-color: rgba(16, 185, 129, 0.2);
          }
          .custom-fetch-card {
            background: rgba(18, 18, 22, 0.3);
            border: 2px dashed rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 180px;
          }
          .custom-fetch-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .custom-fetch-label {
            font-size: 12px;
            font-weight: 500;
            color: #93939c;
          }
          .custom-fetch-input-group {
            display: flex;
            background: rgba(10, 10, 12, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            overflow: hidden;
            padding: 2px;
          }
          .custom-fetch-input {
            background: transparent;
            border: none;
            outline: none;
            color: #f2f2f4;
            padding: 8px 12px;
            font-size: 14px;
            flex-grow: 1;
            width: 100%;
          }
          .custom-fetch-btn {
            background: #d4a843;
            color: #0a0a0c;
            border: none;
            font-weight: 600;
            font-size: 12px;
            padding: 0 16px;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .custom-fetch-btn:hover {
            background: #e2bb59;
          }
          .custom-fetch-btn:disabled {
            background: rgba(212, 168, 67, 0.4);
            cursor: not-allowed;
          }
          .back-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
          }
          .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 8px 16px;
            color: #93939c;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .back-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #f2f2f4;
            transform: translateX(-2px);
          }
          .sync-spin {
            animation: spin 1.5s linear infinite;
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          .companies-section-title {
            font-size: 18px;
            font-weight: 600;
            color: #f2f2f4;
            margin-top: 40px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
        `}</style>

        <div className="dashboard-container">
          
          {/* Company Details View */}
          {selectedCompany ? (
            <div className="company-detail-view animate-fade-in">
              <div className="back-header">
                <button className="back-btn" onClick={() => setSelectedCompany(null)}>
                  <ArrowLeft size={16} />
                  <span>Back to Companies</span>
                </button>
              </div>

              {companyDetailsQuery.isLoading ? (
                <div className="ds-empty">
                  <div className="auth-loading-spinner" />
                  <p>Loading questions for {selectedCompany}...</p>
                </div>
              ) : companyDetailsQuery.isError ? (
                <div className="ds-empty ds-empty-error">
                  <p>Failed to load questions: {companyDetailsQuery.error.message}</p>
                </div>
              ) : (
                <>
                  {/* Hero Header */}
                  <div className="dh-hero-new">
                    <div className="dh-hero-left">
                      <h1 className="dh-title">{activeSheet?.name} Questions</h1>
                      <p className="dh-curation-credit">LeetCode tagged problems</p>
                      <p className="dh-subtitle">
                        Comprehensive collection of {activeSheet?.name} interview questions, categorized for efficient revision.
                      </p>
                    </div>

                    <div className="dh-hero-right">
                      {/* Circular Progress */}
                      <div className="dh-hero-card circular-card">
                        <div className="dh-circle-wrap">
                          <svg className="dh-circle-svg" width="90" height="90">
                            <defs>
                              <linearGradient id="company-circle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                              </linearGradient>
                            </defs>
                            <circle className="dh-circle-track" cx="45" cy="45" r="34" strokeWidth="5.5" />
                            <circle
                              className="dh-circle-fill"
                              cx="45"
                              cy="45"
                              r="34"
                              strokeWidth="5.5"
                              stroke="url(#company-circle-grad)"
                              strokeDasharray={2 * Math.PI * 34}
                              strokeDashoffset={2 * Math.PI * 34 - (stats.totalCount > 0 ? (stats.solvedCount / stats.totalCount) : 0) * 2 * Math.PI * 34}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="dh-circle-text">
                            <span className="percent-num">{stats.totalCount > 0 ? Math.round((stats.solvedCount / stats.totalCount) * 100) : 0}%</span>
                            <span className="percent-lbl">CLEARED</span>
                          </div>
                        </div>
                      </div>

                      {/* Fraction Solved */}
                      <div className="dh-hero-card fraction-card">
                        <div className="fraction-icon-wrap">
                          <LibraryBig size={20} className="fraction-icon" />
                        </div>
                        <div className="fraction-info-wrap">
                          <span className="fraction-lbl">SOLVED / TOTAL</span>
                          <span className="fraction-val">{stats.solvedCount}/{stats.totalCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sync Action & Timeframes */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 my-6">
                    {/* Timeframe Selector (Track Selector) */}
                    <div className="ts-shell" style={{ margin: 0 }}>
                      <div className="ts-list">
                        {companyTopics.map((topic) => {
                          const isActive = topic.name === activeTopicName;
                          return (
                            <button
                              key={topic.id}
                              className={`ts-item${isActive ? ' is-active' : ''}`}
                              type="button"
                              onClick={() => setActiveTopicName(topic.name)}
                            >
                              {topic.name}
                              <span className="ml-1 text-[11px] opacity-60">({topic.totalQuestionsCount})</span>
                              {isActive && <span className="ts-indicator" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Manual Sync Button */}
                    <button
                      className="auth-button"
                      style={{ padding: '8px 16px', fontSize: '13px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#f2f2f4' }}
                      type="button"
                      disabled={syncCompanyMutation.isPending}
                      onClick={() => syncCompanyMutation.mutate(selectedCompany)}
                    >
                      <RefreshCw size={14} className={syncCompanyMutation.isPending ? 'sync-spin' : ''} />
                      <span>{syncCompanyMutation.isPending ? 'Syncing...' : 'Sync with GitHub'}</span>
                    </button>
                  </div>

                  {/* Search Questions */}
                  <div className="ds-search-row">
                    <label className="ds-search">
                      <Search size={18} />
                      <input
                        type="text"
                        value={questionSearch}
                        onChange={(e) => setQuestionSearch(e.target.value)}
                        placeholder={`Search ${selectedCompany} problems...`}
                      />
                    </label>
                  </div>

                  {/* Questions List */}
                  {progressQuery.isLoading ? (
                    <div className="ds-empty">
                      <div className="auth-loading-spinner" />
                      <p>Loading your progress...</p>
                    </div>
                  ) : (
                    <div className="dashboard-main-content animate-fade-in">
                      <div className="ds-card shadow-inner">
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
                              {(activeTopic?.questions || []).map((question) => {
                                const difficulty = difficultyMeta[question.difficulty] || difficultyMeta.medium;
                                const noteCount = (question.notes || '').trim().length;
                                const isSolved = question.isSolved;

                                return (
                                  <tr key={question.id}>
                                    <td className="checkbox-column">
                                      <Checkbox
                                        checked={isSolved}
                                        disabled={markSolvedMutation.isPending || unmarkSolvedMutation.isPending}
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
                                        <Link to={`/question/${slugify(question.title)}`} className="ds-q-link">
                                          {question.title}
                                        </Link>
                                        <div className="ds-q-links">
                                          {question.leetcode_url && (
                                            <a href={question.leetcode_url} target="_blank" rel="noreferrer" className="ds-q-chip">
                                              <img src="https://leetcode.com/favicon.ico" alt="Leetcode" className="ds-q-favicon" />
                                              <span>Leetcode</span>
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
                              {(activeTopic?.questions || []).length === 0 ? (
                                <tr>
                                  <td colSpan={6}>
                                    <div className="ds-empty-row">No questions found in this timeframe matching search.</div>
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Company Grid Selection View */
            <div className="companies-layout animate-fade-in">
              <div className="dh-hero-new">
                <div className="dh-hero-left">
                  <h1 className="dh-title">Target Your Dream Company</h1>
                  <p className="dh-curation-credit">LeetCode Tags</p>
                  <p className="dh-subtitle">
                    Explore interview questions for top employers and get interview ready.
                  </p>
                </div>
              </div>

              {/* Search Grid filter */}
              <div className="ds-search-row" style={{ marginTop: '24px' }}>
                <label className="ds-search">
                  <Search size={18} />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Search companies..."
                  />
                </label>
              </div>

              {companiesQuery.isLoading ? (
                <div className="ds-empty">
                  <div className="auth-loading-spinner" />
                  <p>Loading companies list...</p>
                </div>
              ) : (
                <>
                  {/* Popular Grid list */}
                  <div className="companies-grid">
                    {filteredPopular.map((comp) => (
                      <div
                        key={comp.name}
                        className="company-card"
                        onClick={() => setSelectedCompany(comp.name)}
                      >
                        <div
                          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${comp.gradient} rounded-full filter blur-xl opacity-40 pointer-events-none`}
                        />
                        <div>
                          <p className="company-logo-kicker">{comp.kicker}</p>
                          <h3 className="company-card-title">{comp.name}</h3>
                        </div>
                        <div className={`company-card-status ${comp.isSynced ? 'status-synced' : ''}`}>
                          {comp.isSynced ? (
                            <>
                              <CheckCircle2 size={12} />
                              <span>Ready to practice</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} />
                              <span>Fetch from GitHub</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Custom Fetch Card */}
                    <div className="custom-fetch-card">
                      <div className="custom-fetch-form">
                        <span className="custom-fetch-label">Don't see your target company?</span>
                        <form onSubmit={handleCustomFetchSubmit} className="custom-fetch-input-group">
                          <input
                            type="text"
                            value={customCompanyInput}
                            onChange={(e) => setCustomCompanyInput(e.target.value)}
                            placeholder="e.g. Goldman Sachs"
                            className="custom-fetch-input"
                            disabled={isCustomFetching}
                          />
                          <button type="submit" className="custom-fetch-btn" disabled={isCustomFetching}>
                            {isCustomFetching ? 'Fetching...' : 'Fetch'}
                          </button>
                        </form>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          Case-sensitive. Must match a directory name in the repository.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sync status for custom added companies */}
                  {filteredCustom.length > 0 && (
                    <>
                      <h3 className="companies-section-title">
                        <Building size={18} />
                        <span>Custom Fetched Companies</span>
                      </h3>
                      <div className="companies-grid" style={{ marginTop: '16px' }}>
                        {filteredCustom.map((comp) => (
                          <div
                            key={comp.name}
                            className="company-card"
                            onClick={() => setSelectedCompany(comp.name)}
                          >
                            <div>
                              <p className="company-logo-kicker">Custom Fetched</p>
                              <h3 className="company-card-title">{comp.name}</h3>
                            </div>
                            <div className="company-card-status status-synced">
                              <CheckCircle2 size={12} />
                              <span>Ready to practice</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <SiteFooter />
      </main>

      {/* Modals */}
      <NotesModal
        open={Boolean(notesQuestion)}
        questionTitle={notesQuestion?.title}
        value={notesDraft}
        onChange={setNotesDraft}
        onClose={() => setNotesQuestion(null)}
        onSave={saveNotes}
        saving={saveNotesMutation.isPending}
      />

      <LogicCheckModal
        open={Boolean(logicCheckQuestion)}
        question={logicCheckQuestion}
        onClose={() => setLogicCheckQuestion(null)}
      />
    </>
  );
}
