/**
 * ═══════════════════════════════════════════════════
 *  Analytics Types — Computed dashboard metrics
 * ═══════════════════════════════════════════════════
 */
import type { HabitWithStats } from './habits.types';

/** Weakest habit with worst-day analysis */
export interface WeakestHabitAnalysis extends HabitWithStats {
  worstDay: string;
}

/** Global analytics across all active habits */
export interface GlobalHabitsAnalytics {
  globalConsistency: number;
  monthOverMonthDelta: number;
  strongestHabit: HabitWithStats | null;
  weakestHabit: WeakestHabitAnalysis | null;
  monthTrendData: number[];
}
