import React from 'react';
import { Activity, TrendingUp, TrendingDown, Trophy, Target, AlertCircle } from 'lucide-react';

export default function HabitsAnalyticsDashboard({ analytics, habits }) {
  if (!analytics) return null;

  const { 
    globalConsistency, 
    monthOverMonthDelta, 
    strongestHabit, 
    weakestHabit,
    monthTrendData 
  } = analytics;

  // Render Sparkline SVG for Temp Comparison
  const renderSparkline = () => {
    if (!monthTrendData || monthTrendData.length === 0) return null;
    const maxVal = 100;
    const points = monthTrendData.map((val, idx) => {
      const x = (idx / (monthTrendData.length - 1)) * 100; // 0 to 100 viewbox width
      const y = 100 - ((val / maxVal) * 100); // 0 to 100 viewbox height (inverted)
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible preserve-3d" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(232, 121, 249, 0.4)" />
            <stop offset="100%" stopColor="rgba(232, 121, 249, 0)" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <polygon 
          points={`0,100 ${points} 100,100`} 
          fill="url(#areaGradient)" 
          className="transition-all duration-1000 origin-bottom animate-slide-up"
        />
        <polyline 
          points={points} 
          fill="none" 
          stroke="#e879f9" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#glow)"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6 mt-8">
      
      {/* Title */}
      <div className="flex items-center gap-3 pl-2">
        <Activity className="text-fuchsia-400" size={24} />
        <h2 className="text-xl font-bold text-white tracking-wide">Analytics & Insights</h2>
      </div>

      {/* Main Grid: BEM-inspired structured layout via Tailwind */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. The Monthly Command Center && 3. Temporal Comparison */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Global Consistency Widget */}
          <div className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[50px] pointer-events-none group-hover:bg-fuchsia-500/20 transition-colors" />
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest self-start w-full">Global Consistency</span>
            
            <div className="relative w-40 h-40 mt-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-white/5" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-fuchsia-400 drop-shadow-[0_0_12px_rgba(232,121,249,0.4)] transition-all duration-1500 ease-out" strokeDasharray={`${globalConsistency}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{globalConsistency}%</span>
                <span className="text-[10px] text-fuchsia-300 font-bold uppercase tracking-widest mt-1">Commitment</span>
              </div>
            </div>

            <div className="w-full flex items-center justify-center mt-6 pt-4 border-t border-white/5">
              {monthOverMonthDelta !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${monthOverMonthDelta > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {monthOverMonthDelta > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{monthOverMonthDelta > 0 ? '+' : ''}{monthOverMonthDelta}% vs Last Month</span>
                </div>
              )}
            </div>
          </div>

          {/* Temporal Sparkline Widget */}
          <div className="glass-card p-6 flex flex-col relative overflow-hidden h-40">
            <div className="flex justify-between items-end mb-4 relative z-10">
              <span className="text-xs font-bold text-white/50 uppercase tracking-widest">30-Day Trend</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-24 mt-auto">
              {renderSparkline()}
            </div>
          </div>
        </div>

        {/* 2. Mastery Gauge & 4. Hero/Underdog */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Habits Mastery Algorithm */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Target className="text-violet-400" size={18} />
              <span className="text-sm font-bold text-white uppercase tracking-widest">Acquisition Mastery</span>
            </div>
            
            <div className="space-y-4 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
              {habits.map(habit => {
                const { phase, progress, currentDays, nextThreshold } = habit.stats.mastery;
                let phaseColor = 'bg-white/20';
                let phaseText = 'text-white/50';
                if (phase === 'Initiation') { phaseColor = 'bg-orange-500'; phaseText = 'text-orange-400'; }
                if (phase === 'Integration') { phaseColor = 'bg-violet-500'; phaseText = 'text-violet-400'; }
                if (phase === 'Mastery') { phaseColor = 'bg-fuchsia-500'; phaseText = 'text-fuchsia-400'; }

                return (
                  <div key={habit.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-black/20 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{habit.icon}</span>
                        <span className="text-sm font-bold text-white/90">{habit.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-black/40 ${phaseText}`}>
                        {phase}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${phaseColor} shadow-[0_0_10px_currentColor] transition-all duration-1000`} 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <span className="text-[10px] font-bold text-white/40 min-w-[50px] text-right">
                        {phase === 'Mastery' ? 'MAX' : `${currentDays}/${nextThreshold}d`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* The Hero & Underdog */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Strongest */}
            {strongestHabit && (
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] pointer-events-none" />
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">
                  <Trophy size={14} /> The Hero
                </span>
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <span className="text-3xl bg-black/30 p-2 rounded-xl border border-white/5">{strongestHabit.icon}</span>
                  <div>
                    <h4 className="text-white font-bold text-lg">{strongestHabit.name}</h4>
                    <p className="text-xs text-white/50 font-medium">Unstoppable Momentum</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 flex justify-between items-center text-sm font-bold border-t border-emerald-500/10">
                  <span className="text-emerald-300">{strongestHabit.stats.successRate}% Success</span>
                  <span className="text-emerald-100 bg-emerald-500/20 px-2 py-0.5 rounded-md">{strongestHabit.stats.currentStreak} Streak</span>
                </div>
              </div>
            )}

            {/* Weakest */}
            {weakestHabit && (
              <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent p-5 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[40px] pointer-events-none" />
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">
                  <AlertCircle size={14} /> Focus Area
                </span>
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <span className="text-3xl bg-black/30 p-2 rounded-xl border border-white/5 grayscale">{weakestHabit.icon}</span>
                  <div>
                    <h4 className="text-white font-bold text-lg">{weakestHabit.name}</h4>
                    <p className="text-[10px] text-orange-300 font-medium leading-tight mt-1 max-w-[150px]">
                      {weakestHabit.worstDay !== 'N/A' 
                        ? `Usually drops off on ${weakestHabit.worstDay}s. Watch out!` 
                        : 'Needs more consistency to build the habit.'}
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-orange-500/10 flex items-center justify-between">
                   <span className="text-sm font-bold text-orange-300">{weakestHabit.stats.successRate}% Success</span>
                   <span className="text-[10px] font-bold text-white/50 uppercase">Opportunity for Growth</span>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
