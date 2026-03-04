import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WORKOUT_SYSTEMS } from '../config/workoutSystems';

/**
 * WorkoutProgressDashboard — Shows session-type comparison over time
 * Compares each session type (e.g. Push vs last Push) using totalValue (kg)
 */
export default function WorkoutProgressDashboard({ enrichedData, workoutSystem }) {
  const systemConfig = WORKOUT_SYSTEMS[workoutSystem] || WORKOUT_SYSTEMS.ppl;

  // Collect all sessions grouped by session type
  const sessionHistory = useMemo(() => {
    const history = {};
    systemConfig.sessions.forEach(s => { history[s.value] = []; });

    enrichedData.forEach((week) => {
      if (!week.sessions) return;
      Object.entries(week.sessions).forEach(([dayIdx, session]) => {
        if (session && session.sessionType && history[session.sessionType]) {
          history[session.sessionType].push({
            ...session,
            weekNum: week.week,
            dayIdx: parseInt(dayIdx),
          });
        }
      });
    });

    return history;
  }, [enrichedData, systemConfig]);

  // Build comparison cards
  const comparisons = useMemo(() => {
    return systemConfig.sessions.map(sessionDef => {
      const sessions = sessionHistory[sessionDef.value] || [];
      if (sessions.length === 0) return { ...sessionDef, latest: null, previous: null, delta: 0, allValues: [] };

      const latest = sessions[sessions.length - 1];
      const previous = sessions.length >= 2 ? sessions[sessions.length - 2] : null;

      const latestVal = latest.totalValue || 0;
      const prevVal = previous?.totalValue || 0;
      const delta = prevVal > 0 ? latestVal - prevVal : 0;
      const deltaPct = prevVal > 0 ? Math.round(((latestVal - prevVal) / prevVal) * 100) : 0;

      // All historical values for a mini sparkline-style display
      const allValues = sessions.map(s => s.totalValue || 0);

      return {
        ...sessionDef,
        latest,
        previous,
        latestVal,
        prevVal,
        delta,
        deltaPct,
        allValues,
        count: sessions.length,
      };
    });
  }, [systemConfig, sessionHistory]);

  const hasAnyData = comparisons.some(c => c.latest);
  if (!hasAnyData) return null;

  return (
    <div className="glass-card p-6 space-y-5">
      <div>
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
          Workout Progress
        </h3>
        <p className="text-xs text-white/30 font-semibold mt-0.5">Compare your kg value session by session</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparisons.map(comp => {
          if (!comp.latest) {
            return (
              <div key={comp.value} className="bg-white/[0.02] rounded-xl p-4 border border-white/5 opacity-40">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: comp.color }} />
                  <span className="font-bold text-white/60 text-sm">{comp.label}</span>
                </div>
                <p className="text-xs text-white/20 text-center py-4">No sessions logged yet</p>
              </div>
            );
          }

          const maxVal = Math.max(...comp.allValues, 1);

          return (
            <div key={comp.value} className="bg-white/[0.02] rounded-xl p-4 border border-white/5 hover:bg-white/[0.04] transition-colors">
              {/* Session Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: comp.color }} />
                  <span className="font-bold text-white/80 text-sm">{comp.label}</span>
                  <span className="text-[10px] text-white/20 font-bold">×{comp.count}</span>
                </div>
                {comp.previous && comp.delta !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-black ${comp.delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {comp.delta > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {comp.delta > 0 ? '+' : ''}{comp.delta} kg
                  </div>
                )}
                {comp.previous && comp.delta === 0 && (
                  <div className="flex items-center gap-1 text-xs text-white/30 font-bold">
                    <Minus size={14} /> Same
                  </div>
                )}
              </div>

              {/* Current Value */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-black text-3xl text-white/90">{comp.latestVal}</span>
                <span className="text-sm text-white/30 font-bold">kg</span>
                {comp.previous && (
                  <span className="text-xs text-white/20 ml-2">← {comp.prevVal} kg</span>
                )}
              </div>

              {/* Mini bar chart of history */}
              {comp.allValues.length > 1 && (
                <div className="flex items-end gap-1 h-10 mt-2">
                  {comp.allValues.map((val, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all"
                      style={{
                        height: `${Math.max(10, (val / maxVal) * 100)}%`,
                        background: i === comp.allValues.length - 1 ? comp.color : `${comp.color}44`,
                      }}
                      title={`${val} kg`}
                    />
                  ))}
                </div>
              )}

              {/* Week Info */}
              <div className="mt-3 text-[10px] text-white/20 font-bold">
                Latest: Week {comp.latest.weekNum}
                {comp.previous && ` • Previous: Week ${comp.previous.weekNum}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
