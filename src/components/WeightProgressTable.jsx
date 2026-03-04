import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * WeightProgressTable — Shows all weeks' weight & body fat in a scrollable table
 */
export default function WeightProgressTable({ enrichedData, updateWeight, updateBodyFat }) {
  const rows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(2026, 0, 3);

    const weeksWithData = enrichedData.map((week, idx) => {
      const wStart = new Date(startDate);
      wStart.setDate(wStart.getDate() + idx * 7);
      const isPastOrCurrent = wStart <= today || week.isCurrentWeek;
      const hasWeight = week.weight && !isNaN(parseFloat(week.weight));
      const hasFat = week.bodyFat && !isNaN(parseFloat(week.bodyFat));
      return { ...week, idx, isPastOrCurrent, hasWeight, hasFat };
    }).filter(w => w.isPastOrCurrent || w.hasWeight);

    const result = weeksWithData.reduce((acc, week) => {
      const w = week.hasWeight ? parseFloat(week.weight) : null;
      const f = week.hasFat ? parseFloat(week.bodyFat) : null;
      const wDelta = w !== null && acc.prevWeight !== null ? w - acc.prevWeight : null;
      const fDelta = f !== null && acc.prevFat !== null ? f - acc.prevFat : null;
      acc.rows.push({ ...week, w, f, wDelta, fDelta });
      if (w !== null) acc.prevWeight = w;
      if (f !== null) acc.prevFat = f;
      return acc;
    }, { rows: [], prevWeight: null, prevFat: null });
    return result.rows.reverse();
  }, [enrichedData]);

  return (
    <div className="glass-card p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400">
          ⚖️ Weight & Body Fat Progress
        </h3>
        <p className="text-xs text-white/30 font-semibold mt-0.5">Track your body composition week by week</p>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-3 text-[10px] uppercase tracking-widest font-bold text-white/30">Week</th>
              <th className="text-left py-3 px-3 text-[10px] uppercase tracking-widest font-bold text-white/30">Start</th>
              <th className="text-center py-3 px-3 text-[10px] uppercase tracking-widest font-bold text-fuchsia-400">Weight (kg)</th>
              <th className="text-center py-3 px-3 text-[10px] uppercase tracking-widest font-bold text-fuchsia-400">Change</th>
              <th className="text-center py-3 px-3 text-[10px] uppercase tracking-widest font-bold text-cyan-400">Body Fat (%)</th>
              <th className="text-center py-3 px-3 text-[10px] uppercase tracking-widest font-bold text-cyan-400">Change</th>
              <th className="text-center py-3 px-3 text-[10px] uppercase tracking-widest font-bold text-amber-400">Workouts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.week}
                className={`border-b border-white/5 transition-colors ${
                  row.isCurrentWeek
                    ? 'bg-violet-500/10 border-violet-500/20'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* Week # */}
                <td className="py-2.5 px-3">
                  <span className={`font-black text-sm ${row.isCurrentWeek ? 'text-violet-400' : 'text-white/50'}`}>
                    {row.isCurrentWeek ? '► ' : ''}{row.week}
                  </span>
                </td>

                {/* Start Date */}
                <td className="py-2.5 px-3 text-xs text-white/30 font-semibold">
                  {row.startDate}
                </td>

                {/* Weight */}
                <td className="py-2.5 px-3 text-center">
                  <div className="flex justify-center">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="—"
                      value={row.weight || ''}
                      onChange={(e) => updateWeight(row.idx, e.target.value)}
                      className="w-16 text-center py-1 px-1 bg-white/5 border border-white/10 rounded-lg text-sm font-black focus:ring-2 outline-none transition-all text-white placeholder-white/20 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20"
                    />
                  </div>
                </td>

                {/* Weight Delta */}
                <td className="py-2.5 px-3 text-center">
                  {row.wDelta !== null ? (
                    <DeltaBadge value={row.wDelta} unit="kg" invertColor />
                  ) : (
                    <span className="text-white/10">—</span>
                  )}
                </td>

                {/* Body Fat */}
                <td className="py-2.5 px-3 text-center">
                  <div className="flex justify-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="—"
                      value={row.bodyFat || ''}
                      onChange={(e) => updateBodyFat(row.idx, e.target.value)}
                      className="w-16 text-center py-1 px-1 bg-white/5 border border-white/10 rounded-lg text-sm font-black focus:ring-2 outline-none transition-all text-white placeholder-white/20 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                    />
                  </div>
                </td>

                {/* Body Fat Delta */}
                <td className="py-2.5 px-3 text-center">
                  {row.fDelta !== null ? (
                    <DeltaBadge value={row.fDelta} unit="%" invertColor />
                  ) : (
                    <span className="text-white/10">—</span>
                  )}
                </td>

                {/* Workouts count */}
                <td className="py-2.5 px-3 text-center">
                  <span className={`font-bold ${row.isGoalMet ? 'text-amber-400' : 'text-white/40'}`}>
                    {row.weekWorkouts}
                    {row.isGoalMet && ' 🏆'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeltaBadge({ value, unit, invertColor }) {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-white/30 font-bold">
        <Minus size={12} />0
      </span>
    );
  }
  // For weight/fat: negative is good (losing), so invert colors
  const isPositive = rounded > 0;
  const isGood = invertColor ? !isPositive : isPositive;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-black ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isPositive ? '+' : ''}{rounded}{unit}
    </span>
  );
}
