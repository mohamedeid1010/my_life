import { Flame, Trophy, Target, Zap } from 'lucide-react';
import usePreferences from '../hooks/usePreferences';
import { t } from '../config/translations';

/**
 * Hero Section — Huge streak counter with sub-stats
 */
export default function HeroSection({ stats }) {
  const { language } = usePreferences();
  const L = language;
  return (
    <div className="glass-card p-5 sm:p-6 relative overflow-hidden animate-slide-up flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Background gradient orbs */}
      <div
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
      />

      <div className="relative z-10 flex items-center gap-5 w-full md:w-auto justify-center md:justify-start">
        {/* Flame icon */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))' }}
        >
          <Flame size={28} className="text-violet-400" />
        </div>

        {/* Huge streak number */}
        <div className="flex flex-col items-start animate-count">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black tracking-tighter gradient-text glow-accent leading-none">
              {stats.currentStreak}
            </span>
            <span className="text-lg sm:text-xl font-bold text-white/50 uppercase tracking-widest">
              {t('gym_streak', L)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/30 mt-1 font-medium">
            {t('current_streak', L)}
          </p>
        </div>
      </div>

      {/* Sub-stats row */}
      <div className="relative z-10 flex flex-wrap justify-center md:justify-end gap-3 w-full md:w-auto">
        <SubStat
          icon={Trophy}
          label={t('longest', L)}
          value={`${stats.longestStreak} ${t('gym_streak', L)}`}
          color="text-amber-400"
        />
        <SubStat
          icon={Target}
          label={t('success_rate', L)}
          value={`${stats.successRate}%`}
          color="text-emerald-400"
        />
        <SubStat
          icon={Zap}
          label={t('discipline', L)}
          value={`${stats.disciplineScore}/100`}
          color="text-violet-400"
        />
      </div>
    </div>
  );
}

function SubStat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <Icon size={18} className={color} />
      <div className="text-left">
        <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-lg font-black ${color}`}>{value}</p>
      </div>
    </div>
  );
}
