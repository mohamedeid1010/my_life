import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';

/**
 * Daily Action Panel — Mark today complete + countdown timer
 */
export default function DailyActionPanel({ stats, onMarkComplete }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [justCompleted, setJustCompleted] = useState(false);

  // Countdown to midnight
  useEffect(() => {
    function updateTimer() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;

      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

      setTimeLeft(`${h}:${m}:${s}`);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    onMarkComplete();
    if (!stats.todayCompleted) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 2000);
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: '0.05s' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 self-start w-full">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))' }}
        >
          <Sparkles size={20} className="text-emerald-400" />
        </div>
        <div className="text-left">
          <h3 className="text-base font-bold text-white/90">Daily Action</h3>
          <p className="text-xs text-white/30 font-medium">Today's commitment</p>
        </div>
      </div>

      {/* Big Button */}
      <button
        onClick={handleClick}
        className={`action-btn w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 mb-5 transition-all duration-300 ${
          stats.todayCompleted
            ? 'bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 cursor-default'
            : 'border-2 border-violet-500/30 text-white hover:border-violet-400/60'
        }`}
        style={
          !stats.todayCompleted
            ? { background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))' }
            : {}
        }
        disabled={false}
      >
        {stats.todayCompleted ? (
          <>
            <CheckCircle2 size={24} />
            Today Completed ✨
          </>
        ) : (
          <>
            <CheckCircle2 size={24} />
            Mark Today Complete
          </>
        )}
      </button>

      {/* Celebration flash */}
      {justCompleted && (
        <div className="text-emerald-400 text-sm font-bold animate-pop mb-3">
          🎉 Amazing! Keep the streak alive!
        </div>
      )}

      {/* Countdown */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl w-full justify-center"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <Clock size={16} className="text-white/30" />
        <span className="text-xs text-white/40 font-semibold">Time left:</span>
        <span className="text-lg font-black text-white/80 font-mono tracking-wider">
          {timeLeft}
        </span>
      </div>
    </div>
  );
}
