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

  // Today's missed prayers (from today's tracker)
  const todayMissed = PRAYER_NAMES.filter(n => todayData?.prayers[n]?.status === 'missed');

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Header — Hadith */}
      <div className="glass-card p-5 border-l-4 border-l-amber-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(ellipse at 20% 50%, #f59e0b, transparent 60%)' }} />
        <div className="relative z-10 flex items-start gap-4">
          <BookOpen size={36} className="text-amber-400 shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-2 tracking-tight">
              {t('qada_tracker', L)}
            </h2>
            <p className="text-sm text-amber-400/90 font-bold italic leading-relaxed mb-1">
              "{t('qada_hadith_ar', L)}"
            </p>
            <p className="text-[11px] text-[var(--text-muted)] italic">
              {isAr ? '' : '"Whoever sleeps through a prayer or forgets it, let him pray it when he remembers it — there is no expiation for it other than that." — Sahih Muslim'}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Missed — live link to tracker */}
      {todayMissed.length > 0 && (
        <div className="glass-card p-4 border border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">
              {t('missed_today', L)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayMissed.map(n => {
              const label = PRAYER_LABELS[n];
              return (
                <div
                  key={n}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: '#ef444415', border: '1px solid #ef444430', color: '#f87171' }}
                >
                  <span>{label.emoji}</span>
                  <span>{isAr ? label.ar : label.en}</span>
                  <span className="opacity-60">({label.ar})</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            {t('missed_today_note', L)}
          </p>
        </div>
      )}

      {/* Total Progress */}
      <div className="glass-card p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {t('total_qada_debt', L)}
          </span>
          <span
            className="text-sm font-black"
            style={{ color: totalRemaining === 0 ? '#10b981' : '#f59e0b' }}
          >
            {totalRemaining === 0 && totalOwed > 0
              ? t('all_caught_up', L)
              : totalRemaining === 0
              ? t('no_debt_recorded', L)
              : `${totalRemaining} ${t('prayers_remaining', L)}`}
          </span>
        </div>

        {totalOwed > 0 && (
          <>
            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-700 rounded-full"
                style={{
                  width: `${progress}%`,
                  background:
                    progress >= 100
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-[var(--text-muted)]">
                {t('made_up', L)}: <span className="font-bold text-emerald-400">{totalDone}</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {t('total_owed', L)}: {totalOwed} · {progress}% {t('completed', L)}
              </span>
            </div>
          </>
        )}

        {totalOwed === 0 && (
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {t('qada_no_debt_hint', L)}
          </p>
        )}
      </div>

      {/* Per-Prayer Rows */}
      <div className="space-y-3">
        {PRAYER_NAMES.map(name => {
          const label = PRAYER_LABELS[name];
          const entry = qadaRecord?.prayers[name] ?? { owed: 0, done: 0 };
          const remaining = entry.owed - entry.done;
          const pct = entry.owed > 0 ? Math.round((entry.done / entry.owed) * 100) : 0;
          const missedToday = todayData?.prayers[name]?.status === 'missed';

          return (
            <div
              key={name}
              className="glass-card p-4 transition-all duration-300"
              style={{
                borderColor: missedToday
                  ? '#ef444440'
                  : remaining > 0
                  ? '#f59e0b30'
                  : entry.owed > 0
                  ? '#10b98130'
                  : undefined,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: prayer info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0 relative">
                    {label.emoji}
                    {missedToday && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-[7px] text-white font-black">!</span>
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-[var(--text-primary)] text-sm">
                        {isAr ? label.ar : label.en}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {isAr ? label.en : label.ar}
                      </span>
                      {missedToday && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
                          {t('missed_today_label', L)}
                        </span>
                      )}
                    </div>
                    {remaining > 0 ? (
                      <span className="text-[11px] font-bold text-amber-400">
                        {remaining} {t('prayers_owed', L)}
                      </span>
                    ) : entry.owed > 0 ? (
                      <span className="text-[11px] font-bold text-emerald-400">{t('fully_made_up', L)}</span>
                    ) : (
                      <span className="text-[11px] text-[var(--text-muted)]">{t('no_debt', L)}</span>
                    )}
                  </div>
                </div>

                {/* Right: action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {remaining > 0 && (
                    <button
                      onClick={() => onLogDone(name)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{
                        background: '#10b98118',
                        border: '1px solid #10b98140',
                        color: '#10b981',
                      }}
                      title="Mark one as made up"
                    >
                      <CheckCircle size={13} />
                      {t('made_up_btn', L)}
                    </button>
                  )}
                  <button
                    onClick={() => onAddDebt(name)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: '#f59e0b12',
                      border: '1px solid #f59e0b30',
                      color: '#f59e0b',
                    }}
                    title="Add a past missed prayer"
                  >
                    <PlusCircle size={13} />
                    {t('add_missed_btn', L)}
                  </button>
                </div>
              </div>

              {/* Mini progress bar */}
              {entry.owed > 0 && (
                <div className="mt-3">
                  <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #10b981, #34d399)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-[var(--text-muted)]">
                      {t('made_up_count', L)}: {entry.done} / {entry.owed}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)]">{pct}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="glass-card p-4 border border-[var(--border-glass)] text-center">
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed"
           dangerouslySetInnerHTML={{ __html: '💡 ' + t('qada_footer_note', L) }}
        />
      </div>
    </div>
  );
}
