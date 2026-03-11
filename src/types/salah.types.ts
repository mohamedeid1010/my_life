/**
 * ═══════════════════════════════════════════════════════════
 *  Salah Types — Prayer Tracking Data Structures
 * ═══════════════════════════════════════════════════════════
 */

/** Prayer status levels — weighted scoring */
export type PrayerStatus = 'mosque' | 'congregation' | 'ontime' | 'late' | 'missed' | 'none';

/** Points per status (27x mosque = hadith basis) */
export const PRAYER_POINTS: Record<PrayerStatus, number> = {
  mosque: 27,
  congregation: 15,
  ontime: 10,
  late: 3,
  missed: 0,
  none: 0,
};

/** Five daily prayers */
export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYER_NAMES: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_LABELS: Record<PrayerName, { en: string; ar: string; emoji: string }> = {
  fajr:    { en: 'Fajr',    ar: 'الفجر',   emoji: '🌅' },
  dhuhr:   { en: 'Dhuhr',   ar: 'الظهر',   emoji: '☀️' },
  asr:     { en: 'Asr',     ar: 'العصر',   emoji: '🌤️' },
  maghrib: { en: 'Maghrib', ar: 'المغرب',  emoji: '🌇' },
  isha:    { en: 'Isha',    ar: 'العشاء',  emoji: '🌙' },
};

export const STATUS_CONFIG: Record<PrayerStatus, { label: string; icon: string; color: string }> = {
  mosque:       { label: 'Mosque',       icon: '🕌', color: '#10b981' },
  congregation: { label: 'Congregation', icon: '👥', color: '#3b82f6' },
  ontime:       { label: 'On Time',      icon: '✅', color: '#8b5cf6' },
  late:         { label: 'Late',         icon: '⚠️', color: '#f59e0b' },
  missed:       { label: 'Missed',       icon: '❌', color: '#ef4444' },
  none:         { label: 'Not Logged',   icon: '□', color: '#64748b' },
};

/** Individual prayer entry */
export interface PrayerEntry {
  status: PrayerStatus;
  points: number;
  khushoo?: 1 | 2 | 3;
  spiLoggedAt?: string;
  sunnah?: {
    before?: number;
    after?: number;
  };
}

/** Daily prayer document */
export interface SalahDayEntry {
  date: string;            // "2026-03-11"
  prayers: Record<PrayerName, PrayerEntry>;
  totalPoints: number;     // Sum of prayer points (0-135 max)
  notes: string;
  updatedAt: string;
}

/** Weekly summary */
export interface SalahWeeklySummary {
  weekId: string;
  totalPrayers: number;
  completedPrayers: number;
  mosquePrayers: number;
  latePrayers: number;
  missedPrayers: number;
  fajrRate: number;
  mosqueRate: number;
  onTimeRate: number;
  sdsScore: number;
  perPrayer: Record<PrayerName, PrayerWeeklyStats>;
  streakDays: number;
  perfectDays: number;
}

export interface PrayerWeeklyStats {
  completed: number;
  inMosque: number;
  onTime: number;
  late: number;
  missed: number;
}

/** Qada (make-up prayer) tracking per prayer */
export interface QadaPrayerEntry {
  owed: number;  // total missed prayers accumulated (debt)
  done: number;  // total make-up prayers performed so far
}

/** Qada record — stored in users/{uid}/salah/qada */
export interface QadaRecord {
  prayers: Record<PrayerName, QadaPrayerEntry>;
  updatedAt: string;
}

/** User-level persistent profile */
export interface SalahProfile {
  totalPrayersLogged: number;
  lifetimeMosquePrayers: number;
  currentStreak: number;
  bestStreak: number;
  fajrCurrentStreak: number;
  fajrBestStreak: number;
  fajrRank: 1 | 2 | 3 | 4 | 5;
  startedAt: string;
}

/** Fajr ranks */
export const FAJR_RANKS = [
  { rank: 1, min: 0,  max: 30,  titleAr: 'المستيقظ', titleEn: 'The Awakening', emoji: '🌑' },
  { rank: 2, min: 31, max: 60,  titleAr: 'الصادق',  titleEn: 'The Sincere',   emoji: '🌒' },
  { rank: 3, min: 61, max: 80,  titleAr: 'المجاهد', titleEn: 'The Striving',  emoji: '🌓' },
  { rank: 4, min: 81, max: 95,  titleAr: 'الصابر',  titleEn: 'The Steadfast',  emoji: '🌔' },
  { rank: 5, min: 96, max: 100, titleAr: 'أهل الفجر', titleEn: 'People of Fajr', emoji: '🌅' },
];
