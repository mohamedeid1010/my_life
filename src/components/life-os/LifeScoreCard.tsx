import React from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles, ChevronRight } from 'lucide-react';
import type { LifeScoreData } from '../../types/life-os.types';

/* ──────────────────────────────────────────────────────────────
   Radial arc progress for the big score
────────────────────────────────────────────────────────────── */
function RadialScore({ score }: { score: number }) {
  const radius = 54;
  const stroke = 7;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const dashOffset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 80 ? '#10b981' : score >= 60 ? '#8b5cf6' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
      <svg
        width="128"
        height="128"
        viewBox="0 0 128 128"
        className="-rotate-90"
        aria-hidden
      >
        {/* Track */}
        <circle
          cx="64"
          cy="64"
          r={normalizedRadius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx="64"
          cy="64"
          r={normalizedRadius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color: scoreColor }}>
          {score}
        </span>
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Life Score
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Horizontal dimension bar
────────────────────────────────────────────────────────────── */
function DimensionBar({
  label,
  icon,
  score,
  color,
  delta,
  onClick,
}: {
  label: string;
  icon: string;
  score: number;
  color: string;
  delta?: number;
  onClick?: () => void;
}) {
  const TrendIcon =
    delta == null ? null : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor =
    delta == null ? '' : delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-white/30';

  return (
    <div
      onClick={onClick}
      className={`flex flex-col gap-1.5 p-2 -mx-2 rounded-lg ${onClick ? 'cursor-pointer hover:bg-white/[0.03] transition-colors' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {TrendIcon && (
            <TrendIcon size={11} className={trendColor} />
          )}
          <span className="text-sm font-bold tabular-nums" style={{ color }}>
            {score}
          </span>
          {onClick && (
            <ChevronRight size={12} className="text-white/30" />
          )}
        </div>
      </div>

      {/* Track */}
      <div className="h-1.5 rounded-full w-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            background: color,
            transition: 'width 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────── */
interface LifeScoreCardProps {
  data: LifeScoreData;
  onNavigate?: (page: string) => void;
  dimensionPageMap?: Record<string, string>;
}

export default function LifeScoreCard({ data, onNavigate, dimensionPageMap }: LifeScoreCardProps) {
  const label =
    data.overall >= 85
      ? 'Excellent — keep the momentum!'
      : data.overall >= 70
      ? 'Strong — small adjustments needed.'
      : data.overall >= 50
      ? 'Building — stay consistent.'
      : 'Recovery mode — focus on basics.';

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
      style={{
        background: 'rgba(139,92,246,0.06)',
        border: '1px solid rgba(139,92,246,0.18)',
        boxShadow: '0 0 40px rgba(139,92,246,0.08)',
      }}
    >
      {/* Background glow blob */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}
        aria-hidden
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-violet-400" />
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Life Operating System
        </span>
      </div>

      {/* Score + Dimensions */}
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        {/* Radial Score */}
        <div className="flex flex-col items-center gap-2">
          <RadialScore score={data.overall} />
          <p className="text-xs text-center max-w-[130px]" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
        </div>

        {/* Dimension bars */}
        <div className="flex-1 w-full flex flex-col gap-3 justify-center">
          {data.dimensions.map((dim) => (
            <DimensionBar
              key={dim.key}
              label={dim.label}
              icon={dim.icon}
              score={dim.score}
              color={dim.color}
              delta={dim.delta}
              onClick={onNavigate && dimensionPageMap?.[dim.key]
                ? () => onNavigate(dimensionPageMap[dim.key])
                : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
