import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';

const commandDelay = 400;
const outputDelay = 55;

const formatDateTitle = () =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayKey = dateKey(new Date());
const tomorrowKey = dateKey(new Date(Date.now() + 24 * 60 * 60 * 1000));

const getQuestionTitle = (revision) =>
  revision.question?.title || `Question ${revision.question_id?.slice(0, 8) || ''}`.trim();

export default function RevisionTerminal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  const todayQuery = useQuery({
    queryKey: ['revision-terminal-today', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const response = await apiGet('/revision/today');
      return response.data.revisions || [];
    },
  });

  const upcomingQuery = useQuery({
    queryKey: ['revision-terminal-upcoming', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const response = await apiGet('/revision/upcoming');
      return response.data.revisions || [];
    },
  });

  const revisionGroups = useMemo(() => {
    const upcoming = upcomingQuery.data || [];
    const today = todayQuery.data || [];
    const todayIds = new Set(today.map((revision) => revision.id));
    const tomorrow = upcoming.filter((revision) => revision.due_date === tomorrowKey);
    const later = upcoming.filter(
      (revision) => revision.due_date !== todayKey && revision.due_date !== tomorrowKey && !todayIds.has(revision.id)
    );

    return { today, tomorrow, later };
  }, [todayQuery.data, upcomingQuery.data]);

  const terminalLines = useMemo(() => {
    const lines = [
      { type: 'command', text: 'revision --today' },
      ...(revisionGroups.today.length > 0
        ? revisionGroups.today.map((revision) => ({
            type: 'today',
            text: `due today  ${getQuestionTitle(revision)}`,
          }))
        : [{ type: 'dim', text: 'no due-today revisions' }]),
      { type: 'command', text: 'revision --tomorrow' },
      ...(revisionGroups.tomorrow.length > 0
        ? revisionGroups.tomorrow.map((revision) => ({
            type: 'tomorrow',
            text: `tomorrow   ${getQuestionTitle(revision)}`,
          }))
        : [{ type: 'dim', text: 'no due-tomorrow revisions' }]),
      { type: 'command', text: 'revision --upcoming-count' },
      {
        type: 'dim',
        text: `${revisionGroups.later.length} upcoming revision${revisionGroups.later.length === 1 ? '' : 's'} after tomorrow`,
      },
    ];

    if (todayQuery.isLoading || upcomingQuery.isLoading) {
      return [
        { type: 'command', text: 'revision --sync' },
        { type: 'dim', text: 'loading revision queue...' },
      ];
    }

    if (todayQuery.error || upcomingQuery.error) {
      return [
        { type: 'command', text: 'revision --sync' },
        { type: 'dim', text: 'unable to load revision queue' },
      ];
    }

    return lines;
  }, [revisionGroups, todayQuery.error, todayQuery.isLoading, upcomingQuery.error, upcomingQuery.isLoading]);

  useEffect(() => {
    if (!open) {
      setVisibleCount(0);
      return undefined;
    }

    let elapsed = 0;
    const timeouts = terminalLines.map((line, index) => {
      elapsed += line.type === 'command' ? commandDelay : outputDelay;

      return setTimeout(() => {
        setVisibleCount(index + 1);
      }, elapsed);
    });

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [open, terminalLines]);

  if (!user) {
    return null;
  }

  const dueTodayCount = revisionGroups.today.length;

  return (
    <div className="revision-terminal-shell">
      {open ? (
        <section className="revision-terminal-panel" aria-label="Revision terminal">
          <div className="revision-terminal-topbar">
            <div className="revision-terminal-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <span>revision — {formatDateTitle()}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close revision terminal">
              close
            </button>
          </div>

          <div className="revision-terminal-body">
            {terminalLines.slice(0, visibleCount).map((line, index) => (
              <div key={`${line.type}-${index}`} className={`revision-terminal-line is-${line.type}`}>
                {line.type === 'command' ? <span className="revision-terminal-prompt">$ </span> : null}
                <span>{line.text}</span>
              </div>
            ))}
            <span className="revision-terminal-cursor" />
          </div>
        </section>
      ) : null}

      <button
        className="revision-terminal-orb"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open revision terminal"
      >
        <span className="revision-terminal-orb-prompt">$</span>
        <span className="revision-terminal-orb-count">{dueTodayCount}</span>
      </button>
    </div>
  );
}
