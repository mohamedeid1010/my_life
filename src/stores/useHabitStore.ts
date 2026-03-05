/**
 * ═══════════════════════════════════════════════════════════
 *  useHabitStore — Zustand store for Habit Management
 * ═══════════════════════════════════════════════════════════
 *
 *  Replaces: useHabitsData.js hook
 *
 *  Responsibilities:
 *  - CRUD operations for habits
 *  - Daily habit entry logging (completed / missed / skipped)
 *  - Grace day tracking
 *  - Streak computation (current + longest)
 *  - Mastery phase calculation (Initiation → Integration → Mastery)
 *  - Firestore persistence with debounced auto-save
 *  - Offline action queuing via useSyncStore
 *
 *  Architecture Note:
 *  Pure stat computation functions are defined at module level
 *  (not inside the store) so they can be unit-tested independently.
 *  The store only holds raw data + exposes derived selectors.
 */

import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

/**
 * Returns the local date as YYYY-MM-DD string.
 * This avoids timezone issues with Date.toISOString().
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes all stats for a SINGLE habit.
 *
 * This is a pure function — given a HabitRaw, it returns HabitStats.
 * It handles:
 *  - Total completed / missed counts
 *  - Grace days balance for the current month
 *  - Current streak (skipped days don't break streak)
 *  - Longest streak
 *  - Mastery phase (Initiation < 21d, Integration 21–66d, Mastery ≥ 66d)
 *  - Yearly adherence rate
 */
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

  // ── Pass 1: Count totals ──
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

  // ── Days Since Start ──
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

  // ── Success Rate ──
  const successRate =
    daysPassedSinceStart > 0
      ? Math.round((totalCompleted / daysPassedSinceStart) * 100)
      : 0;

  // ── Current Streak ──
  // Skipped (grace) days do NOT break the streak, but also don't add to it
  let currentStreak = 0;
  const isActiveDay = new Date(todayObj);

  // If today is not logged, start checking from yesterday
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
      // Grace day — streak not broken, continue looking backward
      isActiveDay.setDate(isActiveDay.getDate() - 1);
    } else {
      break; // Missed or untracked = streak broken
    }
  }

  // ── Longest Streak ──
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
        // Grace day — doesn't add to streak, doesn't break it
      } else if (entry?.status === 'missed' || runStr !== todayStr) {
        tempStreak = 0;
      }
      runner.setDate(runner.getDate() + 1);
    }
  }

  // ── Mastery Phase (21-day → 66-day neuroscience model) ──
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

  // ── Yearly Adherence ──
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

/**
 * Computes global analytics across all active habits.
 * Used by the HabitsAnalyticsDashboard component.
 */
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

    // Calculate habit score (streak × 2 + success rate)
    const score = h.stats.currentStreak * 2 + h.stats.successRate;

    if (score > maxScore) {
      maxScore = score;
      strongest = h;
    }

    // Only count as weakest if they have enough data
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

  // Fallbacks
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

  // ── 30-day sparkline data ──
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

  // ── Derived (Computed) Selectors ──
  /** All habits with stats computed */
  getHabitsWithStats: () => HabitWithStats[];

  /** Only non-hidden habits */
  getActiveHabits: () => HabitWithStats[];

  /** Global analytics across all active habits */
  getAnalytics: () => GlobalHabitsAnalytics | null;

  // ── Firebase I/O ──
  /** Load habits from Firestore for the given user ID */
  loadHabits: (uid: string) => Promise<void>;

  /** Save habits to Firestore (debounced internally) */
  saveHabits: (uid: string) => void;

  // ── Mutations ──
  /** Add a new habit */
  addHabit: (newHabit: Omit<HabitRaw, 'id' | 'history'>) => void;

  /** Update an existing habit's properties */
  updateHabit: (id: string, updates: Partial<HabitRaw>) => void;

  /** Soft-delete a habit (or hard-delete) */
  deleteHabit: (id: string) => void;

  /**
   * Log an entry for a specific habit on a specific date.
   * This is the primary action for daily habit tracking.
   *
   * @param habitId — Which habit
   * @param dateStr — YYYY-MM-DD
   * @param entryData — The entry data (status, value, note)
   */
  logHabitEntry: (
    habitId: string,
    dateStr: string,
    entryData: Partial<HabitEntry>
  ) => void;
}

/** Debounce timer reference for auto-save */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useHabitStore = create<HabitStore>((set, get) => ({
  // ── Initial State ──
  habits: [],
  loaded: false,
  saving: false,

  // ── Derived Selectors ──

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
      .filter((h) => !h.isHidden);
  },

  getAnalytics: (): GlobalHabitsAnalytics | null => {
    const activeHabits = get().getActiveHabits();
    return computeGlobalAnalytics(activeHabits);
  },

  // ── Firebase I/O ──

  loadHabits: async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const saved = docSnap.data();

        if (saved.smartHabits && Array.isArray(saved.smartHabits)) {
          set({ habits: saved.smartHabits as HabitRaw[], loaded: true });
        } else if (
          saved.habitsData &&
          typeof saved.habitsData === 'object'
        ) {
          // ── Migration from v1 single-habit model ──
          const migratedHabit: HabitRaw = {
            id: 'legacy-1',
            name: 'Daily Momentum',
            icon: '🔥',
            category: 'productivity',
            type: 'daily',
            targetType: 'boolean',
            graceDaysAllowance: 0,
            history: Object.keys(
              saved.habitsData as Record<string, string>
            ).reduce(
              (acc, date) => {
                acc[date] = {
                  status: (saved.habitsData as Record<string, string>)[date] as HabitEntry['status'],
                };
                return acc;
              },
              {} as Record<string, HabitEntry>
            ),
          };
          set({ habits: [migratedHabit], loaded: true });
        } else {
          set({ loaded: true });
        }
      } else {
        set({ loaded: true });
      }
    } catch (err) {
      console.error('[HabitStore] Error loading habits:', err);
      set({ loaded: true });
    }
  },

  saveHabits: (uid: string) => {
    // Debounced auto-save (1 second)
    if (saveTimeout) clearTimeout(saveTimeout);

    set({ saving: true });

    saveTimeout = setTimeout(async () => {
      try {
        const { habits } = get();
        const { isOnline } = useSyncStore.getState();

        if (isOnline) {
          // Online: save directly to Firestore
          const docRef = doc(db, 'users', uid);
          await setDoc(
            docRef,
            {
              smartHabits: habits,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } else {
          // Offline: queue the entire habits array as a sync action
          useSyncStore.getState().enqueueAction('HABIT_UPDATE', {
            smartHabits: habits,
          });
        }
      } catch (err) {
        console.error('[HabitStore] Error saving habits:', err);
      } finally {
        set({ saving: false });
      }
    }, 1000);
  },

  // ── Mutations ──

  addHabit: (newHabit) => {
    const habit: HabitRaw = {
      id: Date.now().toString(),
      history: {},
      ...newHabit,
    };

    set((state) => ({ habits: [...state.habits, habit] }));
  },

  updateHabit: (id: string, updates: Partial<HabitRaw>) => {
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    }));
  },

  deleteHabit: (id: string) => {
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }));
  },

  logHabitEntry: (
    habitId: string,
    dateStr: string,
    entryData: Partial<HabitEntry>
  ) => {
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
  },
}));
