import { Star, Swords, Trophy, Target } from 'lucide-react';

/**
 * Gamification Panel — XP bar, level, monthly challenge, achievement timeline
 */
export default function GamificationPanel({ stats }) {
  const xpPercentage = Math.min((stats.xpInLevel / stats.xpToNext) * 100, 100);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonthName = monthNames[new Date().getMonth()];
  const challengePercent = Math.min((stats.monthlyWorkouts / stats.monthlyTarget) * 100, 100);

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))' }}
        >
          <Swords size={20} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white/90">Gamification</h3>
          <p className="text-xs text-white/30 font-medium">Level up your discipline</p>
        </div>
      </div>

      {/* Level & XP */}
      <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={18} className="text-amber-400" />
            <span className="text-sm font-bold text-white/70">Level {stats.level}</span>
          </div>
          <span className="text-xs font-bold text-violet-400 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(139,92,246,0.15)' }}
          >
            {stats.levelTitle}
          </span>
        </div>

        {/* XP Bar */}
        <div className="xp-bar-track mb-2">
          <div className="xp-bar-fill" style={{ width: `${xpPercentage}%` }} />
        </div>
        <div className="flex justify-between text-xs font-semibold text-white/30">
          <span>{stats.xpInLevel} XP</span>
          <span>{stats.xpToNext} XP</span>
        </div>

        <p className="text-xs text-white/20 mt-2 text-center">
          Total XP: <span className="text-violet-400 font-bold">{stats.xp}</span>
        </p>
      </div>

      {/* Monthly Challenge */}
      <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-cyan-400" />
          <span className="text-sm font-bold text-white/70">{currentMonthName} Challenge</span>
        </div>
        <p className="text-xs text-white/40 mb-2">
          {stats.monthlyWorkouts}/{stats.monthlyTarget} workouts this month
        </p>
        <div className="xp-bar-track">
          <div
            className="h-full rounded-full"
            style={{
              width: `${challengePercent}%`,
              background: challengePercent >= 100
                ? 'var(--gradient-success)'
                : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
              transition: 'width 1s ease',
            }}
          />
        </div>
      </div>

      {/* Achievement Timeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-sm font-bold text-white/70">Achievements</span>
        </div>

        <div className="relative pl-8">
          <div className="timeline-line" />

          {stats.achievements.map((achievement, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 mb-4 last:mb-0 relative"
            >
              <div className={`timeline-dot ${achievement.unlocked ? 'active' : 'locked'}`} />
              <div className={`pt-px ${achievement.unlocked ? '' : 'opacity-40'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{achievement.icon}</span>
                  <span className={`text-sm font-bold ${achievement.unlocked ? 'text-white/90' : 'text-white/30'}`}>
                    {achievement.name}
                  </span>
                </div>
                <p className="text-xs text-white/30 mt-0.5">{achievement.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
