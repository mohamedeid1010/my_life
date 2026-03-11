/**
 * ═══════════════════════════════════════════════════════════
 * useSyncStore — Zustand store for offline sync & network state
 * ═══════════════════════════════════════════════════════════
 *
 * Responsibilities:
 * - Track online/offline state
 * - Queue pending actions when offline
 * - Flush queue when app comes back online
 * - Trigger Firebase sync operations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ─────────────── Store Interface ─────────────── */

interface SyncAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

interface SyncStore {
  isOnline: boolean;
  pendingActions: SyncAction[];

  setOnlineStatus: (online: boolean) => void;
  addPendingAction: (action: SyncAction) => void;
  removePendingAction: (actionId: string) => void;
  clearPendingActions: () => void;
  initOnlineListener: () => (() => void) | undefined;
  flushQueue: (callback: (action: SyncAction) => Promise<void>) => Promise<void>;
}

/* ─────────────── Store Definition ─────────────── */

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
  // ── Initial State ──
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingActions: [],

  // ── Actions ──

  setOnlineStatus: (online: boolean) => {
    set({ isOnline: online });
    // Trigger flush when coming back online
    if (online) {
      get().flushQueue(async () => {
        // Default no-op; caller will provide the actual callback
      });
    }
  },

  addPendingAction: (action: SyncAction) => {
    set((state) => ({
      pendingActions: [...state.pendingActions, action],
    }));
  },

  removePendingAction: (actionId: string) => {
    set((state) => ({
      pendingActions: state.pendingActions.filter((a) => a.id !== actionId),
    }));
  },

  clearPendingActions: () => {
    set({ pendingActions: [] });
  },

  initOnlineListener: () => {
    if (typeof window === 'undefined') return undefined;

    const handleOnline = () => {
      get().setOnlineStatus(true);
    };

    const handleOffline = () => {
      get().setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return unsubscribe function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },

  flushQueue: async (callback: (action: SyncAction) => Promise<void>) => {
    const { pendingActions, isOnline } = get();

    if (!isOnline || pendingActions.length === 0) {
      return;
    }

    for (const action of pendingActions) {
      try {
        await callback(action);
        get().removePendingAction(action.id);
      } catch (err) {
        console.error('[SyncStore] Failed to sync action:', action, err);
        // Keep action in queue for retry
      }
    }
  },
    }),
    {
      name: 'herizon-sync-store',
      partialize: (state) => ({
        pendingActions: state.pendingActions,
      }),
    }
  )
);
