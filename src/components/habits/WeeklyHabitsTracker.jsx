import React, { useMemo } from 'react';
import { getLocalDateString } from '../../stores/useHabitStore';

function HabitRow({ habit, weekDays, pct, weekCompleted, weekPossible, onLogEntry, onExpandDetails }) {
  return (
    <tr className="hover:bg-white/[0.02] transition-colors relative">
      <td 
        className="p-2 cursor-pointer"
        onClick={() => onExpandDetails && onExpandDetails(habit)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{habit.icon}</span>
          <span className="font-bold text-white/80 truncate max-w-[100px] text-xs">{habit.name}</span>
        </div>
      </td>
      {weekDays.map(day => {
        const entry = habit.history?.[day.dateStr];
        const status = entry?.status || 'empty';
        const isCompleted = status === 'completed';
        const isMissed = status === 'missed';
        const isSkipped = status === 'skipped';

        let cellClass = 'bg-white/5';
        if (day.isFuture) cellClass = 'opacity-20 pointer-events-none';
        else if (isCompleted) cellClass = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
        else if (isMissed) cellClass = 'bg-red-500/30';
        else if (isSkipped) cellClass = 'bg-yellow-500/30';

        return (
          <td key={day.dateStr} className="p-2 text-center">
            <button
              onClick={() => {
                if (!onLogEntry || day.isFuture) return;
                let nextStatus = 'completed';
                if (isCompleted) nextStatus = 'missed';
                else if (isMissed) nextStatus = 'skipped';
                else if (isSkipped) nextStatus = 'pending';
                onLogEntry(habit.id, day.dateStr, { status: nextStatus, timestamp: new Date().toISOString() });
              }}
              title={`${habit.name} — ${day.dateStr}: ${status}`}
              className={`w-8 h-8 mx-auto rounded-full transition-all ${!day.isFuture ? 'hover:scale-110 hover:ring-2 hover:ring-white/40 cursor-pointer' : ''} flex items-center justify-center ${cellClass} ${day.isToday ? 'ring-2 ring-cyan-400/40' : ''}`}
            >
              {isCompleted && <span className="text-white text-xs font-black">✓</span>}
              {isMissed && <span className="text-red-300 text-xs">✕</span>}
              {isSkipped && <span className="text-yellow-300 text-xs font-bold">G</span>}
              {!isCompleted && !isMissed && !isSkipped && !day.isFuture && (
                <span className="text-white/15 text-[10px] font-bold">{day.dayNum}</span>
              )}
            </button>
          </td>
        );
      })}
      <td className="p-2 text-center">
        <div className="flex flex-col items-center gap-0.5">
          <span className={`font-black text-sm ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{weekCompleted}/{weekPossible}</span>
          <span className="text-[10px] text-white/30">{pct}%</span>
        </div>
      </td>
    </tr>
  );
}

const DAY_LABELS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Week 1 starts on January 3 (Saturday) as the user's system anchor
const WEEK1_START = new Date(2026, 0, 3); // Jan 3, 2026
WEEK1_START.setHours(0, 0, 0, 0);

function getWeekNumber(today) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.floor((today - WEEK1_START) / msPerDay);
  return Math.max(1, Math.floor(diff / 7) + 1);
}

export default function WeeklyHabitsTracker({ habits, onLogEntry, onExpandDetails }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Build this week's days (Sat → Fri)
  const { weekDays, weekNumber } = useMemo(() => {
    // Find most recent Saturday (day 6 in JS = Sat)
    const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
    const daysFromSat = dayOfWeek === 6 ? 0 : dayOfWeek + 1; // days since last Saturday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysFromSat);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        dateStr: getLocalDateString(d),
        dateObj: d,
        dayLabel: DAY_LABELS[i],
        dayNum: d.getDate(),
        isToday: getLocalDateString(d) === getLocalDateString(today),
        isFuture: d > today
      };
    });

    return { weekDays: days, weekNumber: getWeekNumber(startOfWeek) };
  }, [today]);

  // Weekly score = (total completed this week) out of (total possible this week)
  const weeklyScore = useMemo(() => {
    let completed = 0;
    let possible = 0;
    habits.forEach(habit => {
      weekDays.forEach(day => {
        if (!day.isFuture) {
          possible++;
          if (habit.history?.[day.dateStr]?.status === 'completed') completed++;
        }
      });
    });
    return { completed, possible, pct: possible > 0 ? Math.round((completed / possible) * 100) : 0 };
  }, [habits, weekDays]);



  if (!habits || habits.length === 0) return null;

  return (
    <div className="glass-card p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center gap-3">
            This Week's Tracker
            <span className="text-xs font-bold border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 rounded-full text-cyan-300 tracking-widest uppercase">
              Week {weekNumber}
            </span>
          </h3>
          <p className="text-sm font-medium text-white/40 mt-0.5">
            Weekly Score: <span className="text-cyan-400 font-black">{weeklyScore.completed}</span>
            <span className="text-white/30"> / {weeklyScore.possible}</span>
            <span className="text-white/50 ml-2">({weeklyScore.pct}%)</span>
          </p>
        </div>
        {/* Score Circle */}
        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
          <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-white/5" strokeWidth="3" stroke="currentColor" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="text-cyan-400 transition-all duration-1000"
              strokeDasharray={`${weeklyScore.pct}, 100`}
              strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">{weeklyScore.pct}%</div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr>
              <th className="p-2 text-left text-[10px] text-white/30 uppercase tracking-widest font-bold min-w-[140px]">Habit</th>
              {weekDays.map(day => (
                <th key={day.dateStr} className={`p-2 text-center min-w-[48px] text-[10px] font-bold uppercase tracking-widest ${day.isToday ? 'text-cyan-400' : 'text-white/30'}`}>
                  <div>{day.dayLabel}</div>
                  <div className={`text-base font-black ${day.isToday ? 'text-cyan-300' : 'text-white/50'}`}>{day.dayNum}</div>
                </th>
              ))}
              <th className="p-2 text-center text-[10px] text-white/30 uppercase tracking-widest font-bold">Score</th>
            </tr>
          </thead>
              <tbody className="divide-y divide-white/5 relative">
                {habits.map(habit => {
                  const weekCompleted = weekDays.filter(d => !d.isFuture && habit.history?.[d.dateStr]?.status === 'completed').length;
                  const weekPossible = weekDays.filter(d => !d.isFuture).length;
                  const pct = weekPossible > 0 ? Math.round((weekCompleted / weekPossible) * 100) : 0;

                  return (
                    <HabitRow 
                      key={habit.id}
                      habit={habit}
                      weekDays={weekDays}
                      pct={pct}
                      weekCompleted={weekCompleted}
                      weekPossible={weekPossible}
                      onLogEntry={onLogEntry}
                      onExpandDetails={onExpandDetails}
                    />
                  );
                })}
              </tbody>
        </table>
      </div>
    </div>
  );
}
