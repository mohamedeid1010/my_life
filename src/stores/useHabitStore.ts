/**
 * ═══════════════════════════════════════════════════════════
 * useHabitStore — Zustand store for Habit Management
 * ═══════════════════════════════════════════════════════════
 *
 * Responsibilities:
 * - CRUD operations for habits (Firestore collection: users/{uid}/habits)
 * - Daily habit entry logging stored safely within the habit document (history object)
 * - Grace day tracking & Streak computation
 * - Mastery phase calculation
 * - Real-time Firestore sync via native onSnapshot (Offline-first approach)
 * - Zero manual queueing (Relies entirely on Firebase's persistentLocalCache)
 */

import { create } from 'zustand';
import { 
  collection, doc, setDoc, deleteDoc, 
  onSnapshot, query, writeBatch, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
// NOTE: useSyncStore is purposely removed. Firebase handles offline queues automatically!

import type {
  HabitRaw,
  HabitEntry,
  HabitStats,
  HabitMastery,
  HabitWithStats,
} from '../types/habits.types';
import type { GlobalHabitsAnalytics, WeakestHabitAnalysis } from '../types/analytics.types';

/* ════════════════════════════════════════════════════════
 * PURE HELPER FUNCTIONS (testable, no side effects)
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
 * ZUSTAND STORE
 * ════════════════════════════════════════════════════════ */

interface HabitStore {
  // ── Raw State ──
  habits: HabitRaw[];
  loaded: boolean;
  unsubscribeFn: (() => void) | null;

  // ── Derived Selectors ──
  getHabitsWithStats: () => HabitWithStats[];
  getActiveHabits: () => HabitWithStats[];
  getAnalytics: () => GlobalHabitsAnalytics | null;

  // ── Firebase I/O ──
  initSync: (uid: string) => void;
  cleanup: () => void;

  // ── Mutations ──
  addHabit: (uid: string, newHabit: Omit<HabitRaw, 'id' | 'history'>) => Promise<void>;
  updateHabit: (uid: string, id: string, updates: Partial<HabitRaw>) => Promise<void>;
  reorderHabits: (uid: string, habitIds: string[]) => Promise<void>;
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
  unsubscribeFn: null,

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
        const aOrder = a.order ?? Infinity;
        const bOrder = b.order ?? Infinity;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
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

    set({ loaded: false });

    const habitsRef = collection(db, `users/${uid}/habits`);
    const q = query(habitsRef);

    // Attach real-time listener: Fetches habits AND their history efficiently in ONE read per doc.
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const habitsData: HabitRaw[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          history: data.history || {}, // History is now embedded inside the habit document
        } as HabitRaw;
      });

      set({ habits: habitsData, loaded: true });
    }, (error) => {
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
    const habitId = Date.now().toString(); // Local ID generation
    
    // 1. Optimistic update: Update UI instantly
    const habit: HabitRaw = {
      id: habitId,
      history: {},
      ...newHabit,
    };
    set((state) => ({ habits: [...state.habits, habit] }));

    // 2. Firestore write (Handles offline queuing automatically)
    const habitRef = doc(db, `users/${uid}/habits/${habitId}`);
    const payload = { ...newHabit, history: {}, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };

    try {
      await setDoc(habitRef, payload);
      console.log(`[HabitStore] ✅ Habit saved to Firestore: ${habitId}`);
    } catch (err) {
      console.error("[HabitStore] ❌ Failed to add habit to Firestore:", err);
      console.error("[HabitStore] Error code:", err?.code);
      console.error("[HabitStore] Error message:", err?.message);
    }
  },

  updateHabit: async (uid: string, id: string, updates: Partial<HabitRaw>) => {
    // 1. Optimistic update
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    }));

    // 2. Firestore write
    const habitRef = doc(db, `users/${uid}/habits/${id}`);
    const payload = { ...updates, updatedAt: serverTimestamp() };

    try {
      await setDoc(habitRef, payload, { merge: true });
    } catch (err) {
      console.error("[HabitStore] Failed to update habit", err);
    }
  },

  reorderHabits: async (uid: string, habitIds: string[]) => {
    // Create order mapping
    const orderUpdates: Record<string, number> = {};
    habitIds.forEach((id, index) => {
      orderUpdates[id] = index;
    });

    // 1. Optimistic update
    set((state) => ({
      habits: state.habits.map((h) => ({
        ...h,
        order: orderUpdates[h.id] ?? h.order,
      })),
    }));

    // 2. Batch update in Firestore
    const batch = writeBatch(db);
    habitIds.forEach((id, index) => {
      const habitRef = doc(db, `users/${uid}/habits/${id}`);
      batch.update(habitRef, { order: index, updatedAt: serverTimestamp() });
    });

    try {
      await batch.commit();
    } catch (err) {
      console.error("[HabitStore] Failed to reorder habits", err);
    }
  },

  deleteHabit: async (uid: string, id: string) => {
    // 1. Optimistic update
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }));

    // 2. Firestore write
    const habitRef = doc(db, `users/${uid}/habits/${id}`);

    try {
      await deleteDoc(habitRef);
    } catch (err) {
      console.error("[HabitStore] Failed to delete habit", err);
    }
  },

  logHabitEntry: async (
    uid: string,
    habitId: string,
    dateStr: string,
    entryData: Partial<HabitEntry>
  ) => {
    // Get current state for optimistic + correct merge
    const currentHabit = get().habits.find((h) => h.id === habitId);
    if (!currentHabit) {
      console.error("[HabitStore] Habit not found:", habitId);
      return;
    }

    const prevHistory = currentHabit.history || {};
    const currentEntry = prevHistory[dateStr] || {};
    const mergedEntry = { ...currentEntry, ...entryData };

    // 1. Optimistic update
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id !== habitId) return h;
        return {
          ...h,
          history: {
            ...prevHistory,
            [dateStr]: mergedEntry,
          },
        };
      }),
    }));

    // 2. Firestore write: Update the entire history map properly
    const habitRef = doc(db, `users/${uid}/habits/${habitId}`);
    
    try {
      await setDoc(habitRef, {
        history: {
          ...prevHistory,
          [dateStr]: { ...mergedEntry, loggedAt: serverTimestamp() },
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log(`[HabitStore] ✅ Entry logged for ${dateStr}: ${habitId}`);
    } catch (err) {
      console.error("[HabitStore] ❌ Failed to log entry:", err);
      console.error("[HabitStore] Error code:", err?.code);
      console.error("[HabitStore] Error message:", err?.message);
    }
  },
}));