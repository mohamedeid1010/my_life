import React, { useState, useCallback } from 'react';
import HabitCard from './HabitCard';
import { Plus, ArrowUpDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useHabitStore } from '../../stores/useHabitStore';
import { useAuthStore } from '../../stores/useAuthStore';

// Sortable Habit Card wrapper
function SortableHabitCard({ habit, onLogEntry, onExpandDetails, isSortMode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="relative">
        <HabitCard
          habit={habit}
          onLogEntry={onLogEntry}
          onExpandDetails={onExpandDetails}
        />
        {isSortMode && (
          <div
            {...listeners}
            className="absolute top-2 right-2 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors"
          >
            <ArrowUpDown size={16} className="text-white/60" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function HabitsDashboard({ habits, onLogEntry, onExpandDetails, onOpenCreateModal }) {
  const user = useAuthStore((s) => s.user);
  const { reorderHabits } = useHabitStore();
  const [isSortMode, setIsSortMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = habits.findIndex(h => h.id === active.id);
      const newIndex = habits.findIndex(h => h.id === over.id);

      const reorderedHabits = arrayMove(habits, oldIndex, newIndex);
      const habitIds = reorderedHabits.map(h => h.id);

      if (user?.uid) {
        reorderHabits(user.uid, habitIds);
      }
    }
  }, [habits, user, reorderHabits]);

  // Calculate today's overall progress
  const total = habits.length;
  const completed = habits.filter(h => h.stats.todayEntry?.status === 'completed').length;
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Section: Progress & Create */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between glass-card p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Daily Habits
          </h2>
          <p className="text-xs font-medium text-white/40 mt-0.5">
            Build consistency, one action at a time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Circular Progress */}
          <div className="flex items-center gap-2.5 flex-1 sm:flex-none">
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-white/5" strokeWidth="4" stroke="currentColor" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path
                  className="text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)] transition-all duration-1000"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                {completed}/{total}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white">{progressPercent}%</span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Today</span>
            </div>
          </div>

          <div className="w-px h-8 bg-white/10" />

          {/* Sort Button */}
          <button
            type="button"
            onClick={() => setIsSortMode(!isSortMode)}
            className={`touch-target px-3 py-2.5 border rounded-xl transition-all flex items-center gap-1.5 min-h-[44px] ${
              isSortMode
                ? 'bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-400'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <ArrowUpDown size={15} />
            <span className="text-xs font-bold">Sort</span>
          </button>

          {/* Create Button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="touch-target px-3 py-2.5 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 hover:from-violet-500/30 hover:to-fuchsia-500/30 border border-violet-500/20 rounded-xl transition-all flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus size={15} className="text-violet-400" />
            <span className="text-xs font-bold text-white">New Habit</span>
          </button>
        </div>
      </div>

      {/* Habit List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {habits.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 p-12 glass-card flex flex-col items-center justify-center text-center opacity-70">
            <span className="text-6xl mb-4 grayscale opacity-50">🌱</span>
            <p className="text-lg font-bold text-white/80">Your journey starts here.</p>
            <p className="text-sm text-white/40 mt-2 max-w-sm">
              Create your first habit to begin building unstoppable momentum.
            </p>
          </div>
        ) : isSortMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={habits.map(h => h.id)} strategy={rectSortingStrategy}>
              {habits.map(habit => (
                <SortableHabitCard
                  key={habit.id}
                  habit={habit}
                  onLogEntry={onLogEntry}
                  onExpandDetails={onExpandDetails}
                  isSortMode={isSortMode}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          habits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onLogEntry={onLogEntry}
              onExpandDetails={onExpandDetails}
            />
          ))
        )}
      </div>
    </div>
  );
}


