import React from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import type { StatusCardData, LifeDimension } from '../../types/life-os.types';

const DIMENSION_CONFIG: Record<
  LifeDimension['key'],
  { label: string; icon: string; gradient: string; glow: string; borderColor: string }
> = {
  spiritual: {
    label: 'Spiritual',
    icon: '🕌',
    gradient: 'from-emerald-500/10 to-teal-500/5',
    glow: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.18)',
  },
  productivity: {
    label: 'Productivity',
    icon: '⚡',
    gradient: 'from-violet-500/10 to-indigo-500/5',
    glow: 'rgba(139,92,246,0.12)',
    borderColor: 'rgba(139,92,246,0.18)',
  },
  health: {
    label: 'Health',
    icon: '💪',
    gradient: 'from-rose-500/10 to-pink-500/5',
    glow: 'rgba(244,63,94,0.12)',
    borderColor: 'rgba(244,63,94,0.18)',
  },
  focus: {
    label: 'Focus',
    icon: '🎯',
    gradient: 'from-blue-500/10 to-cyan-500/5',
    glow: 'rgba(59,130,246,0.12)',
    borderColor: 'rgba(59,130,246,0.18)',
  },
};

interface StatusCardProps {
  data: StatusCardData;
  score: number;
  onNavigate?: () => void;
}

export default function StatusCard({ data, score, onNavigate }: StatusCardProps) {
  const cfg = DIMENSION_CONFIG[data.dimension];

  const scoreColor =
    score >= 80 ? '#10b981' : score >= 60 ? '#8b5cf6' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div
      onClick={onNavigate}
      className={`relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden bg-gradient-to-br ${cfg.gradient} ${onNavigate ? 'cursor-pointer hover:scale-[1.02] transition-transform duration-200' : ''}`}
      style={{
        border: `1px solid ${cfg.borderColor}`,
        boxShadow: `0 0 20px ${cfg.glow}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{cfg.icon}</span>
          <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="text-sm font-black tabular-nums px-2 py-0.5 rounded-lg"
            style={{ color: scoreColor, background: `${scoreColor}15` }}
          >
            {score}
          </div>
          {onNavigate && (
            <ChevronRight size={14} className="text-white/30" />
          )}
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            background: scoreColor,
            boxShadow: `0 0 6px ${scoreColor}88`,
            transition: 'width 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      </div>

      {/* Metrics */}
      <div className="flex flex-col gap-2">
        {data.metrics.map((metric, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {metric.label}
            </span>
            <div className="flex items-center gap-1">
              {metric.trend === 'up' && <TrendingUp size={10} className="text-emerald-400" />}
              {metric.trend === 'down' && <TrendingDown size={10} className="text-red-400" />}
              {metric.trend === 'flat' && <Minus size={10} className="text-white/30" />}
              <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {metric.value}
                {metric.unit && (
                  <span className="text-[10px] font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>
                    {metric.unit}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   LifeStatusGrid — renders 4 StatusCards in a 2×2 grid
────────────────────────────────────────────────────────────── */
interface LifeStatusGridProps {
  cards: StatusCardData[];
  scores: Record<LifeDimension['key'], number>;
  onNavigate?: (page: string) => void;
  dimensionPageMap?: Record<string, string>;
}

export function LifeStatusGrid({ cards, scores, onNavigate, dimensionPageMap }: LifeStatusGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <StatusCard
          key={card.dimension}
          data={card}
          score={scores[card.dimension] ?? 0}
          onNavigate={onNavigate && dimensionPageMap?.[card.dimension]
            ? () => onNavigate(dimensionPageMap[card.dimension])
            : undefined
          }
        />
      ))}
    </div>
  );
}
