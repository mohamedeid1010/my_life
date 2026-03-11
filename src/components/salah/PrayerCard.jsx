import React, { useState } from 'react';
import { PRAYER_LABELS, STATUS_CONFIG } from '../../types/salah.types';
import { t } from '../../config/translations';
import usePreferences from '../../hooks/usePreferences';

const STATUS_ORDER = ['missed', 'late', 'ontime', 'congregation', 'mosque'];

export default function PrayerCard({ prayerName, entry, weekData, onStatusChange, onKhushooChange, isReadOnly, isNextPrayer, nextPrayerCountdown }) {
  const [showKhushoo, setShowKhushoo] = useState(false);
  const { language } = usePreferences();
  const L = language;
  const isAr = L === 'ar';
  const label = PRAYER_LABELS[prayerName];
  const currentStatus = entry?.status || 'none';
  const currentPoints = entry?.points || 0;
  const currentKhushoo = entry?.khushoo;

  const isLogged = currentStatus !== 'none';
  const statusConf = STATUS_CONFIG[currentStatus];

  // Build weekly mini-indicators
  const weekIndicators = (weekData || []).map(day => {
    const p = day.prayers?.[prayerName];
    if (!p || p.status === 'none') return STATUS_CONFIG.none;
    return STATUS_CONFIG[p.status] || STATUS_CONFIG.none;
  });

  return (
    <div
      className={`glass-card p-3 sm:p-4 transition-all duration-500 relative overflow-hidden group flex flex-col ${isNextPrayer ? 'ring-2 ring-cyan-400/60' : ''}`}
      style={{
        borderColor: isNextPrayer ? '#22d3ee' : isLogged ? statusConf.color + '40' : undefined,
        boxShadow: isNextPrayer ? '0 0 25px rgba(34,211,238,0.2)' : isLogged ? `0 0 20px ${statusConf.color}15` : undefined,
      }}
    >
      {/* Next prayer glow */}
      {isNextPrayer && (
        <div className="absolute inset-0 opacity-10 transition-opacity duration-500" style={{ background: 'radial-gradient(ellipse at center, #22d3ee, transparent 70%)' }} />
      )}
      {/* Glow background */}
      {isLogged && !isNextPrayer && (
        <div
          className="absolute inset-0 opacity-5 transition-opacity duration-500"
          style={{ background: `radial-gradient(ellipse at center, ${statusConf.color}, transparent 70%)` }}
        />
      )}

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header — emoji + name + points */}
        <div className="text-center mb-3">
          <span className="text-3xl block mb-1">{label.emoji}</span>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wide">{isAr ? label.ar : label.en}</h3>
          <span className="text-[10px] font-bold text-[var(--text-muted)] block">{isAr ? label.en : label.ar}</span>
          {isNextPrayer && nextPrayerCountdown && (
            <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 animate-pulse">
              ⏳ {nextPrayerCountdown}
            </div>
          )}
          {isLogged && (
            <div
              className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold animate-fade-in"
              style={{ background: statusConf.color + '15', color: statusConf.color }}
            >
              <span>{statusConf.icon}</span>
              <span>+{currentPoints}</span>
            </div>
          )}
        </div>

        {/* Status buttons — compact vertical stack */}
        <div className="flex flex-col gap-1 mb-3 flex-1">
          {STATUS_ORDER.map(status => {
            const conf = STATUS_CONFIG[status];
            const isActive = currentStatus === status;
            return (
              <button
                key={status}
                onClick={() => !isReadOnly && onStatusChange(prayerName, currentStatus === status ? 'none' : status)}
                disabled={isReadOnly}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all duration-200 ${
                  isActive
                    ? 'scale-[1.02] shadow-md'
                    : 'opacity-50 hover:opacity-90'
                } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                style={{
                  background: isActive ? conf.color + '20' : 'rgba(0,0,0,0.05)',
                  borderColor: isActive ? conf.color + '60' : 'transparent',
                  boxShadow: isActive ? `0 0 8px ${conf.color}20` : 'none',
                }}
              >
                <span className="text-sm">{conf.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider flex-1 text-left" style={{ color: isActive ? conf.color : 'var(--text-muted)' }}>
                  {status === 'ontime' ? t('status_ontime', L) : status === 'congregation' ? t('status_congregation', L) : status === 'missed' ? t('status_missed', L) : status === 'late' ? t('status_late', L) : t('status_mosque', L)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom: weekly mini + khushoo */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--border-glass)]">
          <div className="flex items-center gap-0.5">
            {weekIndicators.map((ind, i) => (
              <span
                key={i}
                className="text-[10px] leading-none"
                title={`Day ${i + 1}`}
                style={{ color: ind.color }}
              >
                {ind.icon}
              </span>
            ))}
          </div>

          {isLogged && !isReadOnly && (
            <div>
              {!showKhushoo ? (
                <button
                  onClick={() => setShowKhushoo(true)}
                  className="text-[9px] font-bold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors px-1 py-0.5"
                >
                  {currentKhushoo ? ['😔', '😐', '🤲'][currentKhushoo - 1] : '🤲'}
                </button>
              ) : (
                <div className="flex gap-0.5 animate-fade-in">
                  {[1, 2, 3].map(level => (
                    <button
                      key={level}
                      onClick={() => { onKhushooChange(prayerName, level); setShowKhushoo(false); }}
                      className={`text-sm px-1 rounded transition-all ${
                        currentKhushoo === level ? 'bg-[var(--accent-primary)]/20' : 'hover:bg-white/5'
                      }`}
                    >
                      {['😔', '😐', '🤲'][level - 1]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
