/**
 * ═══════════════════════════════════════════════════════════
 *  Life OS Types — Data structures for the LifeOS Dashboard
 * ═══════════════════════════════════════════════════════════
 */

import type { PrayerName, PrayerStatus } from './salah.types';

/* ─────────────── Life Score ─────────────── */

export interface LifeDimension {
  key: 'spiritual' | 'productivity' | 'health' | 'focus';
  label: string;
  icon: string;
  score: number;       // 0–100
  delta?: number;      // change since last week (optional)
  color: string;       // tailwind or css color token
}

export interface LifeScoreData {
  overall: number;
  dimensions: LifeDimension[];
  updatedAt?: string;
}

/* ─────────────── Life Status Grid ─────────────── */

export interface StatusMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface StatusCardData {
  dimension: LifeDimension['key'];
  metrics: StatusMetric[];
}

/* ─────────────── Today's Mission ─────────────── */

export interface MissionTask {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  category?: 'spiritual' | 'productivity' | 'health' | 'focus' | 'learning';
  dueTime?: string;    // e.g. "14:00"
}

export interface MissionData {
  date: string;        // "2026-03-12"
  tasks: MissionTask[];
}

/* ─────────────── Prayer Status ─────────────── */

export interface PrayerSlot {
  name: PrayerName;
  label: string;
  emoji: string;
  status: PrayerStatus;
  time?: string;       // "05:23"
}

export interface PrayerStatusData {
  prayers: PrayerSlot[];
  completedCount: number;
  totalCount: number;
  nextPrayer?: {
    name: PrayerName;
    label: string;
    emoji: string;
    timeLeft: string;  // "1h 20m"
    targetDate?: Date; // Added for live countdown
    time: string;
  };
}

/* ─────────────── Habit Engine ─────────────── */

export interface HabitEngineItem {
  id: string;
  name: string;
  icon: string;
  currentStreak: number;
  weeklyDone: number;  // out of 7
  weeklyTarget: number;
  todayDone: boolean;
  category: string;
}

/* ─────────────── AI Insights ─────────────── */

export type InsightType = 'warning' | 'tip' | 'praise' | 'pattern';

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  body: string;
  dimension: LifeDimension['key'] | 'general';
  icon?: string;
}

/* ─────────────── Time Awareness ─────────────── */

export interface TimeAwarenessData {
  nextPrayer?: {
    name: string;
    label: string;
    emoji: string;
    timeLeft: string;
    targetDate?: Date;
    time: string;
  };
  nextTask?: {
    title: string;
    time: string;
  };
  currentTime: string;    // HH:MM
  currentDate: string;    // "Thursday, 12 March 2026"
  hijriDate?: string;     // "12 Ramadan 1447"
}

/* ─────────────── Daily Reflection ─────────────── */

export interface ReflectionEntry {
  date: string;           // "2026-03-12"
  learned: string;
  improve: string;
  gratitude?: string;
  savedAt?: string;
}
