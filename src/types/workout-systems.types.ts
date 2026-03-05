/**
 * ═══════════════════════════════════════════════════
 *  Workout System Types — Static config definition
 * ═══════════════════════════════════════════════════
 */

export type WorkoutSystemId =
  | 'ppl'
  | 'ul'
  | 'ppl_ul'
  | 'fullbody'
  | 'bro'
  | 'arnoldSplit'
  | 'phul'
  | 'phat'
  | 'gzclp'
  | '531'
  | 'stronglifts'
  | 'greyskull'
  | 'texas'
  | 'custom';

/** A single session option within a workout system */
export interface SessionConfig {
  value: string;
  label: string;
  color: string;
}

/** A complete workout program definition */
export interface WorkoutSystemConfig {
  label: string;
  sessions: SessionConfig[];
}

/** Registry of all workout systems */
export type WorkoutSystemRegistry = Record<WorkoutSystemId, WorkoutSystemConfig>;
