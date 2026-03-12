import React, { useEffect, useState } from 'react';
import { Clock, CalendarDays, Bell } from 'lucide-react';
import type { TimeAwarenessData } from '../../types/life-os.types';

interface TimeAwarenessCardProps {
  data: TimeAwarenessData;
}

/* ── Live clock tick ── */
function useLiveClock() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

export default function TimeAwarenessCard({ data }: TimeAwarenessCardProps) {
  const liveTime = useLiveClock();

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.04) 100%)',
        border: '1px solid rgba(99,102,241,0.15)',
        boxShadow: '0 0 20px rgba(99,102,241,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Clock size={14} className="text-indigo-400" />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Time Awareness
        </span>
      </div>

      {/* Live time */}
      <div className="flex items-baseline gap-2">
        <span
          className="text-4xl font-black tracking-tight tabular-nums"
          style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
        >
          {liveTime.slice(0, 5)}
        </span>
        <span className="text-base font-bold tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {liveTime.slice(6)}
        </span>
      </div>

      {/* Date row */}
      <div className="flex items-center gap-2">
        <CalendarDays size={12} style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {data.currentDate}
        </span>
        {data.hijriDate && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {data.hijriDate}
            </span>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: 'var(--border-glass)' }} />

      {/* Next prayer */}
      {data.nextPrayer && (
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{data.nextPrayer.emoji}</span>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {data.nextPrayer.label}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                at {data.nextPrayer.time}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg"
            style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}
          >
            <Bell size={10} />
            <span>in {data.nextPrayer.timeLeft}</span>
          </div>
        </div>
      )}

      {/* Next task */}
      {data.nextTask && (
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>
              Next Task
            </p>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {data.nextTask.title}
            </p>
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: '#6366f1' }}>
            {data.nextTask.time}
          </span>
        </div>
      )}
    </div>
  );
}
