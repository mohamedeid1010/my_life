import {
  Trophy,
  Flame,
  Scale,
  Percent,
  Star,
  CalendarDays,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import StatCard from './StatCard';

/**
 * شبكة الإحصائيات الأربع
 */
export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Goals Success */}
      <StatCard
        icon={Trophy}
        iconColor="text-indigo-500"
        title="Goal Success"
        value={stats.weeksGoalMet}
        unit="/ 52"
        subtitle="Weeks goal achieved"
        footerLabel="TOTAL WORKOUTS"
        footerValue={`${stats.totalWorkouts} Days`}
        footerColor="text-indigo-600 bg-indigo-50"
      />

      {/* Smart Streak */}
      <StatCard
        icon={Flame}
        iconColor="text-orange-500"
        title="Smart Streak"
        value={stats.currentStreak}
        unit="Days"
        subtitle="Maintained with auto-rests"
        footerLabel="LONGEST"
        footerIcon={Star}
        footerValue={`${stats.longestStreak} Days`}
        footerColor="text-orange-600 bg-orange-50"
      />

      {/* Body Weight */}
      <StatCard
        icon={Scale}
        iconColor="text-blue-500"
        title="Body Weight"
        value={stats.latestWeight}
        unit="kg"
        footerLabel="LEAN MASS"
        footerValue={`${stats.leanMass} kg`}
        footerColor="text-blue-700 bg-blue-50"
      >
        <WeightTrend diff={stats.weightDiff} />
      </StatCard>

      {/* Body Fat */}
      <StatCard
        icon={Percent}
        iconColor="text-rose-500"
        title="Body Fat"
        value={stats.latestBodyFat}
        unit="%"
        footerLabel="BEST DAY"
        footerIcon={CalendarDays}
        footerValue={stats.bestDay}
        footerColor="text-rose-600 bg-rose-50"
      >
        <FatTrend diff={stats.fatDiff} />
      </StatCard>
    </div>
  );
}

/* ---------- Trend sub-components ---------- */

function WeightTrend({ diff }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      {diff > 0 ? (
        <TrendingUp size={16} className="text-blue-500" />
      ) : diff < 0 ? (
        <TrendingDown size={16} className="text-emerald-500" />
      ) : null}
      <p
        className={`text-sm font-bold ${
          diff > 0
            ? 'text-blue-600'
            : diff < 0
              ? 'text-emerald-600'
              : 'text-slate-400'
        }`}
      >
        {diff > 0 ? '+' : ''}
        {diff} kg{' '}
        <span className="text-slate-400 font-normal">from start</span>
      </p>
    </div>
  );
}

function FatTrend({ diff }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      {diff > 0 ? (
        <TrendingUp size={16} className="text-rose-500" />
      ) : diff < 0 ? (
        <TrendingDown size={16} className="text-emerald-500" />
      ) : null}
      <p
        className={`text-sm font-bold ${
          diff > 0
            ? 'text-rose-600'
            : diff < 0
              ? 'text-emerald-600'
              : 'text-slate-400'
        }`}
      >
        {diff > 0 ? '+' : ''}
        {diff}%{' '}
        <span className="text-slate-400 font-normal">from start</span>
      </p>
    </div>
  );
}
