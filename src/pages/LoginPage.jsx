import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2, LogIn, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import TerminalBlock from '../components/TerminalBlock';
import SiteFooter from '../components/SiteFooter';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await login(email, password);

      if (error) {
        throw error;
      }

      if (data.session) {
        toast.success('Welcome back, challenger!');
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error(error.message || 'Unable to sign in right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card auth-entrance">
        <div className="auth-card-glow" />
        <div className="auth-badge">
          <Gamepad2 size={18} />
          <span>PLAYER ACCESS</span>
        </div>

        <header className="auth-header">
          <p className="auth-eyebrow">Level up your DSA journey</p>
          <h1 className="brand-title">
            <img src="/shubdevlogo.png" alt="DSA Quest logo" />
            <span>DSA QUEST</span>
          </h1>
          <p className="auth-subtitle">
            Enter the arena and continue your coding streak.
          </p>
        </header>

        <TerminalBlock />

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="champion@quest.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your secret code"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="auth-button" type="submit" disabled={submitting}>
            <LogIn size={18} />
            {submitting ? 'Launching...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <Sparkles size={16} />
          <p>
            New here? <Link to="/signup">Create your hero account</Link>
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
