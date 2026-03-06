import { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import usePreferences from '../hooks/usePreferences';
import { t } from '../config/translations';

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

const STATUS_LABEL_KEYS = {
  WORKOUT: 'heatmap_status_workout',
  LOCKED_REST: 'heatmap_status_locked_rest',
  AUTO_REST: 'heatmap_status_auto_rest',
  MISSED: 'heatmap_status_missed',
  PENDING: 'heatmap_status_pending',
};

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
  onOpenWorkoutLog,
}) {
  const [tooltip, setTooltip] = useState(null);
  const { language } = usePreferences();
  const L = language;
  const isAr = L === 'ar';
  const monthLabels = getMonthLabels(enrichedData);

  const dayLabels = isAr
    ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="glass-card-static p-4 sm:p-5 md:p-7 animate-slide-up" style={{ animationDelay: '0.25s' }}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-white/90 tracking-tight">
            {t('workout_activity', L)}
          </h2>
          <p className="text-[10px] sm:text-xs text-white/30 font-medium mt-1 hidden xs:block">
            {t('heatmap_hint', L)}
          </p>
        </div>
      </div>

      {/* Heatmap Grid — smooth scroll on iOS */}
      <div className="overflow-x-auto custom-scrollbar pb-3 relative -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
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
              {dayLabels.map((day) => (
                <div
                  key={day}
                  className="h-[20px] heatmap-day-label-row flex items-center text-[11px] font-bold text-white/25 leading-none select-none"
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
                          onClick={() => {
                            if (isLocked) return;
                            if (onOpenWorkoutLog) {
                              // If not done yet, open modal to log
                              // If done and has session, open modal to edit
                              // If done without session, toggle off
                              const existingSession = week.sessions?.[dIdx] || null;
                              if (dayObj.status === 'WORKOUT' && !existingSession) {
                                onToggleDay(wIdx, dIdx); // just un-toggle
                              } else {
                                onOpenWorkoutLog(wIdx, dIdx, existingSession);
                              }
                            } else {
                              onToggleDay(wIdx, dIdx);
                            }
                          }}
                          disabled={isLocked}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const statusLabel = t(STATUS_LABEL_KEYS[dayObj.status] || 'heatmap_status_pending', L);
                            setTooltip({
                              text: `${t('week', L)} ${week.week} · ${formatDate(dayObj.date)} — ${statusLabel}`,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8,
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          className={`heatmap-cell-v2 ${isTodayCell ? 'heatmap-today-v2' : ''} ${
                            isLocked ? 'cursor-default' : 'cursor-pointer'
                          } ${isCurrent && !isTodayCell ? 'heatmap-current-week' : ''}`}
                          style={{ backgroundColor: color }}
                          aria-label={`${formatDate(dayObj.date)}: ${t(STATUS_LABEL_KEYS[dayObj.status] || 'heatmap_status_pending', L)}`}
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
      <div className="flex items-center justify-between mt-4 sm:mt-5 flex-wrap gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-semibold text-white/30 flex-wrap">
          <span className="flex items-center gap-1.5">
            <div className="w-[18px] h-[18px] rounded-[4px]" style={{ backgroundColor: '#eab308' }} />
            {t('heatmap_legend_workout', L)}
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-[18px] h-[18px] rounded-[4px]" style={{ backgroundColor: '#60a5fa' }} />
            {t('heatmap_legend_break', L)}
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-[18px] h-[18px] rounded-[4px]" style={{ backgroundColor: '#0d9488' }} />
            {t('heatmap_status_locked_rest', L)}
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-[18px] h-[18px] rounded-[4px]" style={{ backgroundColor: 'rgba(239,68,68,0.30)' }} />
            {t('heatmap_status_missed', L)}
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy size={13} className="text-amber-500" />
            {t('goal_met', L)}
          </span>
        </div>
      </div>
    </div>
  );
}
