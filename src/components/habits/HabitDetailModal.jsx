import React, { useMemo, useState, useEffect } from 'react';
import {
  X, Flame, Star, Coffee, Brain, Edit2, Check, Sparkles,
  Heart, Dumbbell, Briefcase, BookOpen, Moon, Users, DollarSign, Target,
  ChevronLeft,
} from 'lucide-react';
import { getLocalDateString } from '../../stores/useHabitStore';
import EmojiPicker from './EmojiPicker';

const CATEGORIES = [
  { id: 'health',       label: 'Health',       icon: <Heart size={14} /> },
  { id: 'fitness',      label: 'Fitness',      icon: <Dumbbell size={14} /> },
  { id: 'productivity', label: 'Productivity', icon: <Briefcase size={14} /> },
  { id: 'learning',     label: 'Learning',     icon: <BookOpen size={14} /> },
  { id: 'spirituality', label: 'Spirituality', icon: <Sparkles size={14} /> },
  { id: 'islamic',      label: 'Islamic',      icon: <Moon size={14} /> },
  { id: 'social',       label: 'Social',       icon: <Users size={14} /> },
  { id: 'finance',      label: 'Finance',      icon: <DollarSign size={14} /> },
  { id: 'mindfulness',  label: 'Mindfulness',  icon: <Sparkles size={14} /> },
  { id: 'other',        label: 'Other',        icon: <Target size={14} /> },
];

export default function HabitDetailModal({ habit, onClose, onUpdateHabit, onDeleteHabit, onLogEntry }) {
  const { name, icon, stats } = habit;
  const [view, setView] = useState('detail');

  useEffect(() => {
    const nav = document.getElementById('main-navbar');
    if (nav) nav.style.display = 'none';
    return () => { if (nav) nav.style.display = ''; };
  }, []); // 'detail' | 'edit'

  // ── Edit States ──
  const [editName, setEditName] = useState(name);
  const [editIcon, setEditIcon] = useState(icon);
  const [editGrace, setEditGrace] = useState(habit.graceDaysAllowance ?? 0);
  const [editStartDate, setEditStartDate] = useState(stats.startDateStr || '');
  const [editCategory, setEditCategory] = useState(habit.category || 'health');
  const [editTargetType, setEditTargetType] = useState(habit.targetType || 'boolean');
  const [editTargetValue, setEditTargetValue] = useState(habit.targetValue || 1);
  const [editUnit, setEditUnit] = useState(habit.unit || habit.targetUnit || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSaveEdit = () => {
    if (onUpdateHabit) {
      onUpdateHabit(habit.id, {
        name: editName.trim(),
        icon: editIcon,
        graceDaysAllowance: Number(editGrace),
        startDate: editStartDate,
        category: editCategory,
        targetType: editTargetType,
        targetValue: editTargetType === 'numeric' ? Number(editTargetValue) : null,
        unit: editTargetType === 'numeric' ? editUnit.trim() : null,
      });
    }
    setView('detail');
  };

  // Generate Calendar Matrix (Month-by-Month or padded linear calendar)
  const calendarDays = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Safety check against missing start date
    const startStr = stats.startDateStr || getLocalDateString(today);
    const startDateObj = new Date(startStr);
    startDateObj.setHours(0,0,0,0);
    
    // Calculate how many days we need to render to show the entire history from start date
    const daysSinceStart = Math.max(28, Math.floor((today - startDateObj) / (1000 * 60 * 60 * 24)) + 1);

    // Padding the grid to align with weeks (Optional, but let's just create a list of days and we'll CSS Grid them into 7 columns)
    const cells = [];
    
    // Fill from start date to today
    for (let i = 0; i < daysSinceStart; i++) {
      const d = new Date(startDateObj);
      d.setDate(d.getDate() + i);
      const str = getLocalDateString(d);
      
      const entry = habit.history?.[str];
      let status = 'empty';
      if (entry) {
        if (entry.status === 'completed') status = 'completed';
        else if (entry.status === 'missed') status = 'missed';
        else if (entry.status === 'skipped') status = 'skipped';
      }
      
      cells.push({ date: str, status, dateObj: d, isFuture: d > today });
    }
    return cells;
  }, [habit.history, stats.startDateStr]);

  // Generate Monthly Aggregate Data
  const monthlyStats = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const startStr = stats.startDateStr || getLocalDateString(today);
    const startDateObj = new Date(startStr);
    startDateObj.setHours(0,0,0,0);
    
    // Create list of months from start to today
    const monthsData = [];
    let currentCursor = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
    const endCursor = new Date(today.getFullYear(), today.getMonth(), 1);
    
    while (currentCursor <= endCursor) {
      monthsData.push({
        year: currentCursor.getFullYear(),
        month: currentCursor.getMonth(),
        label: currentCursor.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        completed: 0,
        validDays: 0,
        rate: 0,
        delta: null
      });
      currentCursor.setMonth(currentCursor.getMonth() + 1);
    }
    
    // Fill data
    monthsData.forEach((mData, idx) => {
      // Calculate valid days in this month
      const isStartMonth = mData.year === startDateObj.getFullYear() && mData.month === startDateObj.getMonth();
      const isCurrentMonth = mData.year === today.getFullYear() && mData.month === today.getMonth();
      
      let startDay = isStartMonth ? startDateObj.getDate() : 1;
      let endDay = isCurrentMonth ? today.getDate() : new Date(mData.year, mData.month + 1, 0).getDate();
      
      mData.validDays = Math.max(0, endDay - startDay + 1);
      
      // Count completions
      for (let d = startDay; d <= endDay; d++) {
        const checkDate = new Date(mData.year, mData.month, d);
        const str = getLocalDateString(checkDate);
        if (habit.history?.[str]?.status === 'completed') {
          mData.completed++;
        }
      }
      
      // Calculate Rate
      mData.rate = mData.validDays > 0 ? Math.round((mData.completed / mData.validDays) * 100) : 0;
      
      // Calculate Delta (MoM)
      if (idx > 0) {
        const prevData = monthsData[idx - 1];
        mData.delta = mData.rate - prevData.rate;
      }
    });
    
    // Reverse to show newest first
    return monthsData.reverse();
  }, [habit.history, stats.startDateStr]);

  // Insights generation based on Mood/Energy context
  const contextInsights = useMemo(() => {
    const energyMap = { high: 0, medium: 0, low: 0 };
    const moodMap = { great: 0, okay: 0, bad: 0 };
    let totalContexts = 0;

    Object.values(habit.history || {}).forEach(entry => {
      if (entry.status === 'completed') {
        if (entry.energyLevel) { energyMap[entry.energyLevel]++; totalContexts++; }
        if (entry.mood) { moodMap[entry.mood]++; totalContexts++; }
      }
    });

    const insights = [];
    if (totalContexts > 2) {
      if (energyMap.high > energyMap.low) insights.push("You crush this habit when your energy is High! ⚡");
      if (moodMap.great > moodMap.bad) insights.push("Good mood days strongly correlate with success here. 🤩");
      if (energyMap.low > 0) insights.push("Even on Low Energy days, you pushed through. That builds grit. 🔋");
    } else {
      insights.push("Start tracking your mood & energy when completing this habit to see smart insights here! 🧠");
    }
    return insights;
  }, [habit.history]);

  // ─────────────────────────────────────────────────────
  //  EDIT VIEW
  // ─────────────────────────────────────────────────────
  if (view === 'edit') {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="glass-card w-full max-w-lg flex flex-col overflow-hidden shadow-2xl max-h-[95vh]">
          {/* Edit Header */}
          <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-white/10 bg-white/5 shrink-0">
            <button onClick={() => setView('detail')} className="p-2 rounded-full hover:bg-white/10 text-white/50 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 flex-1 min-w-0">
              <Edit2 size={18} className="text-violet-400 shrink-0" />
              <span className="truncate">Edit Habit</span>
            </h2>
            <button onClick={() => setView('detail')} className="p-2 rounded-full hover:bg-white/10 text-white/50 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Edit Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">

            {/* Icon & Name */}
            <div className="flex gap-3 items-end">
              <div className="flex flex-col gap-1.5 shrink-0">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Icon</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-14 h-14 bg-black/30 border border-white/10 rounded-xl text-3xl flex items-center justify-center hover:border-violet-500/50 focus:outline-none focus:border-violet-500 transition-all hover:scale-105 active:scale-95"
                  >
                    {editIcon}
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 z-50">
                      <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                      <div className="relative">
                        <EmojiPicker
                          value={editIcon}
                          onChange={(emoji) => { setEditIcon(emoji); setShowEmojiPicker(false); }}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Habit Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Habit name..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-base focus:outline-none focus:border-violet-500 transition-colors placeholder-white/20"
                />
              </div>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Start Date</label>
              <input
                type="date"
                value={editStartDate}
                onChange={e => setEditStartDate(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-violet-500 transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setEditCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm font-bold ${
                      editCategory === cat.id
                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                        : 'bg-black/30 border-white/5 text-white/40 hover:bg-white/5 hover:text-white/70'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Goal Type</label>
              <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setEditTargetType('boolean')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    editTargetType === 'boolean' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  ✓ Yes / No
                </button>
                <button
                  type="button"
                  onClick={() => setEditTargetType('numeric')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    editTargetType === 'numeric' ? 'bg-fuchsia-500/20 text-fuchsia-300 shadow-lg' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  # Amount
                </button>
              </div>
            </div>

            {/* Target Value + Unit */}
            {editTargetType === 'numeric' && (
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Daily Target</label>
                  <input
                    type="number"
                    min="1"
                    value={editTargetValue}
                    onChange={e => setEditTargetValue(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-fuchsia-500 transition-colors"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Unit</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={e => setEditUnit(e.target.value)}
                    placeholder="ml, pages, steps…"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-fuchsia-500 transition-colors placeholder-white/20"
                  />
                </div>
              </div>
            )}

            {/* Grace Days */}
            <div className="flex flex-col gap-2 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 rounded-2xl border border-emerald-500/20">
              <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-between">
                Grace Days / Month
                <span className="text-base font-black text-emerald-300">{editGrace}</span>
              </label>
              <input
                type="range"
                min="0" max="10"
                value={editGrace}
                onChange={e => setEditGrace(e.target.value)}
                className="w-full accent-emerald-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-white/30">
                <span>0 (Strict)</span>
                <span>10 (Flexible)</span>
              </div>
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="shrink-0 flex gap-3 p-4 sm:p-5 border-t border-white/10 bg-black/30">
            <button
              type="button"
              onClick={() => setView('detail')}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={!editName.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}
            >
              <Check size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────
  //  DETAIL VIEW
  // ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl relative max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-3xl bg-black/20 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 truncate">
                {name}
              </h2>
              {habit.category && (
                <span className="text-xs font-bold text-white/30 uppercase tracking-widest capitalize">{habit.category}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={() => setView('edit')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-colors font-bold text-xs border border-violet-500/20"
            >
              <Edit2 size={14} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">

          {/* Top Stats Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            <div className="bg-black/20 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center border border-white/5 gap-1">
              <Flame size={18} className="text-orange-500" />
              <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest text-center leading-tight">Current<br/>Streak</span>
              <span className="text-xl sm:text-2xl font-black text-white">{stats.currentStreak}</span>
            </div>
            <div className="bg-black/20 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center border border-white/5 gap-1">
              <Star size={18} className="text-yellow-500" />
              <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest text-center leading-tight">Best<br/>Streak</span>
              <span className="text-xl sm:text-2xl font-black text-white">{stats.longestStreak}</span>
            </div>
            <div className="bg-black/20 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center border border-fuchsia-500/20 gap-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-fuchsia-500/5" />
              <span className="text-fuchsia-400 text-base sm:text-lg font-black">{stats.yearlyAdherenceRate}%</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest text-center leading-tight">Yearly<br/>Rate</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/30">{stats.totalCompletedThisYear}/{stats.daysPassedThisYear}d</span>
            </div>
            <div className="bg-black/20 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center border border-white/5 gap-1">
              <span className="text-emerald-400 text-base sm:text-lg font-black">{stats.successRate}%</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-widest text-center leading-tight">All-Time<br/>Success</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/30">{stats.totalCompleted}/{stats.daysPassedSinceStart}d</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center border border-emerald-500/20 gap-1 col-span-3 sm:col-span-1">
              <Coffee size={18} className="text-emerald-400" />
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest text-center leading-tight">Grace<br/>Left</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300">{stats.graceDaysBalance}</span>
            </div>
          </div>

          {/* Contextual Insights */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[50px] pointer-events-none" />
            <h3 className="text-xs font-bold text-violet-300 flex items-center gap-2 uppercase tracking-widest mb-3">
              <Brain size={14} /> Neural Tracking Insights
            </h3>
            <ul className="space-y-1.5">
              {contextInsights.map((insight, idx) => (
                <li key={idx} className="text-sm text-white/70 font-medium leading-relaxed flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5 shrink-0">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          {/* Monthly Performance Table */}
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-white/20" />
              Monthly Adherence
              <span className="flex-1 h-px bg-white/10" />
            </h3>
            <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white/5 text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5">
                    <tr>
                      <th className="p-3 sm:p-4 font-bold">Month</th>
                      <th className="p-3 sm:p-4 font-bold text-center">Done / Days</th>
                      <th className="p-3 sm:p-4 font-bold text-right">Rate</th>
                      <th className="p-3 sm:p-4 font-bold text-right">Δ MoM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {monthlyStats.map((item) => (
                      <tr key={item.label} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 sm:p-4 font-bold text-white/80">{item.label}</td>
                        <td className="p-3 sm:p-4 text-center">
                          <span className="text-emerald-400 font-bold">{item.completed}</span>
                          <span className="text-white/30 text-xs"> / {item.validDays}d</span>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 sm:w-16 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full transition-all ${item.rate >= 80 ? 'bg-emerald-500' : item.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${item.rate}%` }}
                              />
                            </div>
                            <span className={`font-bold ${item.rate >= 80 ? 'text-emerald-400' : item.rate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {item.rate}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 text-right">
                          {item.delta !== null ? (
                            <span className={`inline-flex items-center gap-0.5 font-bold text-xs ${item.delta > 0 ? 'text-emerald-400' : item.delta < 0 ? 'text-red-400' : 'text-white/30'}`}>
                              {item.delta > 0 ? '↑' : item.delta < 0 ? '↓' : '−'}{item.delta > 0 ? '+' : ''}{item.delta}%
                            </span>
                          ) : (
                            <span className="text-white/20 text-xs font-bold">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {monthlyStats.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-white/30 font-bold text-sm">No history yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Full Calendar Matrix */}
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-white/20" />
              Calendar Trajectory
              <span className="flex-1 h-px bg-white/10" />
            </h3>

            <div className="bg-black/20 rounded-2xl border border-white/5 p-3 sm:p-4">
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {['S','M','T','W','T','F','S'].map((day, i) => (
                  <div key={`h-${i}`} className="text-center text-[10px] font-bold text-white/30 uppercase pb-1">{day}</div>
                ))}
                {calendarDays.length > 0 && Array.from({ length: calendarDays[0].dateObj.getDay() }).map((_, i) => (
                  <div key={`pad-${i}`} className="w-full aspect-square" />
                ))}
                {calendarDays.map((cell) => {
                  let cls = 'bg-white/5 text-white/30';
                  if (cell.isFuture) cls = 'bg-transparent border border-white/5 border-dashed pointer-events-none opacity-20 text-transparent';
                  else if (cell.status === 'completed') cls = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] hover:scale-110 z-10 border border-emerald-400/30 text-white font-black';
                  else if (cell.status === 'missed') cls = 'bg-red-500/20 border border-red-500/30 text-red-300 font-bold';
                  else if (cell.status === 'skipped') cls = 'bg-yellow-500/25 border border-yellow-500/40 text-yellow-300 font-bold';

                  return (
                    <div
                      key={cell.date}
                      onClick={() => {
                        if (!onLogEntry || cell.isFuture) return;
                        let nextStatus = 'completed';
                        if (cell.status === 'completed') nextStatus = 'missed';
                        else if (cell.status === 'missed') nextStatus = 'skipped';
                        else if (cell.status === 'skipped') nextStatus = 'pending';
                        onLogEntry(habit.id, cell.date, { status: nextStatus, timestamp: new Date().toISOString() });
                      }}
                      title={`${cell.date}: ${cell.status}${cell.isFuture ? ' (Future)' : ' • Click to toggle'}`}
                      className={`w-full aspect-square rounded-full transition-all ${!cell.isFuture ? 'hover:ring-2 hover:ring-white/40 cursor-pointer' : ''} flex items-center justify-center ${cls}`}
                    >
                      <span className="text-[9px] sm:text-[11px] leading-none">{cell.dateObj.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] font-bold text-white/40 uppercase tracking-widest justify-end">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-white/5" /> Pending</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500/30" /> Missed</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500/40" /> Grace</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Done</div>
            </div>
          </div>

        </div>

        {/* Danger Zone Footer */}
        <div className="bg-black/40 border-t border-red-500/20 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 justify-between items-center rounded-b-2xl shrink-0">
          <div className="text-left w-full sm:w-auto">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest">Danger Zone</h3>
            <p className="text-[10px] text-white/30 mt-0.5">Archive hides it · Delete is permanent</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => { if (onUpdateHabit) onUpdateHabit(habit.id, { isHidden: true }); onClose(); }}
              className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 font-bold transition-colors text-xs uppercase tracking-widest"
            >
              Archive
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete "${habit.name}" permanently? All history will be lost.`)) {
                  if (onDeleteHabit) onDeleteHabit(habit.id);
                }
              }}
              className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-bold transition-colors text-xs uppercase tracking-widest"
            >
              Delete
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
