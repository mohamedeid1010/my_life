import React, { useState, useEffect } from 'react';
import { Activity, Plus, X, ChevronUp, ChevronDown, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import usePreferences from '../hooks/usePreferences';
import { t } from '../config/translations';

// Gym widgets
import HeatmapCalendar from './HeatmapCalendar';
import WeightProgressTable from './WeightProgressTable';
import WorkoutProgressDashboard from './WorkoutProgressDashboard';
import HeroSection from './HeroSection';

// Habits widgets
import HabitsDashboard from './habits/HabitsDashboard';
import HabitsAnalyticsDashboard from './habits/HabitsAnalyticsDashboard';

const WIDGET_CATALOG = {
  gym_hero: { label: '🔥 Streak Counter', labelAr: '🔥 عداد السلسلة', type: 'gym' },
  gym_heatmap: { label: '📅 Workout Heatmap', labelAr: '📅 خريطة التمارين', type: 'gym' },
  gym_progress: { label: '⚖️ Weight Progress', labelAr: '⚖️ تقدم الوزن', type: 'gym' },
  habits_dashboard: { label: '✅ Habits Dashboard', labelAr: '✅ لوحة العادات', type: 'habits' },
  habits_analytics: { label: '📊 Habits Analytics', labelAr: '📊 تحليلات العادات', type: 'habits' },
};

const STORAGE_KEY = 'horizon_home_widgets';

function loadHomeWidgets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

export default function LifeOverview({ habitsData, gymData }) {
  const { language } = usePreferences();
  const L = language;
  const isAr = L === 'ar';

  const [widgets, setWidgets] = useState(loadHomeWidgets);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const addWidget = (id) => {
    if (widgets.some(w => w.id === id)) return;
    setWidgets([...widgets, { id, visible: true }]);
  };

  const removeWidget = (idx) => {
    setWidgets(widgets.filter((_, i) => i !== idx));
  };

  const moveWidget = (idx, dir) => {
    const arr = [...widgets];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setWidgets(arr);
  };

  const toggleWidget = (idx) => {
    const arr = [...widgets];
    arr[idx] = { ...arr[idx], visible: !arr[idx].visible };
    setWidgets(arr);
  };

  const availableToAdd = Object.entries(WIDGET_CATALOG).filter(([id]) => !widgets.some(w => w.id === id));

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'gym_hero':
        return gymData?.stats ? <HeroSection stats={gymData.stats} /> : null;
      case 'gym_heatmap':
        return gymData?.enrichedData ? (
          <HeatmapCalendar enrichedData={gymData.enrichedData} onToggleDay={() => {}} onOpenWorkoutLog={() => {}} />
        ) : null;
      case 'gym_progress':
        return gymData?.enrichedData ? (
          <WeightProgressTable enrichedData={gymData.enrichedData} updateWeight={gymData.updateWeight} updateBodyFat={gymData.updateBodyFat} />
        ) : null;
      case 'habits_dashboard':
        return habitsData?.activeHabits ? (
          <HabitsDashboard habits={habitsData.activeHabits} onLogEntry={habitsData.logHabitEntry} onExpandDetails={() => {}} onOpenCreateModal={() => {}} />
        ) : null;
      case 'habits_analytics':
        return habitsData?.analytics ? (
          <HabitsAnalyticsDashboard analytics={habitsData.analytics} habits={habitsData.activeHabits} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">

      {/* Welcome Card */}
      <div className="glass-card p-5 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3">
        <Activity size={32} className="text-violet-400 sm:w-10 sm:h-10" />
        <h2 className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
          {t('home_welcome_title', L)}
        </h2>
        <p className="text-white/40 text-xs sm:text-sm max-w-md px-1">
          {t('home_welcome_desc', L)}
        </p>
      </div>

      {/* Widget Manager Toggle */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-bold text-white/50 uppercase tracking-widest truncate">
          {t('home_widgets_label', L)} ({widgets.filter(w => w.visible).length})
        </span>
        <button
          type="button"
          onClick={() => setShowManager(!showManager)}
          className="touch-target flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 transition-all min-h-[44px]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <LayoutGrid size={14} />
          {t('home_manage', L)}
        </button>
      </div>

      {/* Widget Manager Panel */}
      {showManager && (
        <div className="glass-card p-4 sm:p-5 space-y-4 animate-fade-in">
          {/* Existing widgets */}
          {widgets.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{t('home_current_widgets', L)}</label>
              {widgets.map((w, idx) => {
                const meta = WIDGET_CATALOG[w.id];
                return (
                  <div key={w.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    w.visible ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}>
                    <span className={`flex-1 text-sm font-bold ${w.visible ? 'text-white/70' : 'text-white/30'}`}>
                      {isAr ? meta?.labelAr : meta?.label}
                    </span>
                    <button type="button" onClick={() => toggleWidget(idx)} className="touch-target p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                      {w.visible ? <Eye size={14} className="text-emerald-400/60" /> : <EyeOff size={14} className="text-white/20" />}
                    </button>
                    <button type="button" onClick={() => removeWidget(idx)} className="touch-target p-2 rounded-lg hover:bg-red-500/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <X size={14} className="text-red-400/40" />
                    </button>
                    <div className="flex flex-col gap-0.5">
                      <button type="button" onClick={() => moveWidget(idx, -1)} disabled={idx === 0} className="touch-target p-2 rounded hover:bg-white/10 disabled:opacity-20 min-h-[36px] flex items-center justify-center">
                        <ChevronUp size={12} className="text-white/40" />
                      </button>
                      <button type="button" onClick={() => moveWidget(idx, 1)} disabled={idx === widgets.length - 1} className="touch-target p-2 rounded hover:bg-white/10 disabled:opacity-20 min-h-[36px] flex items-center justify-center">
                        <ChevronDown size={12} className="text-white/40" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add new widgets */}
          {availableToAdd.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{t('home_add_widget', L)}</label>
              {availableToAdd.map(([id, meta]) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => addWidget(id)}
                  className="touch-target w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-left min-h-[48px]"
                >
                  <Plus size={14} className="text-violet-400/60" />
                  <span className="text-sm font-semibold text-white/40">{isAr ? meta.labelAr : meta.label}</span>
                  <span className="ml-auto text-[10px] uppercase font-bold text-white/20 tracking-wider">{meta.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rendered Widgets */}
      {widgets.filter(w => w.visible).map(w => {
        const rendered = renderWidget(w.id);
        if (!rendered) return null;
        return <div key={w.id}>{rendered}</div>;
      })}

      {/* Empty state */}
      {widgets.filter(w => w.visible).length === 0 && !showManager && (
        <div className="glass-card p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <Plus size={24} className="text-violet-400 sm:w-7 sm:h-7" />
          </div>
          <p className="text-white/30 text-xs sm:text-sm px-2">
            {t('home_empty_widgets_hint', L)}
          </p>
        </div>
      )}
    </div>
  );
}
