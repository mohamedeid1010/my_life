import React, { useState } from 'react';
import { PRAYER_LABELS, STATUS_CONFIG } from '../../types/salah.types';
import { t } from '../../config/translations';
import usePreferences from '../../hooks/usePreferences';

const STATUS_ORDER = ['mosque', 'congregation', 'ontime', 'late', 'missed'];

const STATUS_LABELS_MAP = {
  mosque:       { ar: 'مسجد',     en: 'Mosque' },
  congregation: { ar: 'جماعة',    en: 'Jamaa' },
  ontime:       { ar: 'في وقتها', en: 'On Time' },
  late:         { ar: 'متأخر',    en: 'Late' },
  missed:       { ar: 'فائتة',    en: 'Missed' },
};

export default function PrayerCard({
  prayerName, entry, weekData, onStatusChange, onKhushooChange,
  isReadOnly, isNextPrayer, nextPrayerCountdown,
}) {
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

  const weekIndicators = (weekData || []).map(day => {
    const p = day.prayers?.[prayerName];
    if (!p || p.status === 'none') return STATUS_CONFIG.none;
    return STATUS_CONFIG[p.status] || STATUS_CONFIG.none;
  });

  const cardBorder = isNextPrayer
    ? '#22d3ee50'
    : isLogged ? statusConf.color + '35' : 'var(--border-glass)';

  const cardShadow = isNextPrayer
    ? '0 0 32px rgba(34,211,238,0.22), 0 4px 24px rgba(0,0,0,0.25)'
    : isLogged
    ? `0 0 22px ${statusConf.color}18, 0 4px 24px rgba(0,0,0,0.2)`
    : '0 4px 20px rgba(0,0,0,0.15)';

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl transition-all duration-500 group"
      style={{ background: 'var(--bg-card)', border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}
    >
      {/* Top color stripe */}
      <div
        className="h-[3px] w-full flex-shrink-0 transition-all duration-500"
        style={{
          background: isNextPrayer
            ? 'linear-gradient(90deg, transparent, #22d3ee, #06b6d4, #22d3ee, transparent)'
            : isLogged
            ? `linear-gradient(90deg, transparent, ${statusConf.color}, transparent)`
            : `linear-gradient(90deg, transparent, var(--border-glass), transparent)`,
        }}
      />

      {/* Ambient glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: isNextPrayer
            ? 'radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.07) 0%, transparent 60%)'
            : isLogged
            ? `radial-gradient(ellipse at 50% 0%, ${statusConf.color}08 0%, transparent 60%)`
            : 'none',
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 p-4">

        {/* ── Prayer Identity ── */}
        <div className="text-center mb-4">
          <div className="relative inline-flex items-center justify-center mb-2.5">
            {isNextPrayer && (
              <div
                className="absolute w-14 h-14 rounded-full animate-ping opacity-20"
                style={{ background: '#22d3ee', animationDuration: '1.8s' }}
              />
            )}
            <span
              className="text-[2.6rem] leading-none block relative z-10 transition-transform duration-300 group-hover:scale-110"
              style={{
                filter: isNextPrayer
                  ? 'drop-shadow(0 0 10px rgba(34,211,238,0.7))'
                  : isLogged
                  ? `drop-shadow(0 0 7px ${statusConf.color}70)`
                  : 'none',
              }}
            >
              {label.emoji}
            </span>
          </div>

          <h3
            className="text-[13px] font-black uppercase tracking-[0.12em] mb-0.5 leading-tight"
            style={{ color: isNextPrayer ? '#22d3ee' : isLogged ? statusConf.color : 'var(--text-primary)' }}
          >
            {isAr ? label.ar : label.en}
          </h3>
          <span className="text-[10px] font-medium opacity-50 block" style={{ color: 'var(--text-muted)' }}>
            {isAr ? label.en : label.ar}
          </span>

          {isNextPrayer && nextPrayerCountdown && (
            <div
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[10px] font-black"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}
            >
              <span className="animate-pulse">⏳</span>
              <span className="font-mono tracking-wider">{nextPrayerCountdown}</span>
            </div>
          )}

          {isLogged && (
            <div
              className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black"
              style={{ background: statusConf.color + '15', border: `1px solid ${statusConf.color}30`, color: statusConf.color }}
            >
              <span>{statusConf.icon}</span>
              <span>+{currentPoints} pts</span>
            </div>
          )}
        </div>

        {/* ── Status Buttons ── */}
        <div className="flex flex-col gap-1.5 flex-1 mb-3">
          {STATUS_ORDER.map(status => {
            const conf = STATUS_CONFIG[status];
            const isActive = currentStatus === status;
            const lbl = STATUS_LABELS_MAP[status];
            return (
              <button
                key={status}
                onClick={() => !isReadOnly && onStatusChange(prayerName, currentStatus === status ? 'none' : status)}
                disabled={isReadOnly}
                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-xl border overflow-hidden
                  transition-all duration-200 text-left
                  ${isActive ? 'scale-[1.02]' : 'opacity-45 hover:opacity-80 hover:scale-[1.01]'}
                  ${isReadOnly ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}
                `}
                style={{
                  background: isActive ? conf.color + '15' : 'rgba(255,255,255,0.02)',
                  borderColor: isActive ? conf.color + '45' : 'var(--border-glass)',
                  boxShadow: isActive ? `0 2px 12px ${conf.color}20` : 'none',
                }}
              >
                {isActive && (
                  <div className="absolute inset-y-0 left-0 w-[3px] rounded-full" style={{ background: conf.color }} />
                )}
                <span className="text-sm leading-none">{conf.icon}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider flex-1 truncate"
                  style={{ color: isActive ? conf.color : 'var(--text-muted)' }}
                >
                  {isAr ? lbl.ar : lbl.en}
                </span>
                {isActive && (
                  <span className="text-[8px] font-black shrink-0 opacity-70" style={{ color: conf.color }}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Week Dots + Khushoo ── */}
        <div className="pt-3 border-t" style={{ borderColor: 'var(--border-glass)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {weekIndicators.map((ind, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  title={`Day ${i + 1}`}
                  style={{
                    background: ind.color === '#64748b' ? 'rgba(255,255,255,0.07)' : ind.color + '75',
                    border: `1px solid ${ind.color}50`,
                    boxShadow: ind.color !== '#64748b' ? `0 0 5px ${ind.color}50` : 'none',
                  }}
                />
              ))}
            </div>

            {isLogged && !isReadOnly && (
              <div className="flex items-center">
                {!showKhushoo ? (
                  <button
                    onClick={() => setShowKhushoo(true)}
                    className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-white/5 transition-all text-[10px] font-bold"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span className="text-sm">{currentKhushoo ? ['😔', '😐', '🤲'][currentKhushoo - 1] : '🤲'}</span>
                    {!currentKhushoo && <span className="opacity-40 text-[8px]">{isAr ? 'خشوع' : 'focus'}</span>}
                  </button>
                ) : (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(level => (
                      <button
                        key={level}
                        onClick={() => { onKhushooChange(prayerName, level); setShowKhushoo(false); }}
                        className="text-sm px-1.5 py-1 rounded-lg hover:scale-110 active:scale-95 transition-all"
                        style={{ background: currentKhushoo === level ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                      >
                        {['😔', '😐', '🤲'][level - 1]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-[8px] font-bold uppercase tracking-widest opacity-30 mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {isAr ? 'الأسبوع' : 'This week'}
          </div>
        </div>

      </div>
    </div>
  );
}
