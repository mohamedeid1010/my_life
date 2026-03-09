import React, { useState } from 'react';
import { Dumbbell, Download, Target, SlidersHorizontal } from 'lucide-react';
import { t } from '../config/translations';
import usePreferences from '../hooks/usePreferences';

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

export default function Header({ targetDays, setTargetDays, onExport, workoutSystem, setWorkoutSystem, children }) {
  const [showControls, setShowControls] = useState(false);
  const { language } = usePreferences();
  const L = language;
  
  const hasControls = setTargetDays || setWorkoutSystem || onExport;

  return (
    <div className="space-y-4">
      {/* Top Bar for Toggles */}
      <div className="flex justify-end items-center gap-2 sm:gap-3 flex-wrap">
        {/* Sections Button (passed from GymTracker/HabitsTracker as children) */}
        {children}

        {/* Global Settings Toggle */}
        {hasControls && (
          <button
            onClick={() => setShowControls(!showControls)}
            className={`touch-target flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
              showControls ? 'bg-white/10 text-white/90' : 'bg-white/5 text-white/40 hover:text-white/70'
            }`}
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <SlidersHorizontal size={14} />
            {t('settings', L)}
          </button>
        )}
      </div>

      {/* Expanded Controls Panel */}
      {showControls && hasControls && (
        <div className="glass-card flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 p-4 flex-wrap animate-fade-in z-20 relative">
          
          {/* Weekly Goal */}
          {targetDays !== undefined && setTargetDays && (
            <div className="flex items-center justify-between sm:justify-start gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl"
              style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <Target size={18} className="text-violet-400" />
                <span className="text-sm font-bold text-violet-300">Weekly Goal:</span>
              </div>
              <div className="flex items-center gap-3 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <button
                  type="button"
                  onClick={() => setTargetDays(Math.max(1, targetDays - 1))}
                  className="touch-target w-8 h-8 rounded-md flex items-center justify-center font-black text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  -
                </button>
                <span className="font-black text-violet-400 w-6 text-center text-lg">
                  {targetDays}
                </span>
                <button
                  type="button"
                  onClick={() => setTargetDays(Math.min(7, targetDays + 1))}
                  className="touch-target w-8 h-8 rounded-md flex items-center justify-center font-black text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Workout System Selector */}
          {setWorkoutSystem && (
            <div className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex-1 sm:flex-none min-w-[200px]"
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <Dumbbell size={18} className="text-emerald-400 shrink-0" />
              <select
                value={workoutSystem || 'ppl'}
                onChange={e => setWorkoutSystem(e.target.value)}
                className="touch-target bg-transparent text-emerald-300 font-bold text-sm focus:outline-none cursor-pointer w-full min-h-[40px]"
                style={{ colorScheme: 'dark' }}
              >
                {WORKOUT_SYSTEMS.map(s => (
                  <option key={s.value} value={s.value} className="bg-gray-900 text-white">{s.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Export Button */}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="action-btn touch-target flex justify-center items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all text-white min-h-[48px] text-sm w-full sm:w-auto"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
              }}
            >
              <Download size={18} />
              Export CSV
            </button>
          )}
        </div>
      )}
    </div>
  );
}
