import React from 'react';
import { Flame, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import type { HabitEngineItem } from '../../types/life-os.types';

/* ── Week pip row ── */
function WeekPips({ done, target }: { done: number; target: number }) {
  const pips = Array.from({ length: Math.max(target, 7) }, (_, i) => i < done);
  return (
    <div className="flex gap-1">
      {pips.slice(0, 7).map((filled, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background: filled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
            boxShadow: filled ? '0 0 4px rgba(139,92,246,0.5)' : 'none',
            transition: `background 0.3s ease ${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Single habit row ── */
function HabitRow({ habit }: { habit: HabitEngineItem }) {
  const weekPct = habit.weeklyTarget > 0
    ? Math.round((habit.weeklyDone / habit.weeklyTarget) * 100)
    : 0;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.03]"
    >
      {/* Icon + Today status */}
      <div className="relative shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)' }}
        >
          {habit.icon}
        </div>
        {/* Today done indicator */}
        <div className="absolute -bottom-0.5 -right-0.5">
          {habit.todayDone ? (
            <CheckCircle2 size={12} className="text-emerald-400" style={{ filter: 'drop-shadow(0 0 3px rgba(16,185,129,0.6))' }} />
          ) : (
            <Circle size={12} className="text-white/20" />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {habit.name}
          </span>
          {/* Streak badge */}
          {habit.currentStreak > 0 && (
            <div
              className="flex items-center gap-0.5 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-lg ml-2"
              style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}
            >
              <Flame size={9} />
              <span>{habit.currentStreak}d</span>
            </div>
          )}
        </div>
        <WeekPips done={habit.weeklyDone} target={habit.weeklyTarget} />
      </div>

      {/* Weekly % */}
      <div className="shrink-0 text-right">
        <div
          className="text-xs font-black tabular-nums"
          style={{
            color: weekPct >= 80 ? '#10b981' : weekPct >= 50 ? '#8b5cf6' : '#f59e0b',
          }}
        >
          {weekPct}%
        </div>
        <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
          this week
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
interface HabitEngineCardProps {
  habits: HabitEngineItem[];
  maxVisible?: number;
  onNavigate?: () => void;
}

export default function HabitEngineCard({ habits, maxVisible = 5, onNavigate }: HabitEngineCardProps) {
  const visible = habits.slice(0, maxVisible);
  const todayCount = habits.filter((h) => h.todayDone).length;
  const total = habits.length;

  return (
    <div
      onClick={onNavigate}
      className={`rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden ${onNavigate ? 'cursor-pointer hover:scale-[1.01] transition-transform duration-200' : ''}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.1)' }}
          >
            <Flame size={14} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Habit Engine
            </h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Streaks & weekly progress
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Today completion badge */}
          <div
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              color: todayCount === total && total > 0 ? '#10b981' : '#8b5cf6',
              background: todayCount === total && total > 0
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(139,92,246,0.1)',
            }}
          >
            {todayCount}/{total} today
          </div>
          {onNavigate && (
            <ChevronRight size={16} className="text-white/30" />
          )}
        </div>
      </div>

      {/* Habit list */}
      <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {visible.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
            No habits tracked yet. Add habits to see your engine.
          </p>
        ) : (
          visible.map((habit) => <HabitRow key={habit.id} habit={habit} />)
        )}
      </div>

      {habits.length > maxVisible && (
        <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
          +{habits.length - maxVisible} more habits {onNavigate ? '— tap to view all' : ''}
        </p>
      )}
    </div>
  );
}
