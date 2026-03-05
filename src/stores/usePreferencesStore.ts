/**
 * ═══════════════════════════════════════════════════════════
 *  usePreferencesStore — Zustand store for User Preferences
 * ═══════════════════════════════════════════════════════════
 *
 *  Replaces: PreferencesContext.jsx
 *
 *  Responsibilities:
 *  - Profile management (name, photo)
 *  - Theme switching (dark / light / midnight)
 *  - Language switching (en / ar)
 *  - Per-page layout configuration (widget visibility + ordering)
 *  - Firestore persistence in users/{uid}/preferences/main
 */

import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  saving: boolean;

  // ── Firebase I/O ──
  /** Load preferences from Firestore for the given user */
  loadPreferences: (uid: string) => Promise<void>;

  // ── Mutations ──
  /** Update profile (name and/or photo). Saves to Firestore immediately. */
  updateProfile: (uid: string, newProfile: UserProfile) => void;

  /** Switch theme. Saves to Firestore immediately. */
  updateTheme: (uid: string, newTheme: ThemeId) => void;

  /** Switch language. Saves to Firestore immediately. */
  updateLanguage: (uid: string, newLang: LanguageId) => void;

  /** Update layout for a specific page. Saves to Firestore immediately. */
  updateLayout: (uid: string, page: keyof PageLayouts, newLayout: LayoutWidget[]) => void;
}

/* ─────────────── Firestore Helper ─────────────── */

/**
 * Saves a partial preferences update to Firestore.
 * Uses { merge: true } to avoid overwriting other preferences fields.
 */
async function savePrefsToDB(
  uid: string,
  updates: Partial<UserPreferences>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', uid, 'preferences', 'main');
    await setDoc(docRef, updates, { merge: true });
  } catch (err) {
    console.error('[PreferencesStore] Failed to save preferences:', err);
  }
}

/**
 * Merges loaded layouts with defaults.
 * This ensures that newly added widgets appear in the user's layout
 * even if they saved their preferences before the widget existed.
 */
function mergeLayouts(
  savedLayouts: Partial<PageLayouts> | undefined
): PageLayouts {
  if (!savedLayouts) return { ...DEFAULT_LAYOUTS };

  const merged: PageLayouts = { ...DEFAULT_LAYOUTS };

  (Object.keys(DEFAULT_LAYOUTS) as Array<keyof PageLayouts>).forEach(
    (page) => {
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
    }
  );

  return merged;
}

/* ─────────────── Store Definition ─────────────── */

export const usePreferencesStore = create<PreferencesStore>((set) => ({
  // ── Initial State ──
  profile: { name: '', photoURL: '' },
  theme: 'dark',
  language: 'en',
  layouts: { ...DEFAULT_LAYOUTS },
  loading: true,
  saving: false,

  // ── Firebase I/O ──

  loadPreferences: async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid, 'preferences', 'main');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<UserPreferences>;

        set({
          profile: data.profile || { name: '', photoURL: '' },
          theme: data.theme || 'dark',
          language: data.language || 'en',
          layouts: mergeLayouts(data.layouts),
        });
      }
    } catch (err) {
      console.error('[PreferencesStore] Failed to load preferences:', err);
    } finally {
      set({ loading: false });
    }
  },

  // ── Mutations ──

  updateProfile: (uid: string, newProfile: UserProfile) => {
    set({ profile: newProfile, saving: true });
    savePrefsToDB(uid, { profile: newProfile }).finally(() =>
      set({ saving: false })
    );
  },

  updateTheme: (uid: string, newTheme: ThemeId) => {
    set({ theme: newTheme, saving: true });
    savePrefsToDB(uid, { theme: newTheme }).finally(() =>
      set({ saving: false })
    );
  },

  updateLanguage: (uid: string, newLang: LanguageId) => {
    set({ language: newLang, saving: true });
    savePrefsToDB(uid, { language: newLang }).finally(() =>
      set({ saving: false })
    );
  },

  updateLayout: (
    uid: string,
    page: keyof PageLayouts,
    newLayout: LayoutWidget[]
  ) => {
    set((state) => {
      const newLayouts = { ...state.layouts, [page]: newLayout };
      set({ saving: true });
      savePrefsToDB(uid, { layouts: newLayouts }).finally(() =>
        set({ saving: false })
      );
      return { layouts: newLayouts };
    });
  },
}));
