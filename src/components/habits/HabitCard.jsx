import React, { useState } from 'react';
import { getLocalDateString } from '../../stores/useHabitStore';
import { Check, Flame, Star, Battery, Smile, Activity } from 'lucide-react';

export default function HabitCard({ habit, onLogEntry, onExpandDetails }) {
  const { id, name, icon, targetType, targetValue, unit, graceDaysAllowance, stats } = habit;
  const todayStr = getLocalDateString();
  const todayEntry = stats.todayEntry;
  const isCompleted = todayEntry?.status === 'completed';
  
  const [showContext, setShowContext] = useState(false);

  // Zero-friction toggle
  const handleToggle = (e) => {
    e.stopPropagation();
    if (isCompleted) {
      // Un-complete (revert to pending)
      onLogEntry(id, todayStr, { status: 'pending' });
      setShowContext(false);
    } else {
      // Mark complete
      // If it's a numeric target, we assume hitting the button means they achieved the target value
      const val = targetType === 'numeric' ? targetValue : null;
      onLogEntry(id, todayStr, { status: 'completed', value: val });
      
      // Show context popover for mood/energy
      setShowContext(true);
      // Auto-hide context after 5 seconds if ignored
      setTimeout(() => setShowContext(false), 5000);
    }
  };

  const handleContextLog = (e, type, value) => {
    e.stopPropagation();
    onLogEntry(id, todayStr, { [type]: value });
    // Keep context open briefly to see selection
    setTimeout(() => setShowContext(false), 1500);
  };

  return (
    <div
      className={`glass-card p-4 sm:p-5 transition-all duration-300 relative overflow-hidden group cursor-pointer ${
        isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'hover:bg-white/5'
      }`}
      onClick={() => onExpandDetails(habit)}
    >
      {/* Background glow on complete */}
      <div 
        className={`absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent transition-opacity duration-500 rounded-2xl ${
          isCompleted ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className="flex items-center justify-between relative z-10 w-full">
        {/* Left Side: Icon & Info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleToggle}
            className={`touch-target w-12 h-12 rounded-xl flex items-center justify-center text-2xl sm:text-3xl transition-transform duration-300 hover:scale-110 active:scale-95 shrink-0 ${isCompleted ? 'scale-110 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-black/20 hover:bg-black/40'}`}
            title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
          >
            {icon}
          </button>
          
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className={`font-bold text-base sm:text-lg transition-colors truncate ${isCompleted ? 'text-white' : 'text-white/80'}`}>
              {name}
            </h3>
            
            <div className="flex items-center gap-3 mt-1">
              {/* Current Streak */}
              {stats.currentStreak > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-orange-400" title="Current Streak">
                  <Flame size={12} />
                  <span>{stats.currentStreak}d</span>
                </div>
              )}

              {/* Best Streak */}
              {stats.longestStreak > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-yellow-400" title={`Best Streak: ${stats.longestStreak} days`}>
                  <Star size={12} />
                  <span>{stats.longestStreak}d</span>
                </div>
              )}
              
              {/* Target Data (if numeric) */}
              {targetType === 'numeric' && (
                <div className="flex items-center gap-1 text-xs font-bold text-violet-300">
                   <Activity size={12} />
                   <span>{targetValue} {unit}</span>
                </div>
              )}

              {/* Grace Days Left */}
              {graceDaysAllowance > 0 && (
                <div className="text-xs font-semibold text-white/30 flex items-center gap-1" title="Grace days left this month">
                  <span className={stats.graceDaysBalance === 0 ? 'text-red-400/50' : 'text-white/30'}>
                    ☕ {stats.graceDaysBalance}/{graceDaysAllowance} Skips Left
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Big Action Button */}
        <button
          onClick={handleToggle}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-xl ${
            isCompleted 
              ? 'bg-emerald-500 text-white scale-100 rotate-0' 
              : 'bg-white/10 text-white/30 hover:bg-white/20 hover:scale-105 hover:text-white/60 -rotate-12'
          }`}
        >
          {isCompleted && (
            <div className="absolute inset-0 rounded-full  opacity-20 bg-emerald-400" />
          )}
          <Check size={28} className={isCompleted ? 'stroke-[3px]' : 'stroke-[2px]'} />
        </button>
      </div>

      {/* Expandable Context Area (Energy & Mood) */}
      <div 
        className={`relative z-10 transition-all duration-500 overflow-hidden flex flex-col gap-3 ${
          showContext ? 'max-h-40 mt-4 opacity-100' : 'max-h-0 mt-0 opacity-0'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-px w-full bg-white/10" />
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <span className="text-xs font-bold text-white/50 uppercase tracking-widest">How did you feel?</span>
          
          <div className="flex gap-4">
            {/* Energy */}
            <div className="flex bg-black/30 rounded-full p-1 border border-white/5">
              {[
                { val: 'low', emoji: '🪫', label: 'Low Energy' },
                { val: 'medium', emoji: '🔋', label: 'Normal' },
                { val: 'high', emoji: '⚡', label: 'High Energy' }
              ].map(e => (
                <button
                  key={e.val}
                  onClick={(ev) => handleContextLog(ev, 'energyLevel', e.val)}
                  title={e.label}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    todayEntry?.energyLevel === e.val ? 'bg-white/20 scale-110' : 'hover:bg-white/10 opacity-50 hover:opacity-100'
                  }`}
                >
                  {e.emoji}
                </button>
              ))}
            </div>

            {/* Mood */}
            <div className="flex bg-black/30 rounded-full p-1 border border-white/5">
              {[
                { val: 'bad', emoji: '😩', label: 'Bad Mood' },
                { val: 'okay', emoji: '😐', label: 'Okay' },
                { val: 'great', emoji: '🤩', label: 'Great Mood' }
              ].map(m => (
                <button
                  key={m.val}
                  onClick={(ev) => handleContextLog(ev, 'mood', m.val)}
                  title={m.label}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    todayEntry?.mood === m.val ? 'bg-white/20 scale-110' : 'hover:bg-white/10 opacity-50 hover:opacity-100'
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
