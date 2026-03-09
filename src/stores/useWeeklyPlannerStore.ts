/**
 * ═══════════════════════════════════════════════════════════
 *  useWeeklyPlannerStore — Zustand store for Weekly Planner
 * ═══════════════════════════════════════════════════════════
 *
 *  Responsibilities:
 *  - CRUD operations for weekly planner data (Firestore subcollection: users/{uid}/weekly-planner)
 *  - Master tasks, daily tasks, notes, reflections
 *  - Real-time Firestore sync via onSnapshot
 *  - Offline action queuing via useSyncStore
 */

import { create } from 'zustand';
import {
  collection, doc, setDoc, getDocs, getDocsFromServer, deleteDoc,
  onSnapshot, query, where, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useSyncStore } from './useSyncStore';

import type { WeeklyPlannerData, MasterTask, DayTask, DayData } from '../types/weekly-planner.types';

interface WeeklyPlannerStore {
  // State
  data: WeeklyPlannerData | null;
  loading: boolean;
  saving: boolean;
  userId: string | null;

  // Actions
  initialize: (userId: string) => void;
  updateData: (updates: Partial<WeeklyPlannerData>) => Promise<void>;
  addMasterTask: (task: Omit<MasterTask, 'id'>) => void;
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
  const start = new Date(year, 0, 3);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.floor(diff / oneWeek) + 1;
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

// Default data
const createDefaultData = (): WeeklyPlannerData => ({
  startDay: 'sat',
  days: [
    { id: 'sat', name: 'Saturday', tasks: Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), masterId: null, text: '', done: false })) },
    { id: 'sun', name: 'Sunday', tasks: Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), masterId: null, text: '', done: false })) },
    { id: 'mon', name: 'Monday', tasks: Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), masterId: null, text: '', done: false })) },
    { id: 'tue', name: 'Tuesday', tasks: Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), masterId: null, text: '', done: false })) },
    { id: 'wed', name: 'Wednesday', tasks: Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), masterId: null, text: '', done: false })) },
    { id: 'thu', name: 'Thursday', tasks: Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), masterId: null, text: '', done: false })) },
    { id: 'fri', name: 'Friday', tasks: Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), masterId: null, text: '', done: false })) },
  ],
  masterTasks: [],
  notes: '',
  reflections: '',
  weekId: getCurrentWeekId(),
});

export const useWeeklyPlannerStore = create<WeeklyPlannerStore>((set, get) => ({
  data: null,
  loading: false,
  saving: false,
  userId: null,

  initialize: (userId: string) => {
    set({ loading: true, userId });

    const docRef = doc(db, 'users', userId, 'weekly-planner', 'current');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as WeeklyPlannerData;
        set({ data, loading: false });
      } else {
        // Create default data
        const defaultData = createDefaultData();
        setDoc(docRef, defaultData);
        set({ data: defaultData, loading: false });
      }
    });

    // Return unsubscribe function (though Zustand doesn't use it directly)
    return unsubscribe;
  },

  updateData: async (updates: Partial<WeeklyPlannerData>) => {
    const { data, userId } = get();
    if (!data || !userId) return;

    const newData = { ...data, ...updates };
    set({ data: newData, saving: true });

    const docRef = doc(db, 'users', userId, 'weekly-planner', 'current');
    const { isOnline } = useSyncStore.getState();

    if (isOnline) {
      try {
        await setDoc(docRef, newData, { merge: true });
        set({ saving: false });
      } catch (err) {
        console.error("Failed to update weekly planner", err);
        set({ saving: false });
      }
    } else {
      // Queue for sync
      useSyncStore.getState().enqueueAction('WEEKLY_PLANNER_UPDATE', {
        path: `users/${userId}/weekly-planner/current`,
        data: newData,
      });
      set({ saving: false });
    }
  },

  addMasterTask: (task: Omit<MasterTask, 'id'>) => {
    const { data } = get();
    if (!data) return;

    const newTask: MasterTask = { ...task, id: crypto.randomUUID() };
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

    const newTask: DayTask = { id: crypto.randomUUID(), masterId: null, text: '', done: false };
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