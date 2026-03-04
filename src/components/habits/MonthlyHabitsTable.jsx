import React, { useMemo } from 'react';
import { getLocalDateString } from '../../hooks/useHabitsData';

function getMonthRate(habit, year, month, startDateObj, today) {
  const isStartMonth = year === startDateObj.getFullYear() && month === startDateObj.getMonth();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const startDay = isStartMonth ? startDateObj.getDate() : 1;
  const endDay = isCurrentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate();

  const validDays = Math.max(0, endDay - startDay + 1);
  let completed = 0;
  for (let d = startDay; d <= endDay; d++) {
    const str = getLocalDateString(new Date(year, month, d));
    if (habit.history?.[str]?.status === 'completed') completed++;
  }
  return { completed, validDays, rate: validDays > 0 ? Math.round((completed / validDays) * 100) : 0 };
}

function CirclePct({ pct }) {
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-8 h-8 inline-flex items-center justify-center">
      <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
        <path className="text-white/10" strokeWidth="4" stroke="currentColor" fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path strokeDasharray={`${pct}, 100`} strokeWidth="4" strokeLinecap="round"
          stroke={color} fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
      </svg>
      <span className="absolute text-[9px] font-black text-white">{pct}%</span>
    </div>
  );
}

export default function MonthlyHabitsTable({ habits }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // Build the list of all months from the earliest start date to today
  const months = useMemo(() => {
    let earliest = today;
    habits.forEach(habit => {
      let sd = today;
      if (habit.startDate) {
        sd = new Date(habit.startDate);
      } else {
        const allDates = Object.keys(habit.history || {}).sort();
        if (allDates.length > 0) sd = new Date(allDates[0]);
      }
      sd.setHours(0,0,0,0);
      if (sd < earliest) earliest = sd;
    });

    const result = [];
    let cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 1);
    while (cursor <= end) {
      result.push({ year: cursor.getFullYear(), month: cursor.getMonth(), label: cursor.toLocaleString('en-US', { month: 'short', year: 'numeric' }) });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result.reverse(); // newest first
  }, [habits, today]);

  // For each habit, get its own start date
  const habitStartDates = useMemo(() => {
    return habits.map(habit => {
      let sd = today;
      if (habit.startDate) { sd = new Date(habit.startDate); }
      else {
        const allDates = Object.keys(habit.history || {}).sort();
        if (allDates.length > 0) sd = new Date(allDates[0]);
      }
      sd = new Date(sd); sd.setHours(0,0,0,0);
      return sd;
    });
  }, [habits, today]);

  if (!habits || habits.length === 0 || months.length === 0) return null;

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
          Full History — Monthly Adherence
        </h3>
        <p className="text-sm font-medium text-white/40 mt-0.5">All months since your first habit was started.</p>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm border-collapse min-w-max">
          <thead>
            <tr className="bg-white/5 text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5">
              <th className="p-3 font-bold text-left sticky left-0 bg-[color:inherit] z-10 min-w-[100px]"># Month</th>
              <th className="p-3 font-bold text-center min-w-[100px]"># Score</th>
              {habits.map(h => (
                <th key={h.id} className="p-3 font-bold text-center min-w-[90px] whitespace-nowrap">
                  <span className="mr-1">{h.icon}</span>{h.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
           {months.map((m, mIdx) => {
              const prevMonth = months[mIdx + 1];

              // Compute aggregate score for this month across all habits
              let totalCompleted = 0, totalPossible = 0;
              habits.forEach((habit, hIdx) => {
                const startDateObj = habitStartDates[hIdx];
                const habitStartMonth = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
                const thisMonth = new Date(m.year, m.month, 1);
                if (thisMonth >= habitStartMonth) {
                  const curr = getMonthRate(habit, m.year, m.month, startDateObj, today);
                  totalCompleted += curr.completed;
                  totalPossible += curr.validDays;
                }
              });
              const monthScore = totalCompleted;
              const monthScorePct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

              return (
                <tr key={m.label} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 font-bold text-white/70 sticky left-0 bg-gray-900/80 backdrop-blur-sm whitespace-nowrap">
                    {m.label}
                  </td>
                  {/* Aggregate Score Column */}
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-black text-fuchsia-400 text-base">{monthScore}</span>
                      <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-fuchsia-500 rounded-full transition-all" style={{ width: `${monthScorePct}%` }} />
                      </div>
                    </div>
                  </td>
                  {habits.map((habit, hIdx) => {
                    const startDateObj = habitStartDates[hIdx];
                    const habitStartMonth = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
                    const thisMonth = new Date(m.year, m.month, 1);

                    if (thisMonth < habitStartMonth) {
                      return <td key={habit.id} className="p-3 text-center text-white/15 font-bold text-xs">—</td>;
                    }

                    const curr = getMonthRate(habit, m.year, m.month, startDateObj, today);
                    let delta = null;
                    if (prevMonth) {
                      const prevMonthStart = new Date(prevMonth.year, prevMonth.month, 1);
                      if (prevMonthStart >= habitStartMonth) {
                        const prev = getMonthRate(habit, prevMonth.year, prevMonth.month, startDateObj, today);
                        delta = curr.rate - prev.rate;
                      }
                    }

                    return (
                      <td key={habit.id} className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white/80 text-sm">{curr.completed}</span>
                            <CirclePct pct={curr.rate} />
                          </div>
                          {delta !== null ? (
                            <span className={`text-[10px] font-bold ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-white/20'}`}>
                              {delta > 0 ? '↑' : delta < 0 ? '↓' : '—'}{delta !== 0 ? `${delta > 0 ? '+' : ''}${delta}%` : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/20 font-bold">New</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
