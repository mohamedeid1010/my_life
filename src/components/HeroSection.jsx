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
    <div className="glass-card p-8 md:p-10 relative overflow-hidden animate-slide-up">
      {/* Background gradient orbs */}
      <div
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Flame icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))' }}
        >
          <Flame size={32} className="text-violet-400" />
        </div>

        {/* Huge streak number */}
        <div className="animate-count">
          <span
            className="text-8xl md:text-9xl font-black tracking-tighter gradient-text glow-accent leading-none"
          >
            {stats.currentStreak}
          </span>
        </div>
        <span className="text-2xl md:text-3xl font-bold text-white/50 uppercase tracking-widest mt-2">
          {t('gym_streak', L)}
        </span>

        {/* Label */}
        <p className="text-sm text-white/30 mt-3 font-medium">
          {t('current_streak', L)}
        </p>

        {/* Sub-stats row */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8">
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
