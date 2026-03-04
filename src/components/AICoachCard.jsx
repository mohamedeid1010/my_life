import { Brain, Sparkles } from 'lucide-react';

/**
 * AI Coach Card — Smart daily coaching messages
 */
export default function AICoachCard({ messages }) {
  // Show the first (most relevant) message
  const mainMessage = messages[0] || "Keep pushing! Consistency is the key. 💪";

  return (
    <div
      className="glass-card p-6 flex flex-col animate-slide-up relative overflow-hidden"
      style={{ animationDelay: '0.15s' }}
    >
      {/* Background shimmer */}
      <div
        className="absolute inset-0 opacity-30 animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.05), transparent)',
          backgroundSize: '200% 100%',
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center animate-float"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(236,72,153,0.2))' }}
        >
          <Brain size={20} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white/90 flex items-center gap-2">
            AI Coach
            <Sparkles size={14} className="text-violet-400" />
          </h3>
          <p className="text-xs text-white/30 font-medium">Personalized insight</p>
        </div>
      </div>

      {/* Main message */}
      <div className="relative z-10 flex-1 flex items-center">
        <p className="text-base font-semibold text-white/80 leading-relaxed">
          {mainMessage}
        </p>
      </div>

      {/* Additional messages */}
      {messages.length > 1 && (
        <div className="relative z-10 mt-4 pt-4 border-t border-white/5 space-y-2">
          {messages.slice(1, 3).map((msg, idx) => (
            <p key={idx} className="text-xs text-white/40 font-medium leading-relaxed">
              • {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
