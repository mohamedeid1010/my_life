/**
 * ═══════════════════════════════════════════════════════════
 * usePreferencesStore — Zustand store for User Preferences
 * ═══════════════════════════════════════════════════════════
 *
 * Responsibilities:
 * - Profile management (name, photo)
 * - Theme switching (dark / light / midnight)
 * - Language switching (en / ar)
 * - Per-page layout configuration (widget visibility + ordering)
 * - Real-time Firestore sync via onSnapshot for multi-device consistency
 * - Offline-first architecture (Firebase handles queuing automatically)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type {
  ThemeId,
  LanguageId,
  LayoutWidget,
  PageLayouts,
  UserPreferences,
} from '../types/preferences.types';
import type { UserProfile } from '../types/user.types';

/* ─────────────── Default Layouts ─────────────── */

/**
 * Default layout configurations for each page.
 * When new widgets are added to the codebase, they appear here
 * and are automatically merged into the user's saved layouts.
 */
const DEFAULT_LAYOUTS: PageLayouts = {
  overview: [
    { id: 'welcome', visible: true },
  ],
  gym: [
    { id: 'hero', visible: true },
    { id: 'daily', visible: true },
    { id: 'momentum', visible: true },
    { id: 'coach', visible: true },
    { id: 'patterns', visible: true },
    { id: 'gamification', visible: true },
    { id: 'heatmap', visible: true },
    { id: 'workout_progress', visible: true },
    { id: 'weight_progress', visible: true },
  ],
  habits: [
    { id: 'dashboard', visible: true },
    { id: 'analytics', visible: true },
  ],
};

/* ─────────────── Store Interface ─────────────── */

interface PreferencesStore {
  // ── State ──
  profile: UserProfile;
  theme: ThemeId;
  language: LanguageId;
  layouts: PageLayouts;
  loading: boolean;
  unsubscribeFn: (() => void) | null;

  // ── Sync Lifecycle ──
  initSync: (uid: string) => void;
  cleanup: () => void;

  // ── Mutations ──
  updateProfile: (uid: string, newProfile: UserProfile) => Promise<void>;
  updateTheme: (uid: string, newTheme: ThemeId) => Promise<void>;
  updateLanguage: (uid: string, newLang: LanguageId) => Promise<void>;
  updateLayout: (uid: string, page: keyof PageLayouts, newLayout: LayoutWidget[]) => Promise<void>;
}

/* ─────────────── Pure Helpers ─────────────── */

/**
 * Merges loaded layouts with defaults.
 * This ensures that newly added widgets appear in the user's layout
 * even if they saved their preferences before the widget existed.
 */
function mergeLayouts(savedLayouts: Partial<PageLayouts> | undefined): PageLayouts {
  if (!savedLayouts) return { ...DEFAULT_LAYOUTS };

  const merged: PageLayouts = { ...DEFAULT_LAYOUTS };

  (Object.keys(DEFAULT_LAYOUTS) as Array<keyof PageLayouts>).forEach((page) => {
    if (savedLayouts[page]) {
      const savedIds = savedLayouts[page]!.map((w) => w.id);
      const pageLayout = [...savedLayouts[page]!];

      // Append any new defaults that aren't in the saved layout
      DEFAULT_LAYOUTS[page].forEach((defW) => {
        if (!savedIds.includes(defW.id)) {
          pageLayout.push(defW);
        }
      });

      merged[page] = pageLayout;
    }
  });

  return merged;
}

/* ─────────────── Store Definition ─────────────── */

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
  // ── Initial State ──
  profile: { name: '', photoURL: '' },
  theme: 'dark',
  language: 'en',
  layouts: { ...DEFAULT_LAYOUTS },
  loading: true,
  unsubscribeFn: null,

  // ── Sync Lifecycle ──

  initSync: (uid: string) => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) {
      unsubscribeFn(); // Prevent duplicate listeners
    }

    set({ loading: true });
    const docRef = doc(db, 'users', uid, 'preferences', 'main');

    // Real-time listener: syncs theme, language, and layouts across all devices instantly
    const unsubscribe = onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<UserPreferences>;
        set({
          profile: data.profile || { name: '', photoURL: '' },
          theme: data.theme || 'dark',
          language: data.language || 'en',
          layouts: mergeLayouts(data.layouts),
          loading: false,
        });
      } else {
        // First time login, save default layout silently
        setDoc(docRef, { layouts: DEFAULT_LAYOUTS }, { merge: true }).catch(console.error);
        set({ loading: false });
      }
    }, (err) => {
      console.error('[PreferencesStore] Sync error:', err);
      set({ loading: false });
    });

    set({ unsubscribeFn: unsubscribe });
  },

  cleanup: () => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) unsubscribeFn();
    set({ 
      unsubscribeFn: null, 
      profile: { name: '', photoURL: '' }, 
      theme: 'dark', 
      language: 'en', 
      layouts: { ...DEFAULT_LAYOUTS },
      loading: true 
    });
  },

  // ── Mutations ──

  updateProfile: async (uid: string, newProfile: UserProfile) => {
    set({ profile: newProfile }); // Optimistic UI update
    try {
      await setDoc(doc(db, 'users', uid, 'preferences', 'main'), { profile: newProfile }, { merge: true });
    } catch (err) {
      console.error('[PreferencesStore] Failed to update profile:', err);
    }
  },

  updateTheme: async (uid: string, newTheme: ThemeId) => {
    set({ theme: newTheme }); // Optimistic UI update
    try {
      await setDoc(doc(db, 'users', uid, 'preferences', 'main'), { theme: newTheme }, { merge: true });
    } catch (err) {
      console.error('[PreferencesStore] Failed to update theme:', err);
    }
  },

  updateLanguage: async (uid: string, newLang: LanguageId) => {
    set({ language: newLang }); // Optimistic UI update
    try {
      await setDoc(doc(db, 'users', uid, 'preferences', 'main'), { language: newLang }, { merge: true });
    } catch (err) {
      console.error('[PreferencesStore] Failed to update language:', err);
    }
  },

  updateLayout: async (uid: string, page: keyof PageLayouts, newLayout: LayoutWidget[]) => {
    set((state) => {
      const newLayouts = { ...state.layouts, [page]: newLayout };
      return { layouts: newLayouts };
    }); // Optimistic UI update

    try {
      // Re-fetch the current state to send the newly merged layouts to Firestore
      const currentLayouts = get().layouts;
      await setDoc(doc(db, 'users', uid, 'preferences', 'main'), { layouts: currentLayouts }, { merge: true });
    } catch (err) {
      console.error('[PreferencesStore] Failed to update layout:', err);
    }
  },
    }),
    {
      name: 'herizon-preferences-store',
      partialize: (state) => ({
        profile: state.profile,
        theme: state.theme,
        language: state.language,
        layouts: state.layouts,
      }),
    }
  )
);