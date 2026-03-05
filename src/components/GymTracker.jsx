import React, { useState, useCallback } from 'react';
import { Settings, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import usePreferences from '../hooks/usePreferences';
import { t } from '../config/translations';
import Header from './Header';
import HeroSection from './HeroSection';
import DailyActionPanel from './DailyActionPanel';
import MomentumCard from './MomentumCard';
import AICoachCard from './AICoachCard';
import PatternInsights from './PatternInsights';
import GamificationPanel from './GamificationPanel';
import HeatmapCalendar from './HeatmapCalendar';
import WorkoutLogModal from './WorkoutLogModal';
import WorkoutProgressDashboard from './WorkoutProgressDashboard';
import WeightProgressTable from './WeightProgressTable';

const SECTIONS_KEYS = [
  { key: 'hero', tKey: 'streak_counter' },
  { key: 'daily', tKey: 'daily_action' },
  { key: 'momentum', tKey: 'momentum' },
  { key: 'coach', tKey: 'ai_coach' },
  { key: 'patterns', tKey: 'pattern_insights' },
  { key: 'gamification', tKey: 'gamification' },
];

function loadVisibility() {
  try {
    const saved = localStorage.getItem('gym_section_visibility');
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore error and fall back to defaults
  }
  return { hero: true, daily: true, momentum: true, coach: true, patterns: true, gamification: true };
}

export default function GymTracker({
  targetDays,
  setTargetDays,
  workoutSystem,
  setWorkoutSystem,
  exportCSV,
  stats,
  enrichedData,
  toggleDay,
  updateWeight,
  updateBodyFat,
  updateSession,
  deleteSession,
}) {
  const { language } = usePreferences();
  const L = language;
  const [visibility, setVisibility] = useState(loadVisibility);
  const [showSettings, setShowSettings] = useState(false);
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('gym_section_order');
      return saved ? JSON.parse(saved) : SECTIONS_KEYS.map(s => s.key);
    } catch { return SECTIONS_KEYS.map(s => s.key); }
  });

  // Modal state for workout logging
  const [logModal, setLogModal] = useState({ open: false, weekIdx: -1, dayIdx: -1, existing: null });

  // Find current week index
  const currentWeekIdx = enrichedData.findIndex(w => w.isCurrentWeek);
  const currentWeek = currentWeekIdx >= 0 ? enrichedData[currentWeekIdx] : null;

  const v = visibility;
  const toggleSection = useCallback((key) => {
    setVisibility(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('gym_section_visibility', JSON.stringify(next));
      return next;
    });
  }, []);

  const moveSection = (idx, dir) => {
    const arr = [...sectionOrder];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSectionOrder(arr);
    localStorage.setItem('gym_section_order', JSON.stringify(arr));
  };

  // Open modal when marking today — instead of just toggling
  const handleMarkToday = useCallback(() => {
    if (stats.todayWeekIdx >= 0 && stats.todayDayIdx >= 0) {
      const existing = enrichedData[stats.todayWeekIdx]?.sessions?.[stats.todayDayIdx] || null;
      if (stats.todayCompleted && !existing) {
        // Un-completing if already done and no session logged
        toggleDay(stats.todayWeekIdx, stats.todayDayIdx);
      } else if (stats.todayCompleted && existing) {
        // Already done, open to edit session
        setLogModal({ open: true, weekIdx: stats.todayWeekIdx, dayIdx: stats.todayDayIdx, existing });
      } else {
        // Not done yet: open log modal
        setLogModal({ open: true, weekIdx: stats.todayWeekIdx, dayIdx: stats.todayDayIdx, existing: null });
      }
    }
  }, [stats.todayWeekIdx, stats.todayDayIdx, stats.todayCompleted, enrichedData, toggleDay]);

  const handleSaveSession = useCallback((sessionData) => {
    if (logModal.weekIdx >= 0 && logModal.dayIdx >= 0) {
      updateSession(logModal.weekIdx, logModal.dayIdx, sessionData);
    }
  }, [logModal.weekIdx, logModal.dayIdx, updateSession]);

  const handleDeleteSession = useCallback(() => {
    if (logModal.weekIdx >= 0 && logModal.dayIdx >= 0) {
      deleteSession(logModal.weekIdx, logModal.dayIdx);
      setLogModal({ open: false, weekIdx: -1, dayIdx: -1, existing: null });
    }
  }, [logModal.weekIdx, logModal.dayIdx, deleteSession]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header
        targetDays={targetDays}
        setTargetDays={setTargetDays}
        onExport={exportCSV}
        workoutSystem={workoutSystem}
        setWorkoutSystem={setWorkoutSystem}
      />

      {/* Current Week Weight & Body Fat Quick Entry */}
      {currentWeek && (
        <div className="glass-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">{t('week', L)} {currentWeek.week} — {t('body_stats', L)}</h3>
            <p className="text-xs text-white/30 mt-0.5">{t('log_weight_fat', L)}</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
              <span className="text-lg">⚖️</span>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-fuchsia-400">{t('weight_kg', L)}</label>
                <input
                  type="number"
                  min="30" max="300" step="0.1"
                  value={currentWeek.weight || ''}
                  onChange={e => updateWeight(currentWeekIdx, e.target.value)}
                  placeholder="—"
                  className="w-20 bg-transparent text-white font-black text-lg focus:outline-none placeholder-white/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
              <span className="text-lg">📊</span>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-cyan-400">{t('body_fat', L)}</label>
                <input
                  type="number"
                  min="1" max="60" step="0.1"
                  value={currentWeek.bodyFat || ''}
                  onChange={e => updateBodyFat(currentWeekIdx, e.target.value)}
                  placeholder="—"
                  className="w-20 bg-transparent text-white font-black text-lg focus:outline-none placeholder-white/20"
                />
              </div>
            </div>
            {stats.latestWeight && stats.latestWeight !== '-' && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/30 uppercase font-bold">{t('change', L)}</span>
                <span className={`font-black text-base ${parseFloat(stats.weightDiff) < 0 ? 'text-emerald-400' : parseFloat(stats.weightDiff) > 0 ? 'text-red-400' : 'text-white/50'}`}>
                  {parseFloat(stats.weightDiff) > 0 ? '+' : ''}{stats.weightDiff} kg
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section toggles Control (User bar in App handles the main toggle button now, but we can keep local settings or move them. For now let's keep it here if they click Settings) */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Settings size={14} />
          {t('sections', L)}
        </button>
      </div>

      {showSettings && (
        <div className="glass-card p-4 space-y-2 animate-fade-in">
          {sectionOrder.map((key, idx) => {
            const sec = SECTIONS_KEYS.find(s => s.key === key);
            if (!sec) return null;
            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                v[key] ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'
              }`}>
                <span className={`flex-1 text-sm font-bold ${v[key] ? 'text-white/70' : 'text-white/30'}`}>
                  {t(sec.tKey, L)}
                </span>
                <button onClick={() => toggleSection(key)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  {v[key] ? <Eye size={14} className="text-emerald-400/60" /> : <EyeOff size={14} className="text-white/20" />}
                </button>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20">
                    <ChevronUp size={12} className="text-white/40" />
                  </button>
                  <button onClick={() => moveSection(idx, 1)} disabled={idx === sectionOrder.length - 1} className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20">
                    <ChevronDown size={12} className="text-white/40" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamically rendered sections based on order */}
      {(() => {
        const rendered = [];
        const handled = new Set();

        for (const key of sectionOrder) {
          if (handled.has(key) || !v[key]) continue;

          if (key === 'hero') {
            rendered.push(<HeroSection key={key} stats={stats} />);
            handled.add(key);
          }
          // Group daily + momentum + coach into a 3-col grid
          else if (['daily', 'momentum', 'coach'].includes(key) && !handled.has('_row1')) {
            const row1Items = ['daily', 'momentum', 'coach'].filter(k => v[k]);
            if (row1Items.length > 0) {
              rendered.push(
                <div key="_row1" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {v.daily && <DailyActionPanel stats={stats} onMarkComplete={handleMarkToday} />}
                  {v.momentum && <MomentumCard stats={stats} />}
                  {v.coach && <AICoachCard messages={stats.coachMessages} />}
                </div>
              );
            }
            handled.add('_row1');
            handled.add('daily');
            handled.add('momentum');
            handled.add('coach');
          }
          // Group patterns + gamification into a 2-col grid
          else if (['patterns', 'gamification'].includes(key) && !handled.has('_row2')) {
            const row2Items = ['patterns', 'gamification'].filter(k => v[k]);
            if (row2Items.length > 0) {
              rendered.push(
                <div key="_row2" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {v.patterns && <PatternInsights insights={stats.patternInsights} />}
                  {v.gamification && <GamificationPanel stats={stats} />}
                </div>
              );
            }
            handled.add('_row2');
            handled.add('patterns');
            handled.add('gamification');
          }
        }
        return rendered;
      })()}

      {/* Heatmap Calendar — Always visible */}
      <HeatmapCalendar
        enrichedData={enrichedData}
        onToggleDay={toggleDay}
        onOpenWorkoutLog={(wIdx, dIdx, existing) => {
          setLogModal({ open: true, weekIdx: wIdx, dayIdx: dIdx, existing });
        }}
      />

      {/* Workout Progress Dashboard */}
      <WorkoutProgressDashboard
        enrichedData={enrichedData}
        workoutSystem={workoutSystem}
      />

      {/* Weight & Body Fat Progress Table */}
      <WeightProgressTable
        enrichedData={enrichedData}
        updateWeight={updateWeight}
        updateBodyFat={updateBodyFat}
      />

      {/* Workout Log Modal — key forces remount for fresh state */}
      {logModal.open && (
        <WorkoutLogModal
          key={`${logModal.weekIdx}-${logModal.dayIdx}`}
          isOpen={logModal.open}
          onClose={() => setLogModal({ open: false, weekIdx: -1, dayIdx: -1, existing: null })}
          onSave={handleSaveSession}
          onDelete={logModal.existing ? handleDeleteSession : null}
          workoutSystem={workoutSystem}
          existingSession={logModal.existing}
        />
      )}
    </div>
  );
}
