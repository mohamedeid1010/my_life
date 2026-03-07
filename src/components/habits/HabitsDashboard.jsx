import React, { useState } from 'react';
import HabitCard from './HabitCard';
import { Plus, GripVertical } from 'lucide-react';
import usePreferences from '../../hooks/usePreferences';
import { t } from '../../config/translations';
import { useHabitStore } from '../../stores/useHabitStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Wrapper for individual sortable item
function SortableHabitCard(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
    scale: isDragging ? 1.05 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative touch-none">
      <HabitCard 
        habit={props.habit}
        onLogEntry={props.onLogEntry}
        onExpandDetails={props.onExpandDetails}
        dragHandleProps={{...attributes, ...listeners}}
        isReorderMode={props.isReorderMode}
      />
    </div>
  );
}

export default function HabitsDashboard({ habits, onLogEntry, onExpandDetails, onOpenCreateModal }) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const { language } = usePreferences();
  const L = language;
  const reorderHabits = useHabitStore((s) => s.reorderHabits);
  const userStr = localStorage.getItem('herizon_auth');
  const user = userStr ? JSON.parse(userStr) : null;
  // Calculate today's overall progress
  const total = habits.length;
  const completed = habits.filter(h => h.stats.todayEntry?.status === 'completed').length;
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Setup DnD Sensors (supports mouse, touch, keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag (prevents accidental drags on click)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0, // Instant drag on touch devices
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id && user?.uid) {
      const oldIndex = habits.findIndex((h) => h.id === active.id);
      const newIndex = habits.findIndex((h) => h.id === over.id);
      const newOrder = arrayMove(habits, oldIndex, newIndex);
      reorderHabits(user.uid, newOrder.map(h => h.id));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Section: Progress & Create */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4 sm:p-6">
        <div className="min-w-0 w-full md:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
            {t('habits_daily_title', L)}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-white/40 mt-1">
            {t('habits_daily_desc', L)}
          </p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
          {/* Circular Progress */}
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/5"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)] transition-all duration-1000"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {completed}/{total}
              </div>
            </div>
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
              {t('habits_completed_today', L)}
            </span>
          </div>

          <div className="w-px h-10 bg-white/10 hidden md:block" />

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Reorder Button */}
            <button
              type="button"
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={`touch-target relative p-2 transition-all flex items-center justify-center shrink-0 rounded-full ${
                isReorderMode 
                ? 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]' 
                : 'text-white/40 hover:text-white/80'
              }`}
              title={t('habits_reorder', L) || 'Reorder'}
            >
              <GripVertical size={24} className={isReorderMode ? 'animate-pulse' : ''} />
            </button>

            {/* Create Button */}
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="touch-target group relative px-4 py-3 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all shadow-lg overflow-hidden flex items-center gap-2 flex-grow md:flex-grow-0 justify-center min-h-[48px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus size={18} className="text-violet-400 group-hover:scale-125 transition-transform shrink-0" />
              <span className="text-sm font-bold text-white relative z-10 w-max hidden sm:inline">{t('habits_new_habit', L)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Habit List */}
      {/* We use grid, but rectSortingStrategy works best here. */}
      {habits.length === 0 ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="col-span-1 p-12 glass-card flex flex-col items-center justify-center text-center opacity-70">
            <span className="text-6xl mb-4 grayscale opacity-50">🌱</span>
            <p className="text-lg font-bold text-white/80">Your journey starts here.</p>
            <p className="text-sm text-white/40 mt-2 max-w-sm">
              Create your first habit to begin building unstoppable momentum.
            </p>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SortableContext
              items={habits.map(h => h.id)}
              strategy={rectSortingStrategy}
            >
              {habits.map(habit => (
                <SortableHabitCard 
                  key={habit.id}
                  habit={habit}
                  onLogEntry={onLogEntry}
                  onExpandDetails={onExpandDetails}
                  isReorderMode={isReorderMode}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}
    </div>
  );
}
