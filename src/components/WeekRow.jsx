import { Trophy } from 'lucide-react';
import DayCell from './DayCell';

/**
 * صف أسبوع واحد في الجدول
 */
export default function WeekRow({
  row,
  weekIndex,
  onToggleDay,
  onUpdateWeight,
  onUpdateBodyFat,
}) {
  const rowClass = row.isGoalMet
    ? 'bg-emerald-50/60 hover:bg-emerald-100/60'
    : row.isCurrentWeek
      ? 'bg-indigo-50/40 hover:bg-indigo-100/40'
      : 'hover:bg-slate-50/80';

  return (
    <tr
      className={`transition-all duration-300 group border-b border-slate-100 last:border-0 relative ${rowClass}`}
    >
      {/* Week Number */}
      <td className="p-3 text-center relative">
        {row.isCurrentWeek && !row.isGoalMet && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-md" />
        )}
        {row.isGoalMet && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-md" />
        )}
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors ${
            row.isGoalMet
              ? 'bg-emerald-500 text-white shadow-md'
              : row.isCurrentWeek
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'
          }`}
        >
          {row.week}
        </span>
      </td>

      {/* Start Date */}
      <td className="p-3 text-left font-semibold whitespace-nowrap flex items-center flex-wrap gap-2 h-full">
        <span
          className={
            row.isGoalMet
              ? 'text-emerald-800'
              : row.isCurrentWeek
                ? 'text-indigo-800'
                : 'text-slate-600'
          }
        >
          {row.startDate}
        </span>

        {row.isGoalMet && (
          <span className="inline-flex items-center gap-1 text-[10px] bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider font-bold animate-pop shadow-sm border border-emerald-300/50">
            <Trophy size={11} className="text-yellow-200 drop-shadow-sm" />
            Goal Met
          </span>
        )}
        {row.isCurrentWeek && !row.isGoalMet && (
          <span className="text-[9px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-sm uppercase tracking-wider font-bold">
            Now
          </span>
        )}
      </td>

      {/* Day Cells */}
      {row.enrichedDays.map((dayObj, dIdx) => (
        <DayCell
          key={dIdx}
          dayObj={dayObj}
          isGoalMet={row.isGoalMet}
          onToggle={() => onToggleDay(weekIndex, dIdx)}
        />
      ))}

      {/* Weight Input */}
      <td
        className={`p-3 transition-colors border-l border-white ${
          row.isGoalMet
            ? 'bg-emerald-100/30'
            : 'bg-blue-50/20 group-hover:bg-blue-50/60'
        }`}
      >
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="--"
          value={row.weight}
          onChange={(e) => onUpdateWeight(weekIndex, e.target.value)}
          className={`w-full text-center py-2 px-1 border rounded-lg font-bold focus:ring-2 outline-none transition-all bg-white/80 ${
            row.isGoalMet
              ? 'border-emerald-200 text-emerald-900 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-emerald-300'
              : 'border-blue-200 text-blue-900 focus:ring-blue-500 focus:border-blue-500 placeholder:text-blue-200'
          }`}
        />
      </td>

      {/* Body Fat Input */}
      <td
        className={`p-3 transition-colors border-l border-white ${
          row.isGoalMet
            ? 'bg-emerald-100/30'
            : 'bg-rose-50/20 group-hover:bg-rose-50/60'
        }`}
      >
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          placeholder="--"
          value={row.bodyFat}
          onChange={(e) => onUpdateBodyFat(weekIndex, e.target.value)}
          className={`w-full text-center py-2 px-1 border rounded-lg font-bold focus:ring-2 outline-none transition-all bg-white/80 ${
            row.isGoalMet
              ? 'border-emerald-200 text-emerald-900 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-emerald-300'
              : 'border-rose-200 text-rose-900 focus:ring-rose-500 focus:border-rose-500 placeholder:text-rose-200'
          }`}
        />
      </td>
    </tr>
  );
}
