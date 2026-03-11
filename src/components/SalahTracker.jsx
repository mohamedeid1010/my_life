import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Activity, BarChart3, TrendingUp, TrendingDown, AlertTriangle, Trophy,
  Calendar, Moon, Sun, ChevronRight, Flame, Star, Target, Eye, MapPin, Clock,
} from 'lucide-react';
import { CalculationMethod, PrayerTimes, Coordinates } from 'adhan';
import { useSalahStore } from '../stores/useSalahStore';
import { useAuthStore } from '../stores/useAuthStore';
import {
  PRAYER_NAMES, PRAYER_LABELS, STATUS_CONFIG, PRAYER_POINTS, FAJR_RANKS,
} from '../types/salah.types';
import PrayerCard from './salah/PrayerCard';
import QadaPanel from './salah/QadaPanel';
import { t } from '../config/translations';
import usePreferences from '../hooks/usePreferences';

/* ── Hijri date helper ── */
function getHijriDate() {
  try {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(new Date());
  } catch {
    return null;
  }
}

/* ── Prayer times helpers ── */
const ADHAN_PRAYER_MAP = { fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };

function getPrayerTimesFromCoords(lat, lng) {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Egyptian();
  const date = new Date();
  const pt = new PrayerTimes(coords, date, params);
  return {
    fajr: pt.fajr,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
}

function getNextPrayer(prayerTimes) {
  const now = new Date();
  for (const name of PRAYER_NAMES) {
    if (prayerTimes[name] > now) return { name, time: prayerTimes[name] };
  }
  return null; // all prayers passed for today
}

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPrayerTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/* ── usePrayerTimes hook ── */
function usePrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const intervalRef = useRef(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const times = getPrayerTimesFromCoords(pos.coords.latitude, pos.coords.longitude);
        setPrayerTimes(times);
        setLocationGranted(true);
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  // Auto-request on mount if permission was previously granted
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') requestLocation();
      }).catch(() => {});
    }
  }, [requestLocation]);

  // Countdown ticker
  useEffect(() => {
    if (!prayerTimes) return;

    const tick = () => {
      const next = getNextPrayer(prayerTimes);
      setNextPrayer(next);
      if (next) {
        setCountdown(formatCountdown(next.time - new Date()));
      } else {
        setCountdown('');
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [prayerTimes]);

  return { prayerTimes, nextPrayer, countdown, locationGranted, locationLoading, requestLocation };
}

export default function SalahTracker() {
  const user = useAuthStore(s => s.user);
  const {
    todayData, profile, weekEntries, recentEntries,
    sdsScore, insights, loading, loaded,
    initialize, cleanup,
    setPrayerStatus, setKhushoo, setDayNotes,
    qadaRecord, addQadaDebt, logQadaDone,
  } = useSalahStore();

  const [activeView, setActiveView] = useState('today');
  const { prayerTimes, nextPrayer, countdown, locationGranted, locationLoading, requestLocation } = usePrayerTimes();
  const hijriDate = useMemo(() => getHijriDate(), []);
  const { language } = usePreferences();
  const L = language;
  const isAr = L === 'ar';

  useEffect(() => {
    if (user?.uid) initialize(user.uid);
    return () => cleanup();
  }, [user?.uid, initialize, cleanup]);

  // ── Computed Stats ──
  const todayPoints = todayData?.totalPoints || 0;
  const maxDailyPoints = 5 * 27; // 135

  const todayCompletion = useMemo(() => {
    if (!todayData) return { completed: 0, total: 5, percentage: 0 };
    let completed = 0;
    PRAYER_NAMES.forEach(n => {
      const s = todayData.prayers[n]?.status;
      if (s && s !== 'none' && s !== 'missed') completed++;
    });
    return { completed, total: 5, percentage: Math.round((completed / 5) * 100) };
  }, [todayData]);

  const todayStatusSummary = useMemo(() => {
    if (!todayData) return { mosque: 0, congregation: 0, ontime: 0, late: 0, missed: 0 };
    const summary = { mosque: 0, congregation: 0, ontime: 0, late: 0, missed: 0 };
    PRAYER_NAMES.forEach(n => {
      const s = todayData.prayers[n]?.status;
      if (s && summary[s] !== undefined) summary[s]++;
    });
    return summary;
  }, [todayData]);

  // ── Week Stats ──
  const weekStats = useMemo(() => {
    let total = 0, completed = 0, mosque = 0, missed = 0;
    const perPrayer = {};
    PRAYER_NAMES.forEach(n => { perPrayer[n] = { completed: 0, missed: 0, mosque: 0 }; });

    weekEntries.forEach(entry => {
      PRAYER_NAMES.forEach(n => {
        total++;
        const s = entry.prayers[n]?.status;
        if (s && s !== 'none' && s !== 'missed') { completed++; perPrayer[n].completed++; }
        if (s === 'mosque') { mosque++; perPrayer[n].mosque++; }
        if (s === 'missed') { missed++; perPrayer[n].missed++; }
      });
    });

    const perfectDays = weekEntries.filter(e =>
      PRAYER_NAMES.every(n => {
        const s = e.prayers[n]?.status;
        return s && s !== 'none' && s !== 'missed';
      })
    ).length;

    const weakest = PRAYER_NAMES.reduce((a, b) =>
      perPrayer[a].missed > perPrayer[b].missed ? a : b
    );

    return { total, completed, mosque, missed, perfectDays, perPrayer, weakest };
  }, [weekEntries]);

  // ── Streak ──
  const streak = useMemo(() => {
    let count = 0;
    const sorted = [...recentEntries].sort((a, b) => b.date.localeCompare(a.date));
    for (const entry of sorted) {
      const allDone = PRAYER_NAMES.every(n => {
        const s = entry.prayers[n]?.status;
        return s && s !== 'none' && s !== 'missed';
      });
      if (allDone) count++;
      else break;
    }
    return count;
  }, [recentEntries]);

  // ── Fajr Stats ──
  const fajrStats = useMemo(() => {
    let completed = 0, mosque = 0, total = recentEntries.length;
    recentEntries.forEach(e => {
      const s = e.prayers.fajr?.status;
      if (s && s !== 'none' && s !== 'missed') completed++;
      if (s === 'mosque') mosque++;
    });
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const rank = FAJR_RANKS.find(r => rate >= r.min && rate <= r.max) || FAJR_RANKS[0];
    return { completed, mosque, total, rate, rank };
  }, [recentEntries]);

  // ── Loading ──
  if (loading && !loaded) {
    return (
      <div className="max-w-[1200px] mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          <div className="text-[var(--text-muted)] font-medium">{t('loading_salah', L)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ═══ Header ═══ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[var(--border-glass)] pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold gradient-text tracking-tight mb-1">
            {t('salah_tracker', L)}
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-medium italic">
            "إن الصلاة كانت على المؤمنين كتاباً موقوتاً"
          </p>
          {hijriDate && (
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
              <span className="text-base">🗓️</span>
              <span className="text-sm font-bold text-[var(--accent-primary)]" dir="rtl">{hijriDate}</span>
            </div>
          )}
        </div>

        {/* View switcher */}
        <div className="glass-card p-1 flex gap-1 rounded-xl">
          {[
            { id: 'today', label: t('today_view', L), icon: Sun },
            { id: 'analytics', label: t('analytics_view', L), icon: BarChart3 },
            { id: 'fajr', label: t('fajr_view', L), icon: Moon },
            { id: 'qada', label: t('qada_view', L), icon: null },
          ].map(v => {
            const qadaRemaining = v.id === 'qada'
              ? (['fajr','dhuhr','asr','maghrib','isha'].reduce((sum, n) => {
                  const p = qadaRecord?.prayers[n];
                  return sum + (p ? Math.max(0, p.owed - p.done) : 0);
                }, 0))
              : 0;
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeView === v.id
                    ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {v.icon && <v.icon size={16} />}
                <span>{v.label}</span>
                {qadaRemaining > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[9px] font-black bg-amber-500 text-white">
                    {qadaRemaining}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Today View ═══ */}
      {activeView === 'today' && (
        <div className="space-y-6">

          {/* Daily summary bar */}
          <div className="glass-card p-5 border-l-4 border-l-emerald-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-black text-[var(--text-primary)]">{todayPoints}</span>
                  <span className="text-lg text-[var(--text-muted)]">/ {maxDailyPoints}</span>
                  <span className="text-2xl font-bold" style={{ color: todayCompletion.percentage >= 80 ? '#10b981' : todayCompletion.percentage >= 40 ? '#f59e0b' : '#ef4444' }}>
                    {todayCompletion.percentage}%
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  {todayStatusSummary.mosque > 0 && <span className="text-emerald-400">🕌 {todayStatusSummary.mosque}</span>}
                  {todayStatusSummary.congregation > 0 && <span className="text-blue-400">👥 {todayStatusSummary.congregation}</span>}
                  {todayStatusSummary.ontime > 0 && <span className="text-purple-400">✅ {todayStatusSummary.ontime}</span>}
                  {todayStatusSummary.late > 0 && <span className="text-amber-400">⚠️ {todayStatusSummary.late}</span>}
                  {todayStatusSummary.missed > 0 && <span className="text-red-400">❌ {todayStatusSummary.missed}</span>}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    <Flame size={18} />
                    <span className="text-lg font-black">{streak}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">{isAr ? 'سلسلة' : 'streak'}</span>
                  </div>
                )}
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 transition-colors"
                  style={{
                    borderColor: sdsScore >= 75 ? '#10b981' : sdsScore >= 50 ? '#f59e0b' : '#ef4444',
                    background: sdsScore >= 75 ? '#10b98110' : sdsScore >= 50 ? '#f59e0b10' : '#ef444410',
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">SDS</span>
                  <span className="text-xl font-black text-[var(--text-primary)]">{sdsScore}</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 w-full h-2 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-700 ease-out rounded-full"
                style={{
                  width: `${(todayPoints / maxDailyPoints) * 100}%`,
                  background: todayCompletion.percentage >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'var(--gradient-hero)',
                }}
              />
            </div>
          </div>

          {/* Next Prayer Countdown / Location */}
          {!locationGranted ? (
            <button
              onClick={requestLocation}
              disabled={locationLoading}
              className="glass-card p-4 flex items-center justify-center gap-3 w-full text-sm font-bold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all border border-dashed border-[var(--border-glass)] hover:border-[var(--accent-primary)]"
            >
              <MapPin size={18} />
              {locationLoading ? t('getting_location', L) : t('enable_location', L)}
            </button>
          ) : nextPrayer ? (
            <div className="glass-card p-4 border-l-4 border-l-cyan-500 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-cyan-400" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('next_prayer', L)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{PRAYER_LABELS[nextPrayer.name].emoji}</span>
                    <span className="text-lg font-black text-[var(--text-primary)]">{isAr ? PRAYER_LABELS[nextPrayer.name].ar : PRAYER_LABELS[nextPrayer.name].en}</span>
                    <span className="text-sm text-[var(--text-muted)]">{t('at_time', L)} {formatPrayerTime(nextPrayer.time)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <span className="text-2xl font-black text-cyan-400 font-mono tracking-wider">{countdown}</span>
              </div>
            </div>
          ) : locationGranted ? (
            <div className="glass-card p-4 border-l-4 border-l-emerald-500 flex items-center gap-3">
              <span className="text-lg">✅</span>
              <span className="text-sm font-bold text-emerald-400">{t('all_prayers_done', L)}</span>
            </div>
          ) : null}

          {/* Prayer Times List (when location is enabled) */}
          {locationGranted && prayerTimes && (
            <div className="flex items-center justify-center gap-4 flex-wrap text-xs font-bold text-[var(--text-muted)]">
              {PRAYER_NAMES.map(name => (
                <span key={name} className={`flex items-center gap-1 ${nextPrayer?.name === name ? 'text-cyan-400' : ''}`}>
                  {PRAYER_LABELS[name].emoji} {isAr ? PRAYER_LABELS[name].ar : PRAYER_LABELS[name].en} {formatPrayerTime(prayerTimes[name])}
                </span>
              ))}
            </div>
          )}

          {/* Prayer Cards — all 5 visible side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PRAYER_NAMES.map(name => (
              <PrayerCard
                key={name}
                prayerName={name}
                entry={todayData?.prayers[name]}
                weekData={weekEntries}
                onStatusChange={setPrayerStatus}
                onKhushooChange={setKhushoo}
                isReadOnly={false}
                isNextPrayer={nextPrayer?.name === name}
                nextPrayerCountdown={nextPrayer?.name === name ? countdown : null}
              />
            ))}
          </div>

          {/* Daily Reflection */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
              <Eye size={16} className="text-[var(--accent-primary)]" /> {t('daily_reflection', L)}
            </h3>
            <textarea
              value={todayData?.notes || ''}
              onChange={e => setDayNotes(e.target.value)}
              placeholder={t('reflection_placeholder', L)}
              className="w-full h-20 bg-transparent border-none outline-none resize-none text-sm text-[var(--text-primary)] leading-relaxed placeholder-[var(--text-muted)]"
            />
          </div>
        </div>
      )}

      {/* ═══ Analytics View ═══ */}
      {activeView === 'analytics' && (
        <div className="space-y-6">

          {/* Top stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 text-center">
              <Target size={24} className="mx-auto mb-2 text-emerald-400" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{weekStats.completed}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('prayers', L)} / {weekStats.total}</div>
            </div>
            <div className="glass-card p-5 text-center">
              <span className="text-2xl block mb-1">🕌</span>
              <div className="text-3xl font-black text-[var(--text-primary)]">{weekStats.mosque}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('in_mosque', L)}</div>
            </div>
            <div className="glass-card p-5 text-center">
              <Star size={24} className="mx-auto mb-2 text-amber-400" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{weekStats.perfectDays}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('perfect_days', L)}</div>
            </div>
            <div className="glass-card p-5 text-center border-2 transition-colors"
              style={{
                borderColor: sdsScore >= 75 ? '#10b98150' : sdsScore >= 50 ? '#f59e0b50' : '#ef444450',
              }}
            >
              <Activity size={24} className="mx-auto mb-2 text-[var(--accent-primary)]" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{sdsScore}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('sds_score', L)}</div>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold uppercase tracking-wide text-[var(--accent-primary)] mb-4 flex items-center gap-2">
              <Calendar size={20} /> {t('weekly_prayer_grid', L)}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] pb-3 pr-3">{t('prayer', L)}</th>
                    {weekEntries.map((e, i) => {
                      const d = new Date(e.date);
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                      const isToday = e.date === new Date().toISOString().split('T')[0];
                      return (
                        <th key={i} className={`text-center pb-3 text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>
                          {dayName}
                          {isToday && <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)] mx-auto mt-1" />}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {PRAYER_NAMES.map(name => (
                    <tr key={name}>
                      <td className="py-2 pr-3 font-bold text-[var(--text-primary)] whitespace-nowrap">
                        {PRAYER_LABELS[name].emoji} {isAr ? PRAYER_LABELS[name].ar : PRAYER_LABELS[name].en}
                      </td>
                      {weekEntries.map((entry, i) => {
                        const s = entry.prayers[name]?.status || 'none';
                        const conf = STATUS_CONFIG[s];
                        return (
                          <td key={i} className="text-center py-2">
                            <span
                              className="text-lg leading-none"
                              title={conf.label}
                              style={{ color: conf.color }}
                            >
                              {conf.icon}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Daily completion row */}
                  <tr className="border-t border-[var(--border-glass)]">
                    <td className="py-2 pr-3 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-wider">{t('score', L)}</td>
                    {weekEntries.map((entry, i) => {
                      const dayCompleted = PRAYER_NAMES.filter(n => {
                        const s = entry.prayers[n]?.status;
                        return s && s !== 'none' && s !== 'missed';
                      }).length;
                      const pct = Math.round((dayCompleted / 5) * 100);
                      return (
                        <td key={i} className="text-center py-2">
                          <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                            {pct}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-Prayer Breakdown */}
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold uppercase tracking-wide text-[var(--accent-primary)] mb-4">
              {t('per_prayer_completion', L)}
            </h3>
            <div className="space-y-4">
              {PRAYER_NAMES.map(name => {
                const stats = weekStats.perPrayer[name] || { completed: 0, missed: 0, mosque: 0 };
                const pct = weekEntries.length > 0 ? Math.round((stats.completed / weekEntries.length) * 100) : 0;
                const isWeakest = weekStats.weakest === name && stats.missed > 0;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                        {PRAYER_LABELS[name].emoji} {isAr ? PRAYER_LABELS[name].ar : PRAYER_LABELS[name].en}
                        {isWeakest && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">⚠ {t('weakest', L)}</span>}
                      </span>
                      <span className="text-[var(--text-muted)] font-medium">{stats.completed}/{weekEntries.length} · 🕌 {stats.mosque}</span>
                    </div>
                    <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-700 rounded-full" style={{
                        width: `${pct}%`,
                        background: pct === 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insights */}
          <div className="glass-card p-5 border-l-4 border-l-[var(--accent-primary)]">
            <h3 className="text-lg font-bold uppercase tracking-wide text-[var(--accent-primary)] mb-4 flex items-center gap-2">
              <Eye size={20} /> {t('spiritual_insights', L)}
            </h3>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-black/10 border border-[var(--border-glass)]">
                  <span className="text-lg shrink-0 mt-0.5">{insight.slice(0, 2)}</span>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">{insight.slice(2).trim()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lifetime stats */}
          {profile && (
            <div className="glass-card p-5">
              <h3 className="text-lg font-bold uppercase tracking-wide text-[var(--text-muted)] mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-amber-400" /> {t('lifetime_stats', L)}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-black/10 border border-[var(--border-glass)]">
                  <div className="text-2xl font-black text-[var(--text-primary)]">{profile.totalPrayersLogged.toLocaleString()}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('prayers_logged', L)}</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-black/10 border border-[var(--border-glass)]">
                  <div className="text-2xl font-black text-emerald-400">{profile.lifetimeMosquePrayers.toLocaleString()}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('mosque_prayers', L)}</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-black/10 border border-[var(--border-glass)]">
                  <div className="text-2xl font-black text-orange-400">{profile.bestStreak}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('best_streak', L)}</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-black/10 border border-[var(--border-glass)]">
                  <div className="text-2xl font-black text-amber-400">{profile.fajrBestStreak}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('fajr_best_streak', L)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Fajr Discipline Center ═══ */}
      {activeView === 'fajr' && (
        <div className="space-y-6">

          {/* Fajr Rank Card */}
          <div className="glass-card p-6 text-center border-2 border-amber-500/30 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at center, #f59e0b, transparent 70%)' }} />
            <div className="relative z-10">
              <span className="text-6xl block mb-3">{fajrStats.rank.emoji}</span>
              <h2 className="text-3xl font-black text-amber-400 mb-1">{fajrStats.rank.titleAr}</h2>
              <p className="text-sm font-bold text-[var(--text-muted)] mb-4">{fajrStats.rank.titleEn}</p>

              {/* Rank progress */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {FAJR_RANKS.map(r => (
                  <div
                    key={r.rank}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                      r.rank <= fajrStats.rank.rank
                        ? 'bg-amber-500/20 border border-amber-500/40 shadow-lg'
                        : 'bg-black/10 border border-[var(--border-glass)] opacity-40'
                    }`}
                    title={`${r.titleEn}: ${r.min}-${r.max}%`}
                  >
                    {r.emoji}
                  </div>
                ))}
              </div>

              <div className="text-sm text-[var(--text-muted)]">
                {t('fajr_rate', L)}: <span className="font-black text-amber-400 text-xl">{fajrStats.rate}%</span>
                <span className="ml-2 opacity-60">({fajrStats.completed}/{fajrStats.total} days)</span>
              </div>
            </div>
          </div>

          {/* Fajr Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 text-center">
              <Flame size={24} className="mx-auto mb-2 text-orange-400" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{profile?.fajrCurrentStreak || 0}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('current_fajr_streak', L)}</div>
            </div>
            <div className="glass-card p-5 text-center">
              <Trophy size={24} className="mx-auto mb-2 text-amber-400" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{profile?.fajrBestStreak || 0}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('best_fajr_streak', L)}</div>
            </div>
            <div className="glass-card p-5 text-center">
              <span className="text-2xl block mb-1">🕌</span>
              <div className="text-3xl font-black text-emerald-400">{fajrStats.mosque}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('fajr_in_mosque', L)}</div>
            </div>
            <div className="glass-card p-5 text-center">
              <Target size={24} className="mx-auto mb-2 text-[var(--accent-primary)]" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{fajrStats.rate}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{t('completion_rate', L)}</div>
            </div>
          </div>

          {/* Fajr Weekly Pattern */}
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold uppercase tracking-wide text-amber-400 mb-4 flex items-center gap-2">
              <Moon size={20} /> {t('fajr_weekly_pattern', L)}
            </h3>
            <div className="flex gap-2 justify-center">
              {weekEntries.map((entry, i) => {
                const s = entry.prayers.fajr?.status || 'none';
                const conf = STATUS_CONFIG[s];
                const d = new Date(entry.date);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                const isToday = entry.date === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      isToday ? 'border-amber-400/50 bg-amber-500/10' : 'border-[var(--border-glass)]'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{dayName}</span>
                    <span className="text-2xl">{conf.icon}</span>
                    <span className="text-[9px] font-bold" style={{ color: conf.color }}>{conf.label.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next rank progress */}
          {fajrStats.rank.rank < 5 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                {t('next_rank', L)}: {FAJR_RANKS[fajrStats.rank.rank]?.titleAr} {FAJR_RANKS[fajrStats.rank.rank]?.emoji}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-amber-500 to-amber-300"
                      style={{
                        width: `${Math.min(100, ((fajrStats.rate - fajrStats.rank.min) / (FAJR_RANKS[fajrStats.rank.rank]?.min - fajrStats.rank.min || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-400">{fajrStats.rate}% → {FAJR_RANKS[fajrStats.rank.rank]?.min}%</span>
              </div>
            </div>
          )}

          {/* Motivational Hadith */}
          <div className="glass-card p-5 text-center border-l-4 border-l-amber-500/50">
            <p className="text-lg font-bold text-amber-300/80 leading-relaxed mb-2">
              "بشّر المشّائين في الظلم إلى المساجد بالنور التام يوم القيامة"
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              "Give glad tidings to those who walk to the mosques in darkness, of a complete light on the Day of Resurrection."
            </p>
          </div>
        </div>
      )}

      {/* ═══ Qada View ═══ */}
      {activeView === 'qada' && (
        <QadaPanel
          qadaRecord={qadaRecord}
          todayData={todayData}
          onAddDebt={addQadaDebt}
          onLogDone={logQadaDone}
        />
      )}
    </div>
  );
}
