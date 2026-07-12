import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, FileText, LogOut, Sparkles, Trophy, Compass } from 'lucide-react';
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
      className={`fixed top-4 left-1/2 z-[100] w-[min(70vw,1100px)] max-w-[1100px] px-5 py-2 rounded-full bg-[rgba(10,10,12,0.88)] backdrop-blur-xl border border-[#232327] pointer-events-auto transition-all duration-400 ease-out ${
        isNear ? 'opacity-100 -translate-x-1/2 scale-100 translate-y-0 shadow-2xl shadow-[#131316]/50' : 'opacity-50 -translate-x-1/2 scale-[0.935] -translate-y-1 shadow-md'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 min-h-[36px]">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-[#f2f2f4] text-[15px] font-semibold justify-self-start group transition-colors" aria-label="CodeWithShub Home">
          <span className="group-hover:text-[#c084fc] transition-colors">CodeWithShub</span>
        </Link>

        {/* Center Links */}
        <div className="flex items-center gap-2 justify-self-center">
          <Link
            to="/roadmap/best-dsa-preparation-roadmap-for-beginners"
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              location.pathname.startsWith('/roadmap')
                ? 'text-[#f2f2f4] bg-[#232327]/50'
                : 'text-[#93939c] hover:text-[#f2f2f4] hover:bg-[#232327]/30'
            }`}
          >
            <Compass size={15} />
            <span>Roadmap</span>
          </Link>

          {user && (
            <>
              <Link
                to="/resume-ai"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === '/resume-ai'
                    ? 'text-[#f2f2f4] bg-[#232327]/50'
                    : 'text-[#93939c] hover:text-[#f2f2f4] hover:bg-[#232327]/30'
                }`}
              >
                <FileText size={15} />
                <span>Resume AI</span>
              </Link>

              <Link
                to="/progress"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === '/progress'
                    ? 'text-[#f2f2f4] bg-[#232327]/50'
                    : 'text-[#93939c] hover:text-[#f2f2f4] hover:bg-[#232327]/30'
                }`}
              >
                <Trophy size={15} />
                <span>Progress</span>
              </Link>

              <Link
                to="/leaderboard"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === '/leaderboard'
                    ? 'text-[#f2f2f4] bg-[#232327]/50'
                    : 'text-[#93939c] hover:text-[#f2f2f4] hover:bg-[#232327]/30'
                }`}
              >
                <Trophy size={15} />
                <span>Leaderboard</span>
              </Link>
            </>
          )}
        </div>

        {/* Right side (Profile / Auth) */}
        <div className="flex items-center justify-end justify-self-end">
          {user ? (
            <div className="flex items-center bg-[#131316] border border-[#232327] rounded-full overflow-hidden h-9 shadow-inner">
              <div className="flex items-center gap-2 px-3 text-[#f2f2f4] text-xs font-medium">
                <Sparkles size={12} className="text-[#d4a843]" />
                <span>{displayName}</span>
              </div>
              <div className="w-[1px] h-4 bg-[#232327]" />
              <button
                className="flex items-center gap-1.5 px-3 text-[#93939c] text-xs font-medium hover:text-[#f2f2f4] hover:bg-[#232327] transition-colors h-full"
                type="button"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-[#93939c] hover:text-[#f2f2f4] px-3 py-1.5 transition-colors"
              >
                <span>Login</span>
              </Link>
              <Link
                to="/signup"
                className="text-sm font-semibold bg-[#d4a843] text-[#0a0a0c] px-4 py-1.5 rounded-full hover:bg-[#e2bb59] transition-colors"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
