/**
 * ═══════════════════════════════════════════════════════════
 *  Feature Flags & RBAC Types
 * ═══════════════════════════════════════════════════════════
 */

// 1. Define the possible User Roles
export type UserRole = 'admin' | 'tester' | 'user';

// 2. Define the configuration structure for a single Feature Flag
export interface FeatureFlagConfig {
  /** Master switch to completely disable a feature for everyone */
  enabled: boolean;
  /** List of roles permitted to access this feature */
  allowedRoles: UserRole[];
}

// 3. Define the available Feature Keys (expand this as you add more features)
export type FeatureKey = 
  | 'beta_dashboard' 
  | 'advanced_analytics' 
  | 'experimental_offline_sync';

// 4. Define the structure of the Firestore Document that will hold these flags
export type FeaturesDocument = Record<FeatureKey, FeatureFlagConfig>;

// 5. Extend your existing User interface to include a role
export interface UserWithRole {
  uid: string;
  email: string | null;
  role: UserRole;
}
