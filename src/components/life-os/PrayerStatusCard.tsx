import React from 'react';
import { Moon, ChevronRight } from 'lucide-react';
import type { PrayerStatusData, PrayerSlot } from '../../types/life-os.types';
import type { PrayerStatus } from '../../types/salah.types';

/* ── Status configuration ── */
const STATUS_CONFIG: Record<
  PrayerStatus,
  { label: string; color: string; bg: string; ring: string }
> = {
  mosque:       { label: 'Mosque',       color: '#10b981', bg: 'rgba(16,185,129,0.12)',  ring: 'rgba(16,185,129,0.35)' },
  congregation: { label: 'Congregation', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  ring: 'rgba(59,130,246,0.35)' },
  ontime:       { label: 'On Time',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', ring: 'rgba(139,92,246,0.35)' },
  late:         { label: 'Late',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  ring: 'rgba(245,158,11,0.35)' },
  missed:       { label: 'Missed',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   ring: 'rgba(239,68,68,0.35)'  },
  none:         { label: 'Pending',      color: '#64748b', bg: 'rgba(100,116,139,0.08)', ring: 'rgba(100,116,139,0.2)' },
};

/* ── Individual prayer dot ── */
function PrayerDot({ prayer }: { prayer: PrayerSlot }) {
  const cfg = STATUS_CONFIG[prayer.status];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circle */}
      <div
        className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-lg transition-all duration-300"
        style={{
          background: cfg.bg,
          boxShadow: `0 0 0 2px ${cfg.ring}`,
        }}
        title={`${prayer.label} — ${cfg.label}`}
      >
        <span>{prayer.emoji}</span>
        {/* Status indicator dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
          style={{
            background: cfg.color,
            borderColor: 'var(--bg-primary)',
          }}
        />
      </div>

      {/* Name */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          {prayer.label}
        </span>
        {prayer.time && (
          <span className="text-[9px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {prayer.time}
          </span>
        )}
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ color: cfg.color, background: cfg.bg }}
        >
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

/* ── Main component ── */
interface PrayerStatusCardProps {
  data: PrayerStatusData;
  onNavigate?: () => void;
}

export default function PrayerStatusCard({ data, onNavigate }: PrayerStatusCardProps) {
  const pct = data.totalCount > 0
    ? Math.round((data.completedCount / data.totalCount) * 100)
    : 0;

  const completedStatuses: PrayerStatus[] = ['mosque', 'congregation', 'ontime', 'late'];
  const allDone = data.prayers.every((p) => completedStatuses.includes(p.status));

  return (
    <div
      onClick={onNavigate}
      className={`rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden ${onNavigate ? 'cursor-pointer hover:scale-[1.01] transition-transform duration-200' : ''}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(16,185,129,0.04) 0%, transparent 60%)' }}
        aria-hidden
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.1)' }}
          >
            <Moon size={14} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Prayer Status
            </h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Today's prayers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Completion badge */}
          <div
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              color: allDone ? '#10b981' : pct >= 60 ? '#8b5cf6' : '#f59e0b',
              background: allDone
                ? 'rgba(16,185,129,0.1)'
                : pct >= 60
                ? 'rgba(139,92,246,0.1)'
                : 'rgba(245,158,11,0.1)',
            }}
          >
            {data.completedCount}/{data.totalCount} prayed
          </div>
          {onNavigate && (
            <ChevronRight size={16} className="text-white/30" />
          )}
        </div>
      </div>

      {/* Prayer dots */}
      <div className="flex items-start justify-between px-1">
        {data.prayers.map((prayer) => (
          <PrayerDot key={prayer.name} prayer={prayer} />
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Daily completion
          </span>
          <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: allDone
                ? 'linear-gradient(90deg, #10b981, #059669)'
                : 'linear-gradient(90deg, #8b5cf6, #10b981)',
              boxShadow: `0 0 6px ${allDone ? 'rgba(16,185,129,0.6)' : 'rgba(139,92,246,0.5)'}`,
            }}
          />
        </div>
      </div>

      {/* Next prayer strip */}
      {data.nextPrayer && (
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{data.nextPrayer.emoji}</span>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Next — {data.nextPrayer.label}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {data.nextPrayer.time}
              </p>
            </div>
          </div>
          <div
            className="text-xs font-black tabular-nums px-2 py-1 rounded-lg"
            style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}
          >
            in {data.nextPrayer.timeLeft}
          </div>
        </div>
      )}
    </div>
  );
}
