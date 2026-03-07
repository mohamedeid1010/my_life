/**
 * ═══════════════════════════════════════════════════════════
 *  useHabitStore — Zustand store for Habit Management
 * ═══════════════════════════════════════════════════════════
 *
 *  Responsibilities:
 *  - CRUD operations for habits (Firestore subcollection: users/{uid}/habits/{habitId})
 *  - Daily habit entry logging (Firestore subcollection: users/{uid}/habits/{habitId}/logs/{date})
 *  - Grace day tracking & Streak computation
 *  - Mastery phase calculation
 *  - Real-time Firestore sync via onSnapshot
 *  - Offline action queuing via useSyncStore
 */

import { create } from 'zustand';
import { 
  collection, doc, setDoc, getDocs, getDocsFromServer, deleteDoc, 
  onSnapshot, query, where, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useSyncStore } from './useSyncStore';
import type {
  HabitRaw,
  HabitEntry,
  HabitStats,
  HabitMastery,
  HabitWithStats,
} from '../types/habits.types';
import type { GlobalHabitsAnalytics, WeakestHabitAnalysis } from '../types/analytics.types';

/* ════════════════════════════════════════════════════════
 *  PURE HELPER FUNCTIONS (testable, no side effects)
 * ════════════════════════════════════════════════════════ */

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeHabitStats(habit: HabitRaw): HabitStats {
  const todayStr = getLocalDateString();
  const todayObj = new Date(todayStr);
  todayObj.setHours(0, 0, 0, 0);

  const history = habit.history || {};
  const allDates = Object.keys(history).sort();

  let totalCompleted = 0;
  let totalMissed = 0;
  let graceDaysUsedThisMonth = 0;

  const currentMonth = todayObj.getMonth();
  const currentYear = todayObj.getFullYear();

  allDates.forEach((dateStr) => {
    const entry = history[dateStr];
    const dateObj = new Date(dateStr);

    if (entry.status === 'completed') totalCompleted++;
    if (entry.status === 'missed') totalMissed++;

    if (
      entry.status === 'skipped' &&
      dateObj.getMonth() === currentMonth &&
      dateObj.getFullYear() === currentYear
    ) {
      graceDaysUsedThisMonth++;
    }
  });

  const graceDaysBalance = Math.max(
    0,
    (habit.graceDaysAllowance || 0) - graceDaysUsedThisMonth
  );

  let startDateObj = todayObj;
  if (habit.startDate) {
    startDateObj = new Date(habit.startDate);
  } else if (allDates.length > 0) {
    startDateObj = new Date(allDates[0]);
  }
  startDateObj.setHours(0, 0, 0, 0);

  const daysPassedSinceStart =
    startDateObj <= todayObj
      ? Math.floor(
          (todayObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      : 0;

  const successRate =
    daysPassedSinceStart > 0
      ? Math.round((totalCompleted / daysPassedSinceStart) * 100)
      : 0;

  let currentStreak = 0;
  const isActiveDay = new Date(todayObj);

  if (!history[todayStr] || history[todayStr].status === 'pending') {
    isActiveDay.setDate(isActiveDay.getDate() - 1);
  }

  while (true) {
    const checkStr = getLocalDateString(isActiveDay);
    const entry = history[checkStr];

    if (entry?.status === 'completed') {
      currentStreak++;
      isActiveDay.setDate(isActiveDay.getDate() - 1);
    } else if (entry?.status === 'skipped') {
      isActiveDay.setDate(isActiveDay.getDate() - 1);
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let tempStreak = 0;

  if (allDates.length > 0) {
    const firstDateObj = new Date(allDates[0]);
    const runner = new Date(firstDateObj);

    while (runner <= todayObj) {
      const runStr = getLocalDateString(runner);
      const entry = history[runStr];

      if (entry?.status === 'completed') {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else if (entry?.status === 'skipped') {
        // skipped
      } else if (entry?.status === 'missed' || runStr !== todayStr) {
        tempStreak = 0;
      }
      runner.setDate(runner.getDate() + 1);
    }
  }

  let masteryPhase: HabitMastery['phase'] = 'Initiation';
  let masteryProgress = 0;
  let nextThreshold = 21;

  if (currentStreak >= 66) {
    masteryPhase = 'Mastery';
    masteryProgress = 100;
  } else if (currentStreak >= 21) {
    masteryPhase = 'Integration';
    masteryProgress = Math.round(((currentStreak - 21) / (66 - 21)) * 100);
    nextThreshold = 66;
  } else {
    masteryPhase = 'Initiation';
    masteryProgress = Math.round((currentStreak / 21) * 100);
    nextThreshold = 21;
  }

  let totalCompletedThisYear = 0;
  allDates.forEach((dateStr) => {
    const entry = history[dateStr];
    const dateObj = new Date(dateStr);
    if (
      entry.status === 'completed' &&
      dateObj.getFullYear() === currentYear
    ) {
      totalCompletedThisYear++;
    }
  });

  const startOfYear = new Date(currentYear, 0, 1);
  const daysPassedThisYear =
    Math.floor(
      (todayObj.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
  const yearlyAdherenceRate = Math.round(
    (totalCompletedThisYear / daysPassedThisYear) * 100
  );

  return {
    totalCompleted,
    totalMissed,
    successRate,
    currentStreak,
    longestStreak,
    graceDaysBalance,
    yearlyAdherenceRate,
    startDateStr: getLocalDateString(startDateObj),
    daysPassedSinceStart,
    totalCompletedThisYear,
    daysPassedThisYear,
    mastery: {
      phase: masteryPhase,
      progress: masteryProgress,
      currentDays: currentStreak,
      nextThreshold,
    },
    todayEntry: history[todayStr] || null,
  };
}

function computeGlobalAnalytics(
  activeHabits: HabitWithStats[]
): GlobalHabitsAnalytics | null {
  if (!activeHabits || activeHabits.length === 0) return null;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear--;
  }

  let currMonthExpected = 0;
  let currMonthCompleted = 0;
  let prevMonthExpected = 0;
  let prevMonthCompleted = 0;

  let strongest: HabitWithStats | null = null;
  let maxScore = -1;

  let weakest: WeakestHabitAnalysis | null = null;
  let minScore = Number.MAX_SAFE_INTEGER;

  activeHabits.forEach((h) => {
    const history = h.history || {};

    let hCurrExpected = 0;
    let hCurrCompleted = 0;
    let hPrevExpected = 0;
    let hPrevCompleted = 0;

    const missedDaysOfWeek: Record<number, number> = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
    };

    Object.entries(history).forEach(([dateStr, entry]) => {
      const d = new Date(dateStr);
      const m = d.getMonth();
      const y = d.getFullYear();

      const isResolved =
        entry.status === 'completed' || entry.status === 'missed';

      if (m === currentMonth && y === currentYear && isResolved) {
        hCurrExpected++;
        if (entry.status === 'completed') hCurrCompleted++;
      }

      if (m === prevMonth && y === prevYear && isResolved) {
        hPrevExpected++;
        if (entry.status === 'completed') hPrevCompleted++;
      }

      if (entry.status === 'missed') {
        missedDaysOfWeek[d.getDay()]++;
      }
    });

    currMonthExpected += hCurrExpected;
    currMonthCompleted += hCurrCompleted;
    prevMonthExpected += hPrevExpected;
    prevMonthCompleted += hPrevCompleted;

    const score = h.stats.currentStreak * 2 + h.stats.successRate;

    if (score > maxScore) {
      maxScore = score;
      strongest = h;
    }

    if (score < minScore && Object.keys(history).length > 2) {
      minScore = score;

      let worstDayNum = 0;
      let mostMisses = -1;
      Object.entries(missedDaysOfWeek).forEach(([day, count]) => {
        if (count > mostMisses) {
          mostMisses = count;
          worstDayNum = parseInt(day, 10);
        }
      });

      const dayNames = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday',
      ];

      weakest = {
        ...h,
        worstDay: mostMisses > 0 ? dayNames[worstDayNum] : 'N/A',
      };
    }
  });

  if (!weakest && activeHabits.length > 0) {
    const min = activeHabits.reduce((a, b) =>
      a.stats.successRate < b.stats.successRate ? a : b
    );
    weakest = { ...min, worstDay: 'N/A' };
  }
  if (!strongest && activeHabits.length > 0) {
    strongest = activeHabits[0];
  }

  const currConsistency =
    currMonthExpected > 0
      ? Math.round((currMonthCompleted / currMonthExpected) * 100)
      : 0;
  const prevConsistency =
    prevMonthExpected > 0
      ? Math.round((prevMonthCompleted / prevMonthExpected) * 100)
      : 0;
  const momDelta = currConsistency - prevConsistency;

  const monthDates: number[] = [];
  const _today = new Date();
  _today.setHours(0, 0, 0, 0);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(_today);
    d.setDate(d.getDate() - i);
    const dStr = getLocalDateString(d);

    let dayTotal = 0;
    let dayComp = 0;
    activeHabits.forEach((h) => {
      const entry = h.history?.[dStr];
      if (
        entry &&
        (entry.status === 'completed' || entry.status === 'missed')
      ) {
        dayTotal++;
        if (entry.status === 'completed') dayComp++;
      }
    });
    monthDates.push(dayTotal > 0 ? Math.round((dayComp / dayTotal) * 100) : 0);
  }

  return {
    globalConsistency: currConsistency,
    monthOverMonthDelta: momDelta,
    strongestHabit: strongest,
    weakestHabit: weakest,
    monthTrendData: monthDates,
  };
}

/* ════════════════════════════════════════════════════════
 *  ZUSTAND STORE
 * ════════════════════════════════════════════════════════ */

interface HabitStore {
  // ── Raw State ──
  habits: HabitRaw[];
  loaded: boolean;
  saving: boolean;
  unsubscribeFn: (() => void) | null;
  syncCounter: number; 

  // ── Derived Selectors ──
  getHabitsWithStats: () => HabitWithStats[];
  getActiveHabits: () => HabitWithStats[];
  getAnalytics: () => GlobalHabitsAnalytics | null;

  // ── Firebase I/O ──
  /** Initializes real-time listener for user's habits & logs */
  initSync: (uid: string) => void;
  /** Cleans up listener */
  cleanup: () => void;

  // ── Mutations ──
  addHabit: (uid: string, newHabit: Omit<HabitRaw, 'id' | 'history'>) => Promise<void>;
  updateHabit: (uid: string, id: string, updates: Partial<HabitRaw>) => Promise<void>;
  reorderHabits: (uid: string, orderedHabitIds: string[]) => Promise<void>;
  deleteHabit: (uid: string, id: string) => Promise<void>;
  logHabitEntry: (
    uid: string,
    habitId: string,
    dateStr: string,
    entryData: Partial<HabitEntry>
  ) => Promise<void>;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  loaded: false,
  saving: false,
  unsubscribeFn: null,
  syncCounter: 0,

  getHabitsWithStats: (): HabitWithStats[] => {
    const { habits } = get();
    return habits.map((h) => ({
      ...h,
      stats: computeHabitStats(h),
    }));
  },

  getActiveHabits: (): HabitWithStats[] => {
    return get()
      .getHabitsWithStats()
      .filter((h) => !h.isHidden)
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id); // Stable tie-breaker
      });
  },

  getAnalytics: (): GlobalHabitsAnalytics | null => {
    const activeHabits = get().getActiveHabits();
    return computeGlobalAnalytics(activeHabits);
  },

  initSync: (uid: string) => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) {
      unsubscribeFn(); // Clean up existing listener
    }

    set({ loaded: false, syncCounter: get().syncCounter + 1 });
    const currentSyncId = get().syncCounter;
    let rebuildCounter = 0; // Local to this sync session

    const habitsRef = collection(db, `users/${uid}/habits`);
    const q = query(habitsRef); 

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rebuildId = ++rebuildCounter;
      const habitsData: HabitRaw[] = [];

      const promises = snapshot.docs.map(async (habitDoc) => {
        const habit = habitDoc.data() as HabitRaw;
        habit.id = habitDoc.id;
        
        const logsRef = collection(db, `users/${uid}/habits/${habitDoc.id}/logs`);
        const logsSnapshot = await getDocs(logsRef);
        
        const history: Record<string, HabitEntry> = {};
        logsSnapshot.forEach(logDoc => {
          history[logDoc.id] = logDoc.data() as HabitEntry;
        });
        
        habit.history = history;
        habitsData.push(habit);
      });

      await Promise.all(promises);
      
      // Protection: Only update if no newer sync session has started 
      // AND this is the result of the LATEST snapshot within this session
      if (get().unsubscribeFn === unsubscribe && get().syncCounter === currentSyncId && rebuildId === rebuildCounter) {
        set({ habits: habitsData, loaded: true });
      }
    }, (error) => {
      // #region agent log
      fetch('http://127.0.0.1:7844/ingest/b473e0b7-e95c-427a-9cb2-ea7d4d9c5da5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e5e788'},body:JSON.stringify({sessionId:'e5e788',location:'useHabitStore.ts:onSnapshot_error',message:'Habits onSnapshot error',data:{err:String(error?.message||error)},hypothesisId:'C',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      console.error("[HabitStore] Real-time sync error:", error);
      set({ loaded: true });
    });

    set({ unsubscribeFn: unsubscribe });
  },

  cleanup: () => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) {
      unsubscribeFn();
      set({ unsubscribeFn: null, habits: [], loaded: false });
    }
  },

  addHabit: async (uid: string, newHabit) => {
    const { isOnline } = useSyncStore.getState();
    const habitId = Date.now().toString(); // Use timestamp as ID locally
    
    // Optistic update
    const habit: HabitRaw = {
      id: habitId,
      history: {},
      order: get().habits.length, // Put at the end by default
      ...newHabit,
    };
    set((state) => ({ habits: [...state.habits, habit] }));

    const habitRef = doc(db, `users/${uid}/habits/${habitId}`);
    const payload = { ...habit, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

    if (isOnline) {
      try {
        await setDoc(habitRef, payload);
      } catch (err) {
        console.error("Failed to add habit", err);
      }
    } else {
      useSyncStore.getState().enqueueAction('HABIT_ADD', { path: `users/${uid}/habits/${habitId}`, data: payload });
    }
  },

  updateHabit: async (uid: string, id: string, updates: Partial<HabitRaw>) => {
    const { isOnline } = useSyncStore.getState();
    
    // Optistic update
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    }));

    const habitRef = doc(db, `users/${uid}/habits/${id}`);
    const payload = { ...updates, updatedAt: serverTimestamp() };

    if (isOnline) {
      try {
        await setDoc(habitRef, payload, { merge: true });
      } catch (err) {
        console.error("Failed to update habit", err);
      }
    } else {
       useSyncStore.getState().enqueueAction('HABIT_UPDATE', { path: `users/${uid}/habits/${id}`, data: payload });
    }
  },

  reorderHabits: async (uid: string, orderedHabitIds: string[]) => {
    const { isOnline } = useSyncStore.getState();
    
    // Optistic update
    set((state) => {
      const newHabits = [...state.habits];
      orderedHabitIds.forEach((id, index) => {
        const hIndex = newHabits.findIndex(h => h.id === id);
        if (hIndex !== -1) {
          newHabits[hIndex] = { ...newHabits[hIndex], order: index };
        }
      });
      return { habits: newHabits };
    });

    if (isOnline) {
      try {
        const batch = writeBatch(db);
        orderedHabitIds.forEach((id, index) => {
          const habitRef = doc(db, `users/${uid}/habits/${id}`);
          batch.set(habitRef, { order: index, updatedAt: serverTimestamp() }, { merge: true });
        });
        await batch.commit();
      } catch (err) {
        console.error("Failed to reorder habits", err);
      }
    } else {
      orderedHabitIds.forEach((id, index) => {
        useSyncStore.getState().enqueueAction('HABIT_UPDATE', { 
          path: `users/${uid}/habits/${id}`, 
          data: { order: index, updatedAt: new Date().toISOString() } 
        });
      });
    }
  },

  deleteHabit: async (uid: string, id: string) => {
    const { isOnline } = useSyncStore.getState();
    
    // Optistic update
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }));

    const habitRef = doc(db, `users/${uid}/habits/${id}`);

    if (isOnline) {
      try {
        await deleteDoc(habitRef);
      } catch (err) {
        console.error("Failed to delete habit", err);
      }
    } else {
      // NOTE: useSyncStore would need a DELETE action type, 
      // but for now we fallback to marking as hidden if offline
      useSyncStore.getState().enqueueAction('HABIT_UPDATE', { path: `users/${uid}/habits/${id}`, data: { isHidden: true } });
    }
  },

  logHabitEntry: async (
    uid: string,
    habitId: string,
    dateStr: string,
    entryData: Partial<HabitEntry>
  ) => {
    const { isOnline } = useSyncStore.getState();

    // Optistic update
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id !== habitId) return h;
        const prevHistory = h.history || {};
        const currentEntry = prevHistory[dateStr] || {};
        return {
          ...h,
          history: {
            ...prevHistory,
            [dateStr]: { ...currentEntry, ...entryData },
          },
        };
      }),
    }));

    const logRef = doc(db, `users/${uid}/habits/${habitId}/logs/${dateStr}`);
    const habitRef = doc(db, `users/${uid}/habits/${habitId}`);
    const payload = { ...entryData, loggedAt: serverTimestamp() };

    if (isOnline) {
      try {
        const batch = writeBatch(db);
        // 1. Write the log entry
        batch.set(logRef, payload, { merge: true });
        // 2. Touch the parent habit so onSnapshot fires on other devices
        batch.set(habitRef, { updatedAt: serverTimestamp() }, { merge: true });
        await batch.commit();
      } catch (err) {
        console.error("Failed to log entry", err);
      }
    } else {
      useSyncStore.getState().enqueueAction('HABIT_LOG_ENTRY', { path: `users/${uid}/habits/${habitId}/logs/${dateStr}`, data: payload });
      // We also enqueue the parent update so it syncs later
      useSyncStore.getState().enqueueAction('HABIT_UPDATE', { path: `users/${uid}/habits/${habitId}`, data: { updatedAt: new Date().toISOString() }});
    }
  },
}));
