import { useState } from 'react';
import { Rocket, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeSheetName] = useState(() => localStorage.getItem('activeSheetName') || 'Striver A-Z');

  const displayName =
    user?.user_metadata?.username || user?.email?.split('@')[0] || 'Quest Player';

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card auth-entrance">
        <div className="dashboard-hero">
          <div>
            <div className="dashboard-kicker">
              <Rocket size={16} />
              <span>Quest Active</span>
            </div>
            <h1>Welcome, {displayName}</h1>
            <p>
              Your DSA adventure is ready. Continue solving, tracking progress, and
              clearing the leaderboard.
            </p>
          </div>
        </div>

        <div className="dashboard-stats">
          <article>
            <Trophy size={20} />
            <div>
              <span>Current Rank</span>
              <strong>Explorer</strong>
            </div>
          </article>
          <article>
            <Trophy size={20} />
            <div>
              <span>Focus Zone</span>
              <strong>{activeSheetName}</strong>
            </div>
          </article>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
