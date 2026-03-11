/**
 * ═══════════════════════════════════════════════════════════
 *  LoginPage — Authentication UI
 * ═══════════════════════════════════════════════════════════
 *
 *  Provides email/password login & signup, plus Google Sign-In.
 *  All auth actions come from the Zustand `useAuthStore`.
 */

import { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { t } from '../config/translations';
import { usePreferencesStore } from '../stores/usePreferencesStore';

/* ─────────────── Google "G" Logo (inline SVG) ─────────────── */

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

/* ─────────────── LoginPage Component ─────────────── */

export default function LoginPage() {
  // ── Zustand auth store ──
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const storeError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const L = usePreferencesStore((s) => s.language);
  const isAr = L === 'ar';

  // ── Local UI state ──
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  /** Combined error: local validation errors take priority */
  const displayError = localError || storeError || '';

  /**
   * Handle email/password form submission.
   * Validates inputs locally, then delegates to the auth store.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) {
          setLocalError(t('error_enter_name', L));
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password);
      }
    } catch (err) {
      // Map Firebase error codes to user-friendly messages
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setLocalError(t('error_invalid_credentials', L));
      } else if (code === 'auth/email-already-in-use') {
        setLocalError(t('error_email_registered', L));
      } else if (code === 'auth/weak-password') {
        setLocalError(t('error_weak_password', L));
      } else if (code === 'auth/invalid-email') {
        setLocalError(t('error_invalid_email', L));
      } else {
        setLocalError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google Sign-In via popup.
   */
  const handleGoogleLogin = async () => {
    setLocalError('');
    clearError();
    setGoogleLoading(true);

    try {
      await loginWithGoogle();
    } catch (err) {
      // User closed the popup or network error
      if (err.code !== 'auth/popup-closed-by-user') {
        setLocalError(err.message || t('error_google_failed', L));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  /**
   * Toggle between Login and Signup modes.
   */
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setLocalError('');
    clearError();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        paddingTop: 'max(1rem, var(--safe-top))',
        paddingBottom: 'max(1rem, var(--safe-bottom))',
        paddingLeft: 'max(1rem, var(--safe-left))',
        paddingRight: 'max(1rem, var(--safe-right))',
      }}
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

      <div className="glass-card p-5 sm:p-6 md:p-8 w-full max-w-md mx-2 sm:mx-4 animate-slide-up relative z-10">
        {/* ── Logo ── */}
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
            {isLogin ? t('welcome_back', L) : t('create_account', L)}
          </p>
        </div>

        {/* ── Error Banner ── */}
        {displayError && (
          <div
            className="mb-5 p-3 rounded-xl text-sm font-semibold text-red-300 animate-fade-in"
            style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            {displayError}
          </div>
        )}

        {/* ── Email / Password Form ── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (signup only) */}
          {!isLogin && (
            <div className="relative animate-fade-in">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                type="text"
                placeholder={t('your_name_placeholder', L)}
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
                placeholder={t('email_placeholder', L)}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="action-btn touch-target w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[48px]"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
            }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLogin ? t('sign_in', L) : t('create_account_btn', L)}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* ── Separator ── */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs font-semibold text-white/20 uppercase tracking-wider">
            {t('or_continue_with', L)}
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* ── Google Sign-In Button ── */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="touch-target w-full py-3.5 rounded-xl font-bold text-white/80 flex items-center justify-center gap-3 transition-all hover:bg-white/[0.08] disabled:opacity-50 min-h-[48px]"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {googleLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <GoogleIcon size={18} />
              <span>Google</span>
            </>
          )}
        </button>

        {/* ── Toggle Login / Signup ── */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            {isLogin ? `${t('no_account', L)} ${t('sign_up', L)}` : `${t('have_account', L)} ${t('login', L)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
