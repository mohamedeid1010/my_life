/**
 * Central type barrel — import everything from '@/types'
 */
export type { FirebaseAuthUser, UserProfile, AuthState } from './user.types';
export type { DayStatus, GymSession, GymWeekRaw, EnrichedDay, GymWeekEnriched, PatternInsight, Achievement, RiskLevel, GymStats } from './gym.types';
export type { HabitType, HabitTargetType, HabitCategory, HabitEntryStatus, HabitEntry, HabitRaw, HabitMastery, HabitStats, HabitWithStats } from './habits.types';
export type { ThemeId, LanguageId, LayoutWidget, PageLayouts, UserPreferences } from './preferences.types';
export type { WorkoutSystemId, SessionConfig, WorkoutSystemConfig, WorkoutSystemRegistry } from './workout-systems.types';
export type { WeakestHabitAnalysis, GlobalHabitsAnalytics } from './analytics.types';
export type { OfflineActionType, PendingAction, SyncState } from './offline.types';
