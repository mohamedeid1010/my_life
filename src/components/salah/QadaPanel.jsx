import React from 'react';
import { CheckCircle, PlusCircle, AlertTriangle, BookOpen } from 'lucide-react';
import { PRAYER_NAMES, PRAYER_LABELS } from '../../types/salah.types';
import { t } from '../../config/translations';
import usePreferences from '../../hooks/usePreferences';

export default function QadaPanel({ qadaRecord, todayData, onAddDebt, onLogDone }) {
  const { language } = usePreferences();
  const L = language;
  const isAr = L === 'ar';
  const totalOwed = PRAYER_NAMES.reduce((sum, n) => sum + (qadaRecord?.prayers[n]?.owed || 0), 0);
  const totalDone = PRAYER_NAMES.reduce((sum, n) => sum + (qadaRecord?.prayers[n]?.done || 0), 0);
  const totalRemaining = totalOwed - totalDone;
  const progress = totalOwed > 0 ? Math.round((totalDone / totalOwed) * 100) : 100;

  const todayMissed = PRAYER_NAMES.filter(n => todayData?.prayers[n]?.status === 'missed');

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Header / Hadith ── */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(0,0,0,0) 100%)',
          border: '1px solid rgba(245,158,11,0.22)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 10% 50%, rgba(245,158,11,0.07), transparent 60%)' }}
        />
        <div className="absolute top-0 right-0 text-[5rem] opacity-[0.04] select-none leading-none pr-4 pt-2">📖</div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <BookOpen size={22} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-black mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {t('qada_tracker', L)}
            </h2>
            <p className="text-sm font-bold italic leading-relaxed mb-1.5" style={{ color: 'rgba(251,191,36,0.85)' }}>
              "{t('qada_hadith_ar', L)}"
            </p>
            {!isAr && (
              <p className="text-[11px] italic opacity-50 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                "Whoever sleeps through a prayer or forgets it, let him pray it when he remembers it." — Sahih Muslim
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Today's Missed Alert ── */}
      {todayMissed.length > 0 && (
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-400" />
            <span className="text-xs font-black uppercase tracking-widest text-red-400 opacity-80">{t('missed_today', L)}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {todayMissed.map(n => {
              const label = PRAYER_LABELS[n];
              return (
                <div key={n} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                >
                  <span>{label.emoji}</span>
                  <span>{isAr ? label.ar : label.en}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] opacity-50" style={{ color: 'var(--text-muted)' }}>{t('missed_today_note', L)}</p>
        </div>
      )}

      {/* ── Total Progress ── */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <span className="text-xs font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>
            {t('total_qada_debt', L)}
          </span>
          <span className="text-sm font-black"
            style={{ color: totalRemaining === 0 ? '#10b981' : '#f59e0b' }}
          >
            {totalRemaining === 0 && totalOwed > 0
              ? t('all_caught_up', L)
              : totalRemaining === 0
              ? t('no_debt_recorded', L)
              : `${totalRemaining} ${t('prayers_remaining', L)}`}
          </span>
        </div>

        {totalOwed > 0 ? (
          <>
            {/* Big circular-style progress indicator */}
            <div className="flex items-center gap-5 mb-4">
              <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl shrink-0"
                style={{
                  background: progress >= 100 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.08)',
                  border: `2px solid ${progress >= 100 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.25)'}`,
                }}
              >
                <span className="text-2xl font-black" style={{ color: progress >= 100 ? '#10b981' : '#f59e0b' }}>{progress}%</span>
                <span className="text-[8px] font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--text-muted)' }}>{t('completed', L)}</span>
              </div>
              <div className="flex-1">
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progress}%`,
                      background: progress >= 100
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>
                    {t('made_up', L)}: <span className="font-black text-emerald-400">{totalDone}</span>
                  </span>
                  <span className="text-[10px] opacity-60" style={{ color: 'var(--text-muted)' }}>
                    {t('total_owed', L)}: {totalOwed}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs opacity-50" style={{ color: 'var(--text-muted)' }}>{t('qada_no_debt_hint', L)}</p>
        )}
      </div>

      {/* ── Per-Prayer Rows ── */}
      <div className="space-y-3">
        {PRAYER_NAMES.map(name => {
          const label = PRAYER_LABELS[name];
          const entry = qadaRecord?.prayers[name] ?? { owed: 0, done: 0 };
          const remaining = entry.owed - entry.done;
          const pct = entry.owed > 0 ? Math.round((entry.done / entry.owed) * 100) : 0;
          const missedToday = todayData?.prayers[name]?.status === 'missed';

          const rowBorder = missedToday
            ? 'rgba(239,68,68,0.3)'
            : remaining > 0
            ? 'rgba(245,158,11,0.2)'
            : entry.owed > 0
            ? 'rgba(16,185,129,0.2)'
            : 'var(--border-glass)';

          const rowBg = missedToday
            ? 'rgba(239,68,68,0.04)'
            : remaining > 0
            ? 'rgba(245,158,11,0.03)'
            : 'var(--bg-card)';

          return (
            <div key={name} className="rounded-2xl p-4 transition-all duration-300"
              style={{ background: rowBg, border: `1px solid ${rowBorder}` }}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <span className="text-2xl">{label.emoji}</span>
                    {missedToday && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-[7px] text-white font-black">!</span>
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{isAr ? label.ar : label.en}</span>
                      <span className="text-[9px] opacity-40" style={{ color: 'var(--text-muted)' }}>{isAr ? label.en : label.ar}</span>
                      {missedToday && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                        >
                          {t('missed_today_label', L)}
                        </span>
                      )}
                    </div>
                    {remaining > 0 ? (
                      <span className="text-[11px] font-bold text-amber-400">{remaining} {t('prayers_owed', L)}</span>
                    ) : entry.owed > 0 ? (
                      <span className="text-[11px] font-bold text-emerald-400">{t('fully_made_up', L)}</span>
                    ) : (
                      <span className="text-[11px] opacity-40" style={{ color: 'var(--text-muted)' }}>{t('no_debt', L)}</span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {remaining > 0 && (
                    <button
                      onClick={() => onLogDone(name)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}
                    >
                      <CheckCircle size={13} />
                      {t('made_up_btn', L)}
                    </button>
                  )}
                  <button
                    onClick={() => onAddDebt(name)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}
                  >
                    <PlusCircle size={13} />
                    {t('add_missed_btn', L)}
                  </button>
                </div>
              </div>

              {/* Mini progress bar */}
              {entry.owed > 0 && (
                <div className="mt-3">
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] opacity-40" style={{ color: 'var(--text-muted)' }}>{t('made_up_count', L)}: {entry.done} / {entry.owed}</span>
                    <span className="text-[9px] font-bold opacity-50" style={{ color: '#10b981' }}>{pct}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer Note ── */}
      <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
        <p className="text-[11px] leading-relaxed opacity-50" style={{ color: 'var(--text-muted)' }}
           dangerouslySetInnerHTML={{ __html: '💡 ' + t('qada_footer_note', L) }}
        />
      </div>
    </div>
  );
}
