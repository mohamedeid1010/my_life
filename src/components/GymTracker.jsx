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
  { key: 'daily', tKey: 'daily_action' },
  { key: 'hero', tKey: 'streak_counter' },
  { key: 'heatmap', tKey: 'workout_activity' },
  { key: 'quick_entry', tKey: 'body_stats' },
  { key: 'momentum', tKey: 'momentum' },
  { key: 'coach', tKey: 'ai_coach' },
  { key: 'patterns', tKey: 'pattern_insights' },
  { key: 'gamification', tKey: 'gamification' },
  { key: 'workout_progress', tKey: 'workout_progress' },
  { key: 'weight_table', tKey: 'weight_progress' },
];

function loadVisibility() {
  try {
    const saved = localStorage.getItem('gym_section_visibility_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, heatmap: true };
    }
  } catch { /* ignore */ }
  return {
    hero: true,
    quick_entry: true,
    daily: true,
    heatmap: true,
    momentum: true,
    coach: true,
    patterns: false,
    gamification: false,
    workout_progress: false,
    weight_table: false,
  };
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
      const saved = localStorage.getItem('gym_section_order_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all keys are present (migration)
        const missing = SECTIONS_KEYS.filter(s => !parsed.includes(s.key)).map(s => s.key);
        return [...parsed, ...missing];
      }
    } catch { /* ignore */ }
    // User requested default order
    return [
      'hero',         // Streak Counter
      'quick_entry',  // Body Stats
      'daily',        // Daily Action
      'heatmap',      // Workout Activity
      'momentum',
      'coach',
      'patterns',
      'gamification',
      'workout_progress',
      'weight_table'
    ];
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
      localStorage.setItem('gym_section_visibility_v2', JSON.stringify(next));
      return next;
    });
  }, []);

  const moveSection = (idx, dir) => {
    const arr = [...sectionOrder];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSectionOrder(arr);
    localStorage.setItem('gym_section_order_v2', JSON.stringify(arr));
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
      {/* Header with Section Toggles Control */}
      <Header
        targetDays={targetDays}
        setTargetDays={setTargetDays}
        onExport={exportCSV}
        workoutSystem={workoutSystem}
        setWorkoutSystem={setWorkoutSystem}
      >
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 transition-colors min-h-[44px]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Settings size={14} />
          {t('sections', L)}
        </button>
      </Header>

      {showSettings && (
        <div className="glass-card p-4 space-y-2 animate-fade-in relative z-20">
          {sectionOrder.map((key, idx) => {
            const sec = SECTIONS_KEYS.find(s => s.key === key);
            if (!sec) return null;
            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                v[key] ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'
              }`}>
                <span className={`flex-1 text-sm font-bold ${v[key] ? 'text-white/70' : 'text-white/30'}`}>
                  {t(sec.tKey, L)}
                  {key === 'heatmap' && <span className="ml-2 text-[10px] text-violet-400 opacity-60 uppercase font-black tracking-widest">{t('main_locked', L)}</span>}
                </span>
                {key !== 'heatmap' ? (
                  <button onClick={() => toggleSection(key)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    {v[key] ? <Eye size={14} className="text-emerald-400/60" /> : <EyeOff size={14} className="text-white/20" />}
                  </button>
                ) : (
                  <div className="p-1.5 opacity-30 cursor-not-allowed">
                    <Eye size={14} className="text-emerald-400/60" />
                  </div>
                )}
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

          if (key === 'daily') {
            rendered.push(<DailyActionPanel key={key} stats={stats} onMarkComplete={handleMarkToday} />);
            handled.add(key);
          } else if (key === 'hero') {
            rendered.push(<HeroSection key={key} stats={stats} />);
            handled.add(key);
          } else if (key === 'heatmap') {
            rendered.push(
              <HeatmapCalendar
                key={key}
                enrichedData={enrichedData}
                onToggleDay={toggleDay}
                onOpenWorkoutLog={(wIdx, dIdx, existing) => {
                  setLogModal({ open: true, weekIdx: wIdx, dayIdx: dIdx, existing });
                }}
              />
            );
            handled.add(key);
          } else if (key === 'quick_entry') {
            if (currentWeek) {
              rendered.push(
                <div key={key} className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white/50 uppercase tracking-widest">{t('week', L)} {currentWeek.week} — {t('body_stats', L)}</h3>
                    <p className="text-[10px] sm:text-xs text-white/30 mt-0.5">{t('log_weight_fat', L)}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-black/20 px-3 sm:px-4 py-2 rounded-xl border border-white/5 min-w-0">
                      <span className="text-base sm:text-lg shrink-0">⚖️</span>
                      <div className="flex flex-col min-w-0">
                        <label className="text-[10px] uppercase font-bold text-fuchsia-400">{t('weight_kg', L)}</label>
                        <input
                          type="number"
                          min="30"
                          max="300"
                          step="0.1"
                          value={currentWeek.weight || ''}
                          onChange={e => updateWeight(currentWeekIdx, e.target.value)}
                          placeholder="—"
                          className="w-16 sm:w-20 bg-transparent text-white font-black text-base sm:text-lg focus:outline-none placeholder-white/20"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black/20 px-3 sm:px-4 py-2 rounded-xl border border-white/5 min-w-0">
                      <span className="text-base sm:text-lg shrink-0">📊</span>
                      <div className="flex flex-col min-w-0">
                        <label className="text-[10px] uppercase font-bold text-cyan-400">{t('body_fat', L)}</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          step="0.1"
                          value={currentWeek.bodyFat || ''}
                          onChange={e => updateBodyFat(currentWeekIdx, e.target.value)}
                          placeholder="—"
                          className="w-16 sm:w-20 bg-transparent text-white font-black text-base sm:text-lg focus:outline-none placeholder-white/20"
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
              );
            }
            handled.add(key);
          } else if (['momentum', 'coach'].includes(key) && !handled.has('_intel_row')) {
             const rowItems = ['momentum', 'coach'].filter(k => v[k]);
             if (rowItems.length > 0) {
               rendered.push(
                 <div key="_intel_row" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {v.momentum && <MomentumCard stats={stats} />}
                    {v.coach && <AICoachCard messages={stats.coachMessages} />}
                 </div>
               );
             }
             handled.add('_intel_row');
             handled.add('momentum');
             handled.add('coach');
          } else if (['patterns', 'gamification'].includes(key) && !handled.has('_engagement_row')) {
            const rowItems = ['patterns', 'gamification'].filter(k => v[k]);
            if (rowItems.length > 0) {
              rendered.push(
                <div key="_engagement_row" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {v.patterns && <PatternInsights insights={stats.patternInsights} />}
                  {v.gamification && <GamificationPanel stats={stats} />}
                </div>
              );
            }
            handled.add('_engagement_row');
            handled.add('patterns');
            handled.add('gamification');
          } else if (key === 'workout_progress') {
            rendered.push(
              <WorkoutProgressDashboard
                key={key}
                enrichedData={enrichedData}
                workoutSystem={workoutSystem}
              />
            );
            handled.add(key);
          } else if (key === 'weight_table') {
            rendered.push(
              <WeightProgressTable
                key={key}
                enrichedData={enrichedData}
                updateWeight={updateWeight}
                updateBodyFat={updateBodyFat}
              />
            );
            handled.add(key);
          }
        }
        return rendered;
      })()}

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
