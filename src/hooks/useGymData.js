import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useGymStore } from '../stores/useGymStore';

/**
 * ═══════════════════════════════════════════════════════════
 *  useGymData Hook
 * ═══════════════════════════════════════════════════════════
 *
 *  Refactored to simply act as a selector wrapper around the 
 *  Zustand `useGymStore`, which handles all Firestore 
 *  subcollection syncing and state management.
 *
 *  This keeps the React components perfectly intact while 
 *  enabling elite document-level real-time sync across devices.
 */
export default function useGymData() {
  const user = useAuthStore((s) => s.user);

  // ── Zustand Selectors ──
  const data = useGymStore((s) => s.data);
  const targetDays = useGymStore((s) => s.targetDays);
  const workoutSystem = useGymStore((s) => s.workoutSystem);
  const loaded = useGymStore((s) => s.loaded);
  const saving = useGymStore((s) => s.saving);

  const getEnrichedData = useGymStore((s) => s.getEnrichedData);
  const getStats = useGymStore((s) => s.getStats);

  const enrichedData = getEnrichedData();
  const stats = getStats();

  // ── Actions ──
  const initSync = useGymStore((s) => s.initSync);
  const cleanup = useGymStore((s) => s.cleanup);

  const _setTargetDays = useGymStore((s) => s.setTargetDays);
  const _setWorkoutSystem = useGymStore((s) => s.setWorkoutSystem);
  const _toggleDay = useGymStore((s) => s.toggleDay);
  const _updateWeight = useGymStore((s) => s.updateWeight);
  const _updateBodyFat = useGymStore((s) => s.updateBodyFat);
  const _updateSession = useGymStore((s) => s.updateSession);
  const _deleteSession = useGymStore((s) => s.deleteSession);
  const _markTodayComplete = useGymStore((s) => s.markTodayComplete);

  // ── Real-time Sync Initialization ──
  useEffect(() => {
    if (!user) {
      cleanup();
      return;
    }

    // Starts the onSnapshot listener for this user's gym profile + logs
    initSync(user.uid);

    return () => {
      cleanup();
    };
  }, [user, initSync, cleanup]);

  // ── Wrapped Mutations (Injecting UID) ──
  const setTargetDays = (days) => {
    if (!user) return;
    _setTargetDays(user.uid, days);
  };

  const setWorkoutSystem = (system) => {
    if (!user) return;
    _setWorkoutSystem(user.uid, system);
  };

  const updateWeight = (weekIndex, value) => {
    if (!user) return;
    _updateWeight(user.uid, weekIndex, value);
  };

  const updateBodyFat = (weekIndex, value) => {
    if (!user) return;
    _updateBodyFat(user.uid, weekIndex, value);
  };

  const toggleDay = (weekIndex, dayIndex) => {
    if (!user) return;
    _toggleDay(user.uid, weekIndex, dayIndex);
  };

  const updateSession = (weekIndex, dayIndex, sessionData) => {
    if (!user) return;
    _updateSession(user.uid, weekIndex, dayIndex, sessionData);
  };

  const deleteSession = (weekIndex, dayIndex) => {
    if (!user) return;
    _deleteSession(user.uid, weekIndex, dayIndex);
  };

  const markTodayComplete = () => {
    if (!user) return;
    _markTodayComplete(user.uid);
  };

  return {
    data,
    targetDays,
    setTargetDays,
    workoutSystem,
    setWorkoutSystem,
    toggleDay,
    updateWeight,
    updateBodyFat,
    updateSession,
    deleteSession,
    enrichedData,
    stats,
    markTodayComplete,
    loaded,
    saving,
  };
}
