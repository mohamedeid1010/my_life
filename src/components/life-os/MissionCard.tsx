import React, { useState } from 'react';
import { CheckCircle2, Circle, Zap, Flag, Clock } from 'lucide-react';
import type { MissionData, MissionTask } from '../../types/life-os.types';

const PRIORITY_CONFIG = {
  high: {
    dot: 'bg-red-400',
    badge: 'text-red-400 bg-red-400/10',
    label: 'High',
  },
  medium: {
    dot: 'bg-amber-400',
    badge: 'text-amber-400 bg-amber-400/10',
    label: 'Med',
  },
  low: {
    dot: 'bg-white/20',
    badge: 'text-white/30 bg-white/5',
    label: 'Low',
  },
};

const CATEGORY_ICON: Record<NonNullable<MissionTask['category']>, string> = {
  spiritual: '🕌',
  productivity: '⚡',
  health: '💪',
  focus: '🎯',
  learning: '📚',
};

interface TaskRowProps {
  task: MissionTask;
  onToggle: (id: string) => void;
}

function TaskRow({ task, onToggle }: TaskRowProps) {
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <button
      type="button"
      onClick={() => onToggle(task.id)}
      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/[0.04] text-left"
      aria-label={`${task.completed ? 'Unmark' : 'Complete'}: ${task.title}`}
    >
      {/* Checkbox icon */}
      <div className="shrink-0 transition-transform duration-200 group-hover:scale-110">
        {task.completed ? (
          <CheckCircle2 size={18} className="text-emerald-400" />
        ) : (
          <Circle size={18} className="text-white/20 group-hover:text-white/40 transition-colors" />
        )}
      </div>

      {/* Category emoji */}
      {task.category && (
        <span className="text-sm shrink-0">{CATEGORY_ICON[task.category]}</span>
      )}

      {/* Title */}
      <span
        className={`flex-1 text-sm font-medium transition-all duration-200 ${
          task.completed ? 'line-through' : ''
        }`}
        style={{ color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}
      >
        {task.title}
      </span>

      {/* Metadata */}
      <div className="flex items-center gap-1.5 shrink-0">
        {task.dueTime && (
          <div className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <Clock size={9} />
            <span>{task.dueTime}</span>
          </div>
        )}
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${priority.badge}`}>
          {priority.label}
        </span>
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────── */
interface MissionCardProps {
  data: MissionData;
  /** Called when a task is toggled. Pass-through to parent / Firestore write. */
  onToggleTask: (taskId: string) => void;
}

export default function MissionCard({ data, onToggleTask }: MissionCardProps) {
  const completed = data.tasks.filter((t) => t.completed).length;
  const total = data.tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const allDone = completed === total && total > 0;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Glow when all done */}
      {allDone && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: 'radial-gradient(ellipse at top, rgba(16,185,129,0.08) 0%, transparent 60%)' }}
          aria-hidden
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(251,191,36,0.1)' }}
          >
            <Zap size={14} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Today's Mission
            </h3>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              {data.date}
            </p>
          </div>
        </div>

        {/* Progress pill */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{
            background: allDone ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
            color: allDone ? '#10b981' : 'var(--text-secondary)',
            border: `1px solid ${allDone ? 'rgba(16,185,129,0.2)' : 'var(--border-glass)'}`,
          }}
        >
          <Flag size={10} />
          <span>
            {completed}/{total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: allDone
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : 'linear-gradient(90deg, #8b5cf6, #6366f1)',
            boxShadow: allDone ? '0 0 8px rgba(16,185,129,0.5)' : '0 0 8px rgba(139,92,246,0.5)',
          }}
        />
      </div>

      {/* Task list */}
      <div className="flex flex-col">
        {data.tasks.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
            No tasks today. Add your priorities to get started.
          </p>
        ) : (
          data.tasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={onToggleTask} />
          ))
        )}
      </div>

      {/* Completion message */}
      {allDone && (
        <div
          className="flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-bold"
          style={{ color: '#10b981', background: 'rgba(16,185,129,0.08)' }}
        >
          <CheckCircle2 size={12} />
          <span>All missions complete — excellent work!</span>
        </div>
      )}
    </div>
  );
}
