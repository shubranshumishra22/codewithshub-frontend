import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  Flame,
  LibraryBig,
  Sparkles,
  Trophy,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  startOfDay,
  subMonths,
} from 'date-fns';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import useCountUp from '../hooks/useCountUp';
import SiteFooter from '../components/SiteFooter';

const STRIVER_SHEET_NAME = 'Striver A-Z';
const DIFFICULTY_COLORS = {
  easy: '#d4d4d4',
  medium: '#737373',
  hard: '#111214',
};

const heatmapColors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

function StatCard({ icon, label, value, suffix = '' }) {
  return (
    <article className="progress-stat-card">
      <div className="progress-stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>
          {value}
          {suffix}
        </strong>
      </div>
    </article>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="progress-section-header">
      <div className="progress-section-title">
        <Sparkles size={16} />
        <span>{title}</span>
      </div>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

function CircularProgressRing({ percentage }) {
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-shell">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="progress-ring-track"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="progress-ring-value"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke="#e8eaed"
        />
      </svg>
      <div className="progress-ring-center">
        <strong>{Math.round(progress)}%</strong>
        <span>Cleared</span>
      </div>
    </div>
  );
}

function Heatmap({ activityMap }) {
  const endDate = new Date();
  const startDate = startOfWeek(subMonths(endDate, 6), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const maxActivity = Math.max(1, ...days.map((day) => activityMap[format(day, 'yyyy-MM-dd')] || 0));

  return (
    <div className="heatmap-card">
      <div className="heatmap-grid">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const value = activityMap[key] || 0;
          const intensity = Math.min(Math.round((value / maxActivity) * 4), 4);

          return (
            <div
              key={key}
              className={`heatmap-cell heatmap-level-${intensity}`}
              title={`${format(day, 'dd MMM yyyy')}: ${value} solved`}
            />
          );
        })}
      </div>
      <div className="heatmap-axis">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        {heatmapColors.map((color) => (
          <i key={color} style={{ background: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const { user } = useAuth();

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
    queryKey: ['progress-topics', sheetId],
    enabled: Boolean(sheetId),
    queryFn: async () => {
      const response = await apiGet(`/sheets/${sheetId}/topics`);
      return response.data.topics;
    },
  });

  const progressQuery = useQuery({
    queryKey: ['progress-rows', sheetId],
    enabled: Boolean(sheetId),
    queryFn: async () => {
      const response = await apiGet(`/progress/${sheetId}`);
      return response.data.progress;
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['progress-settings'],
    queryFn: async () => {
      const response = await apiGet('/user/settings');
      return response.data.profile;
    },
  });

  const topics = topicsQuery.data || [];
  const progressRows = progressQuery.data || [];
  const profile = settingsQuery.data || null;

  const solvedRows = useMemo(
    () => progressRows.filter((row) => row.is_solved),
    [progressRows]
  );

  const solvedById = useMemo(
    () => new Map(solvedRows.map((row) => [row.question_id, row])),
    [solvedRows]
  );

  const topicStats = useMemo(() => {
    return topics.map((topic) => {
      const solvedCount = topic.questions.filter((question) => solvedById.has(question.id)).length;
      const totalCount = topic.questions.length;
      const percentage = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

      return {
        id: topic.id,
        name: topic.name,
        solvedCount,
        totalCount,
        percentage,
      };
    });
  }, [solvedById, topics]);

  const totalQuestions = topics.reduce((sum, topic) => sum + topic.questions.length, 0);
  const totalSolved = solvedRows.length;
  const solvedToday = solvedRows.filter((row) => isSameDay(parseISO(row.solved_at), new Date())).length;
  const streakCount = profile?.streak_count || 0;
  const completionPercentage = totalQuestions > 0 ? (totalSolved / totalQuestions) * 100 : 0;

  const easySolved = solvedRows.filter((row) => row.difficulty === 'easy').length;
  const mediumSolved = solvedRows.filter((row) => row.difficulty === 'medium').length;
  const hardSolved = solvedRows.filter((row) => row.difficulty === 'hard').length;

  const chartData = [
    { name: 'Easy', value: easySolved, color: DIFFICULTY_COLORS.easy },
    { name: 'Medium', value: mediumSolved, color: DIFFICULTY_COLORS.medium },
    { name: 'Hard', value: hardSolved, color: DIFFICULTY_COLORS.hard },
  ].filter((item) => item.value > 0);

  const activityMap = useMemo(() => {
    return solvedRows.reduce((accumulator, row) => {
      const key = format(startOfDay(parseISO(row.solved_at)), 'yyyy-MM-dd');
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
  }, [solvedRows]);

  const ringAnimationValue = useCountUp(Math.round(completionPercentage));
  const animatedSolved = useCountUp(totalSolved);
  const animatedTotal = useCountUp(totalQuestions);
  const animatedStreak = useCountUp(streakCount);
  const animatedToday = useCountUp(solvedToday);

  const isLoading = sheetsQuery.isLoading || topicsQuery.isLoading || progressQuery.isLoading || settingsQuery.isLoading;
  const hasError = sheetsQuery.error || topicsQuery.error || progressQuery.error || settingsQuery.error;

  return (
    <main className="progress-shell">
      <div className="progress-particles" />
      <section className="progress-card auth-entrance">
        <div className="progress-hero">
          <div>
            <div className="progress-kicker" style={{ cursor: 'pointer' }}>
              <Trophy size={16} />
              <select
                value={activeSheetId || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedSheet = allSheets.find((s) => s.id === selectedId);
                  if (selectedSheet) {
                    setActiveSheetId(selectedId);
                    setActiveSheetName(selectedSheet.name);
                    localStorage.setItem('activeSheetId', selectedId);
                    localStorage.setItem('activeSheetName', selectedSheet.name);
                    toast.success(`Switched focus to: ${selectedSheet.name}`);
                  }
                }}
              >
                {allSheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </div>
            <h1>Progress Dashboard</h1>
            <p>
              Track your {activeSheetName} journey with live stats, topic mastery, revision heat, and difficulty split.
            </p>
          </div>
          <Link className="progress-back-button" to="/">
            <ArrowLeft size={16} />
            Back to Sheet
          </Link>
        </div>

        {isLoading ? (
          <div className="progress-loading-card">Loading your quest logs...</div>
        ) : hasError ? (
          <div className="progress-error-card">
            {(hasError && hasError.message) || 'Failed to load progress data.'}
          </div>
        ) : (
          <>
            <section className="progress-overall-grid">
              <article className="progress-ring-card">
                <CircularProgressRing percentage={ringAnimationValue} />
              </article>

              <div className="progress-stat-grid">
                <StatCard
                  icon={<LibraryBig size={18} />}
                  label="Solved / Total"
                  value={`${animatedSolved}/${animatedTotal}`}
                />
                <StatCard
                  icon={<Flame size={18} />}
                  label="Current Streak"
                  value={animatedStreak}
                  suffix=" 🔥"
                />
                <StatCard
                  icon={<Sparkles size={18} />}
                  label="Solved Today"
                  value={animatedToday}
                />
              </div>
            </section>

            <section className="progress-panel">
              <SectionHeader
                title="Topic Breakdown"
                subtitle={`Completion percentage for each topic in the ${activeSheetName} sheet.`}
              />
              <div className="topic-bars">
                {topicStats.map((topic) => (
                  <article key={topic.id} className="topic-bar-item">
                    <div className="topic-bar-labels">
                      <span>{topic.name}</span>
                      <strong>
                        {topic.solvedCount}/{topic.totalCount}
                      </strong>
                    </div>
                    <div className="topic-bar-track">
                      <div
                        className="topic-bar-fill"
                        style={{
                          width: `${topic.percentage}%`,
                          background: '#e8eaed',
                        }}
                      />
                    </div>
                    <div className="topic-bar-percent">{topic.percentage}%</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="progress-panel">
              <SectionHeader
                title="Activity Heatmap"
                subtitle="Your last 6 months of solves, based on solved_at timestamps."
              />
              <Heatmap activityMap={activityMap} />
            </section>

            <section className="progress-panel">
              <SectionHeader
                title="Difficulty Breakdown"
                subtitle="Solved questions grouped by difficulty."
              />
              <div className="donut-layout">
                <div className="donut-card">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={chartData.length > 0 ? chartData : [{ name: 'No Data', value: 1, color: '#d4d4d4' }]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={84}
                        outerRadius={118}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {(chartData.length > 0 ? chartData : [{ color: '#d4d4d4' }]).map((entry, index) => (
                          <Cell key={`slice-${entry.name}-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#1c1e21',
                          border: '0.5px solid #242629',
                          borderRadius: '12px',
                          color: '#e8eaed',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="difficulty-summary">
                  <article>
                    <span>Easy</span>
                    <strong>{easySolved}</strong>
                  </article>
                  <article>
                    <span>Medium</span>
                    <strong>{mediumSolved}</strong>
                  </article>
                  <article>
                    <span>Hard</span>
                    <strong>{hardSolved}</strong>
                  </article>
                </div>
              </div>
            </section>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
