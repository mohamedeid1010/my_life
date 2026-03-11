import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity, BarChart3, TrendingUp, TrendingDown, AlertTriangle, Trophy,
  Calendar, Moon, Sun, ChevronRight, Flame, Star, Target, Eye,
} from 'lucide-react';
import { useSalahStore } from '../stores/useSalahStore';
import { useAuthStore } from '../stores/useAuthStore';
import {
  PRAYER_NAMES, PRAYER_LABELS, STATUS_CONFIG, PRAYER_POINTS, FAJR_RANKS,
} from '../types/salah.types';
import PrayerCard from './salah/PrayerCard';
import QadaPanel from './salah/QadaPanel';

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
          <div className="text-[var(--text-muted)] font-medium">Loading Prayer Tracker...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 animate-fade-in">

      {/* ═══ Header ═══ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[var(--border-glass)] pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold gradient-text tracking-tight mb-1">
            🕌 Salah Tracker
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-medium italic">
            "إن الصلاة كانت على المؤمنين كتاباً موقوتاً"
          </p>
        </div>

        {/* View switcher */}
        <div className="glass-card p-1 flex gap-1 rounded-xl">
          {[
            { id: 'today', label: 'Today', icon: Sun },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'fajr', label: 'Fajr', icon: Moon },
            { id: 'qada', label: 'Qada ', icon: null },
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
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">streak</span>
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
              />
            ))}
          </div>

          {/* Daily Reflection */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
              <Eye size={16} className="text-[var(--accent-primary)]" /> Daily Reflection
            </h3>
            <textarea
              value={todayData?.notes || ''}
              onChange={e => setDayNotes(e.target.value)}
              placeholder="How was your spiritual day? Any du'a or reflection..."
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Prayers / {weekStats.total}</div>
            </div>
            <div className="glass-card p-5 text-center">
              <span className="text-2xl block mb-1">🕌</span>
              <div className="text-3xl font-black text-[var(--text-primary)]">{weekStats.mosque}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">In Mosque</div>
            </div>
            <div className="glass-card p-5 text-center">
              <Star size={24} className="mx-auto mb-2 text-amber-400" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{weekStats.perfectDays}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Perfect Days</div>
            </div>
            <div className="glass-card p-5 text-center border-2 transition-colors"
              style={{
                borderColor: sdsScore >= 75 ? '#10b98150' : sdsScore >= 50 ? '#f59e0b50' : '#ef444450',
              }}
            >
              <Activity size={24} className="mx-auto mb-2 text-[var(--accent-primary)]" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{sdsScore}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">SDS Score</div>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold uppercase tracking-wide text-[var(--accent-primary)] mb-4 flex items-center gap-2">
              <Calendar size={20} /> Weekly Prayer Grid
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] pb-3 pr-3">Prayer</th>
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
                        {PRAYER_LABELS[name].emoji} {PRAYER_LABELS[name].en}
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
                    <td className="py-2 pr-3 font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Score</td>
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
              Per-Prayer Completion
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
                        {PRAYER_LABELS[name].emoji} {PRAYER_LABELS[name].en}
                        {isWeakest && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">⚠ Weakest</span>}
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
              <Eye size={20} /> Spiritual Insights
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
                <Trophy size={20} className="text-amber-400" /> Lifetime Stats
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-black/10 border border-[var(--border-glass)]">
                  <div className="text-2xl font-black text-[var(--text-primary)]">{profile.totalPrayersLogged.toLocaleString()}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Prayers Logged</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-black/10 border border-[var(--border-glass)]">
                  <div className="text-2xl font-black text-emerald-400">{profile.lifetimeMosquePrayers.toLocaleString()}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Mosque Prayers</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-black/10 border border-[var(--border-glass)]">
                  <div className="text-2xl font-black text-orange-400">{profile.bestStreak}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Best Streak</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-black/10 border border-[var(--border-glass)]">
                  <div className="text-2xl font-black text-amber-400">{profile.fajrBestStreak}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Fajr Best Streak</div>
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
                Fajr Rate: <span className="font-black text-amber-400 text-xl">{fajrStats.rate}%</span>
                <span className="ml-2 opacity-60">({fajrStats.completed}/{fajrStats.total} days)</span>
              </div>
            </div>
          </div>

          {/* Fajr Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 text-center">
              <Flame size={24} className="mx-auto mb-2 text-orange-400" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{profile?.fajrCurrentStreak || 0}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Current Fajr Streak</div>
            </div>
            <div className="glass-card p-5 text-center">
              <Trophy size={24} className="mx-auto mb-2 text-amber-400" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{profile?.fajrBestStreak || 0}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Best Fajr Streak</div>
            </div>
            <div className="glass-card p-5 text-center">
              <span className="text-2xl block mb-1">🕌</span>
              <div className="text-3xl font-black text-emerald-400">{fajrStats.mosque}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Fajr in Mosque</div>
            </div>
            <div className="glass-card p-5 text-center">
              <Target size={24} className="mx-auto mb-2 text-[var(--accent-primary)]" />
              <div className="text-3xl font-black text-[var(--text-primary)]">{fajrStats.rate}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Completion Rate</div>
            </div>
          </div>

          {/* Fajr Weekly Pattern */}
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold uppercase tracking-wide text-amber-400 mb-4 flex items-center gap-2">
              <Moon size={20} /> Fajr Weekly Pattern
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
                Next Rank: {FAJR_RANKS[fajrStats.rank.rank]?.titleAr} {FAJR_RANKS[fajrStats.rank.rank]?.emoji}
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
