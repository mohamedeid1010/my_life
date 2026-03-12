import React, { useState } from 'react';
import { getLocalDateString } from '../../stores/useHabitStore';
import { Check, Flame, Star, Activity } from 'lucide-react';

export default function HabitCard({ habit, onLogEntry, onExpandDetails }) {
  const { id, name, icon, targetType, targetValue, unit, graceDaysAllowance, stats } = habit;
  const todayStr = getLocalDateString();
  const todayEntry = stats.todayEntry;
  const isCompleted = todayEntry?.status === 'completed';

  const [showContext, setShowContext] = useState(false);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isCompleted) {
      onLogEntry(id, todayStr, { status: 'pending' });
      setShowContext(false);
    } else {
      const val = targetType === 'numeric' ? targetValue : null;
      onLogEntry(id, todayStr, { status: 'completed', value: val });
      setShowContext(true);
      setTimeout(() => setShowContext(false), 5000);
    }
  };

  const handleContextLog = (e, type, value) => {
    e.stopPropagation();
    onLogEntry(id, todayStr, { [type]: value });
    setTimeout(() => setShowContext(false), 1500);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer group ${
        isCompleted
          ? 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
          : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15'
      }`}
      onClick={() => onExpandDetails(habit)}
    >
      {/* Completion glow */}
      <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-transparent transition-opacity duration-500 pointer-events-none ${isCompleted ? 'opacity-100' : 'opacity-0'}`} />

      <div className="p-4 sm:p-5 relative z-10">
        <div className="flex items-center gap-3">
          {/* Icon button */}
          <button
            type="button"
            onClick={handleToggle}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 hover:scale-110 active:scale-95 shrink-0 ${
              isCompleted
                ? 'drop-shadow-[0_0_12px_rgba(16,185,129,0.7)] scale-105'
                : 'bg-black/20 hover:bg-black/30'
            }`}
          >
            {icon}
          </button>

          {/* Text info */}
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className={`font-bold text-base leading-tight transition-colors truncate ${isCompleted ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
              {name}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              {stats.currentStreak > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-orange-400">
                  <Flame size={11} />{stats.currentStreak}d
                </span>
              )}
              {stats.longestStreak > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-yellow-400">
                  <Star size={11} />{stats.longestStreak}d
                </span>
              )}
              {targetType === 'numeric' && (
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-violet-300">
                  <Activity size={11} />{targetValue} {unit}
                </span>
              )}
              {graceDaysAllowance > 0 && (
                <span className={`text-[11px] font-semibold ${stats.graceDaysBalance === 0 ? 'text-red-400/60' : 'text-white/25'}`}>
                  ☕ {stats.graceDaysBalance}/{graceDaysAllowance}
                </span>
              )}
            </div>
          </div>

          {/* Check button */}
          <button
            onClick={handleToggle}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-lg ${
              isCompleted
                ? 'bg-emerald-500 text-white scale-100'
                : 'bg-white/8 text-white/25 hover:bg-white/15 hover:scale-105 hover:text-white/60 -rotate-12'
            }`}
            aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
          >
            {isCompleted && <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" style={{ animationIterationCount: 1 }} />}
            <Check size={22} strokeWidth={isCompleted ? 3 : 2} />
          </button>
        </div>

        {/* Context: mood & energy (shown after completion) */}
        <div
          className={`transition-all duration-500 overflow-hidden ${showContext ? 'max-h-24 mt-4 opacity-100' : 'max-h-0 mt-0 opacity-0'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-px w-full bg-white/10 mb-3" />
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest shrink-0">How did you feel?</span>
            <div className="flex gap-3">
              <div className="flex bg-black/30 rounded-full p-1 border border-white/5">
                {[{v:'low',e:'🪫'},{v:'medium',e:'🔋'},{v:'high',e:'⚡'}].map(x => (
                  <button key={x.v} onClick={ev => handleContextLog(ev,'energyLevel',x.v)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${todayEntry?.energyLevel===x.v?'bg-white/20 scale-110':'hover:bg-white/10 opacity-50 hover:opacity-100'}`}>
                    {x.e}
                  </button>
                ))}
              </div>
              <div className="flex bg-black/30 rounded-full p-1 border border-white/5">
                {[{v:'bad',e:'😩'},{v:'okay',e:'😐'},{v:'great',e:'🤩'}].map(x => (
                  <button key={x.v} onClick={ev => handleContextLog(ev,'mood',x.v)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${todayEntry?.mood===x.v?'bg-white/20 scale-110':'hover:bg-white/10 opacity-50 hover:opacity-100'}`}>
                    {x.e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

