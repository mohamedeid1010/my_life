/**
 * ═══════════════════════════════════════════════════════════
 * useFeatureStore — Zustand store for Feature Flags & RBAC
 * ═══════════════════════════════════════════════════════════
 *
 * Responsibilities:
 * - Fetch global feature flags from Firestore `system_settings/features`
 * - Store these flags in memory for instant synchronous checks
 * - Provide a robust, reactive way to check permissions across the app
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { FeaturesDocument, FeatureKey, UserRole } from '../types/features';

/* ─────────────── Pure Helper ─────────────── */

/**
 * Pure function to evaluate access. Extracted to allow reuse in both 
 * non-reactive functions (like router guards) and reactive React Hooks.
 */
export function evaluateAccess(
  features: FeaturesDocument | null,
  loading: boolean,
  featureName: FeatureKey,
  userRole: UserRole
): boolean {
  // If still loading or no features fetched, err on the side of caution (deny access)
  if (loading || !features) return false;

  const config = features[featureName];

  // If the feature isn't defined in the database, deny access by default
  if (!config) return false;

  // 1. Check primary kill switch (Global toggle)
  if (!config.enabled) return false;

  // 2. Check RBAC (Role-Based Access Control)
  if (config.allowedRoles && config.allowedRoles.includes(userRole)) {
    return true;
  }

  return false;
}

/* ─────────────── Store Interface ─────────────── */

interface FeatureStore {
  // ── State ──
  features: FeaturesDocument | null;
  loading: boolean;
  unsubscribeFn: (() => void) | null;

  // ── Firestore I/O ──
  initFeatureListener: () => void;
  cleanup: () => void;

  // ── Helpers ──
  canAccessFeature: (featureName: FeatureKey, userRole: UserRole) => boolean;
}

/* ─────────────── Store Definition ─────────────── */

export const useFeatureStore = create<FeatureStore>()(
  persist(
    (set, get) => ({
  features: null,
  loading: true,
  unsubscribeFn: null,

  initFeatureListener: () => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) {
      unsubscribeFn(); // Clean up existing listener to prevent memory leaks
    }

    set({ loading: true });

    const featuresRef = doc(db, 'system_settings', 'features');
    
    // Using includeMetadataChanges to ensure instant cache loading for PWAs/Offline
    const unsubscribe = onSnapshot(
      featuresRef,
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.exists()) {
          set({ features: docSnap.data() as FeaturesDocument, loading: false });
        } else {
          console.warn('[FeatureStore] system_settings/features document not found. Defaulting to empty.');
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

  /**
   * NOTE: Use this ONLY in standard JS functions (like utility files or outside React tree).
   * Inside React components, use the `useFeatureAccess` hook below for proper reactivity!
   */
  canAccessFeature: (featureName: FeatureKey, userRole: UserRole): boolean => {
    const { features, loading } = get();
    return evaluateAccess(features, loading, featureName, userRole);
  },
    }),
    {
      name: 'herizon-feature-store',
      partialize: (state) => ({
        features: state.features,
      }),
    }
  )
);

/* ─────────────── Reactive Custom Hook ─────────────── */

/**
 * Custom React Hook to safely and reactively check feature access inside components.
 * This guarantees the component will re-render instantly if a feature flag changes in Firestore.
 * * @example
 * const isPro = useFeatureAccess('premium_analytics', user.role);
 * if (!isPro) return <UpgradePrompt />;
 */
export function useFeatureAccess(featureName: FeatureKey, userRole: UserRole): boolean {
  // Select only the specific feature config and the loading state to optimize re-renders
  const featureConfig = useFeatureStore((state) => state.features?.[featureName]);
  const loading = useFeatureStore((state) => state.loading);

  // Fallback to evaluating with the current config
  if (loading || !featureConfig) return false;
  if (!featureConfig.enabled) return false;
  if (featureConfig.allowedRoles && featureConfig.allowedRoles.includes(userRole)) return true;

  return false;
}