import React, { useState, useCallback } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
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

const SECTIONS = [
  { key: 'hero', label: 'Streak Counter' },
  { key: 'daily', label: 'Daily Action' },
  { key: 'momentum', label: 'Momentum' },
  { key: 'coach', label: 'AI Coach' },
  { key: 'patterns', label: 'Pattern Insights' },
  { key: 'gamification', label: 'Gamification' },
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
  const [visibility, setVisibility] = useState(loadVisibility);
  const [showSettings, setShowSettings] = useState(false);

  // Modal state for workout logging
  const [logModal, setLogModal] = useState({ open: false, weekIdx: -1, dayIdx: -1, existing: null });

  // Find current week index
  const currentWeekIdx = enrichedData.findIndex(w => w.isCurrentWeek);
  const currentWeek = currentWeekIdx >= 0 ? enrichedData[currentWeekIdx] : null;

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

  const toggleSection = (key) => {
    const updated = { ...visibility, [key]: !visibility[key] };
    setVisibility(updated);
    localStorage.setItem('gym_section_visibility', JSON.stringify(updated));
  };

  const v = visibility;

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
            <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest">Week {currentWeek.week} — Body Stats</h3>
            <p className="text-xs text-white/30 mt-0.5">Log your weight and body fat for this week</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5">
              <span className="text-lg">⚖️</span>
              <div className="flex flex-col">
                <label className="text-[10px] uppercase font-bold text-fuchsia-400">Weight (kg)</label>
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
                <label className="text-[10px] uppercase font-bold text-cyan-400">Body Fat (%)</label>
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
                <span className="text-[10px] text-white/30 uppercase font-bold">Change</span>
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
          Sections
        </button>
      </div>

      {showSettings && (
        <div className="glass-card p-4 flex flex-wrap gap-2 animate-fade-in">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => toggleSection(s.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                v[s.key]
                  ? 'text-violet-300 border-violet-500/30'
                  : 'text-white/25 border-white/5'
              }`}
              style={{
                background: v[s.key] ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${v[s.key] ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}`,
              }}
            >
              {v[s.key] ? <Eye size={12} /> : <EyeOff size={12} />}
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Hero Section */}
      {v.hero && <HeroSection stats={stats} />}

      {/* Row: Daily Action + Momentum + AI Coach */}
      {(v.daily || v.momentum || v.coach) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {v.daily && (
            <DailyActionPanel
              stats={stats}
              onMarkComplete={handleMarkToday}
            />
          )}
          {v.momentum && <MomentumCard stats={stats} />}
          {v.coach && <AICoachCard messages={stats.coachMessages} />}
        </div>
      )}

      {/* Row: Pattern Insights + Gamification */}
      {(v.patterns || v.gamification) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {v.patterns && <PatternInsights insights={stats.patternInsights} />}
          {v.gamification && <GamificationPanel stats={stats} />}
        </div>
      )}

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
