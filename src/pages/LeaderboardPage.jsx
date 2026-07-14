import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Trophy, Award, Crown, Search, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

const getRankClass = (streak) => {
  if (streak >= 30) return { label: 'Grandmaster', className: 'rank-grandmaster' };
  if (streak >= 15) return { label: 'Master', className: 'rank-master' };
  if (streak >= 7) return { label: 'Expert', className: 'rank-expert' };
  if (streak >= 1) return { label: 'Explorer', className: 'rank-explorer' };
  return { label: 'Inactive', className: 'rank-inactive' };
};

const getNextDivisionProgress = (streak) => {
  if (streak >= 30) {
    return {
      label: 'Grandmaster',
      streak,
      nextStreak: 0,
      nextLabel: 'Max Division',
      percent: 100,
    };
  }
  if (streak >= 15) {
    const base = 15;
    const target = 30;
    const progress = streak - base;
    const total = target - base;
    const percent = Math.min(100, Math.max(0, (progress / total) * 100));
    return {
      label: 'Master',
      streak,
      nextStreak: target,
      nextLabel: 'Grandmaster',
      percent,
    };
  }
  if (streak >= 7) {
    const base = 7;
    const target = 15;
    const progress = streak - base;
    const total = target - base;
    const percent = Math.min(100, Math.max(0, (progress / total) * 100));
    return {
      label: 'Expert',
      streak,
      nextStreak: target,
      nextLabel: 'Master',
      percent,
    };
  }
  if (streak >= 1) {
    const base = 1;
    const target = 7;
    const progress = streak - base;
    const total = target - base;
    const percent = Math.min(100, Math.max(0, (progress / total) * 100));
    return {
      label: 'Explorer',
      streak,
      nextStreak: target,
      nextLabel: 'Expert',
      percent,
    };
  }
  return {
    label: 'Inactive',
    streak: 0,
    nextStreak: 1,
    nextLabel: 'Explorer',
    percent: 0,
  };
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'division' | 'top_10'

  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const response = await apiGet('/user/leaderboard');
      return response.data.leaderboard || [];
    },
  });

  const list = leaderboardQuery.data || [];
  const isLoading = leaderboardQuery.isLoading;
  const hasError = leaderboardQuery.error;

  // 1. Find current user and overall standings
  const currentUserItem = list.find((player) => player.id === user?.id);
  const currentUserRank = list.findIndex((player) => player.id === user?.id) + 1;
  const currentUserDivision = currentUserItem ? getRankClass(currentUserItem.streak_count) : null;

  // 2. Filter list based on searchQuery and activeTab
  const filteredList = list.filter((player) => {
    // Filter by Search Query
    const nameMatch = (player.username || 'Quest Player')
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!nameMatch) return false;

    // Filter by Tabs
    if (activeTab === 'division') {
      if (!currentUserDivision) return false;
      const playerDivision = getRankClass(player.streak_count);
      return playerDivision.label === currentUserDivision.label;
    }
    return true; // 'all' or 'top_10' (spliced later)
  });

  // Top 10 limit for that tab
  const displayList = activeTab === 'top_10' ? filteredList.slice(0, 10) : filteredList;

  // 3. Extract podium players (Top 3 of the global list)
  // We only show podium when search is empty and activeTab is 'all' to maintain clear standings view
  const showPodium = !searchQuery && activeTab === 'all';
  const podiumPlayers = list.slice(0, 3);

  // For the list rows below, if we are showing the podium, we skip the first 3 players in the list
  const listToRender = showPodium ? displayList.slice(3) : displayList;

  return (
    <>
    <main className="leaderboard-shell">
      {/* Background radial glow */}
      <div className="leaderboard-bg-glow-1" />
      <div className="leaderboard-bg-glow-2" />

      {/* Header section */}
      <div className="leaderboard-header-section">
        <h1>Global Leaderboard</h1>
        <p>Compete with fellow quest players by maintaining your daily coding streaks.</p>
      </div>

      <div className="leaderboard-main-layout">
        {/* Left Column: Podium + Standings List */}
        <div className="leaderboard-left-col">
          {/* Controls Bar */}
          <div className="leaderboard-controls">
            <div className="search-box-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search player by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-tabs">
              <button
                className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Players
              </button>
              <button
                className={`filter-tab ${activeTab === 'division' ? 'active' : ''}`}
                onClick={() => setActiveTab('division')}
                disabled={!currentUserDivision || currentUserDivision.label === 'Inactive'}
                title={!currentUserDivision || currentUserDivision.label === 'Inactive' ? 'You need to be in an active division to filter' : ''}
              >
                My Division
              </button>
              <button
                className={`filter-tab ${activeTab === 'top_10' ? 'active' : ''}`}
                onClick={() => setActiveTab('top_10')}
              >
                Top 10
              </button>
            </div>
          </div>

          {/* Podium Layout */}
          <AnimatePresence>
            {showPodium && podiumPlayers.length > 0 && (
              <motion.div
                className="podium-container"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* 2nd Place Spot */}
                {podiumPlayers[1] && (
                  <div className="podium-spot spot-second">
                    <div className="podium-avatar-wrap">
                      <div className="podium-rank-badge rank-second">2</div>
                      <div className="podium-avatar silver-border">
                        {podiumPlayers[1].avatar_url ? (
                          <img src={podiumPlayers[1].avatar_url} alt={podiumPlayers[1].username} />
                        ) : (
                          <span>{(podiumPlayers[1].username || 'P').slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <Award className="podium-award-icon silver-glow" size={16} />
                    </div>
                    <div className="podium-player-details">
                      <span className="podium-player-name">
                        {podiumPlayers[1].username || 'Player'}
                        {podiumPlayers[1].id === user?.id && <span className="self-tag">(You)</span>}
                      </span>
                      <span className="podium-streak">
                        <Flame size={14} className="flame-active" />
                        {podiumPlayers[1].streak_count}
                      </span>
                      <span className={`division-badge-sm ${getRankClass(podiumPlayers[1].streak_count).className}`}>
                        {getRankClass(podiumPlayers[1].streak_count).label}
                      </span>
                    </div>
                    <motion.div
                      className="podium-pedestal pedestal-second"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                    >
                      <div className="pedestal-shine" />
                    </motion.div>
                  </div>
                )}

                {/* 1st Place Spot */}
                {podiumPlayers[0] && (
                  <div className="podium-spot spot-first">
                    <div className="podium-avatar-wrap">
                      <Crown className="podium-crown-icon" size={24} />
                      <div className="podium-avatar gold-border">
                        {podiumPlayers[0].avatar_url ? (
                          <img src={podiumPlayers[0].avatar_url} alt={podiumPlayers[0].username} />
                        ) : (
                          <span>{(podiumPlayers[0].username || 'P').slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <div className="podium-player-details">
                      <span className="podium-player-name font-bold">
                        {podiumPlayers[0].username || 'Player'}
                        {podiumPlayers[0].id === user?.id && <span className="self-tag">(You)</span>}
                      </span>
                      <span className="podium-streak text-gold">
                        <Flame size={16} className="flame-active flame-gold-glow animate-pulse" />
                        <strong>{podiumPlayers[0].streak_count}</strong>
                      </span>
                      <span className={`division-badge-sm ${getRankClass(podiumPlayers[0].streak_count).className}`}>
                        {getRankClass(podiumPlayers[0].streak_count).label}
                      </span>
                    </div>
                    <motion.div
                      className="podium-pedestal pedestal-first"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                    >
                      <div className="pedestal-shine" />
                    </motion.div>
                  </div>
                )}

                {/* 3rd Place Spot */}
                {podiumPlayers[2] && (
                  <div className="podium-spot spot-third">
                    <div className="podium-avatar-wrap">
                      <div className="podium-rank-badge rank-third">3</div>
                      <div className="podium-avatar bronze-border">
                        {podiumPlayers[2].avatar_url ? (
                          <img src={podiumPlayers[2].avatar_url} alt={podiumPlayers[2].username} />
                        ) : (
                          <span>{(podiumPlayers[2].username || 'P').slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <Award className="podium-award-icon bronze-glow" size={16} />
                    </div>
                    <div className="podium-player-details">
                      <span className="podium-player-name">
                        {podiumPlayers[2].username || 'Player'}
                        {podiumPlayers[2].id === user?.id && <span className="self-tag">(You)</span>}
                      </span>
                      <span className="podium-streak">
                        <Flame size={14} className="flame-active" />
                        {podiumPlayers[2].streak_count}
                      </span>
                      <span className={`division-badge-sm ${getRankClass(podiumPlayers[2].streak_count).className}`}>
                        {getRankClass(podiumPlayers[2].streak_count).label}
                      </span>
                    </div>
                    <motion.div
                      className="podium-pedestal pedestal-third"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                    >
                      <div className="pedestal-shine" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standings List */}
          <div className="standings-list-container">
            {isLoading ? (
              <div className="leaderboard-loading-card-new">
                <div className="loading-spinner-new" />
                <p>Scanning the arena standings...</p>
              </div>
            ) : hasError ? (
              <div className="leaderboard-error-card-new">
                {hasError.message || 'Failed to scan the standings.'}
              </div>
            ) : (
              <motion.div
                className="standings-rows-wrap"
                layout
                transition={{ duration: 0.2 }}
              >
                {/* List Header Labels for desktop */}
                {listToRender.length > 0 && (
                  <div className="standings-header-row">
                    <span className="col-rank">Rank</span>
                    <span className="col-user">Player</span>
                    <span className="col-streak">Streak</span>
                  </div>
                )}

                {listToRender.map((player, idx) => {
                  const globalRank = list.findIndex((p) => p.id === player.id) + 1;
                  const isCurrentUser = player.id === user?.id;
                  const rankClass = getRankClass(player.streak_count);

                  let rankDisplay = globalRank < 10 ? `0${globalRank}` : globalRank;
                  let highlightClass = isCurrentUser ? 'is-self-row' : '';

                  if (globalRank === 1) highlightClass += ' first-rank-row';
                  if (globalRank === 2) highlightClass += ' second-rank-row';
                  if (globalRank === 3) highlightClass += ' third-rank-row';

                  return (
                    <motion.div
                      key={player.id}
                      className={`standings-row ${highlightClass}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                      whileHover={{ scale: 1.008 }}
                      layoutId={`player-row-${player.id}`}
                    >
                      <div className="row-rank">
                        {globalRank === 1 && <Crown size={16} className="rank-gold-icon" />}
                        {globalRank === 2 && <Award size={16} className="rank-silver-icon" />}
                        {globalRank === 3 && <Award size={16} className="rank-bronze-icon" />}
                        {globalRank > 3 && <span>{rankDisplay}</span>}
                      </div>

                      <div className="row-user">
                        <div className="row-avatar">
                          {player.avatar_url ? (
                            <img src={player.avatar_url} alt={player.username} />
                          ) : (
                            <span>{(player.username || 'P').slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="row-username">
                          {player.username || 'Quest Player'}
                          {isCurrentUser && <span className="you-badge">YOU</span>}
                        </span>
                      </div>

                      <div className="row-streak">
                        <Flame size={16} className={player.streak_count > 0 ? 'flame-active' : 'flame-inactive'} />
                        <span className="row-streak-text">{player.streak_count} days</span>
                      </div>

                    </motion.div>
                  );
                })}

                {listToRender.length === 0 && (
                  <div className="leaderboard-empty-new">
                    <span>No quest warriors found in this view.</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column: User Arena Card */}
        <div className="leaderboard-right-col">
          <div className="user-arena-profile-card">
            <h3>Your Arena Profile</h3>

            {currentUserItem ? (
              <div className="profile-details-wrap">
                <div className="profile-hero-row">
                  <div className="profile-avatar-large">
                    {currentUserItem.avatar_url ? (
                      <img src={currentUserItem.avatar_url} alt={currentUserItem.username} />
                    ) : (
                      <span>{(currentUserItem.username || 'P').slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="profile-info-block">
                    <h4>{currentUserItem.username || 'Quest Player'}</h4>
                    <p className="profile-rank-label">Rank #{currentUserRank} Overall</p>
                  </div>
                </div>

                <div className="profile-stats-grid">
                  <div className="profile-stat-box">
                    <span className="stat-label">Streak</span>
                    <span className="stat-value streak-value">
                      <Flame size={20} className="flame-active animate-pulse" />
                      {currentUserItem.streak_count}
                    </span>
                  </div>
                  <div className="profile-stat-box">
                    <span className="stat-label">Division</span>
                    {getRankClass(currentUserItem.streak_count).label !== 'Inactive' ? (
                      <span className={`division-badge ${getRankClass(currentUserItem.streak_count).className}`}>
                        {getRankClass(currentUserItem.streak_count).label}
                      </span>
                    ) : (
                      <span className="text-neutral-500 font-mono text-xs">-</span>
                    )}
                  </div>
                </div>

                {/* Division Progress */}
                {(() => {
                  const { streak, nextStreak, nextLabel, percent } = getNextDivisionProgress(
                    currentUserItem.streak_count
                  );
                  return (
                    <div className="division-progress-wrap">
                      <div className="progress-labels">
                        <span>Progress to {nextLabel}</span>
                        <span>{streak} / {nextStreak} Days</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      {nextStreak > 0 ? (
                        <p className="progress-subtext">
                          Maintain your streak for <strong>{nextStreak - streak} more days</strong>{' '}
                          to enter the {nextLabel} division!
                        </p>
                      ) : (
                        <p className="progress-subtext text-gold">
                          🏆 You are at the pinnacle! Master of all divisions.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="profile-empty-wrap">
                <div className="profile-avatar-large">
                  <span>{user?.username ? user.username.slice(0, 1).toUpperCase() : 'P'}</span>
                </div>
                <h4>{user?.username || 'Quest Player'}</h4>
                <p className="no-streak-text">You don't have an active streak yet in the standings.</p>
                <div className="start-streak-tip">
                  <Zap size={16} className="tip-icon" />
                  <span>Solve a DSA question today to launch your streak and claim your rank!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
      <SiteFooter />
    </>);
}

