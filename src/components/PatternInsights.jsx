import { Lightbulb } from 'lucide-react';

/**
 * Pattern Insights — Smart analytics about workout behavior
 */
export default function PatternInsights({ insights }) {
  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.2))' }}
        >
          <Lightbulb size={20} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white/90">Pattern Insights</h3>
          <p className="text-xs text-white/30 font-medium">AI-detected behavior patterns</p>
        </div>
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              animationDelay: `${idx * 0.1}s`,
            }}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{insight.icon}</span>
            <p className={`text-sm font-semibold ${insight.color}`}>
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
