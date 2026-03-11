import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Check, Calendar, Edit3, GripVertical, ListTodo, X, Plus,
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, Trophy,
  Activity, LayoutDashboard, CalendarDays, Settings, CalendarRange,
  ChevronLeft, ChevronRight, RotateCcw, CalendarPlus,
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useWeeklyPlannerStore,
  weekIdToStartDate,
} from '../stores/useWeeklyPlannerStore';
import { useAuthStore } from '../stores/useAuthStore';

// ==========================================
// Helpers & Categories
// ==========================================

const TASK_CATEGORIES = [
  { id: 'work',        label: 'Work 💼',        color: '#3b82f6' },
  { id: 'personal',   label: 'Personal 👤',     color: '#8b5cf6' },
  { id: 'health',     label: 'Health 🏃',       color: '#10b981' },
  { id: 'study',      label: 'Study 📚',        color: '#f59e0b' },
  { id: 'finance',    label: 'Finance 💰',      color: '#14b8a6' },
  { id: 'home',       label: 'Home 🏠',         color: '#ec4899' },
  { id: 'other',      label: 'Other 📌',        color: '#64748b' },
];

// Stable module-level constant — never changes, safe to omit from deps
const DAY_ORDER = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

const mockHistoricalData = [
  { weekId: 'W-4', completion: 45 },
  { weekId: 'W-3', completion: 60 },
  { weekId: 'W-2', completion: 55 },
  { weekId: 'Last Week', completion: 72 },
];

// ==========================================
// Sortable Task Row (for per-day reordering)
// ==========================================

function SortableTaskRow({ task, dayId, isReadOnly, onToggle, onTextChange, onBlur, onDragStart }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const hasText = task.text.trim() !== '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`flex items-center gap-2 group p-1 -mx-1 rounded-md transition-all duration-300 ${
        task.done && hasText ? 'bg-[#10b981]/10 border border-[#10b981]/20' : 'border border-transparent'
      }`}
      draggable={hasText && !isReadOnly}
      onDragStart={(e) => {
        if (!hasText || isReadOnly) { e.preventDefault(); return; }
        onDragStart?.({ type: 'day', dayId, id: task.id, text: task.text, masterId: task.masterId, done: task.done });
      }}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className={`cursor-grab active:cursor-grabbing transition-opacity touch-none ${
          hasText && !isReadOnly ? 'opacity-30 group-hover:opacity-100 text-[var(--accent-primary)]' : 'opacity-0 pointer-events-none'
        }`}
      >
        <GripVertical size={14} />
      </div>

      {/* Done checkbox */}
      <button
        onClick={() => !isReadOnly && onToggle(dayId, task.id)}
        disabled={isReadOnly}
        className={`w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center transition-all duration-300 ${
          task.done
            ? 'bg-[#10b981] border-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            : 'border-[var(--text-muted)] group-hover:border-[var(--accent-primary)]'
        } ${isReadOnly ? 'cursor-default opacity-60' : ''}`}
      >
        {task.done && <Check size={14} className="text-white" />}
      </button>

      {/* Task text input */}
      <input
        type="text"
        value={task.text}
        readOnly={isReadOnly}
        onChange={(e) => onTextChange(dayId, task.id, e.target.value)}
        onBlur={(e) => onBlur(dayId, task.id, e.target.value)}
        placeholder={isReadOnly ? '—' : '...'}
        className={`w-full bg-transparent border-b border-transparent focus:border-[var(--accent-primary)] py-1 text-sm outline-none transition-all duration-300 ${
          task.done ? 'text-[#10b981] line-through font-medium opacity-80' : 'text-[var(--text-primary)]'
        } ${isReadOnly ? 'cursor-default' : ''}`}
      />
    </div>
  );
}

// ==========================================
// Main Component
// ==========================================

export default function WeeklyPlanner() {
  const user = useAuthStore((s) => s.user);
  const {
    data, loading, saving, loaded,
    currentWeekId, viewingWeekId,
    initialize, cleanup,
    updateData, addMasterTask, removeMasterTask, updateMasterTask,
    updateDayTask, addDayTask, reorderDayTasks,
    goToPrevWeek, goToNextWeek, goToCurrentWeek,
    rolloverIncompleteTasks, addTaskToDate,
  } = useWeeklyPlannerStore();

  const [activeView, setActiveView] = useState('planner');
  const [showSettings, setShowSettings] = useState(false);
  const [masterInput, setMasterInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [targetDate, setTargetDate] = useState('');   // for date-targeted tasks
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [rollingOver, setRollingOver] = useState(false);

  const isViewingCurrentWeek = viewingWeekId === currentWeekId;
  const isReadOnly = !isViewingCurrentWeek;

  // Initialize store on mount
  useEffect(() => {
    if (user?.uid) initialize(user.uid);
    return () => cleanup();
  }, [user?.uid, initialize, cleanup]);

  const startDay = data?.startDay || 'sat';
  const days = useMemo(() => data?.days || [], [data?.days]);
  const masterTasks = useMemo(() => data?.masterTasks || [], [data?.masterTasks]);
  const notes = data?.notes || '';
  const reflections = data?.reflections || '';

  // ── Compute week start / end from viewingWeekId ──
  const weekStartDate = useMemo(() => weekIdToStartDate(viewingWeekId), [viewingWeekId]);
  const weekEndDate = useMemo(() => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStartDate]);
  const weekNum = useMemo(() => {
    const [, wStr] = viewingWeekId.split('-W');
    return parseInt(wStr, 10);
  }, [viewingWeekId]);

  // ── Assign dates to day columns (DAY_ORDER is module-scope constant) ──

  const sortedDayIds = useMemo(() => {
    const startIdx = DAY_ORDER.indexOf(startDay);
    return [...DAY_ORDER.slice(startIdx), ...DAY_ORDER.slice(0, startIdx)];
  }, [startDay]);

  const assignedDates = useMemo(() => {
    const map = {};
    sortedDayIds.forEach((id, i) => {
      const d = new Date(weekStartDate);
      d.setDate(weekStartDate.getDate() + i);
      map[id] = d;
    });
    return map;
  }, [weekStartDate, sortedDayIds]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const sortedDays = useMemo(() =>
    sortedDayIds.map(id =>
      days.find(d => d.id === id) ||
      { id, name: id.charAt(0).toUpperCase() + id.slice(1), tasks: [] }
    )
  , [sortedDayIds, days]);

  // ── Incomplete tasks for rollover banner ──
  const incompleteTasks = useMemo(() => {
    if (isViewingCurrentWeek) return [];
    const result = [];
    days.forEach(day => {
      day.tasks.forEach(t => {
        if (t.text.trim() && !t.done) result.push(t.id);
      });
    });
    return result;
  }, [days, isViewingCurrentWeek]);

  // ── Analytics ──
  const masterStats = useMemo(() => {
    const stats = {};
    masterTasks.forEach(t => { stats[t.id] = { total: 0, done: 0 }; });
    days.forEach(day => {
      day.tasks.forEach(task => {
        if (task.text.trim() && task.masterId && stats[task.masterId]) {
          stats[task.masterId].total++;
          if (task.done) stats[task.masterId].done++;
        }
      });
    });
    return stats;
  }, [masterTasks, days]);

  const globalStats = useMemo(() => {
    let total = 0, completed = 0;
    days.forEach(day => {
      day.tasks.forEach(task => {
        if (task.text.trim()) { total++; if (task.done) completed++; }
      });
    });
    masterTasks.forEach(m => {
      if (masterStats[m.id]?.total === 0) total++;
    });
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [masterTasks, days, masterStats]);

  const categoryAnalytics = useMemo(() => {
    const catData = {};
    TASK_CATEGORIES.forEach(c => { catData[c.id] = { label: c.label, color: c.color, total: 0, done: 0 }; });
    days.forEach(day => {
      day.tasks.forEach(task => {
        if (task.text.trim() && task.masterId) {
          const mTask = masterTasks.find(m => m.id === task.masterId);
          if (mTask && catData[mTask.categoryId]) {
            catData[mTask.categoryId].total++;
            if (task.done) catData[mTask.categoryId].done++;
          }
        }
      });
    });
    masterTasks.forEach(mTask => {
      if (masterStats[mTask.id]?.total === 0 && catData[mTask.categoryId]) {
        catData[mTask.categoryId].total++;
      }
    });
    return Object.values(catData)
      .map(cat => ({ ...cat, percent: cat.total === 0 ? 0 : Math.round((cat.done / cat.total) * 100) }))
      .filter(c => c.total > 0);
  }, [days, masterTasks, masterStats]);

  const weakestCategory = useMemo(() =>
    categoryAnalytics.length === 0 ? null :
    categoryAnalytics.reduce((p, c) => p.percent < c.percent ? p : c)
  , [categoryAnalytics]);

  const bestDay = useMemo(() => {
    let maxDone = -1, bDay = null;
    days.forEach(d => {
      const count = d.tasks.filter(t => t.text.trim() && t.done).length;
      if (count > maxDone && count > 0) { maxDone = count; bDay = d.name; }
    });
    return bDay;
  }, [days]);

  // ── DnD sensors for per-day reorder ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDayDragEnd = useCallback((dayId, event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const day = days.find(d => d.id === dayId);
      if (!day) return;
      const oldIndex = day.tasks.findIndex(t => t.id === active.id);
      const newIndex = day.tasks.findIndex(t => t.id === over.id);
      const reordered = arrayMove(day.tasks, oldIndex, newIndex);
      reorderDayTasks(dayId, reordered.map(t => t.id));
    }
  }, [days, reorderDayTasks]);

  // ── Master task drag-to-day ──
  const handleDropOnDay = (e, targetDayId) => {
    e.preventDefault();
    if (!draggedItem || !data || isReadOnly) return;
    if (draggedItem.type === 'day' && draggedItem.dayId === targetDayId) { setDraggedItem(null); return; }

    const textToMove = draggedItem.text;
    const newDays = [...data.days];
    const targetDay = newDays.find(d => d.id === targetDayId);
    if (!targetDay) return;

    let targetTask = targetDay.tasks.find(t => t.text.trim() === '');
    if (!targetTask) {
      const newId = generateIdClient();
      targetTask = { id: newId, masterId: null, text: '', done: false };
      targetDay.tasks.push(targetTask);
    }
    targetTask.text = textToMove;
    targetTask.masterId = draggedItem.type === 'master' ? draggedItem.id : draggedItem.masterId;
    targetTask.done = draggedItem.type === 'day' ? draggedItem.done : false;

    if (draggedItem.type === 'day') {
      const srcTask = newDays.find(d => d.id === draggedItem.dayId)?.tasks.find(t => t.id === draggedItem.id);
      if (srcTask) { srcTask.text = ''; srcTask.done = false; srcTask.masterId = null; }
    }
    updateData({ days: newDays });
    setDraggedItem(null);
  };

  const handleDropOnCategory = (e, targetCategoryId) => {
    e.preventDefault();
    if (!draggedItem || !data || isReadOnly) return;
    if (draggedItem.type === 'master') {
      updateMasterTask(draggedItem.id, { categoryId: targetCategoryId });
    } else if (draggedItem.type === 'day') {
      if (!masterTasks.some(m => m.id === draggedItem.masterId)) {
        addMasterTask({ text: draggedItem.text, categoryId: targetCategoryId });
      } else {
        updateMasterTask(draggedItem.masterId, { categoryId: targetCategoryId });
      }
      const newDays = [...data.days];
      const srcDay = newDays.find(d => d.id === draggedItem.dayId);
      const srcTask = srcDay?.tasks.find(t => t.id === draggedItem.id);
      if (srcTask) { srcTask.text = ''; srcTask.done = false; srcTask.masterId = null; }
      updateData({ days: newDays });
    }
    setDraggedItem(null);
  };

  // ── Interactions ──
  const handleAddMasterTask = async () => {
    if (masterInput.trim() === '') return;

    if (targetDate) {
      // Date-targeted: add to specific week + day
      await addTaskToDate(user.uid, new Date(targetDate + 'T12:00:00'), {
        text: masterInput.trim(),
        categoryId: selectedCategory,
      });
      setTargetDate('');
      setShowDatePicker(false);
    } else {
      addMasterTask({ text: masterInput.trim(), categoryId: selectedCategory });
    }
    setMasterInput('');
  };

  const handleTaskTextChange = (dayId, taskId, text) => {
    updateDayTask(dayId, taskId, { text, masterId: text.trim() === '' ? null : undefined });
  };

  const syncDayTaskToMaster = (dayId, taskId, text) => {
    if (text.trim() === '' || isReadOnly) return;
    const day = days.find(d => d.id === dayId);
    const task = day?.tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!task.masterId) {
      const newId = generateIdClient();
      updateDayTask(dayId, taskId, { masterId: newId });
      addMasterTask({ id: newId, text, categoryId: 'other' });
    } else {
      updateMasterTask(task.masterId, { text });
    }
  };

  const handleTaskToggle = (dayId, taskId) => {
    if (isReadOnly) return;
    const day = days.find(d => d.id === dayId);
    const task = day?.tasks.find(t => t.id === taskId);
    if (task) updateDayTask(dayId, taskId, { done: !task.done });
  };

  const handleRollover = async () => {
    setRollingOver(true);
    await rolloverIncompleteTasks();
    setRollingOver(false);
  };

  // Date formatting
  const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDayCardDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const activeCategories = TASK_CATEGORIES.filter(cat => masterTasks.some(t => t.categoryId === cat.id));

  if (loading && !loaded) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
          <div className="text-[var(--text-muted)] font-medium">Synchronizing Weekly Planner...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8">

      {/* ───────────── Header ───────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[var(--border-glass)] pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold gradient-text tracking-tight mb-2">
            Weekly Planner
          </h1>

          {/* Read-only badge */}
          {isReadOnly && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Calendar size={12} /> Viewing Past Week — Read Only
            </div>
          )}

          {/* Week navigation row */}
          <div className="flex flex-wrap items-center gap-3 mt-3">

            {/* Prev arrow */}
            <button
              onClick={goToPrevWeek}
              className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all"
              title="Previous Week"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Week badge */}
            <div className="flex flex-col items-center justify-center bg-[var(--accent-primary)] text-white px-5 py-2 rounded-xl shadow-[var(--shadow-glow)] border border-white/20">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-90 mb-1">Week</span>
              <span className="text-3xl font-black leading-none">{weekNum}</span>
            </div>

            {/* Next arrow */}
            <button
              onClick={goToNextWeek}
              className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all"
              title="Next Week"
            >
              <ChevronRight size={18} />
            </button>

            {/* Date range */}
            <div className="flex items-center gap-3 bg-[var(--bg-card)] px-4 py-3 rounded-xl border border-[var(--border-glass)] shadow-sm">
              <CalendarRange size={20} className="text-[var(--accent-primary)]" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] mb-0.5">
                  {isViewingCurrentWeek ? 'Current Schedule' : 'Viewing'}
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {formatDate(weekStartDate)} <span className="text-[var(--text-muted)] mx-1">→</span> {formatDate(weekEndDate)}
                </span>
              </div>
            </div>

            {/* "Today" reset pill */}
            {!isViewingCurrentWeek && (
              <button
                onClick={goToCurrentWeek}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] text-xs font-bold hover:bg-[var(--accent-primary)]/20 transition-all"
                title="Go to current week"
              >
                <RotateCcw size={14} /> This Week
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saving && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
              <Activity size={12} /> Saving...
            </div>
          )}

          {/* View switcher */}
          <div className="glass-card p-1 flex gap-1 rounded-xl">
            <button
              onClick={() => setActiveView('planner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'planner' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <CalendarDays size={18} /> Planner
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'analytics' ? 'bg-[var(--accent-primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <BarChart3 size={18} /> Analytics
            </button>
          </div>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl glass-card transition-all ${showSettings ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              title="Settings"
            >
              <Settings size={18} />
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-3 w-56 glass-card p-4 z-50 animate-slide-down shadow-2xl border-[var(--border-glass-hover)]">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)] mb-3">Planner Settings</h4>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Week Starts On:</label>
                  <select
                    value={startDay}
                    onChange={(e) => { updateData({ startDay: e.target.value }); setShowSettings(false); }}
                    disabled={isReadOnly}
                    className="w-full bg-black/20 border border-[var(--border-glass)] rounded-lg p-2 text-sm outline-none focus:border-[var(--accent-primary)]"
                  >
                    {['sat','sun','mon','tue','wed','thu','fri'].map(d => (
                      <option key={d} value={d} className="bg-[#1c1c1e]">
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────── Rollover Banner ───────────── */}
      {!isViewingCurrentWeek && incompleteTasks.length > 0 && (
        <div className="mb-6 flex items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-400 shrink-0" />
            <p className="text-sm font-bold text-amber-300">
              You have <span className="text-amber-200">{incompleteTasks.length}</span> unfinished task{incompleteTasks.length > 1 ? 's' : ''} in this week.
              Roll them over to the next week's master list?
            </p>
          </div>
          <button
            onClick={handleRollover}
            disabled={rollingOver}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-all shrink-0 disabled:opacity-60"
          >
            {rollingOver ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <RotateCcw size={15} />
            )}
            Roll Over
          </button>
        </div>
      )}

      {/* ───────────── Analytics View ───────────── */}
      {activeView === 'analytics' && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="text-lg font-bold text-[var(--text-secondary)] uppercase tracking-wider">Weekly Completion</h3>
                <Activity className="text-[var(--accent-primary)]" size={24} />
              </div>
              <div className="text-5xl font-extrabold text-[var(--text-primary)] mb-2 relative z-10">{globalStats.percentage}%</div>
              <div className="flex items-center gap-2 text-sm font-bold relative z-10">
                {globalStats.percentage >= mockHistoricalData[3].completion ? (
                  <span className="flex items-center text-[#10b981]"><TrendingUp size={16} className="mr-1"/>+{globalStats.percentage - mockHistoricalData[3].completion}% vs last week</span>
                ) : (
                  <span className="flex items-center text-[#ef4444]"><TrendingDown size={16} className="mr-1"/>{globalStats.percentage - mockHistoricalData[3].completion}% vs last week</span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 h-1.5 bg-[#10b981] transition-all duration-1000 ease-out" style={{ width: `${globalStats.percentage}%` }} />
            </div>

            <div className="glass-card p-6 border-l-4 border-l-[#f59e0b]">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-[var(--text-secondary)] uppercase tracking-wider">AI Insight: Alert</h3>
                <AlertTriangle className="text-[#f59e0b]" size={24} />
              </div>
              {weakestCategory ? (
                <>
                  <div className="text-xl font-bold text-[var(--text-primary)] mb-2">Needs Attention: <span style={{ color: weakestCategory.color }}>{weakestCategory.label.split(' ')[0]}</span></div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Only <strong>{weakestCategory.percent}%</strong> completion across {weakestCategory.total} tasks.
                  </p>
                </>
              ) : (
                <div className="text-[var(--text-muted)] italic">Add tasks to get AI insights.</div>
              )}
            </div>

            <div className="glass-card p-6 border-l-4 border-l-[var(--accent-primary)] relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="text-lg font-bold text-[var(--text-secondary)] uppercase tracking-wider">Peak Energy Day</h3>
                <Trophy className="text-[var(--accent-primary)]" size={24} />
              </div>
              {bestDay ? (
                <>
                  <div className="text-3xl font-extrabold text-[var(--accent-primary)] mb-2 relative z-10">{bestDay}</div>
                  <p className="text-sm text-[var(--text-muted)] relative z-10">Your most productive day this week.</p>
                </>
              ) : (
                <div className="text-[var(--text-muted)] italic">Complete tasks to see your best day.</div>
              )}
              <div className="absolute -right-4 -bottom-4 opacity-5"><Trophy size={120} /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6 flex items-center gap-2">
                <LayoutDashboard size={20} /> Category Mastery
              </h3>
              {categoryAnalytics.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-[var(--border-glass)] rounded-xl text-[var(--text-muted)]">No data yet.</div>
              ) : (
                <div className="space-y-5">
                  {categoryAnalytics.sort((a,b) => b.total - a.total).map(cat => (
                    <div key={cat.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: cat.color}} /> {cat.label}</span>
                        <span className="text-[var(--text-muted)] font-medium">{cat.done}/{cat.total} ({cat.percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-1000" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-6 flex flex-col">
              <h3 className="text-lg font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6 flex items-center gap-2">
                <BarChart3 size={20} /> History vs Current
              </h3>
              <div className="flex-1 flex items-end justify-between gap-2 pt-10 pb-4 border-b border-[var(--border-glass)] px-2">
                {mockHistoricalData.map((d, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 group w-full">
                    <div className="w-full flex justify-center h-40 relative">
                      <div className="w-[80%] max-w-[40px] bg-[var(--border-glass)] rounded-t-md absolute bottom-0 transition-all duration-500" style={{ height: `${d.completion}%` }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-white">{d.completion}%</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{d.weekId}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-2 group w-full">
                  <div className="w-full flex justify-center h-40 relative">
                    <div className="w-[80%] max-w-[40px] rounded-t-md absolute bottom-0 transition-all duration-1000" style={{ height: `${globalStats.percentage}%`, background: 'var(--gradient-hero)', boxShadow: 'var(--shadow-glow)' }}>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold bg-[var(--accent-primary)] text-white px-2 py-1 rounded shadow-lg">{globalStats.percentage}%</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--accent-primary)] font-extrabold uppercase">This Week</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── Planner View ───────────── */}
      {activeView === 'planner' && (
        <div className="animate-fade-in">

          {/* Master Task Panel */}
          <div className="glass-card p-5 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 border-b border-[var(--border-glass)] pb-3">
              <div className="flex items-center gap-2">
                <ListTodo size={24} className="text-[var(--accent-primary)]" />
                <h2 className="text-xl font-bold uppercase tracking-wide text-[var(--accent-primary)]">Master Task List</h2>
              </div>
              <div className="flex items-center gap-4 bg-black/10 px-4 py-2 rounded-xl border border-[var(--border-glass)] shadow-inner">
                <div className="flex flex-col text-sm">
                  <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-bold">Weekly Progress</span>
                  <span className="font-bold text-[var(--text-primary)]">{globalStats.completed} / {globalStats.total} Tasks</span>
                </div>
                <div className="w-24 md:w-32 h-2.5 bg-black/30 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full transition-all duration-700 ease-out" style={{ width: `${globalStats.percentage}%`, background: 'var(--gradient-success)' }} />
                </div>
                <span className="font-extrabold text-[var(--text-primary)] w-10 text-right">{globalStats.percentage}%</span>
              </div>
            </div>

            {/* Add task row */}
            {!isReadOnly && (
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex flex-1 relative items-center">
                    <input
                      type="text" value={masterInput}
                      onChange={e => setMasterInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddMasterTask(); }}
                      placeholder="Type a new task and press Enter..."
                      className="w-full pl-4 pr-32 py-2.5 rounded-lg bg-black/10 border border-[var(--border-glass)] focus:border-[var(--accent-primary)] outline-none transition text-sm sm:text-base"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      {/* Date picker toggle */}
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        title={showDatePicker ? 'Remove date target' : 'Schedule to specific date'}
                        className={`p-1.5 rounded-lg transition-colors ${showDatePicker || targetDate ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'text-[var(--text-muted)] hover:text-[var(--accent-primary)]'}`}
                      >
                        <CalendarPlus size={16} />
                      </button>
                      <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                        className="h-8 pl-2 pr-7 py-0 text-xs sm:text-sm bg-[var(--bg-card)] border-none rounded cursor-pointer outline-none focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]">
                        {TASK_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id} className="bg-[#1c1c1e] text-white">{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button onClick={handleAddMasterTask} className="px-6 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white font-bold hover:brightness-110 transition shadow-lg shrink-0">
                    {targetDate ? 'Add to Date' : 'Add Task'}
                  </button>
                </div>

                {/* Date picker row */}
                {showDatePicker && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 animate-fade-in">
                    <CalendarPlus size={16} className="text-[var(--accent-primary)] shrink-0" />
                    <span className="text-sm font-bold text-[var(--text-muted)]">Schedule to:</span>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={e => setTargetDate(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                      className="bg-black/20 border border-[var(--border-glass)] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[var(--accent-primary)] transition"
                    />
                    {targetDate && (
                      <span className="text-xs text-[var(--accent-primary)] font-bold">
                        → Task will be added to the correct week & day automatically
                      </span>
                    )}
                    {targetDate && (
                      <button onClick={() => setTargetDate('')} className="ml-auto text-[var(--text-muted)] hover:text-red-400 transition">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Category columns */}
            <div className="flex overflow-x-auto gap-4 custom-scrollbar pb-4 items-start pt-2">
              {masterTasks.length === 0 && (
                <div className="w-full flex items-center justify-center text-[var(--text-muted)] text-sm italic py-8 border-2 border-dashed border-[var(--border-glass)] rounded-xl">
                  {isReadOnly ? 'No tasks were created this week.' : 'Your master task list is empty. Add a task above to get started!'}
                </div>
              )}
              {activeCategories.map(category => {
                const catTasks = masterTasks.filter(t => t.categoryId === category.id);
                return (
                  <div
                    key={category.id}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDropOnCategory(e, category.id)}
                    className="min-w-[240px] max-w-[240px] bg-black/10 border border-[var(--border-glass)] rounded-xl p-3 flex flex-col gap-2 transition-colors hover:border-[var(--border-glass-hover)]"
                  >
                    <h3 className="font-bold text-sm uppercase flex items-center gap-2 mb-2 pb-2 border-b border-[var(--border-glass)]" style={{ color: category.color }}>
                      {category.label}
                      <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full text-white/70 ml-auto">{catTasks.length}</span>
                    </h3>
                    {catTasks.map(task => {
                      const stat = masterStats[task.id] || { total: 0, done: 0 };
                      const isScheduled = stat.total > 0;
                      const isFullyDone = isScheduled && stat.done === stat.total;
                      const progressPercent = isScheduled ? (stat.done / stat.total) * 100 : 0;
                      return (
                        <div
                          key={task.id}
                          draggable={!isReadOnly}
                          onDragStart={() => !isReadOnly && setDraggedItem({ type: 'master', id: task.id, text: task.text, categoryId: task.categoryId })}
                          className={`relative overflow-hidden px-3 py-2 border rounded-lg flex items-center gap-2 ${isReadOnly ? '' : 'cursor-grab active:cursor-grabbing'} transition-all ${isFullyDone ? 'border-[#10b981] bg-[#10b981]/10' : 'bg-[var(--bg-card)] border-[var(--border-glass)] hover:border-[var(--accent-primary)] hover:shadow-lg'}`}
                        >
                          {isScheduled && !isFullyDone && stat.done > 0 && (
                            <div className="absolute left-0 top-0 bottom-0 bg-[#10b981]/20 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                          )}
                          <div className="relative z-10 flex items-center gap-2 w-full">
                            <GripVertical size={14} className={isFullyDone ? 'text-[#10b981]' : 'text-[var(--text-muted)] shrink-0'} />
                            <span className={`text-sm font-medium truncate ${isFullyDone ? 'text-[#10b981] line-through' : ''}`} title={task.text}>{task.text}</span>
                            <div className="flex-1" />
                            {isScheduled && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${isFullyDone ? 'bg-[#10b981] text-white' : 'bg-black/20 text-[var(--text-muted)]'}`}>{stat.done}/{stat.total}</span>}
                            {!isReadOnly && (
                              <button onClick={() => removeMasterTask(task.id)} className="text-red-400 hover:text-red-300 transition-colors ml-1 shrink-0" title="Delete Task">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedDays.filter(Boolean).map((day) => {
              if (!day?.tasks) return null;
              const dayStats = day.tasks.reduce((acc, t) => {
                if (t.text.trim()) { acc.total++; if (t.done) acc.done++; }
                return acc;
              }, { total: 0, done: 0 });
              const dayPercent = dayStats.total === 0 ? 0 : Math.round((dayStats.done / dayStats.total) * 100);
              const autoDate = assignedDates[day.id];
              const isTodayCard = autoDate && isToday(autoDate);

              // Sort tasks by order field for display
              const sortedTasks = [...day.tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

              return (
                <div
                  key={day.id}
                  className={`glass-card p-5 flex flex-col h-[520px] transition-all duration-500 relative ${
                    isTodayCard
                      ? 'border-2 border-[#06b6d4] !shadow-[0_0_20px_rgba(6,182,212,0.5),0_0_40px_rgba(6,182,212,0.2)] scale-[1.02] z-10'
                      : dayPercent === 100 && dayStats.total > 0
                        ? 'border-[#10b981]/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : ''
                  }`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDropOnDay(e, day.id)}
                >
                  {/* Day header */}
                  <div className="flex justify-between items-center mb-4 border-b border-[var(--border-glass)] pb-3">
                    <h2 className={`text-xl font-bold uppercase tracking-wide transition-colors ${
                      isTodayCard ? 'text-[#06b6d4]' :
                      dayPercent === 100 && dayStats.total > 0 ? 'text-[#10b981]' :
                      'text-[var(--accent-primary)]'
                    }`}>
                      {day.name}
                    </h2>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-[var(--text-muted)] mb-0.5 uppercase tracking-wider font-bold">Date</span>
                      <span className="text-sm font-extrabold text-[var(--text-primary)] bg-black/20 px-2 py-0.5 rounded border border-white/5">
                        {autoDate ? formatDayCardDate(autoDate) : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Daily progress bar */}
                  <div className="mb-4 bg-black/5 p-3 rounded-lg border border-white/5">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Daily Progress</span>
                      <span className={`text-[10px] font-bold ${dayPercent === 100 && dayStats.total > 0 ? 'text-[#10b981]' : 'text-[var(--text-primary)]'}`}>{dayPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-700 ease-out" style={{ width: `${dayPercent}%`, background: dayPercent === 100 ? '#10b981' : 'var(--gradient-hero)' }} />
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold mb-3 text-[var(--text-secondary)] uppercase tracking-wider">To Do:</h3>

                  {/* Sortable task list */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => !isReadOnly && handleDayDragEnd(day.id, event)}
                    >
                      <SortableContext
                        items={sortedTasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-2">
                          {sortedTasks.map(task => (
                            <SortableTaskRow
                              key={task.id}
                              task={task}
                              dayId={day.id}
                              isReadOnly={isReadOnly}
                              onToggle={handleTaskToggle}
                              onTextChange={handleTaskTextChange}
                              onBlur={syncDayTaskToMaster}
                              onDragStart={setDraggedItem}
                            />
                          ))}
                          {!isReadOnly && (
                            <button
                              onClick={() => addDayTask(day.id)}
                              className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)] w-fit px-2 py-1 rounded transition-colors"
                            >
                              <Plus size={14} /> Add Task Slot
                            </button>
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              );
            })}

            {/* Notes panel */}
            <div className="glass-card p-5 flex flex-col h-[520px] bg-[var(--bg-card-hover)]">
              <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-glass)] pb-3">
                <Edit3 size={20} className="text-[var(--accent-primary)]" />
                <h2 className="text-xl font-bold uppercase tracking-wide text-[var(--accent-primary)]">Notes</h2>
              </div>
              <textarea
                value={notes}
                onChange={(e) => !isReadOnly && updateData({ notes: e.target.value })}
                readOnly={isReadOnly}
                placeholder={isReadOnly ? 'No notes for this week.' : 'Write your important notes here...'}
                className="flex-1 w-full bg-transparent border-none outline-none resize-none custom-scrollbar text-[var(--text-primary)] leading-relaxed"
              />
            </div>
          </div>

          {/* Reflections */}
          <div className="mt-6 glass-card p-6 border-l-4 border-l-[var(--accent-primary)]">
            <h2 className="text-lg font-bold uppercase tracking-wide text-[var(--accent-primary)] mb-3">Reflections:</h2>
            <textarea
              value={reflections}
              onChange={(e) => !isReadOnly && updateData({ reflections: e.target.value })}
              readOnly={isReadOnly}
              placeholder={isReadOnly ? 'No reflections written for this week.' : 'What did you achieve? What needs improvement for next week?'}
              className="w-full h-24 bg-transparent border-none outline-none resize-none custom-scrollbar text-[var(--text-primary)] leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Local ID generator (client-side, no crypto import needed) ──
function generateIdClient() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch { /* fallthrough */ }
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}