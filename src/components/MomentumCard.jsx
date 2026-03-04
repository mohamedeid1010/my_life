import { Shield, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

/**
 * Momentum Card — failure gaps, risk level, psychological insight
 */
export default function MomentumCard({ stats }) {
  const riskConfig = {
    low: { label: 'Low Risk', className: 'risk-low', icon: Shield },
    medium: { label: 'Medium Risk', className: 'risk-medium', icon: AlertTriangle },
    high: { label: '⚠ High Risk Today', className: 'risk-high', icon: AlertTriangle },
  };

  const risk = riskConfig[stats.riskLevel] || riskConfig.low;
  const RiskIcon = risk.icon;

  return (
    <div className="glass-card p-6 flex flex-col animate-slide-up" style={{ animationDelay: '0.1s' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))' }}
        >
          <TrendingUp size={20} className="text-cyan-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white/90">Momentum</h3>
          <p className="text-xs text-white/30 font-medium">Streak psychology</p>
        </div>
      </div>

      {/* Days since last failure */}
      <div className="mb-5">
        <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">
          Days Since Last Failure
        </p>
        <span className="text-4xl font-black text-cyan-400 glow-accent">
          {stats.daysSinceLastFailure}
        </span>
      </div>

      {/* Avg Gap */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <Clock size={16} className="text-white/30" />
        <div>
          <p className="text-xs text-white/40 font-semibold">Avg Gap Between Failures</p>
          <p className="text-sm font-bold text-white/80">
            {stats.avgGapBetweenFailures > 0 ? `~${stats.avgGapBetweenFailures} days` : 'No failures yet'}
          </p>
        </div>
      </div>

      {/* Risk Level */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold mt-auto ${risk.className}`}>
        <RiskIcon size={16} />
        {risk.label}
      </div>
    </div>
  );
}
