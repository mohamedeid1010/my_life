/**
 * ═══════════════════════════════════════════════════════════
 *  Firebase Configuration — Modular SDK v10+
 * ═══════════════════════════════════════════════════════════
 *
 *  Credentials are loaded exclusively from Vite environment
 *  variables. NO hardcoded fallbacks — if a variable is
 *  missing the app fails fast with a clear error message.
 *
 *  .env.development  →  used by `npm run dev`
 *  .env.production   →  used by `npm run build`
 *
 *  See .env.example for the full list of required variables.
 * ═══════════════════════════════════════════════════════════
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';


/* ─────────────── Environment Guard ─────────────── */

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missing = REQUIRED_VARS.filter((key) => !import.meta.env[key]);
if (missing.length > 0) {
  throw new Error(
    `\n❌ Horizon Firebase: Missing required environment variables:\n` +
    missing.map((k) => `   → ${k}`).join('\n') +
    `\n\n` +
    `Make sure you have a .env.development file (for dev) or .env.production\n` +
    `file (for builds). Copy .env.example and fill in your Firebase credentials.\n`
  );
}


/* ─────────────── Firebase Configuration ─────────── */

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};


/* ─────────────── Startup Banner ─────────────── */

const isProduction = import.meta.env.PROD;
const envLabel     = isProduction ? '🚀 PRODUCTION' : '🛠  DEV';
const envStyle     = isProduction
  ? 'color: #ff4444; font-weight: bold;'
  : 'color: #00cc88; font-weight: bold;';

console.log(
  `%c[Horizon Firebase] ${envLabel} — Project: ${firebaseConfig.projectId}`,
  envStyle
);

if (isProduction) {
  console.warn(
    '[Horizon Firebase] ⚠️  Connected to PRODUCTION Firestore. ' +
    'All reads/writes affect real user data.'
  );
}


/* ─────────────── Initialize Services ─────────────── */

/** The root Firebase app instance */
const app = initializeApp(firebaseConfig);

/** Firebase Authentication instance */
export const auth = getAuth(app);

/**
 * Cloud Firestore instance — offline-first with persistent cache.
 * `experimentalAutoDetectLongPolling` improves reliability behind
 * corporate proxies and restrictive networks.
 */
const db = (() => {
  const DB_ID = 'default';
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    }, DB_ID);
  } catch (err) {
    // Vite HMR re-runs this module — the app is already initialized.
    // Safely retrieve the existing Firestore instance.
    if (err.message?.includes('already-initialized') || err.code === 'failed-precondition') {
      try {
        return getFirestore(app, DB_ID);
      } catch (innerErr) {
        console.warn('[Horizon Firebase] Fallback getFirestore failed:', innerErr);
      }
    }
    console.error('[Horizon Firebase] Firestore init failed:', err);
    // Last resort: initialize without explicit DB ID
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
})();

export { db };
export default app;
