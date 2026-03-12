import React, { useMemo, useEffect, useRef, useState } from 'react';
import { getLocalDateString } from '../../stores/useHabitStore';
import { Plus, Check, Clock, Edit2 } from 'lucide-react';

export default function UnifiedHabitsGrid({ habits, onLogEntry, onExpandDetails }) {
  const scrollRef = useRef(null);
  const [monthOffset, setMonthOffset] = useState(0);

  // Generate days for the selected calendar month
  const { days, viewDate, todayObj } = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Calculate the target month based on offset
    const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    // Number of days in the target month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const result = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      result.push({
        dateStr: getLocalDateString(d),
        dateObj: d,
        dayNum: i,
        isToday: monthOffset === 0 && i === today.getDate()
      });
    }
    return { days: result, viewDate: targetDate, todayObj: today };
  }, [monthOffset]);

  // Auto-scroll to the rightmost edge (today) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [habits]);

  if (!habits || habits.length === 0) return null;

  return (
    <div className="glass-card p-6 overflow-hidden flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 flex items-center gap-3">
            Monthly Overview
            <div className="flex items-center gap-1 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-full px-1 py-0.5 ml-2">
              <button 
                onClick={() => setMonthOffset(prev => prev - 1)}
                className="w-6 h-6 rounded-full hover:bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              
              <span className="text-xs font-bold text-fuchsia-300 tracking-widest uppercase min-w-[100px] text-center">
                {viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              
              <button 
                onClick={() => setMonthOffset(prev => prev + 1)}
                disabled={monthOffset >= 0}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${monthOffset >= 0 ? 'opacity-30 cursor-not-allowed text-fuchsia-300' : 'hover:bg-fuchsia-500/20 text-fuchsia-400'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </h3>
          <p className="text-sm font-medium text-white/40 mt-1">
            Your entire ecosystem at a glance.
          </p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="overflow-x-auto pb-4 custom-scrollbar" 
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="min-w-max inline-block">
          {/* Header Row (Days) */}
          <div className="flex px-4 mb-2">
            <div className="w-48 shrink-0" /> {/* Spacer for habit names */}
            <div className="flex gap-1.5 pl-4 shrink-0">
              {days.map(day => (
                <div 
                  key={day.dateStr}
                  className={`flex flex-col items-center justify-end w-6 transition-all ${
                    day.isToday ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                  }`}
                >
                  <span className="text-[9px] font-bold text-white uppercase transform -rotate-45 mb-1">
                    {day.dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={`text-[10px] font-bold w-full text-center rounded-sm ${day.isToday ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-white/60'}`}>
                    {day.dayNum}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Habit Rows */}
          <div className="flex flex-col gap-2 bg-black/20 rounded-2xl p-4 border border-white/5">
            {habits.map((habit) => {
              // Safety check against missing start date
              let startDateObj = todayObj;
              if (habit.history) {
                 const allDates = Object.keys(habit.history).sort();
                 if (habit.startDate) {
                    startDateObj = new Date(habit.startDate);
                 } else if (allDates.length > 0) {
                    startDateObj = new Date(allDates[0]);
                 }
              } else if (habit.startDate) {
                 startDateObj = new Date(habit.startDate);
              }
              startDateObj.setHours(0,0,0,0);

              return (
                <div key={habit.id} className="flex items-center group">
                  {/* Habit Name/Icon column */}
                  <div
                    className={`w-48 shrink-0 flex items-center gap-3 pr-4 border-r border-white/10 group-hover:border-white/30 transition-colors ${onExpandDetails ? 'cursor-pointer hover:bg-white/5 rounded-l-xl' : ''}`}
                    onClick={() => onExpandDetails && onExpandDetails(habit)}
                    title={onExpandDetails ? `Open ${habit.name}` : undefined}
                  >
                    <span className="text-xl">{habit.icon}</span>
                    <span className="text-xs font-bold text-white/80 truncate group-hover:text-white transition-colors">
                      {habit.name}
                    </span>
                  </div>
                  
                  {/* Heatmap Cells column */}
                  <div className="flex gap-1.5 pl-4 shrink-0">
                    {days.map(day => {
                      const entry = habit.history?.[day.dateStr];
                      const isBeforeStart = day.dateObj < startDateObj;
                      const isFuture = day.dateObj > todayObj;
                      
                      let bgColor = 'bg-white/5';
                      if (isBeforeStart || isFuture) {
                        bgColor = 'bg-transparent border border-white/5 border-dashed pointer-events-none opacity-20';
                      } else if (entry?.status === 'completed') {
                        bgColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] hover:scale-125 z-10 transition-transform';
                      } else if (entry?.status === 'missed') {
                        bgColor = 'bg-red-500/30';
                      } else if (entry?.status === 'skipped') {
                        bgColor = 'bg-yellow-500/50';
                      }

                      return (
                        <div
                          key={`${habit.id}-${day.dateStr}`}
                          onClick={() => {
                            if (!onLogEntry || isBeforeStart || isFuture) return;
                            let nextStatus = 'completed';
                            if (entry?.status === 'completed') nextStatus = 'missed';
                            else if (entry?.status === 'missed') nextStatus = 'skipped';
                            else if (entry?.status === 'skipped') nextStatus = 'pending';
                            
                            onLogEntry(habit.id, day.dateStr, { 
                              status: nextStatus,
                              timestamp: new Date().toISOString()
                            });
                          }}
                          title={`${habit.name} - ${day.dateStr}${entry?.status ? ` (${entry.status})` : ''}${isBeforeStart ? ' (Before Start)' : isFuture ? ' (Future)' : ' • Click to toggle'}`}
                          className={`w-6 h-6 rounded flex items-center justify-center relative ${!isBeforeStart && !isFuture ? 'hover:ring-2 hover:ring-white/50 hover:z-20 cursor-pointer' : ''} transition-all ${bgColor}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-white/5" /> Pending</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/30" /> Missed</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-yellow-500/50" /> Grace</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500" /> Success</div>
      </div>
    </div>
  );
}
