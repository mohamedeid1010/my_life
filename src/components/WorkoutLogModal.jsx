import React, { useState, useMemo } from 'react';
import { X, Save, Dumbbell, Trash2 } from 'lucide-react';
import { WORKOUT_SYSTEMS } from '../config/workoutSystems';

export default function WorkoutLogModal({ isOpen, onClose, onSave, onDelete, workoutSystem, existingSession }) {
  const systemConfig = WORKOUT_SYSTEMS[workoutSystem] || WORKOUT_SYSTEMS.ppl;

  const [sessionType, setSessionType] = useState(existingSession?.sessionType || systemConfig.sessions[0]?.value || '');
  const [totalValue, setTotalValue] = useState(existingSession?.totalValue || '');
  const [notes, setNotes] = useState(existingSession?.notes || '');

  const sessionMeta = useMemo(() => systemConfig.sessions.find(s => s.value === sessionType), [systemConfig, sessionType]);

  const handleSave = () => {
    onSave({
      sessionType,
      totalValue: parseFloat(totalValue) || 0,
      notes,
      timestamp: new Date().toISOString(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="glass-card w-full max-w-md p-6 space-y-5 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${sessionMeta?.color || '#8b5cf6'}22` }}>
              <Dumbbell size={20} style={{ color: sessionMeta?.color || '#8b5cf6' }} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white/90">Log Workout</h2>
              <p className="text-xs text-white/40 font-semibold">{systemConfig.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Session Type Selector */}
        <div>
          <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 block">What did you train today?</label>
          <div className="flex flex-wrap gap-2">
            {systemConfig.sessions.map(s => (
              <button
                key={s.value}
                onClick={() => setSessionType(s.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  sessionType === s.value
                    ? 'text-white shadow-lg scale-105'
                    : 'text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10'
                }`}
                style={sessionType === s.value ? {
                  background: `linear-gradient(135deg, ${s.color}33, ${s.color}11)`,
                  border: `1px solid ${s.color}55`,
                  boxShadow: `0 0 15px ${s.color}22`,
                } : { border: '1px solid rgba(255,255,255,0.05)' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Single Total Value Input */}
        <div>
          <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 block">Total Value (kg)</label>
          <div className="flex items-center gap-3 bg-black/30 rounded-xl p-4 border border-white/5">
            <span className="text-3xl">🏋️</span>
            <input
              type="number"
              value={totalValue}
              onChange={e => setTotalValue(e.target.value)}
              placeholder="e.g. 120"
              min="0"
              step="0.5"
              className="flex-1 bg-transparent text-white font-black text-3xl focus:outline-none placeholder-white/15 text-center"
              autoFocus
            />
            <span className="text-lg font-bold text-white/30">kg</span>
          </div>
          <p className="text-[10px] text-white/20 mt-1.5 text-center">Enter your total weight lifted or max weight for this session</p>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How was the session? Any PRs?"
            rows={2}
            className="w-full bg-white/5 px-3 py-2 rounded-lg text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex-none px-4 py-3.5 rounded-xl font-bold text-red-400 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20"
              title="Delete this workout"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${sessionMeta?.color || '#8b5cf6'}, ${sessionMeta?.color || '#8b5cf6'}88)`,
              boxShadow: `0 4px 20px ${sessionMeta?.color || '#8b5cf6'}33`,
            }}
          >
            <Save size={18} />
            Save Workout
          </button>
        </div>
      </div>
    </div>
  );
}
