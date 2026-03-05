/**
 * ═══════════════════════════════════════════════════════════
 *  useAuthStore — Zustand store for Firebase Authentication
 * ═══════════════════════════════════════════════════════════
 *
 *  Replaces: AuthContext.jsx
 *
 *  Responsibilities:
 *  - Listen to Firebase auth state changes
 *  - Provide login/logout actions
 *  - Expose the current user to all components
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { FirebaseAuthUser } from '../types/user.types';
import type { UserRole } from '../types/features';

/* ─────────────── Store Interface ─────────────── */

interface AuthStore {
  /** Current authenticated user (null = not logged in) */
  user: FirebaseAuthUser | null;

  /** Whether we're still checking initial auth state */
  loading: boolean;

  /** Last auth error message */
  error: string | null;

  /** Sign in with email + password */
  loginWithEmail: (email: string, password: string) => Promise<void>;

  /** Create account with email + password */
  signUpWithEmail: (email: string, password: string) => Promise<void>;

  /** Sign in with Google popup */
  loginWithGoogle: () => Promise<void>;

  /** Sign out and clear user state */
  logout: () => Promise<void>;

  /** Clear any error state */
  clearError: () => void;

  /**
   * Initialize the auth state listener.
   * Call this ONCE in the root component (App.tsx).
   * Returns an unsubscribe function.
   */
  initAuthListener: () => () => void;
}

/* ─────────────── Helper: Firebase User → Our Type ─────────────── */

/**
 * Maps a Firebase Auth User object to our lean FirebaseAuthUser interface.
 * This prevents storing the entire Firebase User object (which is mutable
 * and contains methods) in our Zustand state.
 */
function serializeUser(fbUser: User, role: UserRole): FirebaseAuthUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
    role,
  };
}

/**
 * Helper to fetch a user's role from their Firestore profile document.
 */
async function fetchUserRole(uid: string): Promise<UserRole> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.role === 'admin' || data.role === 'tester') {
        return data.role as UserRole;
      }
    }
  } catch (err) {
    console.error('[AuthStore] Failed to fetch user role:', err);
  }
  return 'user';
}

/* ─────────────── Store Definition ─────────────── */

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ── Initial State ──
      // loading defaults to false since we trust persisted user cache instantly
      user: null,
      loading: false,
      error: null,

      // ── Actions ──

  loginWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const role = await fetchUserRole(credential.user.uid);
      set({ user: serializeUser(credential.user, role), loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, loading: false });
      throw err; // Re-throw so calling components can handle it
    }
  },

  signUpWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      // Wait to create user defaults before setting state completely if needed, or default 'user'
      set({ user: serializeUser(credential.user, 'user'), loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      set({ error: message, loading: false });
      throw err; // Re-throw so calling components can handle it
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const role = await fetchUserRole(credential.user.uid);
      set({ user: serializeUser(credential.user, role), loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      set({ error: message, loading: false });
      throw err; // Re-throw so calling components can handle it
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      set({ error: message });
    }
  },

  clearError: () => set({ error: null }),

  initAuthListener: () => {
    /**
     * Enforce local persistence first: this guarantees the login session
     * survives page refreshes and browser restarts.
     */
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error('[AuthStore] Failed to set auth persistence:', err);
    });

    /**
     * Subscribe to Firebase auth state changes.
     * This fires immediately with the initial state and then
     * on every subsequent login/logout.
     */
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const role = await fetchUserRole(fbUser.uid);
        set({ user: serializeUser(fbUser, role), loading: false });
      } else {
        set({ user: null, loading: false });
      }
    });

    return unsubscribe;
  },
}),
{
  name: 'herizon-auth-cache', // unique name for localStorage
  partialize: (state) => ({ user: state.user }), // only persist the user object, not loading/error
}));
