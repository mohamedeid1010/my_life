/**
 * ═══════════════════════════════════════════════════════════
 *  useSyncStore — Zustand store for Offline Sync Engine
 * ═══════════════════════════════════════════════════════════
 *
 *  Replaces: N/A (new feature)
 *
 *  Responsibilities:
 *  - Track online/offline status
 *  - Queue mutations performed while offline
 *  - Flush the queue when connectivity is restored
 *  - Persist pending actions to localStorage for crash recovery
 */

import { create } from 'zustand';
import type { PendingAction, OfflineActionType, SyncState } from '../types/offline.types';

/* ─────────────── Constants ─────────────── */

/** localStorage key for persisting the offline action queue */
const STORAGE_KEY = 'herizon_offline_queue';

/** Maximum number of retry attempts before dropping an action */
const MAX_RETRIES = 5;

/* ─────────────── Store Interface ─────────────── */

interface SyncStore extends SyncState {
  /**
   * Enqueue a mutation to be synced later.
   * If online, the caller should still sync immediately — this is a fallback.
   */
  enqueueAction: (type: OfflineActionType, payload: Record<string, unknown>) => void;

  /**
   * Attempt to sync all pending actions to Firebase.
   * The actual Firestore writes are delegated to the `syncHandler` callback
   * provided by the caller (gym store, habit store, etc.).
   *
   * @param syncHandler — Async function that processes a single PendingAction.
   *                       It should throw on failure so the action stays queued.
   */
  flushQueue: (syncHandler: (action: PendingAction) => Promise<void>) => Promise<void>;

  /** Remove a specific action from the queue (e.g. after successful sync) */
  removeAction: (actionId: string) => void;

  /** Clear the entire queue (e.g. on logout) */
  clearQueue: () => void;

  /** Set online/offline status (called by event listeners) */
  setOnline: (isOnline: boolean) => void;

  /** Initialize online status listener. Returns cleanup function. */
  initOnlineListener: () => () => void;
}

/* ─────────────── localStorage Persistence ─────────────── */

/**
 * Load pending actions from localStorage.
 * This ensures we don't lose queued mutations if the user
 * closes the browser while offline.
 */
function loadPersistedQueue(): PendingAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save pending actions to localStorage.
 */
function persistQueue(actions: PendingAction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  } catch {
    // Silently fail — localStorage might be full or unavailable
    console.warn('[SyncStore] Failed to persist offline queue');
  }
}

/* ─────────────── Store Definition ─────────────── */

export const useSyncStore = create<SyncStore>((set, get) => ({
  // ── Initial State ──
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingActions: loadPersistedQueue(),
  lastSyncedAt: null,
  lastError: null,

  // ── Actions ──

  enqueueAction: (type: OfflineActionType, payload: Record<string, unknown>) => {
    const action: PendingAction = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    set((state) => {
      const updated = [...state.pendingActions, action];
      persistQueue(updated);
      return { pendingActions: updated };
    });
  },

  flushQueue: async (syncHandler: (action: PendingAction) => Promise<void>) => {
    const { pendingActions, isOnline } = get();

    // Don't attempt sync if offline or queue is empty
    if (!isOnline || pendingActions.length === 0) return;

    set({ isSyncing: true, lastError: null });

    const remainingActions: PendingAction[] = [];

    for (const action of pendingActions) {
      try {
        await syncHandler(action);
        // Action synced successfully — don't add to remaining
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : 'Unknown sync error';

        // Increment retry count
        const updatedAction: PendingAction = {
          ...action,
          retryCount: action.retryCount + 1,
        };

        // Only keep if under max retries
        if (updatedAction.retryCount < MAX_RETRIES) {
          remainingActions.push(updatedAction);
        } else {
          console.error(
            `[SyncStore] Dropping action ${action.id} after ${MAX_RETRIES} retries:`,
            errMessage
          );
        }
      }
    }

    // Update state and persist
    persistQueue(remainingActions);
    set({
      pendingActions: remainingActions,
      isSyncing: false,
      lastSyncedAt: new Date().toISOString(),
      lastError: remainingActions.length > 0 ? 'Some actions failed to sync' : null,
    });
  },

  removeAction: (actionId: string) => {
    set((state) => {
      const updated = state.pendingActions.filter((a) => a.id !== actionId);
      persistQueue(updated);
      return { pendingActions: updated };
    });
  },

  clearQueue: () => {
    persistQueue([]);
    set({ pendingActions: [], lastError: null });
  },

  setOnline: (isOnline: boolean) => {
    set({ isOnline });
  },

  initOnlineListener: () => {
    const handleOnline = () => set({ isOnline: true });
    const handleOffline = () => set({ isOnline: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
}));
