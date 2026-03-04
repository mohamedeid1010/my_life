import { Dumbbell, Download, Target } from 'lucide-react';

/**
 * Header — Dark themed with glass effect
 */
export default function Header({ targetDays, setTargetDays, onExport }) {
  return (
    <div className="glass-card-static flex flex-col lg:flex-row justify-between items-center p-5 gap-4 animate-slide-up">
      {/* Title */}
      <div className="flex items-center gap-4">
        <div
          className="p-3 rounded-xl shadow-lg"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
        >
          <Dumbbell size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white/95 tracking-tight">
            Pro Gym Dashboard
          </h1>
          <p className="text-sm font-medium text-white/30">
            Smart Streak &amp; Discipline System
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Weekly Goal */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
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
              onClick={() => setTargetDays(Math.max(1, targetDays - 1))}
              className="w-7 h-7 rounded-md flex items-center justify-center font-black text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              -
            </button>
            <span className="font-black text-violet-400 w-4 text-center text-lg">
              {targetDays}
            </span>
            <button
              onClick={() => setTargetDays(Math.min(7, targetDays + 1))}
              className="w-7 h-7 rounded-md flex items-center justify-center font-black text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="action-btn flex justify-center items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all w-full sm:w-auto text-white"
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
