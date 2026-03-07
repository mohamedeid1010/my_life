/**
 * ═══════════════════════════════════════════════════
 *  Habits Types — Maps to Firestore: users/{uid}.smartHabits
 * ═══════════════════════════════════════════════════
 */

/** Habit type — daily vs weekly frequency */
export type HabitType = 'daily' | 'weekly';

/** How the habit is measured */
export type HabitTargetType = 'boolean' | 'quantity' | 'duration';

/** Habit category for grouping and analytics */
export type HabitCategory =
  | 'health'
  | 'fitness'
  | 'productivity'
  | 'learning'
  | 'mindfulness'
  | 'finance'
  | 'social'
  | 'custom';

/** Status of a single day's entry */
export type HabitEntryStatus = 'completed' | 'missed' | 'skipped' | 'pending';

/** Single day's log entry */
export interface HabitEntry {
  status: HabitEntryStatus;
  value?: number;
  note?: string;
  loggedAt?: string;
}

/**
 * Raw habit object — exactly as stored in Firestore.
 */
export interface HabitRaw {
  /** Unique ID (generated via Date.now().toString()) */
  id: string;

  /** Habit display name (e.g. "Morning Workout", "Read 30 min") */
  name: string;

  /** Emoji icon */
  icon: string;

  /** Category for grouping */
  category: HabitCategory;

  /** Frequency type */
  type: HabitType;

  /** Measurement approach */
  targetType: HabitTargetType;

  /** Numeric target for quantity/duration types */
  targetValue?: number;

  /** Unit label (e.g. "liters", "minutes", "pages") */
  targetUnit?: string;

  /** Number of allowed grace (skip) days per month */
  graceDaysAllowance: number;

  /** ISO date string when the habit was created */
  startDate?: string;

  /** Whether the habit is soft-deleted / hidden */
  isHidden?: boolean;

  /** Color for the habit card (hex) */
  color?: string;

  /**
   * Order for sorting.
   */
  order?: number;

  /**
   * Daily history keyed by YYYY-MM-DD.
   */
  history: Record<string, HabitEntry>;
}

/** Mastery phase tracking (21-day → 66-day science model) */
export interface HabitMastery {
  phase: 'Initiation' | 'Integration' | 'Mastery';
  progress: number;
  currentDays: number;
  nextThreshold: number;
}

/** Computed stats for a single habit (never stored) */
export interface HabitStats {
  totalCompleted: number;
  totalMissed: number;
  successRate: number;
  currentStreak: number;
  longestStreak: number;
  graceDaysBalance: number;
  yearlyAdherenceRate: number;
  startDateStr: string;
  daysPassedSinceStart: number;
  totalCompletedThisYear: number;
  daysPassedThisYear: number;
  mastery: HabitMastery;
  todayEntry: HabitEntry | null;
}

/** Habit with computed stats attached */
export interface HabitWithStats extends HabitRaw {
  stats: HabitStats;
}
