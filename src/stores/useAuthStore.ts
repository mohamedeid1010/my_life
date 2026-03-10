/**
 * ═══════════════════════════════════════════════════════════
 * useAuthStore — Zustand store for Firebase Authentication
 * ═══════════════════════════════════════════════════════════
 *
 * Responsibilities:
 * - Listen to Firebase auth state changes (onAuthStateChanged)
 * - Provide login/logout/signup actions
 * - Auto-create Firestore user documents for new Google sign-ins
 * - Expose the current user to all components seamlessly
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
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { FirebaseAuthUser } from '../types/user.types';
import type { UserRole } from '../types/features';

/* ─────────────── Store Interface ─────────────── */

interface AuthStore {
  user: FirebaseAuthUser | null;
  loading: boolean;
  error: string | null;
  lastActiveAt: number | null;

  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initAuthListener: () => () => void;
}

/* ─────────────── Helpers ─────────────── */

/**
 * Maps a Firebase Auth User object to our lean FirebaseAuthUser interface.
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
 * Fetches a user's role from Firestore. 
 * If the document doesn't exist (e.g., new Google login), it creates a default one.
 */
async function fetchOrCreateUserProfile(fbUser: User): Promise<UserRole> {
  const userRef = doc(db, 'users', fbUser.uid);
  
  try {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      return (data.role === 'admin' || data.role === 'tester') ? data.role : 'user';
    } else {
      // CRITICAL FIX: Auto-create document for new users (especially Google sign-ups)
      await setDoc(userRef, {
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      return 'user';
    }
  } catch (err) {
    console.error('[AuthStore] Failed to fetch/create user profile:', err);
    return 'user';
  }
}

/* ─────────────── Store Definition ─────────────── */

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──
      user: null,
      loading: true, // Start true until Firebase verifies the persisted state
      error: null,
      lastActiveAt: null,

      // ── Actions ──

      loginWithEmail: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          const role = await fetchOrCreateUserProfile(credential.user);
          set({ 
            user: serializeUser(credential.user, role), 
            lastActiveAt: Date.now(),
            loading: false 
          });
        } catch (err: any) {
          set({ error: err.message || 'Login failed', loading: false });
          throw err;
        }
      },

      signUpWithEmail: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          // Create the user document immediately upon signup
          const role = await fetchOrCreateUserProfile(credential.user);
          set({ 
            user: serializeUser(credential.user, role), 
            lastActiveAt: Date.now(),
            loading: false 
          });
        } catch (err: any) {
          set({ error: err.message || 'Sign up failed', loading: false });
          throw err;
        }
      },

      loginWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
          const provider = new GoogleAuthProvider();
          const credential = await signInWithPopup(auth, provider);
          // Will fetch role OR create a new DB document if they are brand new
          const role = await fetchOrCreateUserProfile(credential.user);
          set({ 
            user: serializeUser(credential.user, role), 
            lastActiveAt: Date.now(),
            loading: false 
          });
        } catch (err: any) {
          set({ error: err.message || 'Google login failed', loading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({ user: null, error: null, lastActiveAt: null });
        } catch (err: any) {
          set({ error: err.message || 'Logout failed' });
        }
      },

      clearError: () => set({ error: null }),

      initAuthListener: () => {
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const { lastActiveAt } = get();
        
        // ── 7-Day Inactivity Check ──
        if (lastActiveAt && (Date.now() - lastActiveAt > SEVEN_DAYS_MS)) {
          console.warn('[AuthStore] Session expired due to inactivity.');
          signOut(auth).catch(console.error);
          set({ user: null, lastActiveAt: null, error: 'Session expired. Please log in again.', loading: false });
        }

        /**
         * Subscribe to Firebase auth state changes.
         */
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            // User is verified by Firebase Server
            const role = await fetchOrCreateUserProfile(fbUser);
            set({ 
              user: serializeUser(fbUser, role), 
              lastActiveAt: Date.now(), 
              loading: false 
            });
          } else {
            // User is logged out
            set({ user: null, lastActiveAt: null, loading: false });
          }
        });

        return unsubscribe;
      },
    }),
    {
      name: 'herizon-auth-cache', // unique name for localStorage
      partialize: (state) => ({ 
        user: state.user,
        lastActiveAt: state.lastActiveAt
      }),
    }
  )
);