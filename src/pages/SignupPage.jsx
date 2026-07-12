import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldPlus, Sparkles, UserPlus, LogIn, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

const STD = [0.16, 1, 0.3, 1];
const SPRING = [0.34, 1.56, 0.64, 1];

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
      const { data, error } = await signup(email, password, { data: { username } });
      if (error) throw error;
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
    <div className="min-h-screen bg-[#0a0a0c] font-sans selection:bg-[#d4a843] selection:text-[#0a0a0c] flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.section 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: STD }}
          className="w-full max-w-[460px] bg-[#131316] border border-[#232327] rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          {isSignedUp ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0c] border border-[#232327] mb-6">
                <Mail size={14} className="text-[#93939c]" />
                <span className="text-xs font-medium text-[#93939c]">VERIFICATION SENT</span>
              </div>

              <header className="mb-6">
                <p className="text-[#d4a843] text-xs font-medium tracking-wide uppercase mb-2">Check your inbox</p>
                <h1 className="text-3xl font-semibold tracking-tight text-[#f2f2f4] mb-2">
                  CONFIRM EMAIL
                </h1>
                <p className="text-[#93939c] text-sm">
                  We have sent an activation link to <strong className="text-[#f2f2f4] underline">{registeredEmail}</strong>.
                </p>
              </header>

              <div className="mb-8 p-4 rounded-xl bg-[#0a0a0c] border border-[#232327]">
                <p className="text-sm text-[#93939c] leading-relaxed">
                  Please open the link in the email to activate your account. If you don't receive it within a few minutes, check your spam or junk folder.
                </p>
              </div>

              <motion.button 
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.02, backgroundColor: '#e2bb59' }}
                whileTap={{ scale: 0.965, transition: { ease: SPRING } }}
                className="w-full h-11 rounded-full bg-[#d4a843] text-[#0a0a0c] text-sm font-semibold flex justify-center items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#d4a843] focus:ring-offset-2 focus:ring-offset-[#0a0a0c]" 
              >
                <LogIn size={16} />
                Return to Portal
              </motion.button>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0c] border border-[#232327] mb-6">
                <ShieldPlus size={14} className="text-[#93939c]" />
                <span className="text-xs font-medium text-[#93939c]">NEW PLAYER</span>
              </div>

              <header className="mb-8">
                <p className="text-[#c084fc] text-xs font-medium tracking-wide uppercase mb-2">Join the leaderboard</p>
                <h1 className="text-3xl font-semibold tracking-tight text-[#f2f2f4] mb-2">
                  CodeWithShub
                </h1>
                <p className="text-[#93939c] text-sm">
                  Register your account and start your quest through the curated DSA paths.
                </p>
              </header>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#f2f2f4]">Username</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="QuestMaster"
                    autoComplete="nickname"
                    className="w-full bg-[#0a0a0c] border border-[#232327] rounded-xl px-4 py-3 text-sm text-[#f2f2f4] placeholder:text-[#55555d] focus:outline-none focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843] transition-colors"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#f2f2f4]">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="hero@quest.com"
                    autoComplete="email"
                    required
                    className="w-full bg-[#0a0a0c] border border-[#232327] rounded-xl px-4 py-3 text-sm text-[#f2f2f4] placeholder:text-[#55555d] focus:outline-none focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843] transition-colors"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-[#f2f2f4]">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Choose a strong password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="w-full bg-[#0a0a0c] border border-[#232327] rounded-xl px-4 py-3 text-sm text-[#f2f2f4] placeholder:text-[#55555d] focus:outline-none focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843] transition-colors"
                  />
                </label>

                <motion.button 
                  whileHover={!submitting ? { scale: 1.02, backgroundColor: 'rgba(212,168,67,0.12)' } : {}}
                  whileTap={!submitting ? { scale: 0.965, transition: { ease: SPRING } } : {}}
                  className="mt-2 w-full h-11 rounded-full bg-transparent border border-[#d4a843] text-[#d4a843] text-sm font-semibold flex justify-center items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#d4a843] focus:ring-offset-2 focus:ring-offset-[#0a0a0c] disabled:opacity-50 disabled:cursor-not-allowed" 
                  type="submit" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {submitting ? 'Forging account...' : 'Sign Up'}
                </motion.button>
              </form>

              <div className="mt-8 pt-6 border-t border-[#232327] flex items-center gap-2 text-xs text-[#55555d]">
                <Sparkles size={14} className="text-[#93939c]" />
                <p>
                  Already have an account? <Link to="/login" className="text-[#d4a843] font-medium hover:text-[#e2bb59] transition-colors">Return to the portal</Link>
                </p>
              </div>
            </>
          )}
        </motion.section>
      </main>
      <SiteFooter />
    </div>
  );
}
