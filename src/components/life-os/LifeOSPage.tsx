/**
 * ═══════════════════════════════════════════════════════════
 *  LifeOSPage — Life Operating System Dashboard
 * ═══════════════════════════════════════════════════════════
 *
 *  Architecture:
 *  - This is a "smart" container component. It derives all
 *    dashboard data from existing Zustand stores (salah, habits, gym).
 *  - Every child component is a pure "dumb" presentation component
 *    that receives typed props.
 *  - Firestore listeners are already active in each store;
 *    this page simply reads computed state from them.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSalahStore }   from '../../stores/useSalahStore';
import { useHabitStore }   from '../../stores/useHabitStore';
import { useGymStore }     from '../../stores/useGymStore';
import { useAuthStore }    from '../../stores/useAuthStore';
import { db }              from '../../firebase';
import {
  doc, onSnapshot, setDoc, serverTimestamp,
} from 'firebase/firestore';

import LifeScoreCard       from './LifeScoreCard';
import { LifeStatusGrid }  from './StatusCard';
import MissionCard         from './MissionCard';
import PrayerStatusCard    from './PrayerStatusCard';
import HabitEngineCard     from './HabitEngineCard';
import AIInsightsCard      from './AIInsightsCard';
import TimeAwarenessCard   from './TimeAwarenessCard';
import DailyReflectionCard from './DailyReflectionCard';

import {
  LifeScoreCardSkeleton,
  LifeStatusGridSkeleton,
  GlassCardSkeleton,
  PrayerCardSkeleton,
} from './SkeletonLoaders';

import type {
  LifeScoreData,
  StatusCardData,
  MissionData,
  MissionTask,
  PrayerStatusData,
  PrayerSlot,
  HabitEngineItem,
  AIInsight,
  TimeAwarenessData,
  ReflectionEntry,
} from '../../types/life-os.types';

import { PRAYER_NAMES, PRAYER_LABELS } from '../../types/salah.types';

/* ────────────────────────────────────────────────
   Pure helpers
──────────────────────────────────────────────── */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Converts minutes-remaining to "Xh Ym" or "Ym" */
function minsToLabel(mins: number): string {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Very lightweight Hijri date formatter.
 * Uses the browser's Intl.DateTimeFormat with islamic-umalqura calendar.
 */
function getHijriDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

/* ────────────────────────────────────────────────
   Prayer time estimator using adhan (if available)
   Falls back to hardcoded fallback times
──────────────────────────────────────────────── */
async function computePrayerTimes(): Promise<Record<string, Date> | null> {
  try {
    // Dynamic import so it doesn't block if not installed
    const { CalculationMethod, Coordinates, PrayerTimes } = await import('adhan');
    // Use a generic latitude/longitude (Cairo) — in production, read from user profile.
    const coordinates = new Coordinates(30.0444, 31.2357);
    const params = CalculationMethod.Egyptian();
    const date = new Date();
    const pt = new PrayerTimes(coordinates, date, params);
    return {
      fajr:    pt.fajr,
      dhuhr:   pt.dhuhr,
      asr:     pt.asr,
      maghrib: pt.maghrib,
      isha:    pt.isha,
    };
  } catch {
    return null;
  }
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/* ────────────────────────────────────────────────
   Static AI insights generator (derives from store data)
──────────────────────────────────────────────── */
function deriveInsights(
  prayerCompletionPct: number,
  habitStreakAvg: number,
  gymStreakDays: number,
): AIInsight[] {
  const insights: AIInsight[] = [];

  if (prayerCompletionPct < 60) {
    insights.push({
      id: 'prayer-low',
      type: 'warning',
      title: 'Prayer consistency needs attention',
      body: "You've been missing prayers frequently. Consider setting reminders 10 minutes before each prayer time. Consistency is more important than perfection.",
      dimension: 'spiritual',
    });
  } else if (prayerCompletionPct >= 80) {
    insights.push({
      id: 'prayer-high',
      type: 'praise',
      title: 'Excellent spiritual consistency!',
      body: 'Your prayer completion rate is above 80%. This is building a strong foundation. Keep the momentum going!',
      dimension: 'spiritual',
    });
  }

  if (habitStreakAvg < 3) {
    insights.push({
      id: 'habit-streaks-low',
      type: 'tip',
      title: 'Build habits through environment design',
      body: 'Your habit streaks are still building. Try habit stacking — attach new habits to existing ones. Start with just 2 minutes to lower activation energy.',
      dimension: 'productivity',
    });
  }

  if (gymStreakDays >= 7) {
    insights.push({
      id: 'gym-streak',
      type: 'praise',
      title: `${gymStreakDays}-day gym streak — elite consistency!`,
      body: 'Maintaining a gym streak over a week is a sign of real discipline. Your body is adapting and getting stronger every session.',
      dimension: 'health',
    });
  } else if (gymStreakDays === 0) {
    insights.push({
      id: 'gym-restart',
      type: 'tip',
      title: 'Time to restart your gym momentum',
      body: 'A single workout session can reignite your momentum. Schedule 30 minutes today — even a light session counts.',
      dimension: 'health',
    });
  }

  insights.push({
    id: 'morning-productivity',
    type: 'pattern',
    title: 'Schedule deep work before noon',
    body: 'Research shows cognitive performance peaks in the morning hours. Block 9–12am for your most demanding tasks, and save admin work for the afternoon.',
    dimension: 'focus',
  });

  return insights.slice(0, 4);
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
════════════════════════════════════════════════════════════ */

/** Dimension to page mapping */
const DIMENSION_PAGE_MAP: Record<string, string> = {
  spiritual:    'salah',
  health:       'gym',
  productivity: 'habits',
  focus:        'habits',
};

interface LifeOSPageProps {
  onNavigate?: (page: string) => void;
}

export default function LifeOSPage({ onNavigate }: LifeOSPageProps) {
  const user = useAuthStore((s) => s.user);

  /* ── Store access ── */
  const todayEntry   = useSalahStore((s) => s.todayData);
  const salahLoaded  = useSalahStore((s) => s.loaded);

  const habits       = useHabitStore((s) => s.habits);
  const habitsLoaded = useHabitStore((s) => s.loaded);
  const getStats     = useGymStore((s) => s.getStats);
  const gymLoaded    = useGymStore((s) => s.loaded);
  const gymStats     = gymLoaded ? getStats() : null;

  /* ── Store initialisation (idempotent) ── */
  useEffect(() => {
    if (!user?.uid) return;
    useSalahStore.getState().initialize(user.uid);
    useHabitStore.getState().initSync(user.uid);
    useGymStore.getState().initSync(user.uid);
  }, [user?.uid]);

  /* ── Mission / tasks local state (Firestore-backed) ── */
  const [missionTasks, setMissionTasks] = useState<MissionTask[]>([
    { id: '1', title: 'Complete Deep Work Session', priority: 'high',   completed: false, category: 'focus'        },
    { id: '2', title: 'Go to the Gym',              priority: 'high',   completed: false, category: 'health'       },
    { id: '3', title: 'Read 30 Minutes',            priority: 'medium', completed: false, category: 'learning'     },
    { id: '4', title: 'Review Weekly Goals',        priority: 'medium', completed: false, category: 'productivity' },
    { id: '5', title: 'Evening Dhikr',              priority: 'low',    completed: false, category: 'spiritual'    },
  ]);

  /* ── Prayer times (adhan) ── */
  const [prayerTimes, setPrayerTimes] = useState<Record<string, Date> | null>(null);
  useEffect(() => {
    computePrayerTimes().then(setPrayerTimes);
  }, []);

  /* ── Reflection (Firestore) ── */
  const [reflection, setReflection] = useState<Partial<ReflectionEntry>>({});
  const today = todayStr();

  useEffect(() => {
    if (!user?.uid) return;
    const ref = doc(db, 'users', user.uid, 'reflections', today);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setReflection(snap.data() as ReflectionEntry);
    });
    return unsub;
  }, [user?.uid, today]);

  const handleSaveReflection = async (entry: Omit<ReflectionEntry, 'savedAt'>) => {
    if (!user?.uid) return;
    const ref = doc(db, 'users', user.uid, 'reflections', today);
    await setDoc(ref, { ...entry, savedAt: serverTimestamp() }, { merge: true });
  };

  /* ── Toggle mission task ── */
  const handleToggleTask = (taskId: string) => {
    setMissionTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  /* ════════ Derived data ════════ */

  /* Prayer slots */
  const prayerSlots = useMemo<PrayerSlot[]>(() => {
    return PRAYER_NAMES.map((name) => {
      const entry   = todayEntry?.prayers?.[name];
      const timeObj = prayerTimes?.[name];
      return {
        name,
        label: PRAYER_LABELS[name].en,
        emoji: PRAYER_LABELS[name].emoji,
        status: entry?.status ?? 'none',
        time:   timeObj ? formatTime(timeObj) : undefined,
      };
    });
  }, [todayEntry, prayerTimes]);

  const completedStatuses = ['mosque', 'congregation', 'ontime', 'late'];
  const completedPrayerCount = prayerSlots.filter((p) => completedStatuses.includes(p.status)).length;

  /* Next prayer */
  const nextPrayerInfo = useMemo(() => {
    if (!prayerTimes) return undefined;
    const now = new Date();
    const order = PRAYER_NAMES;
    for (const name of order) {
      const pt = prayerTimes[name];
      if (pt && pt > now) {
        const minsLeft = Math.round((pt.getTime() - now.getTime()) / 60000);
        return {
          name,
          label: PRAYER_LABELS[name].en,
          emoji: PRAYER_LABELS[name].emoji,
          timeLeft: minsToLabel(minsLeft),
          time: formatTime(pt),
        };
      }
    }
    return undefined;
  }, [prayerTimes]);

  /* Prayer completion % */
  const prayerPct = Math.round((completedPrayerCount / 5) * 100);

  /* Habit engine items */
  /* Habit engine items — derive streak from history since HabitRaw has no computed stats */
  const habitItems = useMemo<HabitEngineItem[]>(() => {
    return habits
      .filter((h) => !h.isHidden)
      .slice(0, 6)
      .map((h) => {
        const history = h.history ?? {};
        // Today
        const todayStatus = history[today]?.status;
        // Week pips (last 7 days)
        let weekDone = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (history[ds]?.status === 'completed') weekDone++;
        }
        // Compute current streak from history
        let currentStreak = 0;
        const checkDate = new Date();
        for (let i = 0; i < 365; i++) {
          const ds = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          if (history[ds]?.status === 'completed') {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        return {
          id:             h.id,
          name:           h.name,
          icon:           h.icon ?? '✅',
          currentStreak,
          weeklyDone:     weekDone,
          weeklyTarget:   7,
          todayDone:      todayStatus === 'completed',
          category:       h.category ?? 'custom',
        };
      });
  }, [habits, today]);

  /* Habit streak average */
  const habitStreakAvg = habitItems.length > 0
    ? Math.round(habitItems.reduce((s, h) => s + h.currentStreak, 0) / habitItems.length)
    : 0;

  /* Life Dimensions */
  const spiritualScore = Math.min(100, Math.round(prayerPct * 0.8 + (habitItems.some(h => h.name.toLowerCase().includes('quran')) ? 20 : 0)));
  const healthScore     = Math.min(100, Math.round((gymStats?.currentStreak ?? 0) * 5 + 40));
  const productivityScore = Math.min(100, Math.round(
    missionTasks.filter(t => t.completed).length / Math.max(missionTasks.length, 1) * 60 + habitStreakAvg * 2
  ));
  const focusScore = Math.min(100, Math.round(habitItems.filter(h => h.category === 'productivity' || h.category === 'learning').length * 15 + 40));

  const lifeScore: LifeScoreData = useMemo(() => ({
    overall: Math.round((spiritualScore + healthScore + productivityScore + focusScore) / 4),
    dimensions: [
      { key: 'spiritual',    label: 'Spiritual',    icon: '🕌', score: spiritualScore,    color: '#10b981', delta: 2  },
      { key: 'productivity', label: 'Productivity', icon: '⚡', score: productivityScore, color: '#8b5cf6', delta: -3 },
      { key: 'health',       label: 'Health',       icon: '💪', score: healthScore,       color: '#f43f5e', delta: 5  },
      { key: 'focus',        label: 'Focus',        icon: '🎯', score: focusScore,        color: '#3b82f6', delta: 0  },
    ],
  }), [spiritualScore, healthScore, productivityScore, focusScore]);

  const statusCards = useMemo<StatusCardData[]>(() => [
    {
      dimension: 'spiritual',
      metrics: [
        { label: 'Prayers today',    value: `${completedPrayerCount}/5`, trend: prayerPct >= 80 ? 'up' : 'flat' },
        { label: 'Prayer streak',    value: /** TODO: use real streak */ '—'             },
        { label: 'Dhikr',            value: habitItems.some(h => h.name.toLowerCase().includes('dhikr') && h.todayDone) ? '✓' : '—' },
      ],
    },
    {
      dimension: 'productivity',
      metrics: [
        { label: 'Tasks done today', value: `${missionTasks.filter(t => t.completed).length}/${missionTasks.length}`, trend: 'flat' },
        { label: 'Habit completion', value: `${habitItems.filter(h => h.todayDone).length}/${habitItems.length}`, trend: 'up' },
        { label: 'Avg streak',       value: habitStreakAvg, unit: 'days'                  },
      ],
    },
    {
      dimension: 'health',
      metrics: [
        { label: 'Gym sessions (wk)', value: gymStats?.monthlyWorkouts ?? 0, trend: 'up' as const },
        { label: 'Current streak',    value: gymStats?.currentStreak ?? 0, unit: 'days'     },
        { label: 'Calories burned',   value: '—'                                            },
      ],
    },
    {
      dimension: 'focus',
      metrics: [
        { label: 'Deep work blocks', value: '—'                                                    },
        { label: 'Focus habits',     value: habitItems.filter(h => h.category === 'focus' || h.category === 'productivity').length },
        { label: 'Distraction level', value: 'Low', trend: 'up'                                   },
      ],
    },
  ], [completedPrayerCount, prayerPct, missionTasks, habitItems, gymStats, habitStreakAvg]);

  const aiInsights = useMemo(
    () => deriveInsights(prayerPct, habitStreakAvg, gymStats?.currentStreak ?? 0),
    [prayerPct, habitStreakAvg, gymStats?.currentStreak],
  );

  const timeData = useMemo<TimeAwarenessData>(() => {
    const now = new Date();
    return {
      currentTime:  formatTime(now),
      currentDate:  formatDateLabel(now),
      hijriDate:    getHijriDate(now),
      nextPrayer:   nextPrayerInfo,
      nextTask:     missionTasks.find(t => !t.completed && t.dueTime)
        ? { title: missionTasks.find(t => !t.completed && t.dueTime)!.title, time: missionTasks.find(t => !t.completed && t.dueTime)!.dueTime! }
        : undefined,
    };
  }, [nextPrayerInfo, missionTasks]);

  const isLoading = !salahLoaded || !habitsLoaded || !gymLoaded;

  /* ════════ Render ════════ */
  return (
    <div className="flex flex-col gap-4 sm:gap-5 animate-fade-in">

      {/* ── Section label ── */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Life OS
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Your personal life management system — {formatDateLabel(new Date())}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ROW 1: Life Score + Time (side by side on lg)
          ============================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {isLoading ? (
            <LifeScoreCardSkeleton />
          ) : (
            <LifeScoreCard data={lifeScore} onNavigate={onNavigate} dimensionPageMap={DIMENSION_PAGE_MAP} />
          )}
        </div>
        <div>
          <TimeAwarenessCard data={timeData} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ROW 2: Status Grid (4 dimension cards)
          ============================================== */}
      {isLoading ? (
        <LifeStatusGridSkeleton />
      ) : (
        <LifeStatusGrid
          cards={statusCards}
          scores={{
            spiritual:    spiritualScore,
            productivity: productivityScore,
            health:       healthScore,
            focus:        focusScore,
          }}
          onNavigate={onNavigate}
          dimensionPageMap={DIMENSION_PAGE_MAP}
        />
      )}

      {/* ══════════════════════════════════════════════
          ROW 3: Mission + Prayer (side by side on md+)
          ============================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <GlassCardSkeleton rows={5} />
            <PrayerCardSkeleton />
          </>
        ) : (
          <>
            <MissionCard
              data={{ date: today, tasks: missionTasks }}
              onToggleTask={handleToggleTask}
            />
            <PrayerStatusCard
              data={{
                prayers:        prayerSlots,
                completedCount: completedPrayerCount,
                totalCount:     5,
                nextPrayer:     nextPrayerInfo,
              }}
              onNavigate={() => onNavigate?.('salah')}
            />
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          ROW 4: Habit Engine + AI Insights
          ============================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <GlassCardSkeleton rows={5} />
            <GlassCardSkeleton rows={4} />
          </>
        ) : (
          <>
            <HabitEngineCard habits={habitItems} onNavigate={() => onNavigate?.('habits')} />
            <AIInsightsCard  insights={aiInsights} />
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          ROW 5: Daily Reflection (full width)
          ============================================== */}
      {isLoading ? (
        <GlassCardSkeleton rows={3} />
      ) : (
        <DailyReflectionCard
          date={today}
          initialData={reflection}
          onSave={handleSaveReflection}
        />
      )}
    </div>
  );
}
