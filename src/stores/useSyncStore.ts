import { create } from 'zustand';
import { SyncState, PendingAction, OfflineActionType } from '../types/offline.types';

interface SyncStore extends SyncState {
  // Actions
  addPendingAction: (action: Omit<PendingAction, 'id' | 'createdAt'>) => void;
  removePendingAction: (id: string) => void;
  clearPendingActions: () => void;
  setOnline: (online: boolean) => void;
  setError: (error: string | null) => void;
  updateLastSynced: () => void;
  
  // Specialized methods
  initOnlineListener: () => () => void; // Returns unsubscribe function
  flushQueue: (handler: (action: PendingAction) => Promise<void>) => Promise<void>;
}

/**
 * Offline sync store using Zustand
 * Manages pending actions queue and online/offline state
 */
export const useSyncStore = create<SyncStore>((set, get) => ({
  // Initial state
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingActions: [],
  lastSyncedAt: null,
  lastError: null,

  // ──── State Mutators ────

  addPendingAction: (action) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAction: PendingAction = {
      ...action,
      id,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    set((state) => ({
      pendingActions: [...state.pendingActions, newAction],
    }));
  },

  removePendingAction: (id) => {
    set((state) => ({
      pendingActions: state.pendingActions.filter((action) => action.id !== id),
    }));
  },

  clearPendingActions: () => {
    set({ pendingActions: [] });
  },

  setOnline: (online) => {
    set({ isOnline: online });
  },

  setError: (error) => {
    set({ lastError: error });
  },

  updateLastSynced: () => {
    set({ lastSyncedAt: new Date().toISOString() });
  },

  // ──── Specialized Methods ────

  /**
   * Initialize window online/offline event listeners
   * Returns unsubscribe function
   */
  initOnlineListener: () => {
    const handleOnline = () => get().setOnline(true);
    const handleOffline = () => get().setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return unsubscribe function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },

  /**
   * Flush pending actions queue by calling handler for each action
   * Remove action from queue after successful handler execution
   * Increment retry count on error (but don't remove)
   */
  flushQueue: async (handler) => {
    const state = get();

    if (state.isSyncing || state.pendingActions.length === 0) {
      return;
    }

    set({ isSyncing: true });

    try {
      const actionsToProcess = [...state.pendingActions];

      for (const action of actionsToProcess) {
        try {
          await handler(action);
          // Success: remove from queue
          get().removePendingAction(action.id);
          get().updateLastSynced();
          get().setError(null);
        } catch (error) {
          // Error: increment retry count but keep in queue
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          get().setError(errorMsg);
          console.warn(`Failed to sync action ${action.id}:`, errorMsg);
          // Could implement exponential backoff here by incrementing retryCount
        }
      }
    } finally {
      set({ isSyncing: false });
    }
  },
}));
