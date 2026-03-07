import React, { useMemo, useState } from 'react';
import { X, Flame, Star, Coffee, Brain, Edit2, Check, Sparkles } from 'lucide-react';
import { getLocalDateString } from '../../stores/useHabitStore';
import usePreferences from '../../hooks/usePreferences';
import { t } from '../../config/translations';

const ICONS = ['💧', '📚', '🏃‍♂️', '🧘‍♀️', '🍎', '✍️', ' 기도', '🛌', '💪', '💻'];

export default function HabitDetailModal({ habit, onClose, onUpdateHabit, onDeleteHabit, onLogEntry }) {
  const { language } = usePreferences();
  const L = language;
  const { name, icon, stats } = habit;
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit States
  const [editName, setEditName] = useState(name);
  const [editIcon, setEditIcon] = useState(icon);
  const [editGrace, setEditGrace] = useState(habit.graceDaysAllowance || 0);
  const [editStartDate, setEditStartDate] = useState(stats.startDateStr || '');

  const handleSaveEdit = () => {
    if (onUpdateHabit) {
      onUpdateHabit(habit.id, {
        name: editName.trim(),
        icon: editIcon,
        graceDaysAllowance: Number(editGrace),
        startDate: editStartDate
      });
    }
    setIsEditing(false);
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="glass-card w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl relative max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-4 flex-grow text-white">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full bg-black/20 p-4 rounded-xl">
                 <div className="flex items-center gap-3 w-full sm:w-auto">
                   <select 
                      value={editIcon} 
                      onChange={e => setEditIcon(e.target.value)}
                      className="w-12 h-12 shrink-0 bg-black/50 border border-white/10 rounded-xl text-2xl flex items-center justify-center text-center appearance-none focus:outline-none focus:border-violet-500"
                    >
                      {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                   <input 
                     type="text" 
                     value={editName}
                     onChange={e => setEditName(e.target.value)}
                     className="flex-grow w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-xl focus:outline-none focus:border-violet-500"
                   />
                 </div>
                 
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0 shrink-0">
                   <div className="flex items-center gap-4 w-full sm:w-auto">
                     <div className="flex flex-col flex-1 sm:flex-none">
                       <label className="text-[10px] uppercase font-bold text-fuchsia-400 mb-1">Start Date</label>
                       <input 
                         type="date" 
                         value={editStartDate}
                         onChange={e => setEditStartDate(e.target.value)}
                         className="w-full sm:w-auto bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-white font-bold focus:outline-none"
                         style={{ colorScheme: 'dark' }}
                       />
                     </div>
                     <div className="flex flex-col w-20 shrink-0">
                       <label className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Grace/Mo</label>
                       <input 
                         type="number" 
                         min="0" max="15" 
                         value={editGrace}
                         onChange={e => setEditGrace(e.target.value)}
                         className="w-full bg-black/30 border border-emerald-500/20 rounded-lg px-2 py-1.5 text-emerald-300 font-bold focus:outline-none"
                       />
                     </div>
                   </div>
                   
                   <button onClick={handleSaveEdit} className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-6 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 font-bold transition-colors">
                     <Check size={20} />
                     <span className="sm:hidden">Save Habit</span>
                   </button>
                 </div>
              </div>
            ) : (
              <>
                <span className="text-3xl bg-black/20 w-12 h-12 rounded-xl flex items-center justify-center">{icon}</span>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  {name}
                </h2>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="ml-2 p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Edit Habit"
                >
                  <Edit2 size={16} />
                </button>
              </>
            )}
          </div>
          {!isEditing && (
            <button onClick={onClose} className="p-2 ml-4 rounded-full hover:bg-white/10 text-white/50 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-8" dir="ltr">
          
          {/* Top Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-black/20 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
              <Flame size={20} className="text-orange-500 mb-1" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Current<br/>Streak</span>
              <span className="text-2xl font-black text-white">{stats.currentStreak}</span>
            </div>
            
            <div className="bg-black/20 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
              <Star size={20} className="text-yellow-500 mb-1" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Longest<br/>Streak</span>
              <span className="text-2xl font-black text-white">{stats.longestStreak}</span>
            </div>

            <div className="bg-black/20 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-fuchsia-500/5 group-hover:bg-fuchsia-500/10 transition-colors" />
              <span className="text-fuchsia-400 text-lg font-black mb-1">{stats.yearlyAdherenceRate}%</span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Yearly<br/>Adherence</span>
              <span className="text-[10px] font-bold text-white/30 mt-1">{stats.totalCompletedThisYear} / {stats.daysPassedThisYear}d</span>
            </div>
            
            <div className="bg-black/20 rounded-2xl p-4 flex flex-col items-center justify-center border border-white/5">
              <span className="text-emerald-400 text-lg font-black mb-1">{stats.successRate}%</span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">All-Time<br/>Success</span>
              <span className="text-[10px] font-bold text-white/30 mt-1">{stats.totalCompleted} / {stats.daysPassedSinceStart}d</span>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl p-4 flex flex-col items-center justify-center border border-emerald-500/20">
              <Coffee size={20} className="text-emerald-400 mb-1" />
              <span className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest text-center">Grace<br/>Ends</span>
              <span className="text-2xl font-black text-emerald-300">{stats.graceDaysBalance}</span>
            </div>
          </div>

          {/* Contextual Insights */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[50px] pointer-events-none" />
            <h3 className="text-xs font-bold text-violet-300 flex items-center gap-2 uppercase tracking-widest mb-3">
              <Brain size={14} /> Neural Tracking Insights
            </h3>
            <ul className="space-y-2">
              {contextInsights.map((insight, idx) => (
                <li key={idx} className="text-sm text-white/70 font-medium leading-relaxed">
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          {/* Monthly Performance Table */}
          <div>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
              Monthly Adherence Analysis
            </h3>
            <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="p-4 font-bold">Month</th>
                    <th className="p-4 font-bold text-center">Days Completed</th>
                    <th className="p-4 font-bold text-right">Commitment %</th>
                    <th className="p-4 font-bold text-right">MoM Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {monthlyStats.map((item) => (
                    <tr key={item.label} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-bold text-white/80">{item.label}</td>
                      <td className="p-4 text-center">
                        <span className="text-emerald-400 font-bold">{item.completed}</span>
                        <span className="text-white/30 text-xs"> / {item.validDays}d</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                           <div className="flex-1 max-w-[60px] h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.rate}%` }} />
                           </div>
                           <span className="font-bold text-white">{item.rate}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {item.delta !== null ? (
                          <div className={`inline-flex items-center gap-1 font-bold text-xs ${item.delta > 0 ? 'text-emerald-400' : item.delta < 0 ? 'text-red-400' : 'text-white/30'}`}>
                            {item.delta > 0 ? '↑' : item.delta < 0 ? '↓' : '−'} {item.delta > 0 ? '+' : ''}{item.delta}%
                          </div>
                        ) : (
                          <span className="text-white/20 text-xs font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {monthlyStats.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-white/30 font-bold text-sm">
                        No history available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Calendar Matrix */}
          <div>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
              Full Calendar Trajectory Since <span className="text-white">{new Date(stats.startDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</span>
            </h3>
            
            <div className="bg-black/20 rounded-2xl border border-white/5 p-4 md:p-6">
              <div className="grid grid-cols-7 gap-1 md:gap-2 max-w-full overflow-hidden">
                 {/* Weekday Headers */}
                 {['S','M','T','W','T','F','S'].map((day, i) => (
                   <div key={`header-${i}`} className="text-center text-[10px] font-bold text-white/30 uppercase pb-2">
                     {day}
                   </div>
                 ))}

                 {/* Padding to align the first day to its correct weekday */}
                 {calendarDays.length > 0 && Array.from({ length: calendarDays[0].dateObj.getDay() }).map((_, i) => (
                   <div key={`pad-${i}`} className="w-full aspect-square" />
                 ))}

                 {/* Actual Cells */}
                 {calendarDays.map((cell) => {
                   let bgColor = 'bg-white/5'; // empty
                   let textColor = 'text-white/30';

                   if (cell.isFuture) {
                     bgColor = 'bg-transparent border border-white/5 border-dashed pointer-events-none opacity-20';
                   } else if (cell.status === 'completed') {
                     bgColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] hover:scale-110 z-10 border border-emerald-400/50';
                     textColor = 'text-white font-black';
                   } else if (cell.status === 'missed') {
                     bgColor = 'bg-red-500/20 border border-red-500/30 text-red-300';
                     textColor = 'text-red-300 font-bold';
                   } else if (cell.status === 'skipped') {
                     bgColor = 'bg-yellow-500/30 border border-yellow-500/50';
                     textColor = 'text-yellow-300 font-bold';
                   }

                   return (
                     <div
                        key={cell.date}
                        onClick={() => {
                          if (!onLogEntry || cell.isFuture) return;
                          let nextStatus = 'completed';
                          if (cell.status === 'completed') nextStatus = 'missed';
                          else if (cell.status === 'missed') nextStatus = 'skipped';
                          else if (cell.status === 'skipped') nextStatus = 'pending';
                          
                          onLogEntry(habit.id, cell.date, { 
                            status: nextStatus,
                            timestamp: new Date().toISOString()
                          });
                        }}
                        title={`${cell.date}: ${cell.status}${cell.isFuture ? ` (${t('status_future', L)})` : ` • ${t('click_to_toggle', L)}`}`}
                        className={`w-7 h-7 sm:w-10 sm:h-10 mx-auto rounded-full transition-all ${!cell.isFuture ? 'hover:ring-2 hover:ring-white/50 cursor-pointer' : ''} relative flex items-center justify-center ${bgColor}`}
                     >
                       <span className={`text-[10px] sm:text-xs ${textColor} z-10 relative`}>
                         {cell.dateObj.getDate()}
                       </span>
                     </div>
                   );
                 })}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] font-bold text-white/40 uppercase tracking-widest justify-end">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-white/5" /> {t('status_pending', L)}</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-500/30" /> {t('status_missed', L)}</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-yellow-500/50 flex items-center justify-center text-[8px] text-white font-bold">G</div> {t('status_grace', L)}</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">✓</div> {t('status_success', L)}</div>
            </div>
          </div>

        </div>
        
        {/* Danger Zone Footer (Shrink protected) */}
        <div className="bg-black/40 border-t border-red-500/20 p-6 flex flex-col sm:flex-row gap-4 justify-between items-center rounded-b-2xl shrink-0">
          <div className="text-left w-full sm:w-auto">
             <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Danger Zone</h3>
             <p className="text-[10px] text-white/40">Archiving hides it. Deleting is permanent.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                if (onUpdateHabit) onUpdateHabit(habit.id, { isHidden: true });
                onClose();
              }}
              className="flex-1 sm:flex-none py-2 px-5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 font-bold transition-colors text-xs uppercase tracking-widest whitespace-nowrap"
            >
              Archive
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to permanently delete "${habit.name}"? All history will be lost.`)) {
                  if (onDeleteHabit) onDeleteHabit(habit.id);
                }
              }}
              className="flex-1 sm:flex-none py-2 px-5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold transition-colors text-xs uppercase tracking-widest whitespace-nowrap"
            >
              Delete
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
