import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2, LogIn, Sparkles, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import TerminalBlock from '../components/TerminalBlock';
import { useAuth } from '../context/AuthContext';

const STD = [0.16, 1, 0.3, 1];
const SPRING = [0.34, 1.56, 0.64, 1];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const emailSent = location.state?.emailSent;
  const registeredEmail = location.state?.email;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await login(email, password);
      if (error) throw error;
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
    <div className="min-h-screen bg-[#0a0a0c] font-sans selection:bg-[#d4a843] selection:text-[#0a0a0c] flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.section 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: STD }}
          className="w-full max-w-[460px] bg-[#131316] border border-[#232327] rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0c] border border-[#232327] mb-6">
            <Gamepad2 size={14} className="text-[#93939c]" />
            <span className="text-xs font-medium text-[#93939c]">PLAYER ACCESS</span>
          </div>

          <header className="mb-8">
            <p className="text-[#c084fc] text-xs font-medium tracking-wide uppercase mb-2">Level up your DSA journey</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#f2f2f4] mb-2">
              CodeWithShub
            </h1>
            <p className="text-[#93939c] text-sm">
              Enter the arena and continue your coding streak.
            </p>
          </header>

          {emailSent && (
            <div className="mb-6 p-4 rounded-xl bg-[rgba(52,211,153,0.06)] border border-[rgba(52,211,153,0.15)]">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={16} className="text-[#34d399]" />
                <span className="font-semibold text-[#f2f2f4] text-sm">Verification Email Sent!</span>
              </div>
              <p className="text-[#93939c] text-sm leading-relaxed">
                A confirmation link has been sent to <strong className="text-[#f2f2f4]">{registeredEmail}</strong>. Please check your inbox (and spam folder) to activate your account before logging in.
              </p>
            </div>
          )}

          <div className="mb-8">
            <TerminalBlock />
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#f2f2f4]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="champion@quest.com"
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
                placeholder="Enter your secret code"
                autoComplete="current-password"
                required
                className="w-full bg-[#0a0a0c] border border-[#232327] rounded-xl px-4 py-3 text-sm text-[#f2f2f4] placeholder:text-[#55555d] focus:outline-none focus:border-[#d4a843] focus:ring-1 focus:ring-[#d4a843] transition-colors"
              />
            </label>

            <motion.button 
              whileHover={!submitting ? { scale: 1.02, backgroundColor: '#e2bb59' } : {}}
              whileTap={!submitting ? { scale: 0.965, transition: { ease: SPRING } } : {}}
              className="mt-2 w-full h-11 rounded-full bg-[#d4a843] text-[#0a0a0c] text-sm font-semibold flex justify-center items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#d4a843] focus:ring-offset-2 focus:ring-offset-[#0a0a0c] disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit" 
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {submitting ? 'Launching...' : 'Login'}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#232327] flex items-center gap-2 text-xs text-[#55555d]">
            <Sparkles size={14} className="text-[#93939c]" />
            <p>
              New here? <Link to="/signup" className="text-[#d4a843] font-medium hover:text-[#e2bb59] transition-colors">Create your hero account</Link>
            </p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
