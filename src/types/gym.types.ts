/**
 * ═══════════════════════════════════════════════════
 *  Gym Types — Maps to Firestore: users/{uid}.gymData
 * ═══════════════════════════════════════════════════
 *
 *  Firestore document shape (users/{uid}):
 *  {
 *    gymData: GymWeekRaw[],
 *    targetDays: number,
 *    workoutSystem: string,
 *    updatedAt: string,
 *    email: string,
 *    displayName: string
 *  }
 */

/** Day status in the heatmap calendar */
export type DayStatus =
  | 'WORKOUT'
  | 'LOCKED_REST'
  | 'AUTO_REST'
  | 'MISSED'
  | 'PENDING';

/** Single workout session logged for a specific day */
export interface GymSession {
  /** Session type key from workout system (e.g. 'push_1', 'squat') */
  sessionType: string;

  /** Total weight lifted or max weight (kg) */
  totalValue: number;

  /** Freeform notes about the session */
  notes: string;

  /** ISO timestamp when the session was logged */
  timestamp: string;
}

/**
 * Raw week data — exactly as stored in Firestore.
 */
export interface GymWeekRaw {
  /** Week number (1–52) */
  week: number;

  /** Formatted start date string (e.g. "Jan 3") */
  startDate: string;

  /**
   * 7-element boolean array (Sat → Fri).
   * true = workout done on that day.
   */
  days: boolean[];

  /**
   * Sessions keyed by day index (0–6).
   * Only days with logged workout sessions have entries.
   */
  sessions: Record<string, GymSession>;

  /** Body weight for the week, stored as string for input binding */
  weight: string;

  /** Body fat percentage for the week, stored as string */
  bodyFat: string;
}

/** Enriched day — computed at runtime, never stored */
export interface EnrichedDay {
  isDone: boolean;
  status: DayStatus;
  date: Date;
}

/** Enriched week — raw data + computed fields */
export interface GymWeekEnriched extends GymWeekRaw {
  weekWorkouts: number;
  isGoalMet: boolean;
  isCurrentWeek: boolean;
  enrichedDays: EnrichedDay[];
}

/** Single pattern insight from the AI analysis */
export interface PatternInsight {
  icon: string;
  text: string;
  color: string;
}

/** Achievement badge */
export interface Achievement {
  name: string;
  desc: string;
  unlocked: boolean;
  icon: string;
}

/** Risk level for momentum prediction */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Comprehensive gym stats — computed from enrichedData.
 * Never stored in Firestore; pure derived state.
 */
export interface GymStats {
  // ── Core Metrics ──
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  weeksGoalMet: number;
  successRate: number;
  disciplineScore: number;

  // ── Body Composition ──
  latestWeight: number | string;
  weightDiff: string;
  latestBodyFat: number | string;
  fatDiff: string;
  leanMass: string;

  // ── Pattern Analysis ──
  bestDay: string;
  worstDay: string;
  patternInsights: PatternInsight[];

  // ── Momentum ──
  daysSinceLastFailure: number;
  avgGapBetweenFailures: number;
  riskLevel: RiskLevel;

  // ── Gamification ──
  xp: number;
  level: number;
  levelTitle: string;
  xpInLevel: number;
  xpToNext: number;
  monthlyWorkouts: number;
  monthlyTarget: number;
  achievements: Achievement[];

  // ── AI Coach ──
  coachMessages: string[];

  // ── Today ──
  todayCompleted: boolean;
  todayWeekIdx: number;
  todayDayIdx: number;
}
