import React, { useState, useEffect } from 'react';
import { Activity, Plus, X, ChevronUp, ChevronDown, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import usePreferences from '../hooks/usePreferences';

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
    <div className="space-y-6 animate-fade-in">

      {/* Welcome Card */}
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center space-y-3">
        <Activity size={40} className="text-violet-400" />
        <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
          {isAr ? 'مرحباً بك' : 'Welcome'}
        </h2>
        <p className="text-white/40 text-sm max-w-md">
          {isAr ? 'أضف الأقسام التي تريدها من الأسفل لتخصيص صفحتك الرئيسية' : 'Add widgets below to customize your home page'}
        </p>
      </div>

      {/* Widget Manager Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white/50 uppercase tracking-widest">
          {isAr ? 'الأقسام' : 'Widgets'} ({widgets.filter(w => w.visible).length})
        </span>
        <button
          onClick={() => setShowManager(!showManager)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <LayoutGrid size={14} />
          {isAr ? 'تعديل' : 'Manage'}
        </button>
      </div>

      {/* Widget Manager Panel */}
      {showManager && (
        <div className="glass-card p-5 space-y-4 animate-fade-in">
          {/* Existing widgets */}
          {widgets.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{isAr ? 'الأقسام الحالية' : 'Current Widgets'}</label>
              {widgets.map((w, idx) => {
                const meta = WIDGET_CATALOG[w.id];
                return (
                  <div key={w.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    w.visible ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}>
                    <span className={`flex-1 text-sm font-bold ${w.visible ? 'text-white/70' : 'text-white/30'}`}>
                      {isAr ? meta?.labelAr : meta?.label}
                    </span>
                    <button onClick={() => toggleWidget(idx)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                      {w.visible ? <Eye size={14} className="text-emerald-400/60" /> : <EyeOff size={14} className="text-white/20" />}
                    </button>
                    <button onClick={() => removeWidget(idx)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                      <X size={14} className="text-red-400/40" />
                    </button>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveWidget(idx, -1)} disabled={idx === 0} className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20">
                        <ChevronUp size={12} className="text-white/40" />
                      </button>
                      <button onClick={() => moveWidget(idx, 1)} disabled={idx === widgets.length - 1} className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20">
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
              <label className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{isAr ? 'إضافة قسم' : 'Add Widget'}</label>
              {availableToAdd.map(([id, meta]) => (
                <button
                  key={id}
                  onClick={() => addWidget(id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-left"
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
        <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <Plus size={28} className="text-violet-400" />
          </div>
          <p className="text-white/30 text-sm">
            {isAr ? 'اضغط على "تعديل" لإضافة أقسام' : 'Click "Manage" to add widgets'}
          </p>
        </div>
      )}
    </div>
  );
}
