import { CheckCircle2 } from 'lucide-react';
import WeekRow from './WeekRow';

const DAYS_OF_WEEK = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/**
 * الجدول التفاعلي الرئيسي — يعرض الـ 52 أسبوع
 */
export default function WorkoutTable({
  enrichedData,
  onToggleDay,
  onUpdateWeight,
  onUpdateBodyFat,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col">
      {/* Legend */}
      <Legend />

      {/* Scrollable Table */}
      <div className="overflow-x-auto max-h-[60vh] relative custom-scrollbar">
        <table className="w-full border-collapse">
          <TableHeader />
          <tbody>
            {enrichedData.map((row, wIdx) => (
              <WeekRow
                key={row.week}
                row={row}
                weekIndex={wIdx}
                onToggleDay={onToggleDay}
                onUpdateWeight={onUpdateWeight}
                onUpdateBodyFat={onUpdateBodyFat}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function Legend() {
  return (
    <div className="flex items-center justify-center sm:justify-end gap-6 p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 flex-wrap">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-emerald-500" />
        Workout Done
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-[10px]">
          B
        </div>
        Locked Break (Goal Met)
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-[10px]">
          B
        </div>
        Auto Break (Streak Safe)
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold text-[10px]">
          X
        </div>
        Missed (Breaks Streak)
      </div>
    </div>
  );
}

function TableHeader() {
  return (
    <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-20 shadow-sm">
      <tr>
        <th className="p-4 text-center font-semibold text-slate-400 border-b border-slate-200 w-16 text-xs uppercase tracking-wider">
          Wk
        </th>
        <th className="p-4 text-left font-semibold text-slate-400 border-b border-slate-200 w-36 text-xs uppercase tracking-wider">
          Start
        </th>
        {DAYS_OF_WEEK.map((day, idx) => (
          <th
            key={day}
            className={`p-4 text-center font-semibold border-b border-slate-200 min-w-[60px] text-xs uppercase tracking-wider ${
              idx === 6 ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            {day}
          </th>
        ))}
        <th className="p-4 text-center font-bold text-blue-600 border-b border-slate-200 w-32 bg-blue-50/50 text-xs uppercase tracking-wider border-l border-white">
          Weight <br />
          <span className="text-[10px] font-medium text-blue-400">(Fri kg)</span>
        </th>
        <th className="p-4 text-center font-bold text-rose-600 border-b border-slate-200 w-28 bg-rose-50/50 text-xs uppercase tracking-wider border-l border-white">
          Fat <br />
          <span className="text-[10px] font-medium text-rose-400">(Fri %)</span>
        </th>
      </tr>
    </thead>
  );
}
