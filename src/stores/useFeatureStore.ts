/**
 * ═══════════════════════════════════════════════════════════
 *  useFeatureStore — Zustand store for Feature Flags & RBAC
 * ═══════════════════════════════════════════════════════════
 *
 *  Responsibilities:
 *  - Fetch global feature flags from Firestore `system_settings/features`
 *  - Store these flags in memory for instant synchronous checks
 *  - Provide a helper function `canAccessFeature` to evaluate permissions
 */

import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { FeaturesDocument, FeatureKey, UserRole } from '../types/features';

interface FeatureStore {
  // ── State ──
  features: FeaturesDocument | null;
  loading: boolean;
  unsubscribeFn: (() => void) | null;

  // ── Firestore I/O ──
  /** Starts listening to the global feature flags document */
  initFeatureListener: () => void;
  /** Cleans up the listener when no longer needed */
  cleanup: () => void;

  // ── Helpers ──
  /** Evaluates if a given role has access to a specific feature */
  canAccessFeature: (featureName: FeatureKey, userRole: UserRole) => boolean;
}

export const useFeatureStore = create<FeatureStore>((set, get) => ({
  features: null,
  loading: true,
  unsubscribeFn: null,

  initFeatureListener: () => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) {
      unsubscribeFn(); // Clean up existing listener
    }

    set({ loading: true });

    const featuresRef = doc(db, 'system_settings', 'features');
    
    const unsubscribe = onSnapshot(
      featuresRef,
      (docSnap) => {
        if (docSnap.exists()) {
          set({ features: docSnap.data() as FeaturesDocument, loading: false });
        } else {
          // If document doesn't exist yet, we can default to an empty configuration
          // or handle it gracefully. Here we just set features to an empty object.
          console.warn('[FeatureStore] system_settings/features document not found.');
          set({ features: {} as FeaturesDocument, loading: false });
        }
      },
      (error) => {
        console.error('[FeatureStore] Error listening to feature flags:', error);
        set({ loading: false });
      }
    );

    set({ unsubscribeFn: unsubscribe });
  },

  cleanup: () => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) {
      unsubscribeFn();
      set({ unsubscribeFn: null, features: null, loading: true });
    }
  },

  canAccessFeature: (featureName: FeatureKey, userRole: UserRole): boolean => {
    const { features, loading } = get();

    // If still loading, err on the side of caution (deny access) or fallback.
    // Usually, you might want to show a spinner in the component itself.
    if (loading || !features) return false;

    const config = features[featureName];

    // If the feature isn't defined in the database, deny access by default.
    if (!config) return false;

    // 1. Check primary kill switch
    if (!config.enabled) return false;

    // 2. Check RBAC
    if (config.allowedRoles && config.allowedRoles.includes(userRole)) {
      return true;
    }

    return false;
  },
}));
