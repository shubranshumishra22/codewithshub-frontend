import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, LogOut, Sparkles, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function FloatingNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navbarRef = useRef(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const navbar = navbarRef.current;
    if (!navbar) return;

    const handleMouseMove = (e) => {
      const rect = navbar.getBoundingClientRect();
      const threshold = 120;
      setIsNear(
        e.clientX >= rect.left - threshold &&
          e.clientX <= rect.right + threshold &&
          e.clientY >= rect.top - threshold &&
          e.clientY <= rect.bottom + threshold
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      toast.error(error.message || 'Unable to log out right now.');
      return;
    }
    toast.success('Logged out successfully.');
  };

  const displayName =
    user?.user_metadata?.username || user?.email?.split('@')[0] || 'Quest Player';

  return (
    <nav
      ref={navbarRef}
      className={`floating-navbar ${isNear ? 'is-near' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="floating-navbar-inner">
        <Link to="/" className="floating-navbar-brand" aria-label="DSA Quest Home">
          <BookOpen size={18} />
          <span>DSA QUEST</span>
        </Link>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link
            to="/progress"
            className={`floating-navbar-link ${location.pathname === '/progress' ? 'is-active' : ''}`}
          >
            <Trophy size={16} />
            <span>Progress</span>
          </Link>

          <Link
            to="/leaderboard"
            className={`floating-navbar-link ${location.pathname === '/leaderboard' ? 'is-active' : ''}`}
          >
            <Trophy size={16} />
            <span>Leaderboard</span>
          </Link>
        </div>

        <div className="floating-navbar-right">
          <div className="floating-navbar-badge">
            <Sparkles size={14} />
            <span>{displayName}</span>
          </div>
          <button
            className="floating-navbar-logout"
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
