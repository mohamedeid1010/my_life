/**
 * ═══════════════════════════════════════════════════════════
 *  useWeeklyPlannerStore — Zustand store for Weekly Planner
 * ═══════════════════════════════════════════════════════════
 *
 *  Responsibilities:
 *  - CRUD operations for weekly planner data (Firestore subcollection: users/{uid}/weekly-planner)
 *  - Master tasks, daily tasks, notes, reflections
 *  - Robust real-time Firestore sync via onSnapshot
 *  - Offline action queuing via useSyncStore
 *  - Optimized writes with debouncing and optimistic updates
 */

import { create } from 'zustand';
import {
  collection, doc, setDoc, getDocs, getDocsFromServer, deleteDoc,
  onSnapshot, query, where, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useSyncStore } from './useSyncStore';

import type { WeeklyPlannerData, MasterTask, DayTask, DayData } from '../types/weekly-planner.types';

/**
 * Robust ID Generator (Fallback for non-secure contexts)
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if randomUUID fails for any reason
    }
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

interface WeeklyPlannerStore {
  // ── State ──
  data: WeeklyPlannerData | null;
  loading: boolean;
  loaded: boolean;
  saving: boolean;
  userId: string | null;
  unsubscribeFn: (() => void) | null;

  // ── Lifecycle ──
  initialize: (userId: string) => void;
  cleanup: () => void;

  // ── Actions ──
  updateData: (updates: Partial<WeeklyPlannerData>) => Promise<void>;
  addMasterTask: (task: Omit<MasterTask, 'id'> & { id?: string }) => void;
  removeMasterTask: (id: string) => void;
  updateMasterTask: (id: string, updates: Partial<MasterTask>) => void;
  updateDayTask: (dayId: string, taskId: string, updates: Partial<DayTask>) => void;
  addDayTask: (dayId: string) => void;
  removeDayTask: (dayId: string, taskId: string) => void;
}

// Helper to get current week ID
function getCurrentWeekId(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Adjust to start on Saturday or defined start day if needed, but for ID 
  // we just need a unique week identifier. Sat-based weeks 2026-WXX.
  const start = new Date(year, 0, 3);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.floor(diff / oneWeek) + 1;
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

// Default data
const createDefaultData = (): WeeklyPlannerData => ({
  startDay: 'sat',
  days: [
    { id: 'sat', name: 'Saturday', tasks: Array.from({ length: 3 }, () => ({ id: generateId(), masterId: null, text: '', done: false })) },
    { id: 'sun', name: 'Sunday', tasks: Array.from({ length: 3 }, () => ({ id: generateId(), masterId: null, text: '', done: false })) },
    { id: 'mon', name: 'Monday', tasks: Array.from({ length: 3 }, () => ({ id: generateId(), masterId: null, text: '', done: false })) },
    { id: 'tue', name: 'Tuesday', tasks: Array.from({ length: 3 }, () => ({ id: generateId(), masterId: null, text: '', done: false })) },
    { id: 'wed', name: 'Wednesday', tasks: Array.from({ length: 3 }, () => ({ id: generateId(), masterId: null, text: '', done: false })) },
    { id: 'thu', name: 'Thursday', tasks: Array.from({ length: 3 }, () => ({ id: generateId(), masterId: null, text: '', done: false })) },
    { id: 'fri', name: 'Friday', tasks: Array.from({ length: 3 }, () => ({ id: generateId(), masterId: null, text: '', done: false })) },
  ],
  masterTasks: [],
  notes: '',
  reflections: '',
  weekId: getCurrentWeekId(),
});

/** 
 * Simple debouncer for Firestore writes
 * key: document path
 * value: Timeout ID
 */
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export const useWeeklyPlannerStore = create<WeeklyPlannerStore>((set, get) => ({
  data: null,
  loading: false,
  loaded: false,
  saving: false,
  userId: null,
  unsubscribeFn: null,

  initialize: (userId: string) => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) {
      unsubscribeFn(); // Clean up previous listener
    }

    set({ loading: true, loaded: false, userId });

    const docRef = doc(db, 'users', userId, 'weekly-planner', 'current');
    
    // Attach real-time listener
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const { saving } = get();
      
      // If we are currently saving, ignore the server snapshot to avoid over-writing 
      // the local optimistic state (which is more up-to-date).
      // The saving flip back to false will happen once the write is truly confirmed.
      if (snapshot.exists()) {
        const serverData = snapshot.data() as WeeklyPlannerData;
        if (!saving) {
          set({ data: serverData, loading: false, loaded: true });
        }
      } else {
        // Doc doesn't exist yet, initialize with default data
        const defaultData = createDefaultData();
        setDoc(docRef, defaultData).catch(err => {
          console.error("[PlannerStore] Failed to create default data", err);
        });
        set({ data: defaultData, loading: false, loaded: true });
      }
    }, (error) => {
      console.error("[PlannerStore] sync error:", error);
      set({ loading: false, loaded: true });
    });

    set({ unsubscribeFn: unsubscribe });
  },

  cleanup: () => {
    const { unsubscribeFn } = get();
    if (unsubscribeFn) {
      unsubscribeFn();
      set({ unsubscribeFn: null, data: null, loaded: false, userId: null });
    }
  },

  updateData: async (updates: Partial<WeeklyPlannerData>) => {
    const { data, userId } = get();
    if (!data || !userId) return;

    // 1. Optimistic Update (Immediate Local State)
    const newData = { ...data, ...updates };
    set({ data: newData, saving: true });

    const path = `users/${userId}/weekly-planner/current`;
    const docRef = doc(db, 'users', userId, 'weekly-planner', 'current');
    const { isOnline } = useSyncStore.getState();

    // 2. Debounced Firestore Write
    if (debounceTimers[path]) clearTimeout(debounceTimers[path]);

    debounceTimers[path] = setTimeout(async () => {
      if (isOnline) {
        try {
          await setDoc(docRef, newData, { merge: true });
          set({ saving: false });
        } catch (err) {
          console.error("[PlannerStore] Write failed, enqueuing...", err);
          set({ saving: false });
          useSyncStore.getState().enqueueAction('WEEKLY_PLANNER_UPDATE', { path, data: newData });
        }
      } else {
        useSyncStore.getState().enqueueAction('WEEKLY_PLANNER_UPDATE', { path, data: newData });
        set({ saving: false });
      }
    }, 1000); // 1 second debounce for heavy typing (notes/reflections)
  },

  addMasterTask: (task) => {
    const { data } = get();
    if (!data) return;

    // Use task.id if provided (important for syncDayTaskToMaster), otherwise generate one
    const newTask: MasterTask = { 
      text: task.text,
      categoryId: task.categoryId,
      id: task.id || generateId() 
    };
    
    const newMasterTasks = [...data.masterTasks, newTask];
    get().updateData({ masterTasks: newMasterTasks });
  },

  removeMasterTask: (id: string) => {
    const { data } = get();
    if (!data) return;

    const newMasterTasks = data.masterTasks.filter(t => t.id !== id);
    const newDays = data.days.map(day => ({
      ...day,
      tasks: day.tasks.map(task => task.masterId === id ? { ...task, masterId: null } : task)
    }));
    get().updateData({ masterTasks: newMasterTasks, days: newDays });
  },

  updateMasterTask: (id: string, updates: Partial<MasterTask>) => {
    const { data } = get();
    if (!data) return;

    const newMasterTasks = data.masterTasks.map(t => t.id === id ? { ...t, ...updates } : t);
    get().updateData({ masterTasks: newMasterTasks });
  },

  updateDayTask: (dayId: string, taskId: string, updates: Partial<DayTask>) => {
    const { data } = get();
    if (!data) return;

    const newDays = data.days.map(day =>
      day.id === dayId
        ? { ...day, tasks: day.tasks.map(task => task.id === taskId ? { ...task, ...updates } : task) }
        : day
    );
    get().updateData({ days: newDays });
  },

  addDayTask: (dayId: string) => {
    const { data } = get();
    if (!data) return;

    const newTask: DayTask = { id: generateId(), masterId: null, text: '', done: false };
    const newDays = data.days.map(day =>
      day.id === dayId ? { ...day, tasks: [...day.tasks, newTask] } : day
    );
    get().updateData({ days: newDays });
  },

  removeDayTask: (dayId: string, taskId: string) => {
    const { data } = get();
    if (!data) return;

    const newDays = data.days.map(day =>
      day.id === dayId ? { ...day, tasks: day.tasks.filter(task => task.id !== taskId) } : day
    );
    get().updateData({ days: newDays });
  },
}));