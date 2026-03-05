import React from 'react';
import { useFeatureStore } from '../stores/useFeatureStore';
import { useAuthStore } from '../stores/useAuthStore';
import type { FeatureKey } from '../types/features';

interface FeatureGuardProps {
  /** The unique key of the feature to check permissions for */
  featureName: FeatureKey;
  
  /** The component(s) to render if access is granted */
  children: React.ReactNode;
  
  /** 
   * Optional placeholder component to render if access is denied. 
   * Useful for showing a 'Pro Feature' lock screen or 'Coming Soon' message.
   * Defaults to rendering nothing (`null`).
   */
  fallback?: React.ReactNode;
}

/**
 * ═══════════════════════════════════════════════════════════
 *  FeatureGuard Component
 * ═══════════════════════════════════════════════════════════
 * 
 * Securely wraps UI elements based on Firestore Feature Flags.
 * Checks the current user's role against the global allowed roles
 * and checks the master feature toggle button.
 * 
 * Usage:
 * <FeatureGuard featureName="beta_dashboard" fallback={<UpgradeToPro />}>
 *   <NewPremiumDashboard />
 * </FeatureGuard>
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({ 
  featureName, 
  children, 
  fallback = null 
}) => {
  const { user } = useAuthStore();
  const { canAccessFeature, loading } = useFeatureStore();

  // If we are still pulling down the initial flags, don't show the feature yet.
  if (loading) return null;

  // We require a user to evaluate RBAC. If no user is logged in, access is denied.
  if (!user) return <>{fallback}</>;

  // Evaluate the feature flag rules synchronously.
  const hasAccess = canAccessFeature(featureName, user.role);

  // Render the feature if allowed, otherwise fall back.
  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
