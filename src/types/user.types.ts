/**
 * ═══════════════════════════════════════════════════
 *  User Types — Maps to Firebase Auth + Firestore
 * ═══════════════════════════════════════════════════
 */

/** Firebase Auth user (subset we rely on) */
export interface FirebaseAuthUser {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoURL: string | null;
}

/** User profile stored in Firestore: users/{uid}/preferences/main */
export interface UserProfile {
  /** Display name (overrides Firebase displayName) */
  name: string;

  /** Profile photo URL or base64 data URI */
  photoURL: string;
}

/** Auth store state */
export interface AuthState {
  user: FirebaseAuthUser | null;
  loading: boolean;
  error: string | null;
}
