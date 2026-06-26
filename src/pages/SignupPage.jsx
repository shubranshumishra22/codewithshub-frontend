import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldPlus, Sparkles, UserPlus, LogIn, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await signup(email, password, {
        data: {
          username,
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        toast.success('Hero account created!');
        navigate('/', { replace: true });
        return;
      }

      setRegisteredEmail(email);
      setIsSignedUp(true);
      toast.success('Check your email to complete signup.');
    } catch (error) {
      toast.error(error.message || 'Unable to create account right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card auth-entrance">
        <div className="auth-card-glow" />

        {isSignedUp ? (
          <>
            <div className="auth-badge">
              <Mail size={18} />
              <span>VERIFICATION SENT</span>
            </div>

            <header className="auth-header">
              <p className="auth-eyebrow">Check your inbox</p>
              <h1>CONFIRM EMAIL</h1>
              <p className="auth-subtitle">
                We have sent an activation link to <strong style={{ color: '#e8eaed', textDecoration: 'underline' }}>{registeredEmail}</strong>.
              </p>
            </header>

            <div style={{ margin: '24px 0', padding: '16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '0.5px solid var(--line-dark)' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-dark)', lineHeight: '1.6' }}>
                Please open the link in the email to activate your account. If you don't receive it within a few minutes, check your spam or junk folder.
              </p>
            </div>

            <button className="auth-button" onClick={() => navigate('/login')} style={{ width: '100%' }}>
              <LogIn size={18} />
              Return to Portal
            </button>
          </>
        ) : (
          <>
            <div className="auth-badge auth-badge-light">
              <ShieldPlus size={18} />
              <span>NEW PLAYER</span>
            </div>

            <header className="auth-header">
              <p className="auth-eyebrow">Join the leaderboard</p>
              <h1>DSA QUEST</h1>
              <p className="auth-subtitle">
                Register your account and start your quest through the Striver A-Z path.
              </p>
            </header>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                <span>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="QuestMaster"
                  autoComplete="nickname"
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="hero@quest.com"
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
                  placeholder="Choose a strong password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>

              <button className="auth-button auth-button-ghost" type="submit" disabled={submitting}>
                <UserPlus size={18} />
                {submitting ? 'Forging account...' : 'Sign Up'}
              </button>
            </form>

            <div className="auth-footer">
              <Sparkles size={16} />
              <p>
                Already have an account? <Link to="/login">Return to the portal</Link>
              </p>
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
