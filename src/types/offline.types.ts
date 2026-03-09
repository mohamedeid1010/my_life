/**
 * ═══════════════════════════════════════════════════
 *  Offline / PWA Types — Sync queue for offline ops
 * ═══════════════════════════════════════════════════
 */

/** Type of mutation that was performed offline */
export type OfflineActionType =
  | 'GYM_TOGGLE_DAY'
  | 'GYM_UPDATE_SESSION'
  | 'GYM_DELETE_SESSION'
  | 'GYM_UPDATE_WEIGHT'
  | 'GYM_UPDATE_BODY_FAT'
  | 'HABIT_LOG_ENTRY'
  | 'HABIT_ADD'
  | 'HABIT_UPDATE'
  | 'HABIT_DELETE'
  | 'PREFERENCES_UPDATE'
  | 'WEEKLY_PLANNER_UPDATE';

/** A single pending action queued while offline */
export interface PendingAction {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

/** Sync engine state */
export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingActions: PendingAction[];
  lastSyncedAt: string | null;
  lastError: string | null;
}
