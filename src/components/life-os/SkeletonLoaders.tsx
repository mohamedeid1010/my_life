import React from 'react';

/* ── Shimmer base ── */
function Shimmer({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: 'rgba(255,255,255,0.05)', ...style }}
    />
  );
}

/* ── Life Score skeleton ── */
export function LifeScoreCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start"
      style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}
    >
      {/* Radial */}
      <Shimmer className="w-32 h-32 rounded-full shrink-0" />
      {/* Bars */}
      <div className="flex-1 w-full flex flex-col gap-4 justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex justify-between">
              <Shimmer className="w-24 h-3" />
              <Shimmer className="w-8 h-3" />
            </div>
            <Shimmer className="h-1.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Status grid skeleton ── */
export function LifeStatusGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex justify-between items-center">
            <Shimmer className="w-20 h-3.5" />
            <Shimmer className="w-8 h-5 rounded-lg" />
          </div>
          <Shimmer className="h-1 w-full" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex justify-between">
                <Shimmer className="w-20 h-2.5" />
                <Shimmer className="w-10 h-2.5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Generic glass card skeleton ── */
export function GlassCardSkeleton({ rows = 4, hasHeader = true }: { rows?: number; hasHeader?: boolean }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}
    >
      {hasHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shimmer className="w-7 h-7 rounded-lg" />
            <div className="flex flex-col gap-1">
              <Shimmer className="w-28 h-3.5" />
              <Shimmer className="w-20 h-2.5" />
            </div>
          </div>
          <Shimmer className="w-16 h-6 rounded-full" />
        </div>
      )}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Shimmer className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Shimmer className="w-3/4 h-3" />
              <Shimmer className="w-1/2 h-2.5" />
            </div>
            <Shimmer className="w-10 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Prayer card skeleton ── */
export function PrayerCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shimmer className="w-7 h-7 rounded-lg" />
          <div className="flex flex-col gap-1">
            <Shimmer className="w-24 h-3.5" />
            <Shimmer className="w-16 h-2.5" />
          </div>
        </div>
        <Shimmer className="w-20 h-6 rounded-full" />
      </div>
      {/* 5 prayer circles */}
      <div className="flex justify-between px-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Shimmer className="w-10 h-10 rounded-full" />
            <Shimmer className="w-10 h-2.5" />
            <Shimmer className="w-10 h-3.5 rounded-full" />
          </div>
        ))}
      </div>
      <Shimmer className="h-1.5 w-full" />
    </div>
  );
}
