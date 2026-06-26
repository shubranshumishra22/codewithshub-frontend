import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Flame, Trophy, Award, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
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

export default function LeaderboardPage() {
  const { user } = useAuth();

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

  return (
    <main className="leaderboard-shell">
      <div className="progress-particles" />
      <section className="leaderboard-card auth-entrance">
        <div className="leaderboard-hero">
          <div>
            <div className="leaderboard-kicker">
              <Trophy size={16} />
              <span>ARENA STANDINGS</span>
            </div>
            <h1>Global Leaderboard</h1>
            <p>
              Compete with fellow quest players by maintaining your daily coding streaks.
            </p>
          </div>
          <Link className="leaderboard-back-button" to="/dashboard">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>

        {isLoading ? (
          <div className="leaderboard-loading-card">
            <div className="auth-loading-spinner" />
            <p>Scanning the arena...</p>
          </div>
        ) : hasError ? (
          <div className="leaderboard-error-card">
            {hasError.message || 'Failed to scan the standings.'}
          </div>
        ) : (
          <div className="leaderboard-list-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="rank-col">Rank</th>
                  <th className="player-col">Player</th>
                  <th className="streak-col">Current Streak</th>
                  <th className="title-col">Division</th>
                </tr>
              </thead>
              <tbody>
                {list.map((player, index) => {
                  const rank = index + 1;
                  const isCurrentUser = player.id === user?.id;
                  const rankClass = getRankClass(player.streak_count);

                  let rankDisplay = rank;
                  let rowClass = isCurrentUser ? 'is-self' : '';

                  if (rank === 1) {
                    rankDisplay = <Crown size={18} className="medal-gold" />;
                    rowClass += ' row-gold';
                  } else if (rank === 2) {
                    rankDisplay = <Award size={18} className="medal-silver" />;
                    rowClass += ' row-silver';
                  } else if (rank === 3) {
                    rankDisplay = <Award size={18} className="medal-bronze" />;
                    rowClass += ' row-bronze';
                  }

                  const avatarChar = (player.username || 'P').slice(0, 1).toUpperCase();

                  return (
                    <tr key={player.id} className={rowClass.trim()}>
                      <td className="rank-col" data-label="Rank">
                        <div className="rank-badge-wrap">{rankDisplay}</div>
                      </td>
                      <td className="player-col" data-label="Player">
                        <div className="player-info">
                          <div className="player-avatar">
                            {player.avatar_url ? (
                              <img src={player.avatar_url} alt={player.username} />
                            ) : (
                              <span>{avatarChar}</span>
                            )}
                          </div>
                          <span className="player-name">
                            {player.username || 'Quest Player'}
                            {isCurrentUser && <span className="self-tag">(You)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="streak-col" data-label="Streak">
                        <div className="streak-count">
                          <Flame size={16} className={player.streak_count > 0 ? 'flame-active' : 'flame-inactive'} />
                          <strong>{player.streak_count}</strong>
                        </div>
                      </td>
                      <td className="title-col" data-label="Division">
                        <span className={`division-badge ${rankClass.className}`}>
                          {rankClass.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="leaderboard-empty">No players found in the arena.</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
