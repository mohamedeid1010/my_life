import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import useGymData from './hooks/useGymData';
import useExportCSV from './hooks/useExportCSV';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import DailyActionPanel from './components/DailyActionPanel';
import MomentumCard from './components/MomentumCard';
import AICoachCard from './components/AICoachCard';
import PatternInsights from './components/PatternInsights';
import GamificationPanel from './components/GamificationPanel';
import HeatmapCalendar from './components/HeatmapCalendar';
import { Settings, Eye, EyeOff, LogOut, Loader2, Cloud, CloudOff } from 'lucide-react';

const SECTIONS = [
  { key: 'hero', label: 'Streak Counter' },
  { key: 'daily', label: 'Daily Action' },
  { key: 'momentum', label: 'Momentum' },
  { key: 'coach', label: 'AI Coach' },
  { key: 'patterns', label: 'Pattern Insights' },
  { key: 'gamification', label: 'Gamification' },
];

function loadVisibility() {
  try {
    const saved = localStorage.getItem('gym_section_visibility');
    if (saved) return JSON.parse(saved);
  } catch {}
  return { hero: true, daily: true, momentum: true, coach: true, patterns: true, gamification: true };
}

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-sans"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 size={40} className="text-violet-400 animate-spin" />
          <p className="text-sm text-white/30 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Authenticated — show dashboard
  return <Dashboard user={user} logout={logout} />;
}

function Dashboard({ user, logout }) {
  const {
    targetDays,
    setTargetDays,
    toggleDay,
    updateWeight,
    updateBodyFat,
    enrichedData,
    stats,
    markTodayComplete,
    loaded,
    saving,
  } = useGymData();

  const exportCSV = useExportCSV(enrichedData);

  const [visibility, setVisibility] = useState(loadVisibility);
  const [showSettings, setShowSettings] = useState(false);

  const toggleSection = (key) => {
    const updated = { ...visibility, [key]: !visibility[key] };
    setVisibility(updated);
    localStorage.setItem('gym_section_visibility', JSON.stringify(updated));
  };

  const v = visibility;

  // Loading data from Firestore
  if (!loaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-sans"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 size={40} className="text-violet-400 animate-spin" />
          <p className="text-sm text-white/30 font-semibold">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className="min-h-screen p-4 md:p-6 font-sans"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Header
          targetDays={targetDays}
          setTargetDays={setTargetDays}
          onExport={exportCSV}
        />

        {/* User bar: name, sync status, logout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              {(user.displayName || user.email || '?')[0].toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-white/50">
              {user.displayName || user.email}
            </span>
            {/* Sync indicator */}
            {saving ? (
              <span className="flex items-center gap-1 text-xs text-amber-400/60">
                <CloudOff size={12} /> Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-emerald-400/60">
                <Cloud size={12} /> Synced
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Settings size={14} />
              Sections
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400/60 hover:text-red-400 transition-colors"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        {/* Section toggles */}
        {showSettings && (
          <div className="glass-card p-4 flex flex-wrap gap-2 animate-fade-in">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSection(s.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  v[s.key]
                    ? 'text-violet-300 border-violet-500/30'
                    : 'text-white/25 border-white/5'
                }`}
                style={{
                  background: v[s.key] ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${v[s.key] ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}`,
                }}
              >
                {v[s.key] ? <Eye size={12} /> : <EyeOff size={12} />}
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Hero Section */}
        {v.hero && <HeroSection stats={stats} />}

        {/* Row: Daily Action + Momentum + AI Coach */}
        {(v.daily || v.momentum || v.coach) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {v.daily && (
              <DailyActionPanel
                stats={stats}
                onMarkComplete={markTodayComplete}
              />
            )}
            {v.momentum && <MomentumCard stats={stats} />}
            {v.coach && <AICoachCard messages={stats.coachMessages} />}
          </div>
        )}

        {/* Row: Pattern Insights + Gamification */}
        {(v.patterns || v.gamification) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {v.patterns && <PatternInsights insights={stats.patternInsights} />}
            {v.gamification && <GamificationPanel stats={stats} />}
          </div>
        )}

        {/* Heatmap Calendar — Always visible */}
        <HeatmapCalendar
          enrichedData={enrichedData}
          onToggleDay={toggleDay}
          onUpdateWeight={updateWeight}
          onUpdateBodyFat={updateBodyFat}
        />
      </div>
    </div>
  );
}
