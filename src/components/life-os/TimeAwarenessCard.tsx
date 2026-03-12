import React, { useEffect, useState } from 'react';
import { Clock, CalendarDays, Bell } from 'lucide-react';
import type { TimeAwarenessData } from '../../types/life-os.types';

interface TimeAwarenessCardProps {
  data: TimeAwarenessData;
}

/* ── Live clock tick ── */
function useLiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = time.getHours();
  const mins = time.getMinutes().toString().padStart(2, '0');
  const secs = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const hour12Str = hour12.toString().padStart(2, '0');

  return {
    now: time,
    main: `${hour12Str}:${mins}`,
    suffix: `${secs} ${ampm}`
  };
}

function formatCountdown(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const hStr = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
  const mStr = m.toString().padStart(2, '0') + ':';
  const sStr = s.toString().padStart(2, '0');
  return `${hStr}${mStr}${sStr}`;
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
          {liveTime.main}
        </span>
        <span className="text-base font-bold tabular-nums uppercase" style={{ color: 'var(--text-muted)' }}>
          {liveTime.suffix}
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
            className="flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg tabular-nums"
            style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}
          >
            <Bell size={10} />
            <span>— {data.nextPrayer.targetDate ? formatCountdown(data.nextPrayer.targetDate, liveTime.now) : data.nextPrayer.timeLeft}</span>
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
