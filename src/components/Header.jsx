import { Dumbbell, Download, Target } from 'lucide-react';

const WORKOUT_SYSTEMS = [
  { value: 'ppl', label: '💪 Push / Pull / Legs (PPL)' },
  { value: 'ul', label: '🔄 Upper / Lower (UL)' },
  { value: 'ppl_ul', label: '🔥 PPL + Upper/Lower' },
  { value: 'fullbody', label: '🏋️ Full Body' },
  { value: 'bro', label: '🦾 Bro Split (5-day)' },
  { value: 'arnoldSplit', label: '🏆 Arnold Split' },
  { value: 'phul', label: '⚡ PHUL (Power Hypertrophy)' },
  { value: 'phat', label: '🔥 PHAT' },
  { value: 'gzclp', label: '📊 GZCLP' },
  { value: '531', label: '🎯 Wendler 5/3/1' },
  { value: 'stronglifts', label: '🏗️ StrongLifts 5x5' },
  { value: 'greyskull', label: '💀 Greyskull LP' },
  { value: 'texas', label: '🤠 Texas Method' },
  { value: 'custom', label: '✏️ Custom' },
];

export default function Header({ targetDays, setTargetDays, onExport, workoutSystem, setWorkoutSystem }) {
  return (
    <div className="glass-card-static flex flex-col lg:flex-row justify-between items-stretch lg:items-center p-4 sm:p-5 gap-4 animate-slide-up">
      {/* Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg p-0.5 shrink-0"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
        >
          <img src="/horizon-logo.png" alt="Horizon Logo" className="w-full h-full object-cover rounded-lg" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-black text-white/95 tracking-tight leading-tight truncate">
            Horizon
          </h1>
          <p className="text-[10px] sm:text-xs font-semibold text-violet-400">Life Operating System</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-wrap">
        {/* Weekly Goal */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex-wrap"
          style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <Target size={20} className="text-violet-400" />
          <span className="text-sm font-bold text-violet-300">Weekly Goal:</span>
          <div className="flex items-center gap-3 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              type="button"
              onClick={() => setTargetDays(Math.max(1, targetDays - 1))}
              className="touch-target w-9 h-9 sm:w-7 sm:h-7 rounded-md flex items-center justify-center font-black text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              -
            </button>
            <span className="font-black text-violet-400 w-6 text-center text-base sm:text-lg">
              {targetDays}
            </span>
            <button
              type="button"
              onClick={() => setTargetDays(Math.min(7, targetDays + 1))}
              className="touch-target w-9 h-9 sm:w-7 sm:h-7 rounded-md flex items-center justify-center font-black text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Workout System Selector */}
        {setWorkoutSystem && (
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl min-w-0"
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <Dumbbell size={18} className="text-emerald-400 shrink-0" />
            <select
              value={workoutSystem || 'ppl'}
              onChange={e => setWorkoutSystem(e.target.value)}
              className="touch-target bg-transparent text-emerald-300 font-bold text-xs sm:text-sm focus:outline-none cursor-pointer min-h-[44px] max-w-full"
              style={{ colorScheme: 'dark' }}
            >
              {WORKOUT_SYSTEMS.map(s => (
                <option key={s.value} value={s.value} className="bg-gray-900 text-white">{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Export Button */}
        <button
          type="button"
          onClick={onExport}
          className="action-btn touch-target flex justify-center items-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-semibold transition-all w-full sm:w-auto text-white min-h-[44px] text-sm sm:text-base"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
          }}
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>
    </div>
  );
}
