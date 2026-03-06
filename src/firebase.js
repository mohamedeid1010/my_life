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
  const DB_ID = "default";
  try {
    // Attempt to initialize with offline persistence immediately.
    // This provides bulletproof caching across browser reloads.
    const instance = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, DB_ID); // Your project's database named "default"
    // #region agent log
    fetch('http://127.0.0.1:7844/ingest/b473e0b7-e95c-427a-9cb2-ea7d4d9c5da5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e5e788'},body:JSON.stringify({sessionId:'e5e788',location:'firebase.js:db_init',message:'Firestore initialized',data:{databaseId:DB_ID},hypothesisId:'A',timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return instance;
  } catch (err) {
    // If it throws an error containing 'already-initialized' (typical in Vite HMR),
    // we safely fallback to retrieving the existing instance.
    if (err.message?.includes('already-initialized') || err.code === 'failed-precondition') {
      try {
        return getFirestore(app, DB_ID);
      } catch (innerErr) {
        console.warn('Fallback getFirestore failed:', innerErr);
      }
    }
    
    console.error('Firestore initialization with cache failed, falling back to default:', err);
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, DB_ID);
  }
})();

export { db };
export default app;
