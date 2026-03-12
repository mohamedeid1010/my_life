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

const DAY_KEY_BY_INDEX = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];

const AR_COMPACT_DAY = {
  day_sun: 'أحد',
  day_mon: 'إثن',
  day_tue: 'ثلا',
  day_wed: 'أرب',
  day_thu: 'خمي',
  day_fri: 'جمع',
  day_sat: 'سبت',
};

function getLocalizedDayName(dateStr, lang = 'en', compact = false) {
  const dayIndex = new Date(dateStr).getDay();
  const dayKey = DAY_KEY_BY_INDEX[dayIndex] || 'day_sun';
  if (lang === 'ar' && compact) return AR_COMPACT_DAY[dayKey] || t(dayKey, lang);
  return t(dayKey, lang);
}

const STATUS_TRANSLATION_KEYS = {
  mosque: 'status_mosque',
  congregation: 'status_congregation',
  ontime: 'status_ontime',
  late: 'status_late',
  missed: 'status_missed',
};

function getLocalizedStatusLabel(status, lang = 'en') {
  if (status === 'none') return lang === 'ar' ? 'غير مسجل' : 'Not Logged';
  const key = STATUS_TRANSLATION_KEYS[status];
  return key ? t(key, lang) : (lang === 'ar' ? 'غير مسجل' : 'Not Logged');
}

function localizeInsightText(insight, lang = 'en') {
  if (lang !== 'ar') return insight;

  if (insight === '📊 Log a few more days to unlock personalized insights.') {
    return '📊 سجّل عدة أيام إضافية لفتح رؤى شخصية أدق.';
  }

  if (insight === '🌅 You miss Fajr more on weekends. Try sleeping earlier on Thursday/Friday nights.') {
    return '🌅 يفوتك الفجر أكثر في نهاية الأسبوع. جرّب النوم مبكرًا ليلة الخميس/الجمعة.';
  }

  if (insight === '🕌 Your mosque attendance is below 20%. Challenge: try 3 mosque prayers this week.') {
    return '🕌 حضورك للمسجد أقل من 20٪. التحدي: حاول أداء 3 صلوات في المسجد هذا الأسبوع.';
  }

  if (insight === '🕌 MashaAllah! Your mosque attendance is above 60%. Keep up the community spirit.') {
    return '🕌 ما شاء الله! حضورك للمسجد فوق 60٪. استمر على روح الجماعة.';
  }

  if (insight === '📈 You\'re doing well! Keep logging daily for deeper insights.') {
    return '📈 أداؤك جيد! استمر في التسجيل اليومي للحصول على رؤى أعمق.';
  }

  const weakestMatch = insight.match(/^⚠️ Your weakest prayer is ([A-Za-z]+) — missed (\d+) time(?:s)? recently\.$/);
  if (weakestMatch) {
    const prayerNameEn = weakestMatch[1].toLowerCase();
    const missedCount = weakestMatch[2];
    const prayerAr = PRAYER_LABELS[prayerNameEn]?.ar || weakestMatch[1];
    return `⚠️ أضعف صلاة عندك هي ${prayerAr} — فاتتك ${missedCount} مرة مؤخرًا.`;
  }

  const perfectDaysMatch = insight.match(/^🏆 You prayed all 5 daily prayers every day for (\d+) days!.*$/);
  if (perfectDaysMatch) {
    return `🏆 صليت الصلوات الخمس يوميًا لمدة ${perfectDaysMatch[1]} أيام! \"أحب الأعمال إلى الله أدومها وإن قلّ\"`;
  }

  return insight;
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
    loadDateEntry, setPrayerStatusForDate,
  } = useSalahStore();

  const [activeView, setActiveView] = useState('today');

  // ── Past-day browsing ──
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [pastDayData, setPastDayData] = useState(null);
  const [loadingPastDay, setLoadingPastDay] = useState(false);

  // Generate last 7 days (oldest → today)
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  const isViewingToday = selectedDate === todayDateStr;

  // Load past day data when date changes
  useEffect(() => {
    if (isViewingToday) {
      setPastDayData(null);
      return;
    }
    setLoadingPastDay(true);
    loadDateEntry(selectedDate).then(data => {
      if (data) {
        setPastDayData(data);
      } else {
        const emptyPrayers = {};
        PRAYER_NAMES.forEach(n => { emptyPrayers[n] = { status: 'none', points: 0 }; });
        setPastDayData({ date: selectedDate, prayers: emptyPrayers, totalPoints: 0, notes: '', updatedAt: new Date().toISOString() });
      }
      setLoadingPastDay(false);
    });
  }, [selectedDate, isViewingToday, loadDateEntry]);

  // Handler for changing status on a past day
  const handlePastDayStatusChange = useCallback(async (prayer, newStatus) => {
    if (!pastDayData) return;
    const prevStatus = pastDayData.prayers[prayer]?.status || 'none';
    const newEntry = {
      status: newStatus,
      points: PRAYER_POINTS[newStatus],
      ...(pastDayData.prayers[prayer]?.khushoo !== undefined && { khushoo: pastDayData.prayers[prayer].khushoo }),
      spiLoggedAt: new Date().toISOString(),
    };
    const newPrayers = { ...pastDayData.prayers, [prayer]: newEntry };
    const totalPoints = PRAYER_NAMES.reduce((sum, n) => sum + (newPrayers[n]?.points || 0), 0);
    const updatedDay = { ...pastDayData, prayers: newPrayers, totalPoints, updatedAt: new Date().toISOString() };
    setPastDayData(updatedDay);
    await setPrayerStatusForDate(updatedDay, prayer, prevStatus);
  }, [pastDayData, setPrayerStatusForDate]);
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
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10" />
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-emerald-300 border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-2 flex items-center justify-center text-xl">🕌</div>
          </div>
          <div className="text-[var(--text-muted)] font-medium text-sm">{t('loading_salah', L)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ═══ Header ═══ */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-5 sm:p-7"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.08) 40%, rgba(139,92,246,0.06) 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Decorative geometric background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-[0.03]"
            style={{ background: 'radial-gradient(circle, #22d3ee, transparent 70%)' }} />
          <div className="absolute top-0 right-0 text-[8rem] opacity-[0.04] select-none leading-none pr-4 pt-1">🕌</div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #22d3ee 50%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {t('salah_tracker', L)}
              </h1>
              {hijriDate && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
                  dir="rtl"
                >
                  🗓️ {hijriDate}
                </div>
              )}
            </div>
            <p className="text-sm font-medium opacity-70 italic" style={{ color: 'var(--text-muted)' }}>
              "إن الصلاة كانت على المؤمنين كتاباً موقوتاً"
            </p>
          </div>

          {/* View switcher — pill style */}
          <div className="flex gap-1 p-1 rounded-2xl shrink-0"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', backdropFilter: 'blur(12px)' }}
          >
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
                  className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                    activeView === v.id
                      ? 'text-white shadow-lg scale-[1.02]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  style={{
                    background: activeView === v.id
                      ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                      : 'transparent',
                    boxShadow: activeView === v.id ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                  }}
                >
                  {v.icon && <v.icon size={15} />}
                  <span>{v.label}</span>
                  {qadaRemaining > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[8px] font-black bg-amber-500 text-white">
                      {qadaRemaining}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Today View ═══ */}
      {activeView === 'today' && (
        <div className="space-y-5">

          {/* ── Hero Score Bar ── */}
          <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${todayCompletion.percentage >= 80 ? 'rgba(16,185,129,0.3)' : todayCompletion.percentage >= 40 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
              boxShadow: `0 4px 24px rgba(0,0,0,0.2)`,
            }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: todayCompletion.percentage >= 80
                  ? 'radial-gradient(ellipse at 0% 50%, rgba(16,185,129,0.06) 0%, transparent 60%)'
                  : todayCompletion.percentage >= 40
                  ? 'radial-gradient(ellipse at 0% 50%, rgba(245,158,11,0.05) 0%, transparent 60%)'
                  : 'radial-gradient(ellipse at 0% 50%, rgba(239,68,68,0.05) 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                  <span
                    className="text-5xl font-black leading-none"
                    style={{ color: todayCompletion.percentage >= 80 ? '#10b981' : todayCompletion.percentage >= 40 ? '#f59e0b' : '#ef4444' }}
                  >
                    {todayCompletion.percentage}%
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {isAr ? 'النقاط اليوم' : "Today's Score"}
                    </span>
                    <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                      {todayPoints} <span className="font-normal opacity-50 text-xs">/ {maxDailyPoints}</span>
                    </span>
                  </div>
                </div>

                {/* Status summary pills */}
                <div className="flex flex-wrap gap-1.5">
                  {todayStatusSummary.mosque > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: '#10b98115', border: '1px solid #10b98130', color: '#10b981' }}>
                      🕌 {todayStatusSummary.mosque} {isAr ? 'مسجد' : 'mosque'}
                    </span>
                  )}
                  {todayStatusSummary.congregation > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: '#3b82f615', border: '1px solid #3b82f630', color: '#3b82f6' }}>
                      👥 {todayStatusSummary.congregation}
                    </span>
                  )}
                  {todayStatusSummary.ontime > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: '#8b5cf615', border: '1px solid #8b5cf630', color: '#8b5cf6' }}>
                      ✅ {todayStatusSummary.ontime}
                    </span>
                  )}
                  {todayStatusSummary.late > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: '#f59e0b15', border: '1px solid #f59e0b30', color: '#f59e0b' }}>
                      ⚠️ {todayStatusSummary.late}
                    </span>
                  )}
                  {todayStatusSummary.missed > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444' }}>
                      ❌ {todayStatusSummary.missed}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-4 w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                    style={{
                      width: `${(todayPoints / maxDailyPoints) * 100}%`,
                      background: todayCompletion.percentage >= 80
                        ? 'linear-gradient(90deg, #10b981, #34d399, #10b981)'
                        : todayCompletion.percentage >= 40
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                      backgroundSize: '200% 100%',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>

              {/* Right panel — streak + SDS */}
              <div className="flex items-center gap-3 shrink-0">
                {streak > 0 && (
                  <div className="flex flex-col items-center justify-center px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}
                  >
                    <Flame size={20} className="text-orange-400 mb-1" />
                    <span className="text-2xl font-black text-orange-400 leading-none">{streak}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold opacity-60 text-orange-400 mt-0.5">{isAr ? 'سلسلة' : 'streak'}</span>
                  </div>
                )}
                <div
                  className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all"
                  style={{
                    borderColor: sdsScore >= 75 ? '#10b981' : sdsScore >= 50 ? '#f59e0b' : '#ef4444',
                    background: sdsScore >= 75 ? 'rgba(16,185,129,0.08)' : sdsScore >= 50 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                  }}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>SDS</span>
                  <span className="text-3xl font-black leading-tight" style={{ color: sdsScore >= 75 ? '#10b981' : sdsScore >= 50 ? '#f59e0b' : '#ef4444' }}>{sdsScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Next Prayer / Location ── */}
          {!locationGranted ? (
            <button
              onClick={requestLocation}
              disabled={locationLoading}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all duration-200 hover:scale-[1.005]"
              style={{
                background: 'var(--bg-card)',
                border: '1px dashed rgba(34,211,238,0.25)',
                color: 'var(--text-muted)',
              }}
            >
              <MapPin size={18} className="text-cyan-400" />
              {locationLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                  {t('getting_location', L)}
                </span>
              ) : (
                <span className="text-cyan-400">{t('enable_location', L)}</span>
              )}
            </button>
          ) : nextPrayer ? (
            <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
              style={{ background: 'var(--bg-card)', border: '1px solid rgba(34,211,238,0.25)', boxShadow: '0 4px 24px rgba(34,211,238,0.08)' }}
            >
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(34,211,238,0.06) 0%, transparent 60%)' }}
              />
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)' }}
                  >
                    {PRAYER_LABELS[nextPrayer.name].emoji}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 opacity-70 mb-0.5">{t('next_prayer', L)}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-cyan-300">{isAr ? PRAYER_LABELS[nextPrayer.name].ar : PRAYER_LABELS[nextPrayer.name].en}</span>
                      <span className="text-xs text-[var(--text-muted)]">{t('at_time', L)} {formatPrayerTime(nextPrayer.time)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl"
                  style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}
                >
                  <Clock size={16} className="text-cyan-400 opacity-60" />
                  <span className="text-2xl font-black text-cyan-300 font-mono tracking-wider">{countdown}</span>
                </div>
              </div>
            </div>
          ) : locationGranted ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div>
              <span className="text-sm font-bold text-emerald-400">{t('all_prayers_done', L)}</span>
            </div>
          ) : null}

          {/* Prayer Times Quick Strip */}
          {locationGranted && prayerTimes && (
            <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap py-1">
              {PRAYER_NAMES.map(name => (
                <div key={name}
                  className={`flex items-center gap-1.5 transition-all ${nextPrayer?.name === name ? 'scale-105' : 'opacity-60'}`}
                >
                  <span className="text-sm">{PRAYER_LABELS[name].emoji}</span>
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${nextPrayer?.name === name ? 'text-cyan-400' : 'text-[var(--text-muted)]'}`}>
                      {isAr ? PRAYER_LABELS[name].ar : PRAYER_LABELS[name].en}
                    </span>
                    <span className={`text-[10px] font-black ${nextPrayer?.name === name ? 'text-cyan-300' : 'text-[var(--text-muted)]'}`}>
                      {formatPrayerTime(prayerTimes[name])}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Day Navigator ── */}
          <div className="rounded-2xl p-3 sm:p-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>
                {isAr ? 'تعديل يوم سابق' : 'Edit a past day'}
              </span>
              {!isViewingToday && (
                <button
                  onClick={() => setSelectedDate(todayDateStr)}
                  className="text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
                >
                  {isAr ? '← اليوم' : '← Today'}
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" dir="ltr">
              {last7Days.map(date => {
                const dayIndex = new Date(date).getDay();
                const dayShortEn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayIndex];
                const dayShortAr = AR_COMPACT_DAY[DAY_KEY_BY_INDEX[dayIndex]];
                const isToday = date === todayDateStr;
                const isSelected = date === selectedDate;
                const weekEntry = weekEntries.find(e => e.date === date);
                const dayDone = weekEntry
                  ? PRAYER_NAMES.filter(n => weekEntry.prayers[n]?.status && weekEntry.prayers[n].status !== 'none' && weekEntry.prayers[n].status !== 'missed').length
                  : null;
                const dotColor = dayDone === null ? 'transparent' : dayDone === 5 ? '#10b981' : dayDone >= 3 ? '#f59e0b' : '#ef4444';
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border font-bold text-xs transition-all whitespace-nowrap shrink-0 hover:scale-105 active:scale-95"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                        : 'rgba(255,255,255,0.03)',
                      borderColor: isSelected
                        ? 'rgba(16,185,129,0.5)'
                        : isToday
                        ? 'rgba(16,185,129,0.25)'
                        : 'var(--border-glass)',
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                      boxShadow: isSelected ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
                    }}
                  >
                    <span className="text-[9px] uppercase tracking-wider opacity-70">{isAr ? dayShortAr : dayShortEn}</span>
                    <span className="font-black text-sm leading-none">{date.slice(8)}</span>
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: isSelected ? 'rgba(255,255,255,0.5)' : dotColor, opacity: dayDone === null ? 0 : 1 }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Past-day banner */}
          {!isViewingToday && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-amber-400"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <span className="text-xl">📅</span>
              <span dir="rtl">
                {isAr
                  ? `تعديل صلوات يوم ${selectedDate} — اضغط على أي صلاة لتغيير حالتها`
                  : `Editing prayers for ${selectedDate} — tap any prayer to change its status`}
              </span>
            </div>
          )}

          {/* ── Prayer Cards Grid ── */}
          {loadingPastDay ? (
            <div className="flex items-center justify-center h-32">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10" />
                <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 animate-spin" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {PRAYER_NAMES.map(name => (
                <PrayerCard
                  key={name}
                  prayerName={name}
                    entry={isViewingToday ? todayData?.prayers[name] : pastDayData?.prayers[name]}
                  weekData={weekEntries}
                  onStatusChange={isViewingToday ? setPrayerStatus : handlePastDayStatusChange}
                  onKhushooChange={setKhushoo}
                  isReadOnly={false}
                  isNextPrayer={isViewingToday && nextPrayer?.name === name}
                  nextPrayerCountdown={isViewingToday && nextPrayer?.name === name ? countdown : null}
                />
              ))}
            </div>
          )}

          {/* ── Daily Reflection ── */}
          <div className="rounded-2xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-[var(--accent-primary)]" />
              <h3 className="text-xs font-black uppercase tracking-widest opacity-70" style={{ color: 'var(--text-muted)' }}>
                {t('daily_reflection', L)}
              </h3>
            </div>
            <textarea
              value={todayData?.notes || ''}
              onChange={e => setDayNotes(e.target.value)}
              placeholder={t('reflection_placeholder', L)}
              className="w-full h-20 bg-transparent border-none outline-none resize-none text-sm leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      )}

      {/* ═══ Analytics View ═══ */}
      {activeView === 'analytics' && (
        <div className="space-y-5">

          {/* ── Top KPI cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Target, color: '#10b981', value: weekStats.completed, label: t('prayers', L) + ` / ${weekStats.total}`, bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
              { icon: null, emoji: '🕌', color: '#10b981', value: weekStats.mosque, label: t('in_mosque', L), bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)' },
              { icon: Star, color: '#f59e0b', value: weekStats.perfectDays, label: t('perfect_days', L), bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)' },
              { icon: Activity, color: sdsScore >= 75 ? '#10b981' : sdsScore >= 50 ? '#f59e0b' : '#ef4444', value: sdsScore, label: t('sds_score', L), bg: sdsScore >= 75 ? 'rgba(16,185,129,0.07)' : sdsScore >= 50 ? 'rgba(245,158,11,0.07)' : 'rgba(239,68,68,0.07)', border: sdsScore >= 75 ? 'rgba(16,185,129,0.2)' : sdsScore >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)' },
            ].map((card, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                style={{ background: card.bg, border: `1px solid ${card.border}` }}
              >
                {card.icon ? <card.icon size={22} className="mb-2" style={{ color: card.color }} /> : <span className="text-2xl mb-1">{card.emoji}</span>}
                <div className="text-3xl sm:text-4xl font-black mb-1" style={{ color: card.color }}>{card.value}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-center opacity-60" style={{ color: 'var(--text-muted)' }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* ── Weekly Grid ── */}
          <div className="rounded-2xl p-5 overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>{t('weekly_prayer_grid', L)}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr>
                    <th className="text-left text-[9px] font-bold uppercase tracking-widest pb-3 pr-3 opacity-50" style={{ color: 'var(--text-muted)' }}>{t('prayer', L)}</th>
                    {weekEntries.map((e, i) => {
                      const dayName = getLocalizedDayName(e.date, L, false);
                      const isToday = e.date === new Date().toISOString().split('T')[0];
                      return (
                        <th key={i} className="text-center pb-3 text-[9px] font-bold uppercase tracking-widest" style={{ color: isToday ? 'var(--accent-primary)' : 'var(--text-muted)', opacity: isToday ? 1 : 0.5 }}>
                          {dayName}
                          {isToday && <div className="w-1 h-1 rounded-full mx-auto mt-1" style={{ background: 'var(--accent-primary)' }} />}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {PRAYER_NAMES.map(name => (
                    <tr key={name} className="border-t" style={{ borderColor: 'var(--border-glass)' }}>
                      <td className="py-2.5 pr-3 font-bold whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                        {PRAYER_LABELS[name].emoji} {isAr ? PRAYER_LABELS[name].ar : PRAYER_LABELS[name].en}
                      </td>
                      {weekEntries.map((entry, i) => {
                        const s = entry.prayers[name]?.status || 'none';
                        const conf = STATUS_CONFIG[s];
                        return (
                          <td key={i} className="text-center py-2.5">
                            <span className="text-base leading-none" title={getLocalizedStatusLabel(s, L)} style={{ color: conf.color }}>
                              {conf.icon}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-t" style={{ borderColor: 'var(--border-glass)' }}>
                    <td className="py-2 pr-3 text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--text-muted)' }}>{t('score', L)}</td>
                    {weekEntries.map((entry, i) => {
                      const dayCompleted = PRAYER_NAMES.filter(n => {
                        const s = entry.prayers[n]?.status;
                        return s && s !== 'none' && s !== 'missed';
                      }).length;
                      const pct = Math.round((dayCompleted / 5) * 100);
                      return (
                        <td key={i} className="text-center py-2">
                          <span className="text-[10px] font-black"
                            style={{ color: pct === 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444' }}
                          >{pct}%</span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Per-Prayer Bars ── */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
            <h3 className="text-sm font-black uppercase tracking-widest mb-5" style={{ color: 'var(--accent-primary)' }}>
              {t('per_prayer_completion', L)}
            </h3>
            <div className="space-y-4">
              {PRAYER_NAMES.map(name => {
                const stats = weekStats.perPrayer[name] || { completed: 0, missed: 0, mosque: 0 };
                const pct = weekEntries.length > 0 ? Math.round((stats.completed / weekEntries.length) * 100) : 0;
                const isWeakest = weekStats.weakest === name && stats.missed > 0;
                const barColor = pct === 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        {PRAYER_LABELS[name].emoji} {isAr ? PRAYER_LABELS[name].ar : PRAYER_LABELS[name].en}
                        {isWeakest && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-black"
                            style={{ background: '#ef444418', border: '1px solid #ef444430', color: '#ef4444' }}
                          >
                            ⚠ {t('weakest', L)}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="opacity-50" style={{ color: 'var(--text-muted)' }}>{stats.completed}/{weekEntries.length}</span>
                        <span className="text-sm" title="Mosque">🕌 {stats.mosque}</span>
                        <span className="font-black" style={{ color: barColor }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}aa)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Spiritual Insights ── */}
          <div className="rounded-2xl p-5 overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Eye size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>{t('spiritual_insights', L)}</h3>
            </div>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}
                >
                  <span className="text-lg shrink-0 mt-0.5">{insight.slice(0, 2)}</span>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{localizeInsightText(insight, L).slice(2).trim()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Lifetime Stats ── */}
          {profile && (
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-amber-400" />
                <h3 className="text-sm font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>{t('lifetime_stats', L)}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: profile.totalPrayersLogged.toLocaleString(), label: t('prayers_logged', L), color: 'var(--text-primary)' },
                  { value: profile.lifetimeMosquePrayers.toLocaleString(), label: t('mosque_prayers', L), color: '#10b981' },
                  { value: profile.bestStreak, label: t('best_streak', L), color: '#f97316' },
                  { value: profile.fajrBestStreak, label: t('fajr_best_streak', L), color: '#f59e0b' },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
                    <div className="text-2xl sm:text-3xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ Fajr Discipline Center ═══ */}
      {activeView === 'fajr' && (
        <div className="space-y-5">

          {/* ── Rank Hero Card ── */}
          <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(16,185,129,0.06) 100%)',
              border: '1px solid rgba(245,158,11,0.25)',
              boxShadow: '0 8px 32px rgba(245,158,11,0.08)',
            }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 60%)' }}
            />
            <div className="absolute top-0 right-0 text-[6rem] opacity-[0.04] select-none leading-none pr-4">🌅</div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-4 text-5xl"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', boxShadow: '0 8px 24px rgba(245,158,11,0.12)' }}
              >
                {fajrStats.rank.emoji}
              </div>
              <h2 className="text-3xl font-black text-amber-400 mb-1">{fajrStats.rank.titleAr}</h2>
              <p className="text-sm font-medium opacity-60 mb-5" style={{ color: 'var(--text-muted)' }}>{fajrStats.rank.titleEn}</p>

              {/* Rank progress bubbles */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-5">
                {FAJR_RANKS.map(r => (
                  <div
                    key={r.rank}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-300"
                    style={{
                      background: r.rank <= fajrStats.rank.rank ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${r.rank <= fajrStats.rank.rank ? 'rgba(245,158,11,0.4)' : 'var(--border-glass)'}`,
                      boxShadow: r.rank <= fajrStats.rank.rank ? '0 4px 12px rgba(245,158,11,0.15)' : 'none',
                      opacity: r.rank <= fajrStats.rank.rank ? 1 : 0.35,
                      transform: r.rank === fajrStats.rank.rank ? 'scale(1.12)' : 'scale(1)',
                    }}
                    title={`${r.titleEn}: ${r.min}-${r.max}%`}
                  >
                    {r.emoji}
                  </div>
                ))}
              </div>

              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <span className="text-xs font-bold uppercase tracking-wider opacity-60 text-amber-400">{t('fajr_rate', L)}</span>
                <span className="text-3xl font-black text-amber-300">{fajrStats.rate}%</span>
                <span className="text-xs opacity-40 text-amber-400">({fajrStats.completed}/{fajrStats.total})</span>
              </div>
            </div>
          </div>

          {/* ── Fajr Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { Icon: Flame, color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', value: profile?.fajrCurrentStreak || 0, label: t('current_fajr_streak', L) },
              { Icon: Trophy, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', value: profile?.fajrBestStreak || 0, label: t('best_fajr_streak', L) },
              { emoji: '🕌', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', value: fajrStats.mosque, label: t('fajr_in_mosque', L) },
              { Icon: Target, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', value: `${fajrStats.rate}%`, label: t('completion_rate', L) },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-5 rounded-2xl transition-all hover:scale-[1.02]"
                style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
              >
                {stat.Icon ? <stat.Icon size={22} className="mb-2" style={{ color: stat.color }} /> : <span className="text-2xl mb-1">{stat.emoji}</span>}
                <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider opacity-55 text-center" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ── Weekly Fajr Pattern ── */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Moon size={18} className="text-amber-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-amber-400">{t('fajr_weekly_pattern', L)}</h3>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekEntries.map((entry, i) => {
                const s = entry.prayers.fajr?.status || 'none';
                const conf = STATUS_CONFIG[s];
                const dayName = getLocalizedDayName(entry.date, L, true);
                const isToday = entry.date === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-xl transition-all"
                    style={{
                      background: isToday ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isToday ? 'rgba(245,158,11,0.3)' : 'var(--border-glass)'}`,
                    }}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--text-muted)' }}>{dayName}</span>
                    <span className="text-2xl leading-none">{conf.icon}</span>
                    <span className="text-[8px] font-bold text-center leading-tight" style={{ color: conf.color }}>{getLocalizedStatusLabel(s, L)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Next Rank Progress ── */}
          {fajrStats.rank.rank < 5 && (
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-widest opacity-55" style={{ color: 'var(--text-muted)' }}>
                  {t('next_rank', L)}:
                </span>
                <span className="text-sm font-black text-amber-400">
                  {FAJR_RANKS[fajrStats.rank.rank]?.titleAr} {FAJR_RANKS[fajrStats.rank.rank]?.emoji}
                </span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, ((fajrStats.rate - fajrStats.rank.min) / (FAJR_RANKS[fajrStats.rank.rank]?.min - fajrStats.rank.min || 1)) * 100)}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-amber-400 opacity-60">
                <span>{fajrStats.rate}%</span>
                <span>{t('next_rank', L)}: {FAJR_RANKS[fajrStats.rank.rank]?.min}%</span>
              </div>
            </div>
          )}

          {/* ── Motivational Hadith ── */}
          <div className="relative overflow-hidden rounded-2xl p-6 text-center"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(245,158,11,0.07), transparent 70%)' }}
            />
            <p className="relative z-10 text-lg font-bold leading-relaxed mb-3" style={{ color: 'rgba(251,191,36,0.85)' }}>
              "بشّر المشّائين في الظلم إلى المساجد بالنور التام يوم القيامة"
            </p>
            <p className="relative z-10 text-xs leading-relaxed opacity-50" style={{ color: 'var(--text-muted)' }}>
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
