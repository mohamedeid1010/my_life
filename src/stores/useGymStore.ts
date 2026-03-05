/**
 * ═══════════════════════════════════════════════════════════
 *  useGymStore — Zustand store for Gym Tracking
 * ═══════════════════════════════════════════════════════════
 *
 *  Replaces: useGymData.js hook (540 lines)
 *
 *  Responsibilities:
 *  - 52-week workout data management
 *  - Day toggling, session logging, weight/body fat tracking
 *  - Enriched data computation (statuses, current week detection)
 *  - Full stats engine (streaks, gamification, momentum, AI coach)
 *  - Firestore persistence with debounced auto-save
 *  - Offline action queuing via useSyncStore
 *
 *  Architecture:
 *  Pure stat functions (computeEnrichedData, computeStats) are
 *  defined at module level for independent unit testing.
 *  The store holds raw data + exposes getter selectors.
 */

import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useSyncStore } from './useSyncStore';
import type {
  GymWeekRaw,
  GymWeekEnriched,
  GymSession,
  GymStats,
  EnrichedDay,
  DayStatus,
  RiskLevel,
  PatternInsight,
  Achievement,
} from '../types/gym.types';
import type { WorkoutSystemId } from '../types/workout-systems.types';

/* ════════════════════════════════════════════════════════
 *  CONSTANTS
 * ════════════════════════════════════════════════════════ */

/** The year's starting Saturday (Week 1 starts here) */
const YEAR_START = new Date(2026, 0, 3); // January 3, 2026 (Saturday)

/** Day names for the Saturday-starting week used in the app */
const DAY_NAMES = [
  'Saturday', 'Sunday', 'Monday', 'Tuesday',
  'Wednesday', 'Thursday', 'Friday',
];

/** Level titles for gamification */
const LEVEL_TITLES = [
  'Beginner', 'Starter', 'Trainee', 'Warrior', 'Fighter',
  'Champion', 'Gladiator', 'Titan', 'Legend', 'Immortal',
];

/* ════════════════════════════════════════════════════════
 *  PURE HELPER FUNCTIONS
 * ════════════════════════════════════════════════════════ */

/**
 * Generates the initial 52-week data structure.
 * Each week has 7 days (all false), no sessions, and empty weight/bodyFat.
 */
function generateInitialData(): GymWeekRaw[] {
  const data: GymWeekRaw[] = [];
  const currentStart = new Date(YEAR_START);
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
  });

  for (let w = 1; w <= 52; w++) {
    data.push({
      week: w,
      startDate: dateFormatter.format(currentStart),
      days: [false, false, false, false, false, false, false],
      sessions: {},
      weight: '',
      bodyFat: '',
    });
    currentStart.setDate(currentStart.getDate() + 7);
  }

  return data;
}

/**
 * Enriches raw week data with computed statuses and week info.
 *
 * For each day, determines if it's:
 *  - WORKOUT (user worked out)
 *  - LOCKED_REST (weekly goal met, remaining days are rest)
 *  - AUTO_REST (smart break: user has ≥ 1 workout, breaks are allowed)
 *  - MISSED (past day with no workout and no breaks left)
 *  - PENDING (future day)
 */
function computeEnrichedData(
  data: GymWeekRaw[],
  targetDays: number,
  today: Date
): GymWeekEnriched[] {
  return data.map((week, wIdx) => {
    const weekWorkouts = week.days.filter(Boolean).length;
    const isGoalMet = weekWorkouts >= targetDays;

    // Calculate week's date range
    const wStart = new Date(YEAR_START);
    wStart.setDate(wStart.getDate() + wIdx * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 6);
    wEnd.setHours(23, 59, 59, 999);
    const isCurrentWeek = today >= wStart && today <= wEnd;

    // Smart status assignment
    const maxBreaks = 7 - targetDays;
    let workoutsDone = 0;
    let breaksTaken = 0;

    const enrichedDays: EnrichedDay[] = week.days.map(
      (isDone: boolean, dIdx: number) => {
        const cellDate = new Date(YEAR_START);
        cellDate.setDate(cellDate.getDate() + wIdx * 7 + dIdx);
        cellDate.setHours(0, 0, 0, 0);

        let status: DayStatus;

        if (isDone) {
          status = 'WORKOUT';
          workoutsDone++;
        } else if (workoutsDone >= targetDays) {
          status = 'LOCKED_REST';
        } else if (cellDate < today) {
          // Smart breaks: only grant if user has ≥ 1 workout
          if (workoutsDone > 0 && breaksTaken < maxBreaks) {
            status = 'AUTO_REST';
            breaksTaken++;
          } else {
            status = 'MISSED';
          }
        } else {
          status = 'PENDING';
        }

        return { isDone, status, date: cellDate };
      }
    );

    return {
      ...week,
      weekWorkouts,
      isGoalMet,
      isCurrentWeek,
      enrichedDays,
    };
  });
}

/**
 * Computes all stats from enriched data.
 *
 * This is the heart of the gym tracker — it produces:
 *  - Core metrics (total workouts, streaks, success rate, discipline score)
 *  - Body composition deltas
 *  - Pattern analysis (best/worst day, pattern insights)
 *  - Momentum engine (days since failure, risk level)
 *  - Gamification (XP, levels, achievements)
 *  - AI Coach messages
 *  - Today's status
 */
function computeStats(enrichedData: GymWeekEnriched[]): GymStats {
  let totalWorkouts = 0;
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayMissedCounts = [0, 0, 0, 0, 0, 0, 0];
  let firstWeight: number | null = null;
  let latestWeight: number | null = null;
  let firstFat: number | null = null;
  let latestFat: number | null = null;
  const allDayStatuses: Array<{
    status: DayStatus;
    dayIndex: number;
    date: Date;
  }> = [];
  let weeksGoalMet = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayCompleted = false;
  let todayWeekIdx = -1;
  let todayDayIdx = -1;

  // ── Pass 1: Collect raw data ──
  enrichedData.forEach((week, weekIdx) => {
    if (week.weight && !isNaN(parseFloat(week.weight))) {
      if (firstWeight === null) firstWeight = parseFloat(week.weight);
      latestWeight = parseFloat(week.weight);
    }
    if (week.bodyFat && !isNaN(parseFloat(week.bodyFat))) {
      if (firstFat === null) firstFat = parseFloat(week.bodyFat);
      latestFat = parseFloat(week.bodyFat);
    }

    if (week.isGoalMet) weeksGoalMet++;

    week.enrichedDays.forEach((dayObj, dIdx) => {
      if (dayObj.status === 'WORKOUT') {
        totalWorkouts++;
        dayCounts[dIdx]++;
      }
      if (dayObj.status === 'MISSED') {
        dayMissedCounts[dIdx]++;
      }

      if (
        dayObj.date.getFullYear() === today.getFullYear() &&
        dayObj.date.getMonth() === today.getMonth() &&
        dayObj.date.getDate() === today.getDate()
      ) {
        todayCompleted = dayObj.status === 'WORKOUT';
        todayWeekIdx = weekIdx;
        todayDayIdx = dIdx;
      }

      if (dayObj.date <= today) {
        allDayStatuses.push({
          status: dayObj.status,
          dayIndex: dIdx,
          date: dayObj.date,
        });
      }
    });
  });

  // ── Current Streak ──
  let currentStreak = 0;
  for (let i = allDayStatuses.length - 1; i >= 0; i--) {
    const s = allDayStatuses[i].status;
    if (s === 'PENDING') continue;
    if (s === 'WORKOUT' || s === 'LOCKED_REST' || s === 'AUTO_REST') {
      currentStreak++;
    } else {
      break;
    }
  }

  // ── Longest Streak ──
  let longestStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < allDayStatuses.length; i++) {
    const s = allDayStatuses[i].status;
    if (s === 'PENDING') continue;
    if (s === 'WORKOUT' || s === 'LOCKED_REST' || s === 'AUTO_REST') {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // ── Success Rate ──
  const resolvedDays = allDayStatuses.filter(
    (d) => d.status !== 'PENDING'
  );
  const successDays = resolvedDays.filter(
    (d) =>
      d.status === 'WORKOUT' ||
      d.status === 'LOCKED_REST' ||
      d.status === 'AUTO_REST'
  );
  const successRate =
    resolvedDays.length > 0
      ? Math.round((successDays.length / resolvedDays.length) * 100)
      : 0;

  // ── Discipline Score (composite metric) ──
  const streakBonus = Math.min(currentStreak / 30, 1) * 35;
  const consistencyBonus = (successRate / 100) * 35;
  const goalMetBonus = Math.min(weeksGoalMet / 10, 1) * 30;
  const disciplineScore = Math.round(
    streakBonus + consistencyBonus + goalMetBonus
  );

  // ── Momentum Engine ──
  const failureDates: Date[] = [];
  allDayStatuses.forEach((d) => {
    if (d.status === 'MISSED') failureDates.push(d.date);
  });

  let daysSinceLastFailure = 0;
  if (failureDates.length > 0) {
    const lastFailure = failureDates[failureDates.length - 1];
    daysSinceLastFailure = Math.floor(
      (today.getTime() - lastFailure.getTime()) / (1000 * 60 * 60 * 24)
    );
  } else {
    daysSinceLastFailure = allDayStatuses.filter(
      (d) => d.status !== 'PENDING'
    ).length;
  }

  let avgGapBetweenFailures = 0;
  if (failureDates.length >= 2) {
    let totalGap = 0;
    for (let i = 1; i < failureDates.length; i++) {
      totalGap += Math.floor(
        (failureDates[i].getTime() - failureDates[i - 1].getTime()) /
          (1000 * 60 * 60 * 24)
      );
    }
    avgGapBetweenFailures = Math.round(
      totalGap / (failureDates.length - 1)
    );
  } else if (failureDates.length === 1) {
    avgGapBetweenFailures = daysSinceLastFailure;
  }

  let riskLevel: RiskLevel = 'low';
  if (failureDates.length > 0 && avgGapBetweenFailures > 0) {
    if (daysSinceLastFailure >= avgGapBetweenFailures * 0.9) {
      riskLevel = 'high';
    } else if (daysSinceLastFailure >= avgGapBetweenFailures * 0.7) {
      riskLevel = 'medium';
    }
  }

  // ── Pattern Analysis ──
  const maxDayCount = Math.max(...dayCounts);
  const bestDay =
    maxDayCount > 0 ? DAY_NAMES[dayCounts.indexOf(maxDayCount)] : 'N/A';
  const maxMissedCount = Math.max(...dayMissedCounts);
  const worstDay =
    maxMissedCount > 0
      ? DAY_NAMES[dayMissedCounts.indexOf(maxMissedCount)]
      : 'N/A';

  // Count streak-breaks after long streaks (7+ days)
  let streakBreaksAfterLong = 0;
  let countStreak = 0;
  for (let i = 0; i < allDayStatuses.length; i++) {
    const s = allDayStatuses[i].status;
    if (s === 'PENDING') continue;
    if (s === 'WORKOUT' || s === 'LOCKED_REST' || s === 'AUTO_REST') {
      countStreak++;
    } else {
      if (countStreak >= 7) streakBreaksAfterLong++;
      countStreak = 0;
    }
  }

  const patternInsights: PatternInsight[] = [];
  if (worstDay !== 'N/A' && maxMissedCount > 0) {
    patternInsights.push({
      icon: '📉',
      text: `Most failures on ${worstDay}`,
      color: 'text-red-400',
    });
  }
  if (bestDay !== 'N/A' && maxDayCount > 0) {
    patternInsights.push({
      icon: '💪',
      text: `Best consistency on ${bestDay}`,
      color: 'text-emerald-400',
    });
  }
  if (streakBreaksAfterLong > 0) {
    patternInsights.push({
      icon: '⚡',
      text: `${streakBreaksAfterLong} streak break${
        streakBreaksAfterLong > 1 ? 's' : ''
      } after 7+ day streaks`,
      color: 'text-amber-400',
    });
  }
  if (failureDates.length > 0 && avgGapBetweenFailures > 0) {
    patternInsights.push({
      icon: '🔄',
      text: `You typically fail every ~${avgGapBetweenFailures} days`,
      color: 'text-violet-400',
    });
  }
  if (patternInsights.length === 0) {
    patternInsights.push({
      icon: '✨',
      text: 'No patterns detected yet — keep going!',
      color: 'text-blue-400',
    });
  }

  // ── Gamification ──
  const xp = totalWorkouts * 25 + currentStreak * 10 + weeksGoalMet * 50;
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpToNext = 500;
  const levelTitle =
    LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  let monthlyWorkouts = 0;
  allDayStatuses.forEach((d) => {
    if (
      d.status === 'WORKOUT' &&
      d.date.getMonth() === currentMonth &&
      d.date.getFullYear() === currentYear
    ) {
      monthlyWorkouts++;
    }
  });
  const monthlyTarget = 20;

  const achievements: Achievement[] = [
    {
      name: 'First Workout',
      desc: 'Complete your first workout',
      unlocked: totalWorkouts >= 1,
      icon: '🏋️',
    },
    {
      name: '7-Day Streak',
      desc: 'Maintain a 7-day streak',
      unlocked: longestStreak >= 7,
      icon: '🔥',
    },
    {
      name: '14-Day Streak',
      desc: 'Maintain a 14-day streak',
      unlocked: longestStreak >= 14,
      icon: '⚡',
    },
    {
      name: '30-Day Streak',
      desc: 'Maintain a 30-day streak',
      unlocked: longestStreak >= 30,
      icon: '💎',
    },
    {
      name: 'Week Champion',
      desc: 'Meet your weekly goal',
      unlocked: weeksGoalMet >= 1,
      icon: '🏆',
    },
    {
      name: 'Month Master',
      desc: 'Meet 4 weekly goals',
      unlocked: weeksGoalMet >= 4,
      icon: '👑',
    },
    {
      name: '50 Workouts',
      desc: 'Complete 50 workouts',
      unlocked: totalWorkouts >= 50,
      icon: '💯',
    },
    {
      name: 'Centurion',
      desc: 'Complete 100 workouts',
      unlocked: totalWorkouts >= 100,
      icon: '🦾',
    },
  ];

  // ── AI Coach Messages ──
  const coachMessages: string[] = [];
  const daysToBreak = longestStreak - currentStreak;
  if (daysToBreak > 0 && daysToBreak <= 5) {
    coachMessages.push(
      `You're ${daysToBreak} day${
        daysToBreak > 1 ? 's' : ''
      } away from beating your longest streak! 🏆`
    );
  }
  if (currentStreak === longestStreak && currentStreak > 0) {
    coachMessages.push(
      "You're ON your longest streak right now! Don't break it! 🔥"
    );
  }
  if (worstDay !== 'N/A' && maxMissedCount > 1) {
    coachMessages.push(
      `Your discipline drops on ${worstDay}s. Plan ahead for those days. 📋`
    );
  }
  if (riskLevel === 'high') {
    coachMessages.push(
      "Warning: You're in a high-risk zone based on your failure patterns. Stay focused! ⚠️"
    );
  }
  if (currentStreak >= 7 && currentStreak < 14) {
    coachMessages.push(
      'Great 1-week streak! Push for 14 days to unlock the ⚡ achievement.'
    );
  }
  if (
    monthlyWorkouts >= monthlyTarget * 0.8 &&
    monthlyWorkouts < monthlyTarget
  ) {
    const remaining = monthlyTarget - monthlyWorkouts;
    coachMessages.push(
      `Almost there! ${remaining} more workout${
        remaining > 1 ? 's' : ''
      } to crush this month's challenge!`
    );
  }
  if (coachMessages.length === 0) {
    if (currentStreak === 0) {
      coachMessages.push(
        "Today is a fresh start. One workout can rebuild everything. Let's go! 💪"
      );
    } else {
      coachMessages.push(
        `${currentStreak}-day streak and counting. Consistency beats motivation every time. 🧠`
      );
    }
  }

  // ── Body Composition Deltas ──
  const weightDiff =
    latestWeight !== null && firstWeight !== null
      ? (latestWeight - firstWeight).toFixed(1)
      : '0';
  const fatDiff =
    latestFat !== null && firstFat !== null
      ? (latestFat - firstFat).toFixed(1)
      : '0';
  const leanMass =
    latestWeight !== null && latestFat !== null
      ? (latestWeight * (1 - latestFat / 100)).toFixed(1)
      : '-';

  return {
    totalWorkouts,
    currentStreak,
    longestStreak,
    weeksGoalMet,
    bestDay,
    worstDay,
    latestWeight: latestWeight ?? '-',
    weightDiff,
    latestBodyFat: latestFat ?? '-',
    fatDiff,
    leanMass,
    successRate,
    disciplineScore,
    daysSinceLastFailure,
    avgGapBetweenFailures,
    riskLevel,
    patternInsights,
    xp,
    level,
    levelTitle,
    xpInLevel,
    xpToNext,
    monthlyWorkouts,
    monthlyTarget,
    achievements,
    coachMessages,
    todayCompleted,
    todayWeekIdx,
    todayDayIdx,
  };
}

/**
 * Serializes data for Firestore storage.
 * Strips out all computed/enriched fields — only raw data goes to the DB.
 */
function serializeForFirestore(data: GymWeekRaw[]): GymWeekRaw[] {
  return data.map((week) => ({
    week: week.week,
    startDate: week.startDate,
    days: week.days,
    sessions: week.sessions || {},
    weight: week.weight,
    bodyFat: week.bodyFat,
  }));
}

/* ════════════════════════════════════════════════════════
 *  ZUSTAND STORE
 * ════════════════════════════════════════════════════════ */

interface GymStore {
  // ── Raw State ──
  data: GymWeekRaw[];
  targetDays: number;
  workoutSystem: WorkoutSystemId;
  loaded: boolean;
  saving: boolean;

  // ── Derived Selectors ──
  getEnrichedData: () => GymWeekEnriched[];
  getStats: () => GymStats;

  // ── Firebase I/O ──
  loadGymData: (uid: string, email?: string | null, displayName?: string | null) => Promise<void>;
  saveGymData: (uid: string, email?: string | null, displayName?: string | null) => void;

  // ── Mutations ──
  setTargetDays: (days: number) => void;
  setWorkoutSystem: (system: WorkoutSystemId) => void;
  toggleDay: (weekIndex: number, dayIndex: number) => void;
  updateWeight: (weekIndex: number, value: string) => void;
  updateBodyFat: (weekIndex: number, value: string) => void;
  updateSession: (weekIndex: number, dayIndex: number, sessionData: GymSession) => void;
  deleteSession: (weekIndex: number, dayIndex: number) => void;
  markTodayComplete: () => void;
}

/** Debounce timer for auto-save */
let gymSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useGymStore = create<GymStore>((set, get) => ({
  // ── Initial State ──
  data: generateInitialData(),
  targetDays: 5,
  workoutSystem: 'ppl' as WorkoutSystemId,
  loaded: false,
  saving: false,

  // ── Derived Selectors ──

  getEnrichedData: (): GymWeekEnriched[] => {
    const { data, targetDays } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return computeEnrichedData(data, targetDays, today);
  },

  getStats: (): GymStats => {
    const enrichedData = get().getEnrichedData();
    return computeStats(enrichedData);
  },

  // ── Firebase I/O ──

  loadGymData: async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const saved = docSnap.data();
        if (saved.gymData && Array.isArray(saved.gymData)) {
          set({ data: saved.gymData as GymWeekRaw[] });
        }
        if (typeof saved.targetDays === 'number') {
          set({ targetDays: saved.targetDays });
        }
        if (saved.workoutSystem) {
          set({ workoutSystem: saved.workoutSystem as WorkoutSystemId });
        }
      }
    } catch (err) {
      console.error('[GymStore] Error loading gym data:', err);
    } finally {
      set({ loaded: true });
    }
  },

  saveGymData: (
    uid: string,
    email?: string | null,
    displayName?: string | null
  ) => {
    if (gymSaveTimeout) clearTimeout(gymSaveTimeout);
    set({ saving: true });

    gymSaveTimeout = setTimeout(async () => {
      try {
        const { data, targetDays, workoutSystem } = get();
        const { isOnline } = useSyncStore.getState();

        const payload = {
          gymData: serializeForFirestore(data),
          targetDays,
          workoutSystem,
          updatedAt: new Date().toISOString(),
          email: email || '',
          displayName: displayName || '',
        };

        if (isOnline) {
          const docRef = doc(db, 'users', uid);
          await setDoc(docRef, payload, { merge: true });
        } else {
          useSyncStore.getState().enqueueAction('GYM_UPDATE_SESSION', payload);
        }
      } catch (err) {
        console.error('[GymStore] Error saving gym data:', err);
      } finally {
        set({ saving: false });
      }
    }, 1000);
  },

  // ── Mutations ──

  setTargetDays: (days: number) => set({ targetDays: days }),

  setWorkoutSystem: (system: WorkoutSystemId) =>
    set({ workoutSystem: system }),

  toggleDay: (weekIndex: number, dayIndex: number) => {
    set((state) => {
      const newData = [...state.data];
      newData[weekIndex] = {
        ...newData[weekIndex],
        days: newData[weekIndex].days.map((d: boolean, i: number) =>
          i === dayIndex ? !d : d
        ),
      };
      return { data: newData };
    });
  },

  updateWeight: (weekIndex: number, value: string) => {
    set((state) => {
      const newData = [...state.data];
      newData[weekIndex] = { ...newData[weekIndex], weight: value };
      return { data: newData };
    });
  },

  updateBodyFat: (weekIndex: number, value: string) => {
    set((state) => {
      const newData = [...state.data];
      newData[weekIndex] = { ...newData[weekIndex], bodyFat: value };
      return { data: newData };
    });
  },

  updateSession: (
    weekIndex: number,
    dayIndex: number,
    sessionData: GymSession
  ) => {
    set((state) => {
      const newData = [...state.data];
      const week = { ...newData[weekIndex] };
      week.sessions = { ...week.sessions, [dayIndex]: sessionData };
      // Also mark the day as completed
      week.days = week.days.map((d: boolean, i: number) =>
        i === dayIndex ? true : d
      );
      newData[weekIndex] = week;
      return { data: newData };
    });
  },

  deleteSession: (weekIndex: number, dayIndex: number) => {
    set((state) => {
      const newData = [...state.data];
      const week = { ...newData[weekIndex] };
      const newSessions = { ...week.sessions };
      delete newSessions[dayIndex.toString()];
      week.sessions = newSessions;
      // Also un-toggle the day
      week.days = week.days.map((d: boolean, i: number) =>
        i === dayIndex ? false : d
      );
      newData[weekIndex] = week;
      return { data: newData };
    });
  },

  markTodayComplete: () => {
    const stats = get().getStats();
    if (stats.todayWeekIdx >= 0 && stats.todayDayIdx >= 0) {
      get().toggleDay(stats.todayWeekIdx, stats.todayDayIdx);
    }
  },
}));
