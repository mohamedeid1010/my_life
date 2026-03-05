/**
 * ═══════════════════════════════════════════════════════════
 *  Firebase Configuration — Modular SDK v10+
 * ═══════════════════════════════════════════════════════════
 *
 *  Initializes the Firebase app, Auth, and Firestore services.
 *
 *  Config values are read from Vite environment variables
 *  (VITE_FIREBASE_*) with hardcoded fallbacks so the app
 *  works out-of-the-box without a .env file.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';


/* ─────────────── Firebase Configuration ─────────────── */

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyAWPGftVLRq_3y7d4ABOtAUaWMg5nF_QXM",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "my-life-3519c.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "my-life-3519c",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "my-life-3519c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "628407543082",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:628407543082:web:e281446795ab10b333aa53",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || "G-GBGK8SWXDL",
};

/* ─────────────── Initialize Services ─────────────── */

/** The root Firebase app instance */
const app = initializeApp(firebaseConfig);

/** Firebase Authentication instance */
export const auth = getAuth(app);

/**
 * Cloud Firestore instance.
 * `experimentalAutoDetectLongPolling` is enabled to improve
 * reliability behind corporate proxies and restrictive networks.
 */
const db = (() => {
  try {
    // Try to get instance first (prevents "already initialized" errors in HMR)
    const existingDb = getFirestore(app);
    return existingDb;
  } catch {
    // If not initialized, do it now with cache settings
    try {
      return initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (err) {
      console.error('Firestore initialization with cache failed, falling back to default:', err);
      return initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true
      });
    }
  }
})();

export { db };
export default app;
