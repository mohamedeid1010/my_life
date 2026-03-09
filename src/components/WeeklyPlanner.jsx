import React, { useState, useMemo, useEffect } from 'react';
import { Check, Calendar, Edit3, GripVertical, ListTodo, X, Plus, BarChart3, TrendingUp, TrendingDown, AlertTriangle, Trophy, Activity, LayoutDashboard, CalendarDays, Settings, CalendarRange } from 'lucide-react';
import { useWeeklyPlannerStore } from '../stores/useWeeklyPlannerStore';
import { useAuthStore } from '../stores/useAuthStore';

// ==========================================
// Helpers & Categories
// ==========================================

const TASK_CATEGORIES = [
  { id: 'work', label: 'Work 💼', color: '#3b82f6' },
  { id: 'personal', label: 'Personal 👤', color: '#8b5cf6' },
  { id: 'health', label: 'Health 🏃', color: '#10b981' },
  { id: 'study', label: 'Study 📚', color: '#f59e0b' },
  { id: 'finance', label: 'Finance 💰', color: '#14b8a6' },
  { id: 'home', label: 'Home 🏠', color: '#ec4899' },
  { id: 'other', label: 'Other 📌', color: '#64748b' }
];

const getWeekNumber = (targetDate) => {
  const year = targetDate.getFullYear();
  const startDate = new Date(year, 0, 3);
  const diffTime = targetDate - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays < 0 ? 1 : Math.floor(diffDays / 7) + 1;
};

const mockHistoricalData = [
  { weekId: 'W-4', completion: 45 },
  { weekId: 'W-3', completion: 60 },
  { weekId: 'W-2', completion: 55 },
  { weekId: 'Last Week', completion: 72 },
];

export default function WeeklyPlanner() {
  const user = useAuthStore((s) => s.user);
  const { data, loading, saving, initialize, updateData, addMasterTask, removeMasterTask, updateMasterTask, updateDayTask, addDayTask } = useWeeklyPlannerStore();

  const [activeView, setActiveView] = useState('planner');
  const [showSettings, setShowSettings] = useState(false);

  // Initialize store on mount
  useEffect(() => {
    if (user?.uid) {
      initialize(user.uid);
    }
  }, [user?.uid, initialize]);

  // Use data from store
  const startDay = data?.startDay || 'sat';
  const days = data?.days || [];
  const masterTasks = data?.masterTasks || [];
  const notes = data?.notes || '';
  const reflections = data?.reflections || '';

  const [masterInput, setMasterInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [draggedItem, setDraggedItem] = useState(null);

  // الاعتماد على تاريخ اليوم كمرجع دائم
  const [today] = useState(new Date());

  // ==========================================
  // النظام التلقائي الذكي لحساب التواريخ
  // ==========================================
  const weekData = useMemo(() => {
    const dayIndexMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
    const currentDayOfWeek = today.getDay();
    const targetStartDay = dayIndexMap[startDay];

    // حساب الفرق للوصول إلى بداية الأسبوع
    let diff = currentDayOfWeek - targetStartDay;
    if (diff < 0) diff += 7;

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - diff);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    // ترتيب وتعيين التواريخ لكل يوم
    const daysOrder = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
    const startIdx = daysOrder.indexOf(startDay);
    const sortedIds = [...daysOrder.slice(startIdx), ...daysOrder.slice(0, startIdx)];

    const assignedDates = {};
    sortedIds.forEach((id, index) => {
       const d = new Date(startDate);
       d.setDate(startDate.getDate() + index);
       assignedDates[id] = d;
    });

    return {
      startDate,
      endDate,
      weekNum: getWeekNumber(startDate),
      assignedDates,
      sortedIds
    };
  }, [today, startDay]);

  // تجهيز الأيام للعرض بناءً على الترتيب الجديد
  const sortedDays = weekData.sortedIds.map(id => days.find(d => d.id === id) || { id, name: id.charAt(0).toUpperCase() + id.slice(1), tasks: [] });

  // تنسيق التواريخ بشكل احترافي
  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDayCardDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // === التحليلات المتقدمة (Analytics Logic) ===
  const masterStats = React.useMemo(() => {
    const stats = {};
    masterTasks.forEach(t => { stats[t.id] = { total: 0, done: 0 }; });
    days.forEach(day => {
      day.tasks.forEach(task => {
        if (task.text.trim() !== '' && task.masterId && stats[task.masterId]) {
          stats[task.masterId].total += 1;
          if (task.done) stats[task.masterId].done += 1;
        }
      });
    });
    return stats;
  }, [masterTasks, days]);

  const globalStats = React.useMemo(() => {
    let total = 0, completed = 0;
    days.forEach(day => {
      day.tasks.forEach(task => {
        if (task.text.trim() !== '') {
          total++;
          if (task.done) completed++;
        }
      });
    });
    masterTasks.forEach(m => {
      if (masterStats[m.id] && masterStats[m.id].total === 0) total++;
    });
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  }, [masterTasks, days, masterStats]);

  const categoryAnalytics = React.useMemo(() => {
    const catData = {};
    TASK_CATEGORIES.forEach(c => { catData[c.id] = { label: c.label, color: c.color, total: 0, done: 0 }; });
    days.forEach(day => {
      day.tasks.forEach(task => {
        if (task.text.trim() !== '' && task.masterId) {
          const mTask = masterTasks.find(m => m.id === task.masterId);
          if (mTask && catData[mTask.categoryId]) {
            catData[mTask.categoryId].total++;
            if (task.done) catData[mTask.categoryId].done++;
          }
        }
      });
    });
    masterTasks.forEach(mTask => {
       if (masterStats[mTask.id] && masterStats[mTask.id].total === 0 && catData[mTask.categoryId]) {
          catData[mTask.categoryId].total++;
       }
    });
    return Object.values(catData).map(cat => ({
      ...cat,
      percent: cat.total === 0 ? 0 : Math.round((cat.done / cat.total) * 100)
    })).filter(c => c.total > 0);
  }, [days, masterTasks, masterStats]);

  const weakestCategory = React.useMemo(() => {
    if (categoryAnalytics.length === 0) return null;
    return categoryAnalytics.reduce((prev, curr) => (prev.percent < curr.percent ? prev : curr));
  }, [categoryAnalytics]);

  const bestDay = React.useMemo(() => {
    let maxDone = -1;
    let bDay = null;
    days.forEach(d => {
       let doneCount = d.tasks.filter(t => t.text.trim() !== '' && t.done).length;
       if (doneCount > maxDone && doneCount > 0) { maxDone = doneCount; bDay = d.name; }
    });
    return bDay;
  }, [days]);

  // === وظائف التفاعل (Interactions) ===
  const handleAddMasterTask = () => {
    if (masterInput.trim() === '') return;
    addMasterTask({ text: masterInput, categoryId: selectedCategory });
    setMasterInput('');
  };

  const handleRemoveMasterTask = (id) => {
    removeMasterTask(id);
  };

  const handleTaskTextChange = (dayId, taskId, newText) => {
    updateDayTask(dayId, taskId, { text: newText, masterId: newText.trim() === '' ? null : undefined });
  };

  const syncDayTaskToMaster = (dayId, taskId, text) => {
    if (text.trim() === '') return;
    const day = days.find(d => d.id === dayId);
    const task = day?.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.masterId) {
      const newMasterId = crypto.randomUUID();
      updateDayTask(dayId, taskId, { masterId: newMasterId });
      addMasterTask({ id: newMasterId, text: text, categoryId: 'other' });
    } else {
      updateMasterTask(task.masterId, { text });
    }
  };

  const handleTaskToggle = (dayId, taskId) => {
    const day = days.find(d => d.id === dayId);
    const task = day?.tasks.find(t => t.id === taskId);
    if (task) {
      updateDayTask(dayId, taskId, { done: !task.done });
    }
  };

  const handleAddTaskToDay = (dayId) => addDayTask(dayId);

  const handleDropOnDay = (e, targetDayId) => {
    e.preventDefault();
    if (!draggedItem || !data) return;
    if (draggedItem.type === 'day' && draggedItem.dayId === targetDayId) { setDraggedItem(null); return; }

    let textToMove = draggedItem.text;
    const newDays = [...data.days];
    const targetDay = newDays.find(d => d.id === targetDayId);
    let targetTask = targetDay.tasks.find(t => t.text.trim() === '');
    if (!targetTask) {
      targetTask = { id: crypto.randomUUID(), masterId: null, text: '', done: false };
      targetDay.tasks.push(targetTask);
    }

    targetTask.text = textToMove;
    targetTask.masterId = draggedItem.type === 'master' ? draggedItem.id : draggedItem.masterId;
    targetTask.done = draggedItem.type === 'day' ? draggedItem.done : false;

    if (draggedItem.type === 'day') {
      const sourceTask = newDays.find(d => d.id === draggedItem.dayId)?.tasks.find(t => t.id === draggedItem.id);
      if (sourceTask) {
        sourceTask.text = '';
        sourceTask.done = false;
        sourceTask.masterId = null;
      }
    }
    updateData({ days: newDays });
    setDraggedItem(null);
  };

  const handleDropOnCategory = (e, targetCategoryId) => {
    e.preventDefault();
    if (!draggedItem || !data) return;

    if (draggedItem.type === 'master') {
      updateMasterTask(draggedItem.id, { categoryId: targetCategoryId });
    } else if (draggedItem.type === 'day') {
      if (!masterTasks.some(m => m.id === draggedItem.masterId)) {
        addMasterTask({ text: draggedItem.text, categoryId: targetCategoryId });
      } else {
        updateMasterTask(draggedItem.masterId, { categoryId: targetCategoryId });
      }
      const newDays = [...data.days];
      const sourceTask = newDays.find(d => d.id === draggedItem.dayId)?.tasks.find(t => t.id === draggedItem.id);
      if (sourceTask) {
        sourceTask.text = '';
        sourceTask.done = false;
        sourceTask.masterId = null;
      }
      updateData({ days: newDays });
    }
    setDraggedItem(null);
  };

  const activeCategories = TASK_CATEGORIES.filter(category => masterTasks.some(t => t.categoryId === category.id));

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-[var(--text-muted)]">Loading Weekly Planner...</div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER (Planner View vs Dashboard View)
  // ==========================================
  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[var(--border-glass)] pb-6">

        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold gradient-text tracking-tight mb-2">
            Weekly Planner
          </h1>

          {/* عرض التواريخ التلقائية المتقدمة ورقم الأسبوع البارز */}
          <div className="flex flex-wrap items-center gap-4 mt-5">

            {/* شارة رقم الأسبوع (واضحة ومنفصلة) */}
            <div className="flex flex-col items-center justify-center bg-[var(--accent-primary)] text-white px-5 py-2 rounded-xl shadow-[var(--shadow-glow)] border border-white/20">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-90 mb-1">Week</span>
              <span className="text-3xl font-black leading-none">{weekData.weekNum}</span>
            </div>

            {/* بطاقة نطاق التاريخ */}
            <div className="flex items-center gap-3 bg-[var(--bg-card)] px-4 py-3 rounded-xl border border-[var(--border-glass)] shadow-sm">
              <CalendarRange size={20} className="text-[var(--accent-primary)]" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] mb-0.5">Current Schedule</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {formatDate(weekData.startDate)} <span className="text-[var(--text-muted)] mx-1">→</span> {formatDate(weekData.endDate)}
                </span>
              </div>
            </div>

          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher */}
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

          {/* الإعدادات (ترس اختيار بداية اليوم) */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2.5 rounded-xl glass-card transition-all ${showSettings ? 'text-[var(--accent-primary)] border-[var(--accent-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
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
                    className="w-full bg-black/20 border border-[var(--border-glass)] rounded-lg p-2 text-sm outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="sat" className="bg-[#1c1c1e]">Saturday</option>
                    <option value="sun" className="bg-[#1c1c1e]">Sunday</option>
                    <option value="mon" className="bg-[#1c1c1e]">Monday</option>
                    <option value="tue" className="bg-[#1c1c1e]">Tuesday</option>
                    <option value="wed" className="bg-[#1c1c1e]">Wednesday</option>
                    <option value="thu" className="bg-[#1c1c1e]">Thursday</option>
                    <option value="fri" className="bg-[#1c1c1e]">Friday</option>
                  </select>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* =======================================================
          [VIEW 1] ANALYTICS DASHBOARD (COMMAND CENTER)
          ======================================================= */}
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
                  <span className="flex items-center text-[#10b981]"><TrendingUp size={16} className="mr-1"/> +{globalStats.percentage - mockHistoricalData[3].completion}% vs last week</span>
                ) : (
                  <span className="flex items-center text-[#ef4444]"><TrendingDown size={16} className="mr-1"/> {globalStats.percentage - mockHistoricalData[3].completion}% vs last week</span>
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
                    You are falling behind in this category with only a <strong>{weakestCategory.percent}%</strong> completion rate across {weakestCategory.total} tasks. Focus here tomorrow!
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
                  <p className="text-sm text-[var(--text-muted)] relative z-10">This is your most productive day so far. Try scheduling heavy tasks on this day next week.</p>
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
                <div className="text-center p-8 border-2 border-dashed border-[var(--border-glass)] rounded-xl text-[var(--text-muted)]">No data to analyze yet.</div>
              ) : (
                <div className="space-y-5">
                  {categoryAnalytics.sort((a,b) => b.total - a.total).map(cat => (
                    <div key={cat.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: cat.color}}></span> {cat.label}</span>
                        <span className="text-[var(--text-muted)] font-medium">{cat.done} / {cat.total} ({cat.percent}%)</span>
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
                {mockHistoricalData.map((data, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 group w-full">
                    <div className="w-full flex justify-center h-40 relative">
                      <div className="w-[80%] max-w-[40px] bg-[var(--border-glass)] rounded-t-md absolute bottom-0 transition-all duration-500 chart-bar-hover" style={{ height: `${data.completion}%` }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-white">{data.completion}%</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{data.weekId}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-2 group w-full">
                  <div className="w-full flex justify-center h-40 relative">
                    <div className="w-[80%] max-w-[40px] rounded-t-md absolute bottom-0 transition-all duration-1000 chart-bar-hover" style={{ height: `${globalStats.percentage}%`, background: 'var(--gradient-hero)', boxShadow: 'var(--shadow-glow)' }}>
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

      {/* =======================================================
          [VIEW 2] PLANNER (MASTER TASKS & DAYS GRID)
          ======================================================= */}
      {activeView === 'planner' && (
        <div className="animate-fade-in">
          <div className="glass-card p-5 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 border-b border-[var(--border-glass)] pb-3">
              <div className="flex items-center gap-2">
                <ListTodo size={24} className="text-[var(--accent-primary)]" />
                <h2 className="text-xl font-bold uppercase tracking-wide text-[var(--accent-primary)]">Master Task List</h2>
              </div>

              {/* نسبة إنجاز الأسبوع الكلية (تم إعادتها) */}
              <div className="flex items-center gap-4 bg-black/10 px-4 py-2 rounded-xl border border-[var(--border-glass)] shadow-inner">
                <div className="flex flex-col text-sm">
                  <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider font-bold">Weekly Progress</span>
                  <span className="font-bold text-[var(--text-primary)]">{globalStats.completed} / {globalStats.total} Tasks</span>
                </div>
                <div className="w-24 md:w-32 h-2.5 bg-black/30 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{ width: `${globalStats.percentage}%`, background: 'var(--gradient-success)' }}
                  />
                </div>
                <span className="font-extrabold text-[var(--text-primary)] w-10 text-right">
                  {globalStats.percentage}%
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex flex-1 relative items-center">
                <input
                  type="text" value={masterInput} onChange={e => setMasterInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddMasterTask() }}
                  placeholder="Type a new task and press Enter..."
                  className="w-full pl-4 pr-32 py-2.5 rounded-lg bg-black/10 border border-[var(--border-glass)] focus:border-[var(--accent-primary)] outline-none transition text-sm sm:text-base"
                />
                <div className="absolute right-2 flex items-center">
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="h-8 pl-2 pr-7 py-0 text-xs sm:text-sm bg-[var(--bg-card)] border-none rounded cursor-pointer outline-none focus:ring-1 focus:ring-[var(--accent-primary)] text-[var(--text-primary)]">
                    {TASK_CATEGORIES.map(cat => ( <option key={cat.id} value={cat.id} className="bg-[#1c1c1e] text-white">{cat.label}</option> ))}
                  </select>
                </div>
              </div>
              <button onClick={handleAddMasterTask} className="px-6 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white font-bold hover:brightness-110 transition shadow-lg shrink-0">Add Task</button>
            </div>

            <div className="flex overflow-x-auto gap-4 custom-scrollbar pb-4 items-start pt-2">
              {masterTasks.length === 0 && (
                <div className="w-full flex items-center justify-center text-[var(--text-muted)] text-sm italic py-8 border-2 border-dashed border-[var(--border-glass)] rounded-xl">
                  Your master task list is empty. Add a task above to get started!
                </div>
              )}

              {activeCategories.map(category => {
                const catTasks = masterTasks.filter(t => t.categoryId === category.id);
                return (
                  <div key={category.id} onDragOver={e => e.preventDefault()} onDrop={e => handleDropOnCategory(e, category.id)} className="min-w-[240px] max-w-[240px] bg-black/10 border border-[var(--border-glass)] rounded-xl p-3 flex flex-col gap-2 transition-colors hover:border-[var(--border-glass-hover)]">
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
                        <div key={task.id} draggable onDragStart={(e) => setDraggedItem({ type: 'master', id: task.id, text: task.text, categoryId: task.categoryId })}
                          className={`relative overflow-hidden px-3 py-2 border rounded-lg flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all ${isFullyDone ? 'border-[#10b981] bg-[#10b981]/10' : 'bg-[var(--bg-card)] border-[var(--border-glass)] hover:border-[var(--accent-primary)] hover:shadow-lg'}`}
                        >
                          {isScheduled && !isFullyDone && stat.done > 0 && ( <div className="absolute left-0 top-0 bottom-0 bg-[#10b981]/20 transition-all duration-500" style={{ width: `${progressPercent}%` }} /> )}
                          <div className="relative z-10 flex items-center gap-2 w-full">
                            <GripVertical size={14} className={isFullyDone ? 'text-[#10b981]' : 'text-[var(--text-muted)] shrink-0'} />
                            <span className={`text-sm font-medium truncate ${isFullyDone ? 'text-[#10b981] line-through' : ''}`} title={task.text}>{task.text}</span>
                            <div className="flex-1" />
                            {isScheduled && ( <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-colors shrink-0 ${isFullyDone ? 'bg-[#10b981] text-white' : 'bg-black/20 text-[var(--text-muted)]'}`}>{stat.done}/{stat.total}</span> )}
                              <button onClick={() => handleRemoveMasterTask(task.id)} className="text-red-400 hover:text-red-300 transition-colors ml-1 shrink-0" title="Delete Task"><X size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sortedDays.filter(Boolean).map((day) => {
              if (!day || !day.tasks) return null;
              
              const dayStats = day.tasks.reduce((acc, t) => {
                 if(t.text.trim() !== '') { acc.total++; if(t.done) acc.done++; }
                 return acc;
              }, {total: 0, done: 0});
              const dayPercent = dayStats.total === 0 ? 0 : Math.round((dayStats.done / dayStats.total) * 100);

              // جلب التاريخ المخصص لهذا اليوم من النظام التلقائي
              const autoDate = weekData.assignedDates[day.id];

              return (
                <div key={day.id} className={`glass-card p-5 flex flex-col h-[500px] transition-all duration-500 ${dayPercent === 100 && dayStats.total > 0 ? 'border-[#10b981]/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : ''}`} onDragOver={e => e.preventDefault()} onDrop={e => handleDropOnDay(e, day.id)}>
                  <div className="flex justify-between items-center mb-4 border-b border-[var(--border-glass)] pb-3">
                    <h2 className={`text-xl font-bold uppercase tracking-wide transition-colors ${dayPercent === 100 && dayStats.total > 0 ? 'text-[#10b981]' : 'text-[var(--accent-primary)]'}`}>{day.name}</h2>

                    {/* عرض التاريخ التلقائي هنا بدلاً من الإدخال اليدوي */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-[var(--text-muted)] mb-0.5 uppercase tracking-wider font-bold">Date</span>
                      <span className="text-sm font-extrabold text-[var(--text-primary)] bg-black/20 px-2 py-0.5 rounded border border-white/5">
                        {formatDayCardDate(autoDate)}
                      </span>
                    </div>
                  </div>

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
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
                    <div className="flex flex-col gap-2">
                      {day.tasks.map((task) => {
                        const hasText = task.text.trim() !== '';
                        return (
                          <div key={task.id} className={`flex items-center gap-2 group p-1 -mx-1 rounded-md transition-all duration-300 ${task.done && hasText ? 'bg-[#10b981]/10 border border-[#10b981]/20' : 'border border-transparent'}`} draggable={hasText} onDragStart={(e) => { if (!hasText) { e.preventDefault(); } else { setDraggedItem({ type: 'day', dayId: day.id, id: task.id, text: task.text, masterId: task.masterId, done: task.done }); } }}>
                            <div className={`cursor-grab active:cursor-grabbing transition-opacity ${hasText ? 'opacity-30 group-hover:opacity-100 text-[var(--accent-primary)]' : 'opacity-0'}`}><GripVertical size={14} /></div>
                            <button onClick={() => handleTaskToggle(day.id, task.id)} className={`w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center transition-all duration-300 ${task.done ? 'bg-[#10b981] border-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-[var(--text-muted)] group-hover:border-[var(--accent-primary)]'}`}>
                              {task.done && <Check size={14} className="text-white" />}
                            </button>
                            <input type="text" value={task.text} onChange={(e) => handleTaskTextChange(day.id, task.id, e.target.value)} onBlur={(e) => syncDayTaskToMaster(day.id, task.id, e.target.value)} placeholder="..." className={`w-full bg-transparent border-b border-transparent focus:border-[var(--accent-primary)] py-1 text-sm outline-none transition-all duration-300 ${task.done ? 'text-[#10b981] line-through font-medium opacity-80' : 'text-[var(--text-primary)]'}`} />
                          </div>
                        );
                      })}
                      <button onClick={() => handleAddTaskToDay(day.id)} className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)] w-fit px-2 py-1 rounded transition-colors"><Plus size={14} /> Add Task Slot</button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="glass-card p-5 flex flex-col h-[500px] bg-[var(--bg-card-hover)]">
               <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-glass)] pb-3">
                  <Edit3 size={20} className="text-[var(--accent-primary)]" />
                  <h2 className="text-xl font-bold uppercase tracking-wide text-[var(--accent-primary)]">Notes</h2>
               </div>
               <textarea value={notes} onChange={(e) => updateData({ notes: e.target.value })} placeholder="Write your important notes here..." className="flex-1 w-full bg-transparent border-none outline-none resize-none custom-scrollbar text-[var(--text-primary)] leading-relaxed" />
            </div>
          </div>

          <div className="mt-6 glass-card p-6 border-l-4 border-l-[var(--accent-primary)]">
            <h2 className="text-lg font-bold uppercase tracking-wide text-[var(--accent-primary)] mb-3">Reflections:</h2>
            <textarea value={reflections} onChange={(e) => updateData({ reflections: e.target.value })} placeholder="What did you achieve? What needs improvement for next week?" className="w-full h-24 bg-transparent border-none outline-none resize-none custom-scrollbar text-[var(--text-primary)] leading-relaxed" />
          </div>

        </div>
      )}

    </div>
  );
}