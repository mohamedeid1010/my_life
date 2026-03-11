/**
 * ═══════════════════════════════════════════════════════════
 * useWeeklyPlannerStore — Zustand store for Weekly Planner
 * ═══════════════════════════════════════════════════════════
 *
 * Architecture: One Firestore document per week.
 *   Path: users/{uid}/weekly-planner/{weekId}
 *   e.g.: users/abc123/weekly-planner/2026-W11
 *
 * This enables:
 *   - Week navigation (prev / next)
 *   - Incomplete task rollover to next week
 *   - Date-targeted task creation (any week, any day)
 */

import { create } from 'zustand';
import { doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

import type {
  WeeklyPlannerData,
  MasterTask,
  DayTask,
} from '../types/weekly-planner.types';

/* ─────────────── Helpers ─────────────── */

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch { /* fallthrough */ }
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

const DAY_IDS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

/**
 * Returns the week document ID for any given Date.
 * Week anchor: Jan 3, 2026 (Saturday) = Week 1.
 * Format: "2026-W11"
 */
export function getWeekId(date: Date = new Date()): string {
  const anchor = new Date(2026, 0, 3); // Jan 3, 2026 = Sat = Week 1
  anchor.setHours(0, 0, 0, 0);

  // Roll back to most recent Saturday
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
  const daysFromSat = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  d.setDate(d.getDate() - daysFromSat);

  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNum = Math.max(1, Math.floor((d.getTime() - anchor.getTime()) / msPerWeek) + 1);
  const year = d.getFullYear();
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

/** Given a weekId like "2026-W11", return the Saturday start date */
export function weekIdToStartDate(weekId: string): Date {
  const [yearStr, weekStr] = weekId.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  const anchor = new Date(2026, 0, 3);
  anchor.setHours(0, 0, 0, 0);
  const result = new Date(anchor.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  // If year differs from 2026, compensate (handles multi-year)
  // Simple approach: anchor is 2026-W01, shift by year difference weeks
  // For now this is accurate enough for 2026
  void year;
  return result;
}

/** Given a weekId, return the weekId of the next week */
export function nextWeekId(weekId: string): string {
  const start = weekIdToStartDate(weekId);
  const next = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return getWeekId(next);
}

/** Given a weekId, return the weekId of the previous week */
export function prevWeekId(weekId: string): string {
  const start = weekIdToStartDate(weekId);
  const prev = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
  return getWeekId(prev);
}

/**
 * Given a Date, return the dayId (sat/sun/mon/…) it corresponds to
 */
export function dateToDayId(date: Date): string {
  const map: Record<number, string> = {
    0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed',
    4: 'thu', 5: 'fri', 6: 'sat',
  };
  return map[date.getDay()] ?? 'mon';
}

const createDefaultData = (weekId: string): WeeklyPlannerData => ({
  startDay: 'sat',
  days: DAY_IDS.map((id, i) => ({
    id,
    name: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i],
    tasks: Array.from({ length: 3 }, (_, idx) => ({
      id: generateId(), masterId: null, text: '', done: false, order: idx
    })),
  })),
  masterTasks: [],
  notes: '',
  reflections: '',
  weekId,
});

/* ─────────────── Store Interface ─────────────── */

interface WeeklyPlannerStore {
  // ── State ──
  data: WeeklyPlannerData | null;
  loading: boolean;
  loaded: boolean;
  saving: boolean;
  userId: string | null;
  currentWeekId: string;       // This week (never changes)
  viewingWeekId: string;       // The week the user is viewing (may differ)
  unsubscribeFn: (() => void) | null;

  // ── Lifecycle ──
  initialize: (userId: string) => void;
  cleanup: () => void;

  // ── Week Navigation ──
  loadWeek: (userId: string, weekId: string) => void;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;

  // ── Data Actions ──
  updateData: (updates: Partial<WeeklyPlannerData>) => Promise<void>;
  addMasterTask: (task: Omit<MasterTask, 'id'> & { id?: string; targetDayId?: string }) => void;
  removeMasterTask: (id: string) => void;
  updateMasterTask: (id: string, updates: Partial<MasterTask>) => void;
  updateDayTask: (dayId: string, taskId: string, updates: Partial<DayTask>) => void;
  addDayTask: (dayId: string) => void;
  removeDayTask: (dayId: string, taskId: string) => void;
  reorderDayTasks: (dayId: string, orderedTaskIds: string[]) => void;

  // ── Rollover ──
  rolloverIncompleteTasks: () => Promise<void>;

  // ── Date-Targeted Task ──
  addTaskToDate: (
    userId: string,
    date: Date,
    task: Omit<MasterTask, 'id'>
  ) => Promise<void>;
}

/* ─────────────── Store Implementation ─────────────── */

export const useWeeklyPlannerStore = create<WeeklyPlannerStore>((set, get) => ({
  data: null,
  loading: false,
  loaded: false,
  saving: false,
  userId: null,
  currentWeekId: getWeekId(),
  viewingWeekId: getWeekId(),
  unsubscribeFn: null,

  initialize: (userId: string) => {
    const thisWeek = getWeekId();
    set({ currentWeekId: thisWeek });

    // ── One-time Migration: weekly-planner/current → weekly-planner/{weekId} ──
    // Runs silently on first boot after the architecture change.
    // If a legacy 'current' doc exists, its data is merged into this week's doc,
    // then 'current' is deleted. Safe to run on every boot — getDoc is a no-op
    // once the doc is gone.
    const legacyRef = doc(db, 'users', userId, 'weekly-planner', 'current');
    const currentWeekRef = doc(db, 'users', userId, 'weekly-planner', thisWeek);

    getDoc(legacyRef)
      .then(async (legacySnap) => {
        if (!legacySnap.exists()) return; // Already migrated or nothing to migrate

        const legacyData = legacySnap.data() as WeeklyPlannerData;
        console.log('[PlannerStore] 🔄 Migrating legacy weekly-planner/current → ' + thisWeek);

        // Check if this week already has data — merge legacy into it, don't overwrite
        const currentSnap = await getDoc(currentWeekRef);
        let mergedData: WeeklyPlannerData;

        if (currentSnap.exists()) {
          const existingData = currentSnap.data() as WeeklyPlannerData;
          // Prefer current week's existing data, but fill in missing master tasks from legacy
          const existingTaskIds = new Set(existingData.masterTasks.map(t => t.id));
          const legacyOnlyTasks = legacyData.masterTasks.filter(t => !existingTaskIds.has(t.id));
          mergedData = {
            ...existingData,
            masterTasks: [...existingData.masterTasks, ...legacyOnlyTasks],
            // Carry over notes/reflections only if current week has none
            notes: existingData.notes || legacyData.notes,
            reflections: existingData.reflections || legacyData.reflections,
          };
        } else {
          // No data yet for this week — use legacy data as-is, just fix the weekId
          mergedData = { ...legacyData, weekId: thisWeek };
        }

        await setDoc(currentWeekRef, mergedData, { merge: true });
        await deleteDoc(legacyRef);
        console.log('[PlannerStore] ✅ Migration complete. Legacy doc deleted.');
      })
      .catch(err => console.warn('[PlannerStore] Migration check failed (non-critical):', err))
      .finally(() => get().loadWeek(userId, thisWeek));
  },

  cleanup: () => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) unsubscribeFn();
    set({ unsubscribeFn: null, data: null, loaded: false, userId: null });
  },

  loadWeek: (userId: string, weekId: string) => {
    // Detach existing listener before switching weeks
    const { unsubscribeFn } = get();
    if (unsubscribeFn) unsubscribeFn();

    set({ loading: true, loaded: false, userId, viewingWeekId: weekId });

    const docRef = doc(db, 'users', userId, 'weekly-planner', weekId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        set({
          data: snapshot.data() as WeeklyPlannerData,
          loading: false,
          loaded: true,
          saving: false,
        });
      } else {
        // Create a blank week doc for weeks that haven't been started yet
        const defaultData = createDefaultData(weekId);
        setDoc(docRef, defaultData).catch((err) =>
          console.error('[PlannerStore] Failed to create week doc:', err)
        );
        set({ data: defaultData, loading: false, loaded: true });
      }
    }, (error) => {
      console.error('[PlannerStore] Sync error:', error);
      set({ loading: false, loaded: true });
    });

    set({ unsubscribeFn: unsubscribe });
  },

  goToPrevWeek: () => {
    const { userId, viewingWeekId } = get();
    if (!userId) return;
    get().loadWeek(userId, prevWeekId(viewingWeekId));
  },

  goToNextWeek: () => {
    const { userId, viewingWeekId } = get();
    if (!userId) return;
    get().loadWeek(userId, nextWeekId(viewingWeekId));
  },

  goToCurrentWeek: () => {
    const { userId, currentWeekId } = get();
    if (!userId) return;
    get().loadWeek(userId, currentWeekId);
  },

  updateData: async (updates: Partial<WeeklyPlannerData>) => {
    const { data, userId, viewingWeekId } = get();
    if (!data || !userId) return;

    const newData = { ...data, ...updates };
    set({ data: newData, saving: true });

    const docRef = doc(db, 'users', userId, 'weekly-planner', viewingWeekId);
    try {
      await setDoc(docRef, newData, { merge: true });
    } catch (err) {
      console.error('[PlannerStore] Write error:', err);
    } finally {
      set({ saving: false });
    }
  },

  addMasterTask: (task) => {
    const { data } = get();
    if (!data) return;

    const newTask: MasterTask = {
      id: task.id || generateId(),
      text: task.text,
      categoryId: task.categoryId,
    };

    const newMasterTasks = [...data.masterTasks, newTask];

    // If a targetDayId is provided, also slot it into that day
    let newDays = data.days;
    if (task.targetDayId) {
      const dayTaskSlot: DayTask = {
        id: generateId(),
        masterId: newTask.id,
        text: newTask.text,
        done: false,
        order: (data.days.find(d => d.id === task.targetDayId)?.tasks.length ?? 0),
      };
      newDays = data.days.map(day =>
        day.id === task.targetDayId
          ? { ...day, tasks: [...day.tasks, dayTaskSlot] }
          : day
      );
    }

    get().updateData({ masterTasks: newMasterTasks, days: newDays });
  },

  removeMasterTask: (id: string) => {
    const { data } = get();
    if (!data) return;

    const newMasterTasks = data.masterTasks.filter(t => t.id !== id);
    // ✅ BUG FIX: Clear BOTH masterId AND text from linked day slots
    const newDays = data.days.map(day => ({
      ...day,
      tasks: day.tasks.map(task =>
        task.masterId === id
          ? { ...task, masterId: null, text: '', done: false }
          : task
      ),
    }));
    get().updateData({ masterTasks: newMasterTasks, days: newDays });
  },

  updateMasterTask: (id: string, updates: Partial<MasterTask>) => {
    const { data } = get();
    if (!data) return;
    const newMasterTasks = data.masterTasks.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    get().updateData({ masterTasks: newMasterTasks });
  },

  updateDayTask: (dayId: string, taskId: string, updates: Partial<DayTask>) => {
    const { data } = get();
    if (!data) return;
    const newDays = data.days.map(day =>
      day.id === dayId
        ? { ...day, tasks: day.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) }
        : day
    );
    get().updateData({ days: newDays });
  },

  addDayTask: (dayId: string) => {
    const { data } = get();
    if (!data) return;
    const day = data.days.find(d => d.id === dayId);
    const newTask: DayTask = {
      id: generateId(),
      masterId: null,
      text: '',
      done: false,
      order: day ? day.tasks.length : 0,
    };
    const newDays = data.days.map(d =>
      d.id === dayId ? { ...d, tasks: [...d.tasks, newTask] } : d
    );
    get().updateData({ days: newDays });
  },

  removeDayTask: (dayId: string, taskId: string) => {
    const { data } = get();
    if (!data) return;
    const newDays = data.days.map(day =>
      day.id === dayId
        ? { ...day, tasks: day.tasks.filter(t => t.id !== taskId) }
        : day
    );
    get().updateData({ days: newDays });
  },

  reorderDayTasks: (dayId: string, orderedTaskIds: string[]) => {
    const { data } = get();
    if (!data) return;
    const newDays = data.days.map(day => {
      if (day.id !== dayId) return day;
      const taskMap = new Map(day.tasks.map(t => [t.id, t]));
      const reordered = orderedTaskIds
        .map((id, idx) => {
          const t = taskMap.get(id);
          return t ? { ...t, order: idx } : null;
        })
        .filter(Boolean) as DayTask[];
      // Append any tasks whose IDs weren't in orderedTaskIds (safety net)
      day.tasks.forEach(t => {
        if (!orderedTaskIds.includes(t.id)) reordered.push(t);
      });
      return { ...day, tasks: reordered };
    });
    get().updateData({ days: newDays });
  },

  rolloverIncompleteTasks: async () => {
    const { data, userId, viewingWeekId, currentWeekId } = get();
    if (!data || !userId) return;

    // Collect all incomplete tasks (text not empty, done = false)
    const incompleteTasks: MasterTask[] = [];
    data.days.forEach(day => {
      day.tasks.forEach(task => {
        if (task.text.trim() && !task.done) {
          // Check if this task's master is already in the list
          const masterId = task.masterId;
          const master = data.masterTasks.find(m => m.id === masterId);
          if (master && !incompleteTasks.some(t => t.id === master.id)) {
            incompleteTasks.push(master);
          } else if (!masterId) {
            // Standalone day task with no master
            incompleteTasks.push({
              id: generateId(),
              text: task.text,
              categoryId: 'other',
            });
          }
        }
      });
    });

    if (incompleteTasks.length === 0) return;

    // Load next week's doc and append these tasks to its master list
    const targetWeekId = nextWeekId(viewingWeekId);
    const targetRef = doc(db, 'users', userId, 'weekly-planner', targetWeekId);

    try {
      const snap = await getDoc(targetRef);
      let targetData: WeeklyPlannerData;
      if (snap.exists()) {
        targetData = snap.data() as WeeklyPlannerData;
      } else {
        targetData = createDefaultData(targetWeekId);
      }

      // Add incomplete tasks (avoid duplicates by text)
      const existingTexts = new Set(targetData.masterTasks.map(m => m.text.trim()));
      const newTasks = incompleteTasks
        .filter(t => !existingTexts.has(t.text.trim()))
        .map(t => ({ ...t, id: generateId() })); // fresh IDs for next week

      const updatedTarget: WeeklyPlannerData = {
        ...targetData,
        masterTasks: [...targetData.masterTasks, ...newTasks],
      };

      await setDoc(targetRef, updatedTarget, { merge: true });
      console.log(`[PlannerStore] ✅ Rolled over ${newTasks.length} tasks → ${targetWeekId}`);

      // If user was viewing the current week, also navigate forward
      if (viewingWeekId === currentWeekId) {
        get().loadWeek(userId, targetWeekId);
      }
    } catch (err) {
      console.error('[PlannerStore] Rollover failed:', err);
    }
  },

  addTaskToDate: async (userId: string, date: Date, task: Omit<MasterTask, 'id'>) => {
    const targetWeekId = getWeekId(date);
    const targetDayId = dateToDayId(date);
    const docRef = doc(db, 'users', userId, 'weekly-planner', targetWeekId);

    try {
      const snap = await getDoc(docRef);
      let weekData: WeeklyPlannerData;
      if (snap.exists()) {
        weekData = snap.data() as WeeklyPlannerData;
      } else {
        weekData = createDefaultData(targetWeekId);
      }

      const newMasterId = generateId();
      const newMaster: MasterTask = { id: newMasterId, ...task };

      // Add to master list
      const newMasterTasks = [...weekData.masterTasks, newMaster];

      // Add to the specific day slot
      const dayTaskSlot: DayTask = {
        id: generateId(),
        masterId: newMasterId,
        text: task.text,
        done: false,
        order: (weekData.days.find(d => d.id === targetDayId)?.tasks.length ?? 0),
      };

      const newDays = weekData.days.map(day =>
        day.id === targetDayId
          ? { ...day, tasks: [...day.tasks, dayTaskSlot] }
          : day
      );

      const updatedWeek: WeeklyPlannerData = {
        ...weekData,
        masterTasks: newMasterTasks,
        days: newDays,
      };

      await setDoc(docRef, updatedWeek, { merge: true });

      // If this week is currently loaded, update local state too
      const { viewingWeekId } = get();
      if (viewingWeekId === targetWeekId) {
        set({ data: updatedWeek });
      }

      console.log(`[PlannerStore] ✅ Task added to ${targetWeekId} / ${targetDayId}`);
    } catch (err) {
      console.error('[PlannerStore] addTaskToDate failed:', err);
    }
  },
}));