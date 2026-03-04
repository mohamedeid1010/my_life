import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import useHabitsData from '../hooks/useHabitsData';

import HabitsDashboard from './habits/HabitsDashboard';
import CreateHabitForm from './habits/CreateHabitForm';
import HabitDetailModal from './habits/HabitDetailModal';
import HabitsAnalyticsDashboard from './habits/HabitsAnalyticsDashboard';

export default function HabitsTracker() {
  const {
    activeHabits,
    analytics,
    addHabit,
    updateHabit,
    deleteHabit,
    logHabitEntry,
    loaded
  } = useHabitsData();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
        <Loader2 size={40} className="text-violet-400 animate-spin" />
        <p className="text-sm text-white/30 font-semibold">Loading Smart Habits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative z-0">
      <HabitsDashboard 
        habits={activeHabits}
        onLogEntry={logHabitEntry}
        onExpandDetails={(habit) => setSelectedHabit(habit)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      <HabitsAnalyticsDashboard analytics={analytics} habits={activeHabits} />

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
