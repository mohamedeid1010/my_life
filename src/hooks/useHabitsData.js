import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useHabitStore } from '../stores/useHabitStore';

/**
 * ═══════════════════════════════════════════════════════════
 *  useHabitsData Hook 
 * ═══════════════════════════════════════════════════════════
 * 
 * Re-written to simply act as a selector wrapper around the 
 * Zustand `useHabitStore`, which now handles all Firebase
 * subcollection syncing and state management.
 * 
 * This keeps the React components clean while enabling 
 * real-time sync across devices.
 */
export default function useHabitsData() {
  const user = useAuthStore((s) => s.user);
  
  // ── Zustand Selectors ──
  // These internal subscriptions ensure the hook re-renders when data changes
  const _habitsRaw = useHabitStore(s => s.habits);
  const _logsRaw = useHabitStore(s => s.logs);
  const storeLoaded = useHabitStore(s => s.loaded);
  const storeSaving = useHabitStore(s => s.saving);
  const getHabitsWithStats = useHabitStore(s => s.getHabitsWithStats);
  const getActiveHabits = useHabitStore(s => s.getActiveHabits);
  const getAnalytics = useHabitStore(s => s.getAnalytics);
  
  const addHabitToStore = useHabitStore(s => s.addHabit);
  const updateHabitToStore = useHabitStore(s => s.updateHabit);
  const deleteHabitFromStore = useHabitStore(s => s.deleteHabit);
  const logHabitEntryToStore = useHabitStore(s => s.logHabitEntry);

  const initSync = useHabitStore(s => s.initSync);
  const cleanup = useHabitStore(s => s.cleanup);

  // ── Real-time Sync Initialization ──
  useEffect(() => {
    if (!user) {
      cleanup();
      return;
    }

    // Starts the onSnapshot listener for this user's habits and logs
    initSync(user.uid);

    return () => {
      cleanup();
    };
  }, [user, initSync, cleanup]);

  // ── Wrapped Mutations (injecting UID) ──
  const addHabit = (newHabit) => {
    if (!user) return;
    addHabitToStore(user.uid, newHabit);
  };

  const updateHabit = (id, updates) => {
    if (!user) return;
    updateHabitToStore(user.uid, id, updates);
  };

  const deleteHabit = (id) => {
    if (!user) return;
    deleteHabitFromStore(user.uid, id);
  };

  const logHabitEntry = (habitId, dateStr, entryData) => {
    if (!user) return;
    logHabitEntryToStore(user.uid, habitId, dateStr, entryData);
  };

  return {
    habits: getHabitsWithStats(),
    activeHabits: getActiveHabits(),
    analytics: getAnalytics(),
    addHabit,
    updateHabit,
    deleteHabit,
    logHabitEntry,
    loaded: storeLoaded,
    saving: storeSaving
  };
}
