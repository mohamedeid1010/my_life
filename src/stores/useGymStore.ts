/**
 * ═══════════════════════════════════════════════════════════
 *  useGymStore — Zustand store for Gym Tracking
 * ═══════════════════════════════════════════════════════════
 *
 *  Refactored for Elite Subcollection Architecture:
 *  - Profile Data (targetDays, weights): users/{uid}/gym_profile/main
 *  - Daily Workout Logs: users/{uid}/gym_logs/{dateStr}
 */

import { create } from 'zustand';
import { 
  collection, doc, setDoc, deleteDoc, 
  onSnapshot, query, serverTimestamp, 
  getDocFromServer, getDocsFromServer 
} from 'firebase/firestore';
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
 *  CONSTANTS & PURE HELPERS
 * ════════════════════════════════════════════════════════ */

const YEAR_START = new Date(2026, 0, 3); // Jan 3, 2026 (Saturday)
const DAY_NAMES = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const LEVEL_TITLES = ['Beginner', 'Starter', 'Trainee', 'Warrior', 'Fighter', 'Champion', 'Gladiator', 'Titan', 'Legend', 'Immortal'];

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Calculates the exact Date object for a given weekIndex and dayIndex */
function getDateForIndex(weekIndex: number, dayIndex: number): Date {
  const d = new Date(YEAR_START);
  d.setDate(d.getDate() + weekIndex * 7 + dayIndex);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Generates the empty 52-week template */
function generateInitialData(): GymWeekRaw[] {
  const data: GymWeekRaw[] = [];
  const currentStart = new Date(YEAR_START);
  const dateFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short' });

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

function computeEnrichedData(data: GymWeekRaw[], targetDays: number, today: Date): GymWeekEnriched[] {
  return data.map((week, wIdx) => {
    const weekWorkouts = week.days.filter(Boolean).length;
    const isGoalMet = weekWorkouts >= targetDays;

    const wStart = new Date(YEAR_START);
    wStart.setDate(wStart.getDate() + wIdx * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 6);
    wEnd.setHours(23, 59, 59, 999);
    const isCurrentWeek = today >= wStart && today <= wEnd;

    const maxBreaks = 7 - targetDays;
    let workoutsDone = 0;
    let breaksTaken = 0;

    const enrichedDays: EnrichedDay[] = week.days.map((isDone: boolean, dIdx: number) => {
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
    });

    return { ...week, weekWorkouts, isGoalMet, isCurrentWeek, enrichedDays };
  });
}

function computeStats(enrichedData: GymWeekEnriched[]): GymStats {
  let totalWorkouts = 0;
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayMissedCounts = [0, 0, 0, 0, 0, 0, 0];
  let firstWeight: number | null = null;
  let latestWeight: number | null = null;
  let firstFat: number | null = null;
  let latestFat: number | null = null;
  const allDayStatuses: Array<{ status: DayStatus; dayIndex: number; date: Date }> = [];
  let weeksGoalMet = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayCompleted = false;
  let todayWeekIdx = -1;
  let todayDayIdx = -1;

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
      if (dayObj.status === 'MISSED') dayMissedCounts[dIdx]++;

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
        allDayStatuses.push({ status: dayObj.status, dayIndex: dIdx, date: dayObj.date });
      }
    });
  });

  let currentStreak = 0;
  for (let i = allDayStatuses.length - 1; i >= 0; i--) {
    const s = allDayStatuses[i].status;
    if (s === 'PENDING') continue;
    if (s === 'WORKOUT' || s === 'LOCKED_REST' || s === 'AUTO_REST') currentStreak++;
    else break;
  }

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

  const resolvedDays = allDayStatuses.filter((d) => d.status !== 'PENDING');
  const successDays = resolvedDays.filter(
    (d) => d.status === 'WORKOUT' || d.status === 'LOCKED_REST' || d.status === 'AUTO_REST'
  );
  const successRate = resolvedDays.length > 0 ? Math.round((successDays.length / resolvedDays.length) * 100) : 0;

  const streakBonus = Math.min(currentStreak / 30, 1) * 35;
  const consistencyBonus = (successRate / 100) * 35;
  const goalMetBonus = Math.min(weeksGoalMet / 10, 1) * 30;
  const disciplineScore = Math.round(streakBonus + consistencyBonus + goalMetBonus);

  const failureDates: Date[] = [];
  allDayStatuses.forEach((d) => {
    if (d.status === 'MISSED') failureDates.push(d.date);
  });

  let daysSinceLastFailure = 0;
  if (failureDates.length > 0) {
    const lastFailure = failureDates[failureDates.length - 1];
    daysSinceLastFailure = Math.floor((today.getTime() - lastFailure.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    daysSinceLastFailure = allDayStatuses.filter((d) => d.status !== 'PENDING').length;
  }

  let avgGapBetweenFailures = 0;
  if (failureDates.length >= 2) {
    let totalGap = 0;
    for (let i = 1; i < failureDates.length; i++) {
      totalGap += Math.floor((failureDates[i].getTime() - failureDates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
    }
    avgGapBetweenFailures = Math.round(totalGap / (failureDates.length - 1));
  } else if (failureDates.length === 1) {
    avgGapBetweenFailures = daysSinceLastFailure;
  }

  let riskLevel: RiskLevel = 'low';
  if (failureDates.length > 0 && avgGapBetweenFailures > 0) {
    if (daysSinceLastFailure >= avgGapBetweenFailures * 0.9) riskLevel = 'high';
    else if (daysSinceLastFailure >= avgGapBetweenFailures * 0.7) riskLevel = 'medium';
  }

  const maxDayCount = Math.max(...dayCounts);
  const bestDay = maxDayCount > 0 ? DAY_NAMES[dayCounts.indexOf(maxDayCount)] : 'N/A';
  const maxMissedCount = Math.max(...dayMissedCounts);
  const worstDay = maxMissedCount > 0 ? DAY_NAMES[dayMissedCounts.indexOf(maxMissedCount)] : 'N/A';

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
    patternInsights.push({ icon: '📉', text: `Most failures on ${worstDay}`, color: 'text-red-400' });
  }
  if (bestDay !== 'N/A' && maxDayCount > 0) {
    patternInsights.push({ icon: '💪', text: `Best consistency on ${bestDay}`, color: 'text-emerald-400' });
  }
  if (streakBreaksAfterLong > 0) {
    patternInsights.push({
      icon: '⚡',
      text: `${streakBreaksAfterLong} streak break${streakBreaksAfterLong > 1 ? 's' : ''} after 7+ day streaks`,
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
    patternInsights.push({ icon: '✨', text: 'No patterns detected yet — keep going!', color: 'text-blue-400' });
  }

  const xp = totalWorkouts * 25 + currentStreak * 10 + weeksGoalMet * 50;
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpToNext = 500;
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  let monthlyWorkouts = 0;
  allDayStatuses.forEach((d) => {
    if (d.status === 'WORKOUT' && d.date.getMonth() === currentMonth && d.date.getFullYear() === currentYear) {
      monthlyWorkouts++;
    }
  });
  const monthlyTarget = 20;

  const achievements: Achievement[] = [
    { name: 'First Workout', desc: 'Complete your first workout', unlocked: totalWorkouts >= 1, icon: '🏋️' },
    { name: '7-Day Streak', desc: 'Maintain a 7-day streak', unlocked: longestStreak >= 7, icon: '🔥' },
    { name: '14-Day Streak', desc: 'Maintain a 14-day streak', unlocked: longestStreak >= 14, icon: '⚡' },
    { name: '30-Day Streak', desc: 'Maintain a 30-day streak', unlocked: longestStreak >= 30, icon: '💎' },
    { name: 'Week Champion', desc: 'Meet your weekly goal', unlocked: weeksGoalMet >= 1, icon: '🏆' },
    { name: 'Month Master', desc: 'Meet 4 weekly goals', unlocked: weeksGoalMet >= 4, icon: '👑' },
    { name: '50 Workouts', desc: 'Complete 50 workouts', unlocked: totalWorkouts >= 50, icon: '💯' },
    { name: 'Centurion', desc: 'Complete 100 workouts', unlocked: totalWorkouts >= 100, icon: '🦾' },
  ];

  const coachMessages: string[] = [];
  const daysToBreak = longestStreak - currentStreak;
  if (daysToBreak > 0 && daysToBreak <= 5) {
    coachMessages.push(`You're ${daysToBreak} day${daysToBreak > 1 ? 's' : ''} away from beating your longest streak! 🏆`);
  }
  if (currentStreak === longestStreak && currentStreak > 0) {
    coachMessages.push("You're ON your longest streak right now! Don't break it! 🔥");
  }
  if (worstDay !== 'N/A' && maxMissedCount > 1) {
    coachMessages.push(`Your discipline drops on ${worstDay}s. Plan ahead for those days. 📋`);
  }
  if (riskLevel === 'high') {
    coachMessages.push("Warning: You're in a high-risk zone based on your failure patterns. Stay focused! ⚠️");
  }
  if (currentStreak >= 7 && currentStreak < 14) {
    coachMessages.push('Great 1-week streak! Push for 14 days to unlock the ⚡ achievement.');
  }
  if (monthlyWorkouts >= monthlyTarget * 0.8 && monthlyWorkouts < monthlyTarget) {
    const remaining = monthlyTarget - monthlyWorkouts;
    coachMessages.push(`Almost there! ${remaining} more workout${remaining > 1 ? 's' : ''} to crush this month's challenge!`);
  }
  if (coachMessages.length === 0) {
    if (currentStreak === 0) coachMessages.push("Today is a fresh start. Let's go! 💪");
    else coachMessages.push(`${currentStreak}-day streak. Consistency beats motivation. 🧠`);
  }

  const weightDiff = latestWeight !== null && firstWeight !== null ? (latestWeight - firstWeight).toFixed(1) : '0';
  const fatDiff = latestFat !== null && firstFat !== null ? (latestFat - firstFat).toFixed(1) : '0';
  const leanMass = latestWeight !== null && latestFat !== null ? (latestWeight * (1 - latestFat / 100)).toFixed(1) : '-';

  return {
    totalWorkouts, currentStreak, longestStreak, weeksGoalMet, bestDay, worstDay,
    latestWeight: latestWeight ?? '-', weightDiff,
    latestBodyFat: latestFat ?? '-', fatDiff, leanMass,
    successRate, disciplineScore, daysSinceLastFailure, avgGapBetweenFailures,
    riskLevel, patternInsights, xp, level, levelTitle, xpInLevel, xpToNext,
    monthlyWorkouts, monthlyTarget, achievements, coachMessages,
    todayCompleted, todayWeekIdx, todayDayIdx,
  };
}

/* ════════════════════════════════════════════════════════
 *  ZUSTAND STORE
 * ════════════════════════════════════════════════════════ */

interface GymStore {
  // ── State ──
  data: GymWeekRaw[];
  targetDays: number;
  workoutSystem: WorkoutSystemId;
  loaded: boolean;
  saving: boolean;
  unsubscribeProfile: (() => void) | null;
  unsubscribeLogs: (() => void) | null;

  // ── Selectors ──
  getEnrichedData: () => GymWeekEnriched[];
  getStats: () => GymStats;

  // ── Sync Lifecycle ──
  initSync: (uid: string) => void;
  cleanup: () => void;

  // ── Mutations ──
  setTargetDays: (uid: string, days: number) => Promise<void>;
  setWorkoutSystem: (uid: string, system: WorkoutSystemId) => Promise<void>;
  updateWeight: (uid: string, weekIndex: number, value: string) => Promise<void>;
  updateBodyFat: (uid: string, weekIndex: number, value: string) => Promise<void>;
  
  toggleDay: (uid: string, weekIndex: number, dayIndex: number) => Promise<void>;
  updateSession: (uid: string, weekIndex: number, dayIndex: number, sessionData: GymSession) => Promise<void>;
  deleteSession: (uid: string, weekIndex: number, dayIndex: number) => Promise<void>;
  markTodayComplete: (uid: string) => Promise<void>;
}

export const useGymStore = create<GymStore>((set, get) => ({
  data: generateInitialData(),
  targetDays: 5,
  workoutSystem: 'ppl' as WorkoutSystemId,
  loaded: false,
  saving: false,
  unsubscribeProfile: null,
  unsubscribeLogs: null,

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

  initSync: (uid: string) => {
    const { unsubscribeProfile, unsubscribeLogs } = get();
    if (unsubscribeProfile) unsubscribeProfile();
    if (unsubscribeLogs) unsubscribeLogs();

    set({ loaded: false });

    const profileRef = doc(db, `users/${uid}/gym_profile/main`);
    
    // 1. Force server fetch first to bypass stubborn IndexedDB tab persistence
    getDocFromServer(profileRef).then(docSnap => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        set({ targetDays: d.targetDays || 5, workoutSystem: d.workoutSystem || 'ppl' });
        set((state) => {
          const newData = [...state.data];
          const weights = d.weeklyWeights || {};
          const bodyFats = d.weeklyBodyFats || {};
          for (let i = 0; i < 52; i++) {
            if (weights[i] !== undefined) newData[i].weight = weights[i];
            if (bodyFats[i] !== undefined) newData[i].bodyFat = bodyFats[i];
          }
          return { data: newData };
        });
      }
    }).catch(err => console.warn("[GymStore] Server pull failed for profile.", err));

    // 2. Subscribe to profile/metrics real-time
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        set({ targetDays: d.targetDays || 5, workoutSystem: d.workoutSystem || 'ppl' });
        
        // Reconstruct Weekly Weights and BodyFats into the 52-week array
        set((state) => {
          const newData = [...state.data];
          const weights = d.weeklyWeights || {};
          const bodyFats = d.weeklyBodyFats || {};
          
          for (let i = 0; i < 52; i++) {
            if (weights[i] !== undefined) newData[i].weight = weights[i];
            if (bodyFats[i] !== undefined) newData[i].bodyFat = bodyFats[i];
          }
          return { data: newData };
        });
      }
    });

    // 3. Force server fetch for logs
    const logsRef = collection(db, `users/${uid}/gym_logs`);
    const q = query(logsRef);
    
    getDocsFromServer(q).then(snapshot => {
      set((state) => {
        const newData = generateInitialData();
        for (let i = 0; i < 52; i++) {
          newData[i].weight = state.data[i].weight;
          newData[i].bodyFat = state.data[i].bodyFat;
        }
        snapshot.docs.forEach((logDoc) => {
          const l = logDoc.data();
          const logDate = new Date(l.dateStr);
          logDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((logDate.getTime() - YEAR_START.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff < 364) {
            const weekIndex = Math.floor(daysDiff / 7);
            const dayIndex = daysDiff % 7;
            newData[weekIndex].days[dayIndex] = l.isDone || false;
            if (l.session) newData[weekIndex].sessions[dayIndex] = l.session;
          }
        });
        return { data: newData, loaded: true };
      });
    }).catch(err => console.warn("[GymStore] Server pull failed for logs.", err));

    // 4. Subscribe to logs subcollection real-time
    const unsubLogs = onSnapshot(q, (snapshot) => {
      set((state) => {
        // Start from a fresh template but copy over the weights/fats from current state
        const newData = generateInitialData();
        for (let i = 0; i < 52; i++) {
          newData[i].weight = state.data[i].weight;
          newData[i].bodyFat = state.data[i].bodyFat;
        }

        // Apply every log entry to the correct week/day
        snapshot.docs.forEach((logDoc) => {
          const l = logDoc.data();
          const logDate = new Date(l.dateStr);
          logDate.setHours(0, 0, 0, 0);

          const daysDiff = Math.floor((logDate.getTime() - YEAR_START.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff < 364) {
            const weekIndex = Math.floor(daysDiff / 7);
            const dayIndex = daysDiff % 7;

            newData[weekIndex].days[dayIndex] = l.isDone || false;
            if (l.session) {
              newData[weekIndex].sessions[dayIndex] = l.session;
            }
          }
        });
        
        return { data: newData, loaded: true };
      });
    });

    set({ unsubscribeProfile: unsubProfile, unsubscribeLogs: unsubLogs });
  },

  cleanup: () => {
    const { unsubscribeProfile, unsubscribeLogs } = get();
    if (unsubscribeProfile) unsubscribeProfile();
    if (unsubscribeLogs) unsubscribeLogs();
    set({ unsubscribeProfile: null, unsubscribeLogs: null, data: generateInitialData(), loaded: false });
  },

  setTargetDays: async (uid: string, days: number) => {
    const { isOnline } = useSyncStore.getState();
    set({ targetDays: days });
    
    if (isOnline) {
      await setDoc(doc(db, `users/${uid}/gym_profile/main`), { targetDays: days }, { merge: true });
    } else {
      useSyncStore.getState().enqueueAction('PREFERENCES_UPDATE', { path: `users/${uid}/gym_profile/main`, data: { targetDays: days } });
    }
  },

  setWorkoutSystem: async (uid: string, system: WorkoutSystemId) => {
    const { isOnline } = useSyncStore.getState();
    set({ workoutSystem: system });
    
    if (isOnline) {
      await setDoc(doc(db, `users/${uid}/gym_profile/main`), { workoutSystem: system }, { merge: true });
    } else {
      useSyncStore.getState().enqueueAction('PREFERENCES_UPDATE', { path: `users/${uid}/gym_profile/main`, data: { workoutSystem: system } });
    }
  },

  updateWeight: async (uid: string, weekIndex: number, value: string) => {
    const { isOnline } = useSyncStore.getState();
    
    set((state) => {
      const newData = [...state.data];
      newData[weekIndex] = { ...newData[weekIndex], weight: value };
      return { data: newData };
    });

    const payload = { weeklyWeights: { [weekIndex]: value } };
    if (isOnline) {
      await setDoc(doc(db, `users/${uid}/gym_profile/main`), payload, { merge: true });
    } else {
      useSyncStore.getState().enqueueAction('GYM_UPDATE_WEIGHT', { path: `users/${uid}/gym_profile/main`, data: payload });
    }
  },

  updateBodyFat: async (uid: string, weekIndex: number, value: string) => {
    const { isOnline } = useSyncStore.getState();
    
    set((state) => {
      const newData = [...state.data];
      newData[weekIndex] = { ...newData[weekIndex], bodyFat: value };
      return { data: newData };
    });

    const payload = { weeklyBodyFats: { [weekIndex]: value } };
    if (isOnline) {
      await setDoc(doc(db, `users/${uid}/gym_profile/main`), payload, { merge: true });
    } else {
      useSyncStore.getState().enqueueAction('GYM_UPDATE_BODY_FAT', { path: `users/${uid}/gym_profile/main`, data: payload });
    }
  },

  toggleDay: async (uid: string, weekIndex: number, dayIndex: number) => {
    const { isOnline } = useSyncStore.getState();
    let isDone = false;

    set((state) => {
      const newData = [...state.data];
      isDone = !newData[weekIndex].days[dayIndex];
      newData[weekIndex] = {
        ...newData[weekIndex],
        days: newData[weekIndex].days.map((d, i) => (i === dayIndex ? isDone : d)),
      };
      return { data: newData };
    });

    const d = getDateForIndex(weekIndex, dayIndex);
    const dateStr = getLocalDateString(d);
    
    // Write directly to log document
    const logRef = doc(db, `users/${uid}/gym_logs/${dateStr}`);
    
    if (isDone) {
      const payload = { dateStr, isDone: true, loggedAt: serverTimestamp() };
      if (isOnline) {
        await setDoc(logRef, payload, { merge: true });
      } else {
        useSyncStore.getState().enqueueAction('GYM_TOGGLE_DAY', { path: `users/${uid}/gym_logs/${dateStr}`, data: payload });
      }
    } else {
      // If toggling off, either delete doc entirely or mark as isDone = false if we want to preserve session log. 
      // For simplicity matching old logic, un-toggling destroys the implicit workout flag.
      // Easiest is to set isDone = false so we keep session notes if they exist.
      if (isOnline) {
        await setDoc(logRef, { isDone: false }, { merge: true });
      } else {
        useSyncStore.getState().enqueueAction('GYM_TOGGLE_DAY', { path: `users/${uid}/gym_logs/${dateStr}`, data: { isDone: false } });
      }
    }
  },

  updateSession: async (uid: string, weekIndex: number, dayIndex: number, sessionData: GymSession) => {
    const { isOnline } = useSyncStore.getState();
    
    set((state) => {
      const newData = [...state.data];
      newData[weekIndex].sessions = { ...newData[weekIndex].sessions, [dayIndex]: sessionData };
      newData[weekIndex].days = newData[weekIndex].days.map((d, i) => (i === dayIndex ? true : d)); // Auto-toggle day to true
      return { data: newData };
    });

    const d = getDateForIndex(weekIndex, dayIndex);
    const dateStr = getLocalDateString(d);
    const logRef = doc(db, `users/${uid}/gym_logs/${dateStr}`);
    
    const payload = { dateStr, isDone: true, session: sessionData, loggedAt: serverTimestamp() };

    if (isOnline) {
      await setDoc(logRef, payload, { merge: true });
    } else {
      useSyncStore.getState().enqueueAction('GYM_UPDATE_SESSION', { path: `users/${uid}/gym_logs/${dateStr}`, data: payload });
    }
  },

  deleteSession: async (uid: string, weekIndex: number, dayIndex: number) => {
    const { isOnline } = useSyncStore.getState();
    
    set((state) => {
      const newData = [...state.data];
      const newSessions = { ...newData[weekIndex].sessions };
      delete newSessions[dayIndex.toString()];
      newData[weekIndex].sessions = newSessions;
      newData[weekIndex].days = newData[weekIndex].days.map((d, i) => (i === dayIndex ? false : d)); // Auto-toggle day to false
      return { data: newData };
    });

    const d = getDateForIndex(weekIndex, dayIndex);
    const dateStr = getLocalDateString(d);
    const logRef = doc(db, `users/${uid}/gym_logs/${dateStr}`);

    if (isOnline) {
      await deleteDoc(logRef);
    } else {
      useSyncStore.getState().enqueueAction('GYM_DELETE_SESSION', { path: `users/${uid}/gym_logs/${dateStr}`, payload: null });
    }
  },

  markTodayComplete: async (uid: string) => {
    const stats = get().getStats();
    if (stats.todayWeekIdx >= 0 && stats.todayDayIdx >= 0) {
      await get().toggleDay(uid, stats.todayWeekIdx, stats.todayDayIdx);
    }
  },
}));
