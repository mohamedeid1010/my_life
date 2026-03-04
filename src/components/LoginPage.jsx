import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        await signup(email, password, name.trim());
      }
    } catch (err) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (code === 'auth/email-already-in-use') {
        setError('Email already registered. Try logging in.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Background orbs */}
      <div
        className="fixed -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
      />
      <div
        className="fixed -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
      />

      <div className="glass-card p-8 md:p-10 w-full max-w-md animate-slide-up relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-20 h-20 rounded-2xl shadow-lg mb-4 p-1 animate-pulse-glow flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
          >
            <img src="/horizon-logo.png" alt="Horizon Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white/95 tracking-tight">
            Horizon
          </h1>
          <p className="text-sm text-white/30 mt-1">
            {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-5 p-3 rounded-xl text-sm font-semibold text-red-300 animate-fade-in"
            style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (signup only) */}
          {!isLogin && (
            <div className="relative animate-fade-in">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-semibold text-white/90 placeholder:text-white/20 outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-semibold text-white/90 placeholder:text-white/20 outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-semibold text-white/90 placeholder:text-white/20 outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="action-btn w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
            }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
