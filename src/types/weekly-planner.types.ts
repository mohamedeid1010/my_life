export interface MasterTask {
  id: string;
  text: string;
  categoryId: string;
}

export interface DayTask {
  id: string;
  masterId: string | null;
  text: string;
  done: boolean;
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