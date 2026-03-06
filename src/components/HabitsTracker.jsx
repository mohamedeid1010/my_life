import React, { useState } from 'react';
import { Loader2, Settings, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import usePreferences from '../hooks/usePreferences';
import { t } from '../config/translations';

import HabitsDashboard from "./habits/HabitsDashboard";
import CreateHabitForm from "./habits/CreateHabitForm";
import HabitDetailModal from "./habits/HabitDetailModal";
import HabitsAnalyticsDashboard from "./habits/HabitsAnalyticsDashboard";

const SECTIONS = [
  { key: 'dashboard', labelEn: 'Habits Dashboard', labelAr: 'لوحة العادات', locked: true },
  { key: 'analytics', labelEn: 'Analytics', labelAr: 'التحليلات' },
];

function loadVisibility() {
  try {
    const saved = localStorage.getItem('habits_sections');
    return saved ? JSON.parse(saved) : { dashboard: true, analytics: true };
  } catch { return { dashboard: true, analytics: true }; }
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
      const saved = localStorage.getItem('habits_order');
      return saved ? JSON.parse(saved) : ['dashboard', 'analytics'];
    } catch { return ['dashboard', 'analytics']; }
  });

  const v = visibility;
  const toggleSection = (key) => {
    const sec = SECTIONS.find(s => s.key === key);
    if (sec?.locked) return;
    const next = { ...v, [key]: !v[key] };
    setVisibility(next);
    localStorage.setItem('habits_sections', JSON.stringify(next));
  };

  const moveSection = (idx, dir) => {
    const arr = [...sectionOrder];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setSectionOrder(arr);
    localStorage.setItem('habits_order', JSON.stringify(arr));
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
      case 'analytics':
        return <HabitsAnalyticsDashboard analytics={analytics} habits={activeHabits} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in relative z-0">

      {/* Section Manager Toggle */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowSectionManager(!showSectionManager)}
          className="touch-target flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 transition-all min-h-[44px]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Settings size={14} />
          {isAr ? 'الأقسام' : 'Sections'}
        </button>
      </div>

      {/* Section Manager Panel */}
      {showSectionManager && (
        <div className="glass-card p-4 space-y-2 animate-fade-in">
          {sectionOrder.map((key, idx) => {
            const sec = SECTIONS.find(s => s.key === key);
            if (!sec) return null;
            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                v[key] ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'
              }`}>
                <span className={`flex-1 text-xs sm:text-sm font-bold min-w-0 truncate ${v[key] ? 'text-white/70' : 'text-white/30'}`}>
                  {isAr ? sec.labelAr : sec.labelEn}
                </span>
                {!sec.locked && (
                  <button type="button" onClick={() => toggleSection(key)} className="touch-target p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                    {v[key] ? <Eye size={14} className="text-emerald-400/60" /> : <EyeOff size={14} className="text-white/20" />}
                  </button>
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
