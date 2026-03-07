import React, { useState } from 'react';
import { Loader2, Settings, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import usePreferences from '../hooks/usePreferences';
import { t } from '../config/translations';

import HabitsDashboard from "./habits/HabitsDashboard";
import CreateHabitForm from "./habits/CreateHabitForm";
import HabitDetailModal from "./habits/HabitDetailModal";
import HabitsAnalyticsDashboard from "./habits/HabitsAnalyticsDashboard";
import WeeklyHabitsTracker from "./habits/WeeklyHabitsTracker";
import UnifiedHabitsGrid from "./habits/UnifiedHabitsGrid";
import MonthlyHabitsTable from "./habits/MonthlyHabitsTable";

const SECTIONS = [
  { key: 'dashboard', labelEn: 'Habits Dashboard', labelAr: 'لوحة العادات', locked: true },
  { key: 'weekly_view', labelEn: "This Week's Tracker", labelAr: 'متتبع الأسبوع' },
  { key: 'unified_grid', labelEn: 'Monthly Overview', labelAr: 'نظرة عامة شهرية' },
  { key: 'monthly_view', labelEn: 'Full History', labelAr: 'السجل الكامل' },
  { key: 'analytics', labelEn: 'Analytics', labelAr: 'التحليلات' },
];

function loadVisibility() {
  try {
    const saved = localStorage.getItem('habits_sections_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure new sections are visible by default
      return {
        dashboard: true,
        weekly_view: false,
        unified_grid: false,
        monthly_view: false,
        analytics: false,
        ...parsed,
      };
    }
  } catch { /* ignore */ }
  // Only show the main dashboard by default for a simpler experience
  return { dashboard: true, weekly_view: false, unified_grid: false, monthly_view: false, analytics: false };
}

export default function HabitsTracker({ habitsData }) {
  const { language } = usePreferences();
  const L = language;
  const isAr = L === 'ar';
  const {
    activeHabits, analytics, addHabit, updateHabit, deleteHabit, logHabitEntry, loaded,
  } = habitsData;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [visibility, setVisibility] = useState(loadVisibility);
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('habits_order_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration: Ensure all keys are present
        const missing = SECTIONS.filter(s => !parsed.includes(s.key)).map(s => s.key);
        return [...parsed, ...missing];
      }
    } catch { /* ignore */ }
    return SECTIONS.map(s => s.key);
  });

  const v = visibility;
  const toggleSection = (key) => {
    const sec = SECTIONS.find(s => s.key === key);
    if (sec?.locked) return;
    const next = { ...v, [key]: !v[key] };
    setVisibility(next);
    localStorage.setItem('habits_sections_v2', JSON.stringify(next));
  };

  const moveSection = (idx, dir) => {
    const arr = [...sectionOrder];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSectionOrder(arr);
    localStorage.setItem('habits_order_v2', JSON.stringify(arr));
  };

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
        <Loader2 size={40} className="text-violet-400 animate-spin" />
        <p className="text-sm text-white/30 font-semibold">{t('loading_habits', L)}</p>
      </div>
    );
  }

  const renderSection = (key) => {
    if (!v[key]) return null;
    switch (key) {
      case 'dashboard':
        return (
          <HabitsDashboard
            habits={activeHabits}
            onLogEntry={logHabitEntry}
            onExpandDetails={(habit) => setSelectedHabit(habit)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        );
      case 'weekly_view':
        return <WeeklyHabitsTracker habits={activeHabits} onLogEntry={logHabitEntry} onExpandDetails={(habit) => setSelectedHabit(habit)} />;
      case 'unified_grid':
        return <UnifiedHabitsGrid habits={activeHabits} onLogEntry={logHabitEntry} onExpandDetails={(habit) => setSelectedHabit(habit)} />;
      case 'monthly_view':
        return <MonthlyHabitsTable habits={activeHabits} onExpandDetails={(habit) => setSelectedHabit(habit)} />;
      case 'analytics':
        return <HabitsAnalyticsDashboard analytics={analytics} habits={activeHabits} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in relative">
      {/* Section Manager Toggle */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowSectionManager(!showSectionManager)}
          className="touch-target flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 transition-all min-h-[44px]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Settings size={14} />
          {isAr ? 'الأقسام' : 'Sections'}
        </button>
      </div>

      {/* Section Manager Panel */}
      {showSectionManager && (
        <div className="glass-card p-4 space-y-2 animate-fade-in relative z-10">
          {sectionOrder.map((key, idx) => {
            const sec = SECTIONS.find(s => s.key === key);
            if (!sec) return null;
            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                v[key] ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'
              }`}>
                <span className={`flex-1 text-xs sm:text-sm font-bold min-w-0 truncate ${v[key] ? 'text-white/70' : 'text-white/30'}`}>
                  {isAr ? sec.labelAr : sec.labelEn}
                  {sec.locked && <span className="ml-2 text-[10px] text-violet-400 opacity-60 uppercase font-black tracking-widest">{t('main_locked', L)}</span>}
                </span>
                {!sec.locked ? (
                  <button type="button" onClick={() => toggleSection(key)} className="touch-target p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                    {v[key] ? <Eye size={14} className="text-emerald-400/60" /> : <EyeOff size={14} className="text-white/20" />}
                  </button>
                ) : (
                  <div className="p-2 opacity-30 cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <Eye size={14} className="text-emerald-400/60" />
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="touch-target p-2 rounded hover:bg-white/10 disabled:opacity-20 min-h-[36px] flex items-center justify-center">
                    <ChevronUp size={12} className="text-white/40" />
                  </button>
                  <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === sectionOrder.length - 1} className="touch-target p-2 rounded hover:bg-white/10 disabled:opacity-20 min-h-[36px] flex items-center justify-center">
                    <ChevronDown size={12} className="text-white/40" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rendered Sections */}
      {sectionOrder.map(key => (
        <React.Fragment key={key}>{renderSection(key)}</React.Fragment>
      ))}

      {isCreateModalOpen && (
        <CreateHabitForm
          onClose={() => setIsCreateModalOpen(false)}
          onSave={addHabit}
        />
      )}

      {selectedHabit && (
        <HabitDetailModal
          habit={selectedHabit}
          onClose={() => setSelectedHabit(null)}
          onUpdateHabit={updateHabit}
          onDeleteHabit={(id) => {
            deleteHabit(id);
            setSelectedHabit(null);
          }}
          onLogEntry={logHabitEntry}
        />
      )}
    </div>
  );
}
