import React, { useState } from 'react';
import { Brain, AlertTriangle, Lightbulb, Star, TrendingUp, ChevronRight } from 'lucide-react';
import type { AIInsight, InsightType } from '../../types/life-os.types';

const TYPE_CONFIG: Record<
  InsightType,
  { icon: React.ElementType; color: string; bg: string; border: string; label: string }
> = {
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.18)',
    label: 'Pattern Alert',
  },
  tip: {
    icon: Lightbulb,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.18)',
    label: 'Tip',
  },
  praise: {
    icon: Star,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.18)',
    label: 'Well Done',
  },
  pattern: {
    icon: TrendingUp,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.18)',
    label: 'Insight',
  },
};

interface InsightItemProps {
  insight: AIInsight;
  isActive: boolean;
  onClick: () => void;
}

function InsightItem({ insight, isActive, onClick }: InsightItemProps) {
  const cfg = TYPE_CONFIG[insight.type];
  const Icon = cfg.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-200"
      style={{
        background: isActive ? cfg.bg : 'transparent',
        border: `1px solid ${isActive ? cfg.border : 'transparent'}`,
      }}
    >
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <Icon size={13} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
          {insight.dimension !== 'general' && (
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
              · {insight.dimension}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold mb-1 leading-snug" style={{ color: 'var(--text-primary)' }}>
          {insight.title}
        </p>
        {isActive && (
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {insight.body}
          </p>
        )}
      </div>

      <ChevronRight
        size={14}
        className="shrink-0 mt-1 transition-transform duration-200"
        style={{
          color: 'var(--text-muted)',
          transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
      />
    </button>
  );
}

/* ── Typing animation wrapper ── */
function TypingDot() {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
      style={{ animationDelay: '0ms' }}
    />
  );
}

/* ── Main component ── */
interface AIInsightsCardProps {
  insights: AIInsight[];
  isAnalyzing?: boolean;
}

export default function AIInsightsCard({ insights, isAnalyzing = false }: AIInsightsCardProps) {
  const [activeId, setActiveId] = useState<string | null>(
    insights.length > 0 ? insights[0].id : null
  );

  const handleClick = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Purple ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(139,92,246,0.05) 0%, transparent 60%)' }}
        aria-hidden
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Brain size={14} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              AI Insights
            </h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Behavioral analysis
            </p>
          </div>
        </div>

        {/* Analyzing indicator */}
        {isAnalyzing ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}
          >
            <span>Analyzing</span>
            <span className="flex gap-0.5 items-center">
              <TypingDot />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        ) : (
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}
          >
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Insight list */}
      <div className="flex flex-col gap-1">
        {insights.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
            {isAnalyzing
              ? 'Crunching your patterns...'
              : 'Track more data to unlock personalized insights.'}
          </p>
        ) : (
          insights.map((insight) => (
            <InsightItem
              key={insight.id}
              insight={insight}
              isActive={activeId === insight.id}
              onClick={() => handleClick(insight.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
