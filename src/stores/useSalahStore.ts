/**
 * ═══════════════════════════════════════════════════════════
 * useSalahStore — Zustand store for Prayer Tracking
 * ═══════════════════════════════════════════════════════════
 *
 * Architecture: One Firestore document per day.
 *   Path: users/{uid}/salah/{date}
 *   e.g.: users/abc123/salah/2026-03-11
 *
 * Plus a profile document:
 *   Path: users/{uid}/salah/profile
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  doc, setDoc, getDoc, onSnapshot,
  collection, query, where, getDocs, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase';

import {
  PRAYER_NAMES, PRAYER_POINTS,
} from '../types/salah.types';

import type {
  PrayerName, PrayerStatus, PrayerEntry,
  SalahDayEntry, SalahProfile, QadaPrayerEntry, QadaRecord,
} from '../types/salah.types';

/* ─────────────── Helpers ─────────────── */

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function createEmptyDay(date: string): SalahDayEntry {
  const prayers = {} as Record<PrayerName, PrayerEntry>;
  PRAYER_NAMES.forEach(name => {
    prayers[name] = { status: 'none', points: 0 };
  });
  return {
    date,
    prayers,
    totalPoints: 0,
    notes: '',
    updatedAt: new Date().toISOString(),
  };
}

function createDefaultQada(): QadaRecord {
  const prayers = {} as Record<PrayerName, QadaPrayerEntry>;
  PRAYER_NAMES.forEach(name => {
    prayers[name] = { owed: 0, done: 0 };
  });
  return { prayers, updatedAt: new Date().toISOString() };
}

function createDefaultProfile(): SalahProfile {
  return {
    totalPrayersLogged: 0,
    lifetimeMosquePrayers: 0,
    currentStreak: 0,
    bestStreak: 0,
    fajrCurrentStreak: 0,
    fajrBestStreak: 0,
    fajrRank: 1,
    startedAt: new Date().toISOString(),
  };
}

function computeTotalPoints(prayers: Record<PrayerName, PrayerEntry>): number {
  return PRAYER_NAMES.reduce((sum, name) => sum + (prayers[name]?.points ?? 0), 0);
}

/**
 * Remove undefined/null values from a PrayerEntry so Firestore never sees them.
 * Shield 3: NEVER send undefined to Firestore.
 */
function sanitizePrayerEntry(entry: PrayerEntry): Record<string, unknown> {
  const clean: Record<string, unknown> = {
    status: entry.status,
    points: entry.points,
  };
  if (entry.khushoo !== undefined) clean.khushoo = entry.khushoo;
  if (entry.spiLoggedAt !== undefined) clean.spiLoggedAt = entry.spiLoggedAt;
  if (entry.sunnah !== undefined) clean.sunnah = entry.sunnah;
  return clean;
}

/**
 * Sanitize an entire SalahDayEntry — strips undefined from all prayer sub-fields.
 */
function sanitizeDayEntry(entry: SalahDayEntry): Record<string, unknown> {
  const cleanPrayers: Record<string, unknown> = {};
  PRAYER_NAMES.forEach(name => {
    if (entry.prayers[name]) {
      cleanPrayers[name] = sanitizePrayerEntry(entry.prayers[name]);
    }
  });
  return {
    date: entry.date,
    prayers: cleanPrayers,
    totalPoints: entry.totalPoints,
    notes: entry.notes ?? '',
    updatedAt: entry.updatedAt,
  };
}

/**
 * Compute SDS (Spiritual Discipline Score) from recent daily entries
 */
function computeSDS(entries: SalahDayEntry[]): number {
  if (entries.length === 0) return 0;

  let totalPrayers = 0;
  let completedPrayers = 0;
  let mosquePrayers = 0;
  let onTimePrayers = 0;

  entries.forEach(entry => {
    PRAYER_NAMES.forEach(name => {
      const p = entry.prayers[name];
      if (!p) return;
      totalPrayers++;
      if (p.status !== 'missed' && p.status !== 'none') {
        completedPrayers++;
      }
      if (p.status === 'mosque') mosquePrayers++;
      if (p.status === 'ontime' || p.status === 'mosque' || p.status === 'congregation') {
        onTimePrayers++;
      }
    });
  });

  if (totalPrayers === 0) return 0;

  const completionRate = completedPrayers / totalPrayers;
  const mosqueRate = mosquePrayers / totalPrayers;
  const onTimeRate = onTimePrayers / totalPrayers;

  // Consistency: how many days had ALL 5 prayed?
  const perfectDays = entries.filter(e =>
    PRAYER_NAMES.every(n => e.prayers[n]?.status !== 'missed' && e.prayers[n]?.status !== 'none')
  ).length;
  const consistencyRate = perfectDays / entries.length;

  const sds = (
    completionRate * 0.35 +
    mosqueRate * 0.25 +
    onTimeRate * 0.20 +
    consistencyRate * 0.20
  ) * 100;

  return Math.round(sds);
}

/**
 * Generate rule-based behavioral insights
 */
function generateInsights(entries: SalahDayEntry[]): string[] {
  if (entries.length < 3) return ['📊 Log a few more days to unlock personalized insights.'];

  const insights: string[] = [];

  // Per-prayer miss counts
  const missCounts: Record<PrayerName, number> = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  const mosqueCounts: Record<PrayerName, number> = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

  entries.forEach(e => {
    PRAYER_NAMES.forEach(n => {
      if (e.prayers[n]?.status === 'missed' || e.prayers[n]?.status === 'none') missCounts[n]++;
      if (e.prayers[n]?.status === 'mosque') mosqueCounts[n]++;
    });
  });

  // Find weakest prayer
  const weakest = PRAYER_NAMES.reduce((a, b) => missCounts[a] > missCounts[b] ? a : b);
  if (missCounts[weakest] > 0) {
    insights.push(`⚠️ Your weakest prayer is ${weakest.charAt(0).toUpperCase() + weakest.slice(1)} — missed ${missCounts[weakest]} time${missCounts[weakest] > 1 ? 's' : ''} recently.`);
  }

  // Weekend vs weekday Fajr
  const weekendEntries = entries.filter(e => {
    const d = new Date(e.date).getDay();
    return d === 5 || d === 6; // Fri, Sat
  });
  const weekdayEntries = entries.filter(e => {
    const d = new Date(e.date).getDay();
    return d !== 5 && d !== 6;
  });

  const weekendFajrMiss = weekendEntries.filter(e =>
    e.prayers.fajr?.status === 'missed' || e.prayers.fajr?.status === 'none'
  ).length;
  const weekdayFajrMiss = weekdayEntries.filter(e =>
    e.prayers.fajr?.status === 'missed' || e.prayers.fajr?.status === 'none'
  ).length;

  if (weekendEntries.length > 0 && weekendFajrMiss / Math.max(1, weekendEntries.length) > 0.5) {
    insights.push('🌅 You miss Fajr more on weekends. Try sleeping earlier on Thursday/Friday nights.');
  }

  // Mosque rate
  const totalCompleted = entries.length * 5;
  const totalMosque = Object.values(mosqueCounts).reduce((a, b) => a + b, 0);
  const mosqueRate = totalMosque / Math.max(1, totalCompleted);

  if (mosqueRate < 0.2) {
    insights.push('🕌 Your mosque attendance is below 20%. Challenge: try 3 mosque prayers this week.');
  } else if (mosqueRate > 0.6) {
    insights.push('🕌 MashaAllah! Your mosque attendance is above 60%. Keep up the community spirit.');
  }

  // All five prayed count
  const perfectDays = entries.filter(e =>
    PRAYER_NAMES.every(n => e.prayers[n]?.status !== 'missed' && e.prayers[n]?.status !== 'none')
  ).length;

  if (perfectDays === entries.length && entries.length >= 7) {
    insights.push(`🏆 You prayed all 5 daily prayers every day for ${entries.length} days! "أحب الأعمال إلى الله أدومها وإن قلّ"`);
  }

  if (insights.length === 0) {
    insights.push('📈 You\'re doing well! Keep logging daily for deeper insights.');
  }

  return insights;
}


/**
 * Sync updated todayData into weekEntries + recentEntries and recompute SDS/insights.
 * Call this after every successful prayer write so Analytics/Fajr views update live.
 */
function syncTodayIntoEntries(
  updatedDay: SalahDayEntry,
  weekEntries: SalahDayEntry[],
  recentEntries: SalahDayEntry[],
): {
  weekEntries: SalahDayEntry[];
  recentEntries: SalahDayEntry[];
  sdsScore: number;
  insights: string[];
} {
  const mergeInto = (list: SalahDayEntry[]) => {
    const idx = list.findIndex(e => e.date === updatedDay.date);
    if (idx >= 0) {
      const updated = [...list];
      updated[idx] = updatedDay;
      return updated;
    }
    // today not in list yet — append
    return [...list, updatedDay];
  };

  const newWeek = mergeInto(weekEntries);
  const newRecent = mergeInto(recentEntries);

  return {
    weekEntries: newWeek,
    recentEntries: newRecent,
    sdsScore: computeSDS(newRecent),
    insights: generateInsights(newRecent),
  };
}


interface SalahStore {
  // State
  todayData: SalahDayEntry | null;
  profile: SalahProfile | null;
  weekEntries: SalahDayEntry[];
  recentEntries: SalahDayEntry[];   // last 30 days for analytics
  sdsScore: number;
  insights: string[];
  loading: boolean;
  loaded: boolean;
  userId: string | null;
  unsubscribeFn: (() => void) | null;
  qadaRecord: QadaRecord | null;

  // Lifecycle
  initialize: (userId: string) => void;
  cleanup: () => void;

  // Actions
  setPrayerStatus: (prayer: PrayerName, status: PrayerStatus) => Promise<void>;
  setKhushoo: (prayer: PrayerName, level: 1 | 2 | 3) => Promise<void>;
  setDayNotes: (notes: string) => Promise<void>;
  loadDateEntry: (date: string) => Promise<SalahDayEntry | null>;
  loadWeekData: () => Promise<void>;
  loadRecentData: () => Promise<void>;
  addQadaDebt: (prayer: PrayerName, count?: number) => Promise<void>;
  logQadaDone: (prayer: PrayerName, count?: number) => Promise<void>;
}

/* ─────────────── Store Implementation ─────────────── */

export const useSalahStore = create<SalahStore>()(
  persist(
    (set, get) => ({
  todayData: null,
  profile: null,
  weekEntries: [],
  recentEntries: [],
  sdsScore: 0,
  insights: [],
  loading: false,
  loaded: false,
  userId: null,
  unsubscribeFn: null,
  qadaRecord: null,

  initialize: (userId: string) => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) unsubscribeFn();

    set({ loading: true, loaded: false, userId });

    const today = todayStr();
    const dayRef = doc(db, 'users', userId, 'salah', today);

    // Real-time listener on today's prayer doc
    const unsub = onSnapshot(dayRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SalahDayEntry;
        set({ todayData: data, loading: false, loaded: true });
      } else {
        const empty = createEmptyDay(today);
        setDoc(dayRef, empty).catch(err =>
          console.error('[SalahStore] Failed to create today doc:', err)
        );
        set({ todayData: empty, loading: false, loaded: true });
      }
    }, (err) => {
      console.error('[SalahStore] Sync error:', err);
      set({ loading: false, loaded: true });
    });

    set({ unsubscribeFn: unsub });

    // Load profile
    const profileRef = doc(db, 'users', userId, 'salah', 'profile');
    getDoc(profileRef).then(snap => {
      if (snap.exists()) {
        set({ profile: snap.data() as SalahProfile });
      } else {
        const defaultProfile = createDefaultProfile();
        setDoc(profileRef, defaultProfile).catch(err =>
          console.error('[SalahStore] Failed to create profile:', err)
        );
        set({ profile: defaultProfile });
      }
    });

    // Load week + recent data for analytics
    get().loadWeekData();
    get().loadRecentData();

    // Load Qada record
    const qadaRef = doc(db, 'users', userId, 'salah', 'qada');
    getDoc(qadaRef).then(snap => {
      if (snap.exists()) {
        set({ qadaRecord: snap.data() as QadaRecord });
      } else {
        const defaultQada = createDefaultQada();
        setDoc(qadaRef, defaultQada).catch(err =>
          console.error('[SalahStore] Failed to create qada doc:', err)
        );
        set({ qadaRecord: defaultQada });
      }
    });
  },

  cleanup: () => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) unsubscribeFn();
    set({ unsubscribeFn: null, todayData: null, profile: null, loaded: false, userId: null, qadaRecord: null });
  },

  setPrayerStatus: async (prayer: PrayerName, status: PrayerStatus) => {
    const { todayData, userId, profile } = get();
    if (!todayData || !userId) return;

    const oldStatus = todayData.prayers[prayer]?.status;
    const newEntry: PrayerEntry = {
      status,
      points: PRAYER_POINTS[status],
      khushoo: todayData.prayers[prayer]?.khushoo,
      spiLoggedAt: new Date().toISOString(),
    };

    const newPrayers = { ...todayData.prayers, [prayer]: newEntry };
    const totalPoints = computeTotalPoints(newPrayers);

    const newData: SalahDayEntry = {
      ...todayData,
      prayers: newPrayers,
      totalPoints,
      updatedAt: new Date().toISOString(),
    };

    set({ todayData: newData });

    const dayRef = doc(db, 'users', userId, 'salah', todayData.date);
    try {
      // ⚑ Shield 3: sanitize before Firestore — strips all undefined fields
      await setDoc(dayRef, sanitizeDayEntry(newData), { merge: true });

      // Sync into Analytics/Fajr views immediately
      const { weekEntries, recentEntries } = get();
      const synced = syncTodayIntoEntries(newData, weekEntries, recentEntries);
      set(synced);
    } catch (err) {
      console.error('[SalahStore] Write error:', err);
    }

    // Auto-track Qada debt when prayer toggled to/from 'missed'
    const { qadaRecord } = get();
    if (qadaRecord && userId) {
      const becameMissed = status === 'missed' && oldStatus !== 'missed';
      const undoneMissed = oldStatus === 'missed' && status !== 'missed';
      if (becameMissed || undoneMissed) {
        const current = qadaRecord.prayers[prayer];
        const newOwed = becameMissed
          ? current.owed + 1
          : Math.max(0, current.owed - 1);
        const newDone = becameMissed ? current.done : Math.min(current.done, newOwed);
        const newQada: QadaRecord = {
          ...qadaRecord,
          prayers: {
            ...qadaRecord.prayers,
            [prayer]: { owed: newOwed, done: newDone },
          },
          updatedAt: new Date().toISOString(),
        };
        set({ qadaRecord: newQada });
        const qadaRef = doc(db, 'users', userId, 'salah', 'qada');
        setDoc(qadaRef, newQada, { merge: true }).catch(console.error);
      }
    }

    // Update profile stats
    if (profile) {
      const wasPrayed = oldStatus && oldStatus !== 'none' && oldStatus !== 'missed';
      const isPrayed = status !== 'none' && status !== 'missed';
      const wasMosque = oldStatus === 'mosque';
      const isMosque = status === 'mosque';

      let totalDelta = 0;
      let mosqueDelta = 0;
      if (!wasPrayed && isPrayed) totalDelta = 1;
      if (wasPrayed && !isPrayed) totalDelta = -1;
      if (!wasMosque && isMosque) mosqueDelta = 1;
      if (wasMosque && !isMosque) mosqueDelta = -1;

      if (totalDelta !== 0 || mosqueDelta !== 0) {
        const updatedProfile: SalahProfile = {
          ...profile,
          totalPrayersLogged: Math.max(0, profile.totalPrayersLogged + totalDelta),
          lifetimeMosquePrayers: Math.max(0, profile.lifetimeMosquePrayers + mosqueDelta),
        };
        set({ profile: updatedProfile });
        const profileRef = doc(db, 'users', userId, 'salah', 'profile');
        setDoc(profileRef, updatedProfile, { merge: true }).catch(console.error);
      }
    }
  },

  setKhushoo: async (prayer: PrayerName, level: 1 | 2 | 3) => {
    const { todayData, userId } = get();
    if (!todayData || !userId) return;

    const newPrayers = {
      ...todayData.prayers,
      [prayer]: { ...todayData.prayers[prayer], khushoo: level },
    };
    const newData = { ...todayData, prayers: newPrayers, updatedAt: new Date().toISOString() };
    set({ todayData: newData });

    const dayRef = doc(db, 'users', userId, 'salah', todayData.date);
    // ⚑ Shield 3: sanitize before Firestore
    await setDoc(dayRef, sanitizeDayEntry(newData), { merge: true }).catch(console.error);

    // Sync into Analytics/Fajr views immediately
    const { weekEntries, recentEntries } = get();
    const synced = syncTodayIntoEntries(newData, weekEntries, recentEntries);
    set(synced);
  },

  setDayNotes: async (notes: string) => {
    const { todayData, userId } = get();
    if (!todayData || !userId) return;

    const newData = { ...todayData, notes, updatedAt: new Date().toISOString() };
    set({ todayData: newData });

    const dayRef = doc(db, 'users', userId, 'salah', todayData.date);
    // ⚑ Shield 3: sanitize before Firestore
    await setDoc(dayRef, sanitizeDayEntry(newData), { merge: true }).catch(console.error);
  },

  loadDateEntry: async (date: string) => {
    const { userId } = get();
    if (!userId) return null;

    const ref = doc(db, 'users', userId, 'salah', date);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as SalahDayEntry : null;
  },

  loadWeekData: async () => {
    const { userId } = get();
    if (!userId) return;

    const today = new Date();
    const entries: SalahDayEntry[] = [];

    // Load last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const ref = doc(db, 'users', userId, 'salah', dateStr);
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          entries.push(snap.data() as SalahDayEntry);
        } else {
          entries.push(createEmptyDay(dateStr));
        }
      } catch {
        entries.push(createEmptyDay(dateStr));
      }
    }

    set({ weekEntries: entries });
  },

  loadRecentData: async () => {
    const { userId } = get();
    if (!userId) return;

    const today = new Date();
    const entries: SalahDayEntry[] = [];

    // Load last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const ref = doc(db, 'users', userId, 'salah', dateStr);
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          entries.push(snap.data() as SalahDayEntry);
        }
      } catch { /* skip */ }
    }

    const sdsScore = computeSDS(entries);
    const insights = generateInsights(entries);

    set({ recentEntries: entries, sdsScore, insights });
  },

  addQadaDebt: async (prayer: PrayerName, count = 1) => {
    const { qadaRecord, userId } = get();
    if (!qadaRecord || !userId) return;
    const current = qadaRecord.prayers[prayer];
    const newQada: QadaRecord = {
      ...qadaRecord,
      prayers: {
        ...qadaRecord.prayers,
        [prayer]: { owed: current.owed + count, done: current.done },
      },
      updatedAt: new Date().toISOString(),
    };
    set({ qadaRecord: newQada });
    const qadaRef = doc(db, 'users', userId, 'salah', 'qada');
    await setDoc(qadaRef, newQada, { merge: true }).catch(console.error);
  },

  logQadaDone: async (prayer: PrayerName, count = 1) => {
    const { qadaRecord, userId } = get();
    if (!qadaRecord || !userId) return;
    const current = qadaRecord.prayers[prayer];
    const remaining = current.owed - current.done;
    if (remaining <= 0) return;
    const newQada: QadaRecord = {
      ...qadaRecord,
      prayers: {
        ...qadaRecord.prayers,
        [prayer]: { owed: current.owed, done: Math.min(current.done + count, current.owed) },
      },
      updatedAt: new Date().toISOString(),
    };
    set({ qadaRecord: newQada });
    const qadaRef = doc(db, 'users', userId, 'salah', 'qada');
    await setDoc(qadaRef, newQada, { merge: true }).catch(console.error);
  },
    }),
    {
      name: 'herizon-salah-store',
      partialize: (state) => ({
        todayData: state.todayData,
        profile: state.profile,
        weekEntries: state.weekEntries,
        recentEntries: state.recentEntries,
        sdsScore: state.sdsScore,
        insights: state.insights,
        qadaRecord: state.qadaRecord,
      }),
    }
  )
);
