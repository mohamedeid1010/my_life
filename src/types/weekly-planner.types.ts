export interface MasterTask {
  id: string;
  text: string;
  categoryId: string;
  /** Optional: if set, this task was scheduled to this day when created */
  targetDayId?: string;
}

export interface DayTask {
  id: string;
  masterId: string | null;
  text: string;
  done: boolean;
  /** Explicit display order within the day */
  order?: number;
}

export interface DayData {
  id: string;
  name: string;
  tasks: DayTask[];
}

export interface WeeklyPlannerData {
  startDay: string;
  days: DayData[];
  masterTasks: MasterTask[];
  notes: string;
  reflections: string;
  weekId: string;
}