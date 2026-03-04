import { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * GitHub-style Heatmap Calendar — Dark Theme
 */

/* ---------- Color palette ---------- */
const STATUS_COLORS = {
  WORKOUT:     '#eab308',  // Warm amber-yellow ✅
  LOCKED_REST: '#0d9488',  // Calm teal — goal met rest
  AUTO_REST:   '#60a5fa',  // Soothing soft blue — earned break
  MISSED:      'rgba(239, 68, 68, 0.30)',  // Faded dim red
  PENDING:     'rgba(255,255,255,0.06)',
};

const STATUS_LABELS = {
  WORKOUT:     'Workout Done ✅',
  LOCKED_REST: 'Rest (Goal Met) 🏆',
  AUTO_REST:   'Rest Day 😴',
  MISSED:      'Missed ❌',
  PENDING:     'Pending',
};

const DAY_LABELS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/* ---------- Helpers ---------- */
function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function getMonthLabels(enrichedData) {
  const labels = [];
  let lastMonth = -1;
  enrichedData.forEach((week, wIdx) => {
    const date = week.enrichedDays[0]?.date;
    if (date) {
      const month = date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
          colIndex: wIdx,
        });
        lastMonth = month;
      }
    }
  });
  return labels;
}

function isToday(date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/* ---------- Main Component ---------- */
export default function HeatmapCalendar({
  enrichedData,
  onToggleDay,
  onUpdateWeight,
  onUpdateBodyFat,
}) {
  const [tooltip, setTooltip] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const monthLabels = getMonthLabels(enrichedData);

  const currentWeekIdx = enrichedData.findIndex((w) => w.isCurrentWeek);

  return (
    <div className="glass-card-static p-5 md:p-7 animate-slide-up" style={{ animationDelay: '0.25s' }}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white/90 tracking-tight">
            Workout Activity
          </h2>
          <p className="text-xs text-white/30 font-medium mt-1">
            Click any day to mark as done · Completed weeks glow with a 🏆
          </p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto custom-scrollbar pb-3 relative">
        <div className="inline-block">
          {/* Month Labels Row */}
          <div className="flex ml-[44px] mb-2">
            {monthLabels.map((label, i) => {
              const nextCol = monthLabels[i + 1]?.colIndex ?? enrichedData.length;
              const span = nextCol - label.colIndex;
              return (
                <div
                  key={label.month + label.colIndex}
                  style={{ width: `${span * 24}px` }}
                  className="text-[11px] font-bold text-white/25 leading-none select-none"
                >
                  {label.month}
                </div>
              );
            })}
          </div>

          {/* Grid: 7 rows × 52 cols */}
          <div className="flex gap-0">
            {/* Day Labels */}
            <div className="flex flex-col gap-[4px] mr-2 pt-0">
              {DAY_LABELS.map((day) => (
                <div
                  key={day}
                  className="h-[20px] flex items-center text-[11px] font-bold text-white/25 leading-none select-none"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="flex gap-[4px]">
              {enrichedData.map((week, wIdx) => {
                const isGoalWeek = week.isGoalMet;
                const isCurrent = week.isCurrentWeek;

                return (
                  <div key={week.week} className="flex flex-col gap-[4px] relative">
                    {isGoalWeek && (
                      <div className="heatmap-goal-glow" />
                    )}

                    {week.enrichedDays.map((dayObj, dIdx) => {
                      const isTodayCell = isToday(dayObj.date);
                      const isLocked = dayObj.status === 'LOCKED_REST';
                      const color = STATUS_COLORS[dayObj.status] || STATUS_COLORS.PENDING;

                      return (
                        <button
                          key={dIdx}
                          onClick={() => !isLocked && onToggleDay(wIdx, dIdx)}
                          disabled={isLocked}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              text: `Week ${week.week} · ${formatDate(dayObj.date)} — ${STATUS_LABELS[dayObj.status]}`,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8,
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          className={`heatmap-cell-v2 ${isTodayCell ? 'heatmap-today-v2' : ''} ${
                            isLocked ? 'cursor-default' : 'cursor-pointer'
                          } ${isCurrent && !isTodayCell ? 'heatmap-current-week' : ''}`}
                          style={{ backgroundColor: color }}
                          aria-label={`${formatDate(dayObj.date)}: ${STATUS_LABELS[dayObj.status]}`}
                        />
                      );
                    })}

                    {isGoalWeek && (
                      <div className="flex justify-center mt-0.5">
                        <Trophy size={12} className="text-amber-500 drop-shadow-sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="heatmap-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
        <div className="flex items-center gap-4 text-[11px] font-semibold text-white/30">
          <span className="flex items-center gap-1.5">
            <div className="w-[18px] h-[18px] rounded-[4px]" style={{ backgroundColor: '#eab308' }} />
            Workout ✅
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-[18px] h-[18px] rounded-[4px]" style={{ backgroundColor: '#60a5fa' }} />
            Break
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-[18px] h-[18px] rounded-[4px]" style={{ backgroundColor: '#0d9488' }} />
            Rest (Goal Met)
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-[18px] h-[18px] rounded-[4px]" style={{ backgroundColor: 'rgba(239,68,68,0.30)' }} />
            Missed
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy size={13} className="text-amber-500" />
            Goal Met
          </span>
        </div>
      </div>

      {/* ─── Weight & Body Fat Section ─── */}
      <div className="mt-6 pt-5 border-t border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white/70 flex items-center gap-2">
            📊 Weekly Weight & Body Fat
          </h3>
          <span className="text-[10px] font-semibold text-violet-400 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(139,92,246,0.15)' }}
          >
            {currentWeekIdx >= 0 ? `Current: Week ${currentWeekIdx + 1}` : '—'}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
            {enrichedData.map((week, wIdx) => {
              const isCurrent = week.isCurrentWeek;
              const isExpanded = expandedWeek === wIdx;
              const hasData = week.weight || week.bodyFat;
              // Past weeks: check if the week's start date is before today
              const startDate = new Date(2026, 0, 3);
              const wStart = new Date(startDate);
              wStart.setDate(wStart.getDate() + wIdx * 7);
              const isPast = wStart < new Date();
              // Show inputs for current week always, past weeks always, future only if expanded
              const showInputs = isCurrent || isPast || isExpanded;

              return (
                <div
                  key={week.week}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all duration-200 ${
                    isCurrent
                      ? 'min-w-[90px] border-violet-500/40 shadow-md shadow-violet-500/10 ring-2 ring-violet-500/20'
                      : week.isGoalMet
                        ? 'min-w-[72px] border-violet-500/15'
                        : 'min-w-[72px] border-white/5 hover:border-white/10'
                  }`}
                  style={{
                    background: isCurrent
                      ? 'rgba(139,92,246,0.1)'
                      : week.isGoalMet
                        ? 'rgba(139,92,246,0.05)'
                        : 'rgba(255,255,255,0.02)',
                  }}
                >
                  {/* Week label */}
                  <button
                    onClick={() => setExpandedWeek(isExpanded ? null : wIdx)}
                    className="flex items-center gap-1 w-full justify-center"
                  >
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isCurrent ? 'text-violet-400' : week.isGoalMet ? 'text-violet-500/60' : 'text-white/25'
                      }`}
                    >
                      {isCurrent ? '► Wk ' : 'Wk '}
                      {week.week}
                    </span>
                    {(isCurrent || hasData) && (
                      isExpanded
                        ? <ChevronUp size={10} className="text-white/25" />
                        : <ChevronDown size={10} className="text-white/25" />
                    )}
                  </button>

                  {/* Goal badge */}
                  {week.isGoalMet && (
                    <div className="flex items-center gap-0.5">
                      <Trophy size={10} className="text-amber-500" />
                      <span className="text-[8px] font-bold text-amber-400">DONE</span>
                    </div>
                  )}

                  {/* Inputs — visible for current, past, or expanded weeks */}
                  {showInputs && (
                    <>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="kg"
                        value={week.weight}
                        onChange={(e) => onUpdateWeight(wIdx, e.target.value)}
                        className="w-full text-center py-1.5 px-1 border rounded-lg text-xs font-bold focus:ring-2 outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          borderColor: 'rgba(139,92,246,0.2)',
                          color: '#c4b5fd',
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="%"
                        value={week.bodyFat}
                        onChange={(e) => onUpdateBodyFat(wIdx, e.target.value)}
                        className="w-full text-center py-1.5 px-1 border rounded-lg text-xs font-bold focus:ring-2 outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          borderColor: 'rgba(236,72,153,0.2)',
                          color: '#f9a8d4',
                        }}
                      />
                    </>
                  )}

                  {/* Compact display */}
                  {!isCurrent && !isExpanded && hasData && (
                    <div className="text-[9px] text-white/30 font-bold leading-tight">
                      {week.weight && <div>{week.weight} kg</div>}
                      {week.bodyFat && <div>{week.bodyFat}%</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
