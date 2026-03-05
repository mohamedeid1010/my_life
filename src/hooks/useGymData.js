import { useState, useMemo, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

/* ──────────────────────────────────────────── */
/*  Generate initial 52-week data               */
/* ──────────────────────────────────────────── */
function generateInitialData() {
  const data = [];
  const currentStart = new Date(2026, 0, 3);
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
  });

  for (let w = 1; w <= 52; w++) {
    data.push({
      week: w,
      startDate: dateFormatter.format(currentStart),
      days: [false, false, false, false, false, false, false],
      sessions: {},  // keyed by dayIndex, e.g. { 0: { sessionType, exercises, totalVolume, ... } }
      weight: '',
      bodyFat: '',
    });
    currentStart.setDate(currentStart.getDate() + 7);
  }
  return data;
}

/* ──────────────────────────────────────────── */
/*  Enrich data with statuses & week info       */
/* ──────────────────────────────────────────── */
function computeEnrichedData(data, targetDays, today) {
  const startDate = new Date(2026, 0, 3);
  
  return data.map((week, wIdx) => {
    const weekWorkouts = week.days.filter(Boolean).length;
    const isGoalMet = weekWorkouts >= targetDays;

    const wStart = new Date(startDate);
    wStart.setDate(wStart.getDate() + wIdx * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 6);
    wEnd.setHours(23, 59, 59, 999);
    const isCurrentWeek = today >= wStart && today <= wEnd;

    const maxBreaks = 7 - targetDays;
    let workoutsDone = 0;
    let breaksTaken = 0;

    const enrichedDays = week.days.map((isDone, dIdx) => {
      const cellDate = new Date(startDate);
      cellDate.setDate(cellDate.getDate() + wIdx * 7 + dIdx);
      cellDate.setHours(0, 0, 0, 0);

      let status;
      if (isDone) {
        status = 'WORKOUT';
        workoutsDone++;
      } else if (workoutsDone >= targetDays) {
        status = 'LOCKED_REST';
      } else if (cellDate < today) {
        // Smart breaks: only give a break if user has done at least 1 workout
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

    return {
      ...week,
      weekWorkouts,
      isGoalMet,
      isCurrentWeek,
      enrichedDays,
    };
  });
}

/* ──────────────────────────────────────────── */
/*  Compute all stats, momentum, patterns, etc. */
/* ──────────────────────────────────────────── */
function computeStats(enrichedData) {
  let totalWorkouts = 0;
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayMissedCounts = [0, 0, 0, 0, 0, 0, 0];
  let firstWeight = null;
  let latestWeight = null;
  let firstFat = null;
  let latestFat = null;
  const allDayStatuses = [];
  let weeksGoalMet = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayCompleted = false;
  let todayWeekIdx = -1;
  let todayDayIdx = -1;

  enrichedData.forEach((week) => {
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
        todayWeekIdx = enrichedData.indexOf(week);
        todayDayIdx = dIdx;
      }

      if (dayObj.date <= today) {
        allDayStatuses.push({ status: dayObj.status, dayIndex: dIdx, date: dayObj.date });
      }
    });
  });

  // Current Streak
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

  // Longest Streak
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

  // Success Rate
  const resolvedDays = allDayStatuses.filter(d => d.status !== 'PENDING');
  const successDays = resolvedDays.filter(
    d => d.status === 'WORKOUT' || d.status === 'LOCKED_REST' || d.status === 'AUTO_REST'
  );
  const successRate = resolvedDays.length > 0
    ? Math.round((successDays.length / resolvedDays.length) * 100)
    : 0;

  // Discipline Score
  const streakBonus = Math.min(currentStreak / 30, 1) * 35;
  const consistencyBonus = (successRate / 100) * 35;
  const goalMetBonus = Math.min(weeksGoalMet / 10, 1) * 30;
  const disciplineScore = Math.round(streakBonus + consistencyBonus + goalMetBonus);

  // Momentum
  const failureDates = [];
  allDayStatuses.forEach((d) => {
    if (d.status === 'MISSED') failureDates.push(d.date);
  });

  let daysSinceLastFailure = 0;
  if (failureDates.length > 0) {
    const lastFailure = failureDates[failureDates.length - 1];
    daysSinceLastFailure = Math.floor((today - lastFailure) / (1000 * 60 * 60 * 24));
  } else {
    daysSinceLastFailure = allDayStatuses.filter(d => d.status !== 'PENDING').length;
  }

  let avgGapBetweenFailures = 0;
  if (failureDates.length >= 2) {
    let totalGap = 0;
    for (let i = 1; i < failureDates.length; i++) {
      totalGap += Math.floor((failureDates[i] - failureDates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    avgGapBetweenFailures = Math.round(totalGap / (failureDates.length - 1));
  } else if (failureDates.length === 1) {
    avgGapBetweenFailures = daysSinceLastFailure;
  }

  let riskLevel = 'low';
  if (failureDates.length > 0 && avgGapBetweenFailures > 0) {
    if (daysSinceLastFailure >= avgGapBetweenFailures * 0.9) {
      riskLevel = 'high';
    } else if (daysSinceLastFailure >= avgGapBetweenFailures * 0.7) {
      riskLevel = 'medium';
    }
  }

  // Patterns
  const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const maxDayCount = Math.max(...dayCounts);
  const bestDay = maxDayCount > 0 ? dayNames[dayCounts.indexOf(maxDayCount)] : 'N/A';
  const maxMissedCount = Math.max(...dayMissedCounts);
  const worstDay = maxMissedCount > 0 ? dayNames[dayMissedCounts.indexOf(maxMissedCount)] : 'N/A';

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

  const patternInsights = [];
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

  // Gamification
  const xp = totalWorkouts * 25 + currentStreak * 10 + weeksGoalMet * 50;
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpToNext = 500;

  const levelTitles = [
    'Beginner', 'Starter', 'Trainee', 'Warrior', 'Fighter',
    'Champion', 'Gladiator', 'Titan', 'Legend', 'Immortal',
  ];
  const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

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

  const achievements = [
    { name: 'First Workout', desc: 'Complete your first workout', unlocked: totalWorkouts >= 1, icon: '🏋️' },
    { name: '7-Day Streak', desc: 'Maintain a 7-day streak', unlocked: longestStreak >= 7, icon: '🔥' },
    { name: '14-Day Streak', desc: 'Maintain a 14-day streak', unlocked: longestStreak >= 14, icon: '⚡' },
    { name: '30-Day Streak', desc: 'Maintain a 30-day streak', unlocked: longestStreak >= 30, icon: '💎' },
    { name: 'Week Champion', desc: 'Meet your weekly goal', unlocked: weeksGoalMet >= 1, icon: '🏆' },
    { name: 'Month Master', desc: 'Meet 4 weekly goals', unlocked: weeksGoalMet >= 4, icon: '👑' },
    { name: '50 Workouts', desc: 'Complete 50 workouts', unlocked: totalWorkouts >= 50, icon: '💯' },
    { name: 'Centurion', desc: 'Complete 100 workouts', unlocked: totalWorkouts >= 100, icon: '🦾' },
  ];

  // AI Coach
  const coachMessages = [];
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
    coachMessages.push("Great 1-week streak! Push for 14 days to unlock the ⚡ achievement.");
  }
  if (monthlyWorkouts >= monthlyTarget * 0.8 && monthlyWorkouts < monthlyTarget) {
    coachMessages.push(`Almost there! ${monthlyTarget - monthlyWorkouts} more workout${monthlyTarget - monthlyWorkouts > 1 ? 's' : ''} to crush this month's challenge!`);
  }
  if (coachMessages.length === 0) {
    if (currentStreak === 0) {
      coachMessages.push("Today is a fresh start. One workout can rebuild everything. Let's go! 💪");
    } else {
      coachMessages.push(`${currentStreak}-day streak and counting. Consistency beats motivation every time. 🧠`);
    }
  }

  const weightDiff = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : 0;
  const fatDiff = latestFat && firstFat ? (latestFat - firstFat).toFixed(1) : 0;
  const leanMass =
    latestWeight && latestFat
      ? (latestWeight * (1 - latestFat / 100)).toFixed(1)
      : '-';

  return {
    totalWorkouts,
    currentStreak,
    longestStreak,
    weeksGoalMet,
    bestDay,
    worstDay,
    latestWeight: latestWeight || '-',
    weightDiff,
    latestBodyFat: latestFat || '-',
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

/* ──────────────────────────────────────────── */
/*  Firestore save/load helpers                 */
/* ──────────────────────────────────────────── */
function serializeForFirestore(data) {
  return data.map(week => ({
    week: week.week,
    startDate: week.startDate,
    days: week.days,
    sessions: week.sessions || {},
    weight: week.weight,
    bodyFat: week.bodyFat,
  }));
}

/* ──────────────────────────────────────────── */
/*  localStorage cache helpers                   */
/* ──────────────────────────────────────────── */
const CACHE_KEY = 'herizon_gym_cache';

function loadFromCache(uid) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToCache(uid, gymData, targetDays, workoutSystem) {
  try {
    localStorage.setItem(`${CACHE_KEY}_${uid}`, JSON.stringify({
      gymData: serializeForFirestore(gymData),
      targetDays,
      workoutSystem,
      cachedAt: Date.now(),
    }));
  } catch { /* localStorage full — ignore */ }
}

/* ──────────────────────────────────────────── */
/*  Main hook                                   */
/* ──────────────────────────────────────────── */
export default function useGymData() {
  const { user } = useAuth();
  const [data, setData] = useState(generateInitialData);
  const [targetDays, setTargetDays] = useState(5);
  const [workoutSystem, setWorkoutSystem] = useState('ppl');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load: localStorage FIRST (instant), then Firestore (background merge)
  useEffect(() => {
    if (!user) {
      setLoaded(false);
      return;
    }

    // Step 1: Instant load from localStorage cache
    const cached = loadFromCache(user.uid);
    if (cached) {
      if (cached.gymData && Array.isArray(cached.gymData)) setData(cached.gymData);
      if (cached.targetDays) setTargetDays(cached.targetDays);
      if (cached.workoutSystem) setWorkoutSystem(cached.workoutSystem);
      setLoaded(true); // Show UI immediately with cached data
    }

    // Step 2: Fetch from Firestore in background
    const loadData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const saved = docSnap.data();
          if (saved.gymData && Array.isArray(saved.gymData)) {
            setData(saved.gymData);
          }
          if (saved.targetDays) setTargetDays(saved.targetDays);
          if (saved.workoutSystem) setWorkoutSystem(saved.workoutSystem);

          // Update cache with fresh Firestore data
          saveToCache(user.uid, saved.gymData || [], saved.targetDays || 5, saved.workoutSystem || 'ppl');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        // If Firestore fails but we have cache, that's fine — user sees cached data
      } finally {
        setLoaded(true);
      }
    };

    loadData();
  }, [user]);

  // Auto-save to BOTH Firestore + localStorage when data changes
  useEffect(() => {
    if (!user || !loaded) return;

    // Always save to localStorage immediately (sync, fast)
    saveToCache(user.uid, data, targetDays, workoutSystem);

    // Save to Firestore (debounced)
    setSaving(true);
    const timeout = setTimeout(async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, {
          gymData: serializeForFirestore(data),
          targetDays,
          workoutSystem,
          updatedAt: new Date().toISOString(),
          email: user.email,
          displayName: user.displayName || '',
        }, { merge: true });
      } catch (err) {
        console.error('Error saving data:', err);
      } finally {
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [data, targetDays, workoutSystem, user, loaded]);

  const toggleDay = useCallback((weekIndex, dayIndex) => {
    setData(prev => {
      const newData = [...prev];
      newData[weekIndex] = {
        ...newData[weekIndex],
        days: newData[weekIndex].days.map((d, i) => (i === dayIndex ? !d : d)),
      };
      return newData;
    });
  }, []);

  const updateWeight = (weekIndex, value) => {
    const newData = [...data];
    newData[weekIndex] = { ...newData[weekIndex], weight: value };
    setData(newData);
  };

  const updateBodyFat = (weekIndex, value) => {
    const newData = [...data];
    newData[weekIndex] = { ...newData[weekIndex], bodyFat: value };
    setData(newData);
  };

  const updateSession = useCallback((weekIndex, dayIndex, sessionData) => {
    setData(prev => {
      const newData = [...prev];
      const week = { ...newData[weekIndex] };
      week.sessions = { ...week.sessions, [dayIndex]: sessionData };
      // Also mark the day as done
      week.days = week.days.map((d, i) => i === dayIndex ? true : d);
      newData[weekIndex] = week;
      return newData;
    });
  }, []);

  const deleteSession = useCallback((weekIndex, dayIndex) => {
    setData(prev => {
      const newData = [...prev];
      const week = { ...newData[weekIndex] };
      const newSessions = { ...week.sessions };
      delete newSessions[dayIndex];
      week.sessions = newSessions;
      // Also un-toggle the day
      week.days = week.days.map((d, i) => i === dayIndex ? false : d);
      newData[weekIndex] = week;
      return newData;
    });
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const enrichedData = useMemo(() => {
    const todayObj = new Date(todayStr);
    todayObj.setHours(0, 0, 0, 0);
    return computeEnrichedData(data, targetDays, todayObj);
  }, [data, targetDays, todayStr]);

  const stats = useMemo(() => computeStats(enrichedData), [enrichedData]);

  const markTodayComplete = useCallback(() => {
    if (stats.todayWeekIdx >= 0 && stats.todayDayIdx >= 0) {
      toggleDay(stats.todayWeekIdx, stats.todayDayIdx);
    }
  }, [stats.todayWeekIdx, stats.todayDayIdx, toggleDay]);

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
