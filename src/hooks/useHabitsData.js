import { useState, useMemo, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

/* ──────────────────────────────────────────── */
/*  Helper: Get local YYYY-MM-DD string         */
/* ──────────────────────────────────────────── */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ──────────────────────────────────────────── */
/*  Compute stats for a SINGLE habit            */
/* ──────────────────────────────────────────── */
function computeHabitStats(habit) {
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

  allDates.forEach(dateStr => {
    const entry = history[dateStr];
    const dateObj = new Date(dateStr);
    
    if (entry.status === 'completed') totalCompleted++;
    if (entry.status === 'missed') totalMissed++;
    
    if (entry.status === 'skipped' && dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear) {
      graceDaysUsedThisMonth++;
    }
  });

  const graceDaysBalance = Math.max(0, (habit.graceDaysAllowance || 0) - graceDaysUsedThisMonth);
  
  // Calculate Days Passed Since Habit Start
  let startDateObj = todayObj;
  if (habit.startDate) {
    startDateObj = new Date(habit.startDate);
  } else if (allDates.length > 0) {
    startDateObj = new Date(allDates[0]);
  }
  startDateObj.setHours(0,0,0,0);
  
  // If habit hasn't started yet (future date), days passed is 0
  const daysPassedSinceStart = startDateObj <= todayObj 
    ? Math.floor((todayObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1 
    : 0;

  // True Success Rate = (Completed / Total Days Since Start)
  const successRate = daysPassedSinceStart > 0 ? Math.round((totalCompleted / daysPassedSinceStart) * 100) : 0;

  // Streak Calculation (ignores 'skipped' grace days)
  let currentStreak = 0;
  let isActiveDay = new Date(todayObj);

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
      // Grace day! Streak is not broken, just continue looking backward
      isActiveDay.setDate(isActiveDay.getDate() - 1);
    } else {
      break; // Missed or untracked
    }
  }

  // Longest Streak
  let longestStreak = 0;
  let tempStreak = 0;
  
  if (allDates.length > 0) {
    const firstDateObj = new Date(allDates[0]);
    let runner = new Date(firstDateObj);
    while (runner <= todayObj) {
      const runStr = getLocalDateString(runner);
      const entry = history[runStr];
      
      if (entry?.status === 'completed') {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else if (entry?.status === 'skipped') {
        // Grace day doesn't add to streak, but doesn't break it
      } else if (entry?.status === 'missed' || runStr !== todayStr) {
        // Break streak
        tempStreak = 0;
      }
      runner.setDate(runner.getDate() + 1);
    }
  }

  // Mastery Phase (Based on current consecutive streak)
  let masteryPhase = 'Initiation';
  let masteryProgress = 0; // 0-100% within current phase
  let nextThreshold = 21;
  const currentDays = currentStreak;
  
  if (currentDays >= 66) {
    masteryPhase = 'Mastery';
    masteryProgress = 100;
  } else if (currentDays >= 21) {
    masteryPhase = 'Integration';
    masteryProgress = Math.round(((currentDays - 21) / (66 - 21)) * 100);
    nextThreshold = 66;
  } else {
    masteryPhase = 'Initiation';
    masteryProgress = Math.round((currentDays / 21) * 100);
    nextThreshold = 21;
  }

  // Yearly Adherence Calculation
  let totalCompletedThisYear = 0;
  allDates.forEach(dateStr => {
    const entry = history[dateStr];
    const dateObj = new Date(dateStr);
    if (entry.status === 'completed' && dateObj.getFullYear() === currentYear) {
      totalCompletedThisYear++;
    }
  });

  const startOfYear = new Date(currentYear, 0, 1);
  const daysPassedThisYear = Math.floor((todayObj - startOfYear) / (1000 * 60 * 60 * 24)) + 1; // +1 to include today
  
  // Note: If the habit was created recently, we still calculate against the whole year as requested by the user,
  // showing the true commitment relative to the 365 days of the year.
  const yearlyAdherenceRate = Math.round((totalCompletedThisYear / daysPassedThisYear) * 100);

  return {
    totalCompleted,
    totalMissed,
    successRate,
    currentStreak,
    longestStreak,
    graceDaysBalance,
    yearlyAdherenceRate,
    startDateStr: getLocalDateString(startDateObj), // Exposure for UI
    daysPassedSinceStart,
    totalCompletedThisYear,
    daysPassedThisYear,
    mastery: { phase: masteryPhase, progress: masteryProgress, currentDays, nextThreshold },
    todayEntry: history[todayStr] || null
  };
}

/* ──────────────────────────────────────────── */
/*  localStorage cache helpers                   */
/* ──────────────────────────────────────────── */
const HABITS_CACHE_KEY = 'herizon_habits_cache';

function loadHabitsFromCache(uid) {
  try {
    const raw = localStorage.getItem(`${HABITS_CACHE_KEY}_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveHabitsToCache(uid, habits) {
  try {
    localStorage.setItem(`${HABITS_CACHE_KEY}_${uid}`, JSON.stringify({
      smartHabits: habits,
      cachedAt: Date.now(),
    }));
  } catch { /* localStorage full */ }
}

export default function useHabitsData() {
  const { user } = useAuth();
  
  const [habits, setHabits] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load: localStorage FIRST (instant), then Firestore (background)
  useEffect(() => {
    if (!user) {
      setLoaded(false);
      return;
    }

    // Step 1: Instant load from cache
    const cached = loadHabitsFromCache(user.uid);
    if (cached && cached.smartHabits && Array.isArray(cached.smartHabits)) {
      setHabits(cached.smartHabits);
      setLoaded(true); // Show UI immediately
    }

    // Step 2: Fetch from Firestore in background
    const loadData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const saved = docSnap.data();
          if (saved.smartHabits && Array.isArray(saved.smartHabits)) {
            setHabits(saved.smartHabits);
            saveHabitsToCache(user.uid, saved.smartHabits);
          } else if (saved.habitsData && typeof saved.habitsData === 'object') {
            const migratedHabit = {
              id: 'legacy-1',
              name: 'Daily Momentum',
              icon: '🔥',
              category: 'productivity',
              type: 'daily',
              targetType: 'boolean',
              graceDaysAllowance: 0,
              history: Object.keys(saved.habitsData).reduce((acc, date) => {
                acc[date] = { status: saved.habitsData[date] };
                return acc;
              }, {})
            };
            setHabits([migratedHabit]);
            saveHabitsToCache(user.uid, [migratedHabit]);
          }
        }
      } catch (err) {
        console.error('Error loading habits data:', err);
      } finally {
        setLoaded(true);
      }
    };

    loadData();
  }, [user]);

  // Save to BOTH localStorage + Firestore
  useEffect(() => {
    if (!user || !loaded) return;

    // Immediate localStorage save
    saveHabitsToCache(user.uid, habits);

    // Debounced Firestore save
    setSaving(true);
    const timeout = setTimeout(async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, {
          smartHabits: habits,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Error saving habits data:', err);
      } finally {
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [habits, user, loaded]);

  const addHabit = useCallback((newHabit) => {
    setHabits(prev => [...prev, {
      id: Date.now().toString(),
      history: {},
      ...newHabit
    }]);
  }, []);

  const updateHabit = useCallback((id, updates) => {
    setHabits(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)));
  }, []);

  const deleteHabit = useCallback((id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  }, []);

  const logHabitEntry = useCallback((habitId, dateStr, entryData) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      
      const prevHistory = h.history || {};
      const currentEntry = prevHistory[dateStr] || {};
      
      return {
        ...h,
        history: {
          ...prevHistory,
          [dateStr]: { ...currentEntry, ...entryData }
        }
      };
    }));
  }, []);

  // Compute stats for all habits optimally
  const habitsWithStats = useMemo(() => {
    return habits.map(h => ({
      ...h,
      stats: computeHabitStats(h)
    }));
  }, [habits]);

  const activeHabits = useMemo(() => {
    return habitsWithStats.filter(h => !h.isHidden);
  }, [habitsWithStats]);

  // Compute Global Elite Analytics
  const analytics = useMemo(() => {
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

    let strongest = null;
    let maxScore = -1;
    
    let weakest = null;
    let minScore = Number.MAX_SAFE_INTEGER;

    activeHabits.forEach(h => {
      // 1. Month vs Month consistency
      const history = h.history || {};
      
      let hCurrExpected = 0;
      let hCurrCompleted = 0;
      let hPrevExpected = 0;
      let hPrevCompleted = 0;
      
      const missedDaysOfWeek = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 }; // Sun-Sat

      Object.entries(history).forEach(([dateStr, entry]) => {
        const d = new Date(dateStr);
        const m = d.getMonth();
        const y = d.getFullYear();
        
        const isResolved = ['completed', 'missed'].includes(entry.status);
        
        // Count for Global Consistency (current month)
        if (m === currentMonth && y === currentYear && isResolved) {
          hCurrExpected++;
          if (entry.status === 'completed') hCurrCompleted++;
        }
        
        // Count for MoM (Previous month)
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
      
      // Calculate habit score (Streak + SuccessRate)
      const score = (h.stats.currentStreak * 2) + h.stats.successRate;
      if (score > maxScore) {
        maxScore = score;
        strongest = h;
      }
      // Only count as weakest if they actually started it to avoid penalizing brand new habits
      if (score < minScore && Object.keys(history).length > 2) { 
        minScore = score;
        // Find worst day of week
        let worstDayNum = 0;
        let mostMisses = -1;
        Object.entries(missedDaysOfWeek).forEach(([day, count]) => {
          if (count > mostMisses) {
            mostMisses = count;
            worstDayNum = day;
          }
        });
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        weakest = {
           ...h,
           worstDay: mostMisses > 0 ? days[worstDayNum] : 'N/A'
        };
      }
    });

    // Fallback: if no habit counts as weakest (e.g. all brand new or all 100% perfect)
    if (!weakest && activeHabits.length > 0) {
      weakest = activeHabits.reduce((min, h) => (h.stats.successRate < min.stats.successRate ? h : min), activeHabits[0]);
    }
    if (!strongest && activeHabits.length > 0) strongest = activeHabits[0];
    
    const currConsistency = currMonthExpected > 0 ? Math.round((currMonthCompleted / currMonthExpected) * 100) : 0;
    const prevConsistency = prevMonthExpected > 0 ? Math.round((prevMonthCompleted / prevMonthExpected) * 100) : 0;
    const momDelta = currConsistency - prevConsistency;

    // Monthly data points for a micro sparkline area chart
    const monthDates = [];
    const _today = new Date();
    _today.setHours(0,0,0,0);
    for(let i=29; i>=0; i--) {
       const d = new Date(_today);
       d.setDate(d.getDate() - i);
       const dStr = getLocalDateString(d);
       
       let dayTotal = 0;
       let dayComp = 0;
       activeHabits.forEach(h => {
          const entry = h.history?.[dStr];
          if (entry && (entry.status === 'completed' || entry.status === 'missed')) {
             dayTotal++;
             if(entry.status === 'completed') dayComp++;
          }
       });
       monthDates.push(dayTotal > 0 ? Math.round((dayComp/dayTotal)*100) : 0);
    }

    return {
      globalConsistency: currConsistency,
      monthOverMonthDelta: momDelta,
      strongestHabit: strongest,
      weakestHabit: weakest,
      monthTrendData: monthDates // array of 30 percentages
    };
  }, [activeHabits]);

  return {
    habits: habitsWithStats,
    activeHabits,
    analytics,
    addHabit,
    updateHabit,
    deleteHabit,
    logHabitEntry,
    loaded,
    saving
  };
}
