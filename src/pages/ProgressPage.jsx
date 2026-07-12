import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Flame,
  LibraryBig,
  Sparkles,
  Trophy,
  ChevronDown,
  Zap,
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
import { motion } from 'framer-motion';
import { apiGet } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import useCountUp from '../hooks/useCountUp';
import SiteFooter from '../components/SiteFooter';

const STRIVER_SHEET_NAME = 'Quest Sheet';
const DIFFICULTY_COLORS = {
  easy: '#10b981',   // emerald-500
  medium: '#f59e0b', // amber-500
  hard: '#ef4444',   // rose-500
};

const heatmapColors = ['#161b22', '#3c1f5c', '#5e2d8a', '#8a43cf', '#b162ff'];

function StatCard({ icon, label, value, suffix = '', delay = 0 }) {
  return (
    <motion.article
      className="progress-stat-card-new"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -3, scale: 1.02 }}
    >
      <div className="progress-stat-icon-new">{icon}</div>
      <div className="progress-stat-info">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">
          {value}
          {suffix}
        </strong>
      </div>
    </motion.article>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="progress-section-header-new">
      <div className="progress-section-title-new">
        <Sparkles size={16} className="sparkle-icon" />
        <h3>{title}</h3>
      </div>
      {subtitle ? <p className="progress-section-subtitle">{subtitle}</p> : null}
    </div>
  );
}

function CircularProgressRing({ percentage }) {
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-shell-new">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="progress-ring-track-new"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="progress-ring-value-new"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke="url(#ring-gradient)"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="progress-ring-center-new">
        <strong className="progress-ring-percent">{Math.round(progress)}%</strong>
        <span className="progress-ring-label">Cleared</span>
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
    <div className="heatmap-card-new">
      <div className="heatmap-grid-new">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const value = activityMap[key] || 0;
          const intensity = Math.min(Math.round((value / maxActivity) * 4), 4);

          return (
            <div
              key={key}
              className={`heatmap-cell-new heatmap-level-${intensity}`}
              title={`${format(day, 'dd MMM yyyy')}: ${value} solved`}
            />
          );
        })}
      </div>
      <div className="heatmap-axis-new">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>
      <div className="heatmap-legend-new">
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
    <>
    <main className="progress-shell">
      {/* Background glowing gradients */}
      <div className="progress-bg-glow-1" />
      <div className="progress-bg-glow-2" />

      <section className="progress-card-new auth-entrance">
        {/* Header section */}
        <div className="progress-header-section">
          
          <h1>Progress Dashboard</h1>
          <p>
            Track your {activeSheetName} journey with live stats, topic mastery, revision heat, and difficulty split.
          </p>

          {/* Sheet Selector Dropdown styled */}
          {allSheets.length > 0 && (
            <div className="progress-sheet-switcher">
              <Trophy size={14} className="trophy-icon" />
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
              <ChevronDown size={14} className="chevron-icon" />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="progress-loading-card-new">
            <div className="loading-spinner-new" />
            <p>Loading your quest logs...</p>
          </div>
        ) : hasError ? (
          <div className="progress-error-card-new">
            {(hasError && hasError.message) || 'Failed to load progress data.'}
          </div>
        ) : (
          <div className="progress-content-wrap">
            {/* Overall Ring + Stat Cards Hero section */}
            <section className="progress-overall-grid-new">
              <div className="progress-ring-card-new">
                <CircularProgressRing percentage={ringAnimationValue} />
              </div>

              <div className="progress-stat-grid-new">
                <StatCard
                  icon={<LibraryBig size={20} />}
                  label="Solved / Total"
                  value={`${animatedSolved}/${animatedTotal}`}
                  delay={0.05}
                />
                <StatCard
                  icon={<Flame size={20} />}
                  label="Current Streak"
                  value={animatedStreak}
                  suffix=" 🔥"
                  delay={0.1}
                />
                <StatCard
                  icon={<Zap size={20} />}
                  label="Solved Today"
                  value={animatedToday}
                  delay={0.15}
                />
              </div>
            </section>

            {/* Panels Section Grid */}
            <div className="progress-panels-grid">
              
              {/* Left Panel: Topic Breakdown */}
              <section className="progress-panel-new topic-breakdown-panel">
                <SectionHeader
                  title="Topic Breakdown"
                  subtitle={`Completion percentage for each topic in the ${activeSheetName} sheet.`}
                />
                
                <div className="topic-bars-grid">
                  {topicStats.map((topic) => {
                    const isCompleted = topic.percentage === 100;
                    return (
                      <div key={topic.id} className={`topic-bar-card ${isCompleted ? 'is-completed' : ''}`}>
                        <div className="topic-bar-header">
                          <div className="topic-title-area">
                            <span className="topic-name">{topic.name}</span>
                            {isCompleted && (
                              <span className="completed-check-tag" title="Topic fully cleared!">
                                <Sparkles size={11} className="completed-sparkle" />
                                <span>Completed</span>
                              </span>
                            )}
                          </div>
                          <span className="topic-solved-count">
                            {topic.solvedCount} / {topic.totalCount}
                          </span>
                        </div>
                        <div className="topic-bar-track-new">
                          <div
                            className={`topic-bar-fill-new ${isCompleted ? 'fill-gradient-completed' : 'fill-gradient-active'}`}
                            style={{ width: `${topic.percentage}%` }}
                          />
                        </div>
                        <div className="topic-bar-footer">
                          <span className="percentage-text">{topic.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Right Panel: Heatmap & Difficulty breakdown */}
              <div className="progress-right-panels-wrap">
                
                {/* Activity Heatmap Panel */}
                <section className="progress-panel-new">
                  <SectionHeader
                    title="Activity Heatmap"
                    subtitle="Your last 6 months of solves, based on solved_at timestamps."
                  />
                  <Heatmap activityMap={activityMap} />
                </section>

                {/* Difficulty Breakdown Panel */}
                <section className="progress-panel-new">
                  <SectionHeader
                    title="Difficulty Breakdown"
                    subtitle="Solved questions grouped by difficulty level."
                  />
                  
                  <div className="donut-layout-new">
                    <div className="donut-chart-container">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={chartData.length > 0 ? chartData : [{ name: 'No Data', value: 1, color: '#d4d4d4' }]}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={76}
                            outerRadius={100}
                            paddingAngle={4}
                            stroke="none"
                          >
                            {(chartData.length > 0 ? chartData : [{ color: '#d4d4d4' }]).map((entry, index) => (
                              <Cell key={`slice-${entry.name}-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(21, 21, 21, 0.95)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '10px',
                              color: '#fafafa',
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      {/* Solved label in the center of the donut chart */}
                      <div className="donut-center-label">
                        <strong className="solved-count">{totalSolved}</strong>
                        <span className="solved-text">Solved</span>
                      </div>
                    </div>

                    <div className="difficulty-summary-new">
                      <div className="difficulty-row easy-row">
                        <span className="diff-dot easy-dot" />
                        <span className="diff-label">Easy</span>
                        <strong className="diff-value">{easySolved}</strong>
                      </div>
                      <div className="difficulty-row medium-row">
                        <span className="diff-dot medium-dot" />
                        <span className="diff-label">Medium</span>
                        <strong className="diff-value">{mediumSolved}</strong>
                      </div>
                      <div className="difficulty-row hard-row">
                        <span className="diff-dot hard-dot" />
                        <span className="diff-label">Hard</span>
                        <strong className="diff-value">{hardSolved}</strong>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </div>
        )}
      </section>
    </main>
      <SiteFooter />
    </>);
}

