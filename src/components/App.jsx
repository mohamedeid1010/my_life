import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useGymData from '../hooks/useGymData';
import useExportCSV from '../hooks/useExportCSV';
import LoginPage from './LoginPage';
import Header from './Header';
import { Settings, Eye, EyeOff, LogOut, Loader2, Cloud, CloudOff } from 'lucide-react';



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

import { Activity, Target, Dumbbell } from 'lucide-react';
import GymTracker from './GymTracker';
import HabitsTracker from './HabitsTracker';
import LifeOverview from './LifeOverview';

// Remove the standalone unused functions and imports we moved to GymTracker
// Notice we keep useAuth, useGymData, useExportCSV in App.jsx

function Dashboard({ user, logout }) {
  const {
    targetDays,
    setTargetDays,
    workoutSystem,
    setWorkoutSystem,
    toggleDay,
    updateWeight,
    updateBodyFat,
    updateSession,
    deleteSession,
    enrichedData,
    stats,
    markTodayComplete,
    loaded,
    saving,
  } = useGymData();

  const exportCSV = useExportCSV(enrichedData);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'gym', 'habits'

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

  const navItems = [
    { id: 'overview', label: 'نظرة عامة', icon: Activity },
    { id: 'gym', label: 'الجيم', icon: Dumbbell },
    { id: 'habits', label: 'العادات', icon: Target },
  ];

  return (
    <div
      dir="rtl"
      className="min-h-screen p-4 md:p-6 font-sans"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Navigation Bar & User Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl">
          
          {/* Main Navigation Tabs */}
          <div className="flex bg-black/20 p-1 rounded-xl w-full md:w-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-violet-500/20 text-violet-300 shadow-sm'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User bar: name, sync status, logout (moved inside the header card) */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end" dir="ltr">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              >
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col">
                 <span className="text-sm font-semibold text-white/70">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                {/* Sync indicator */}
                {saving ? (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400/60 font-medium tracking-wider">
                    <CloudOff size={10} /> SAVING
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400/60 font-medium tracking-wider">
                    <Cloud size={10} /> SYNCED
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400/60 hover:text-red-400 transition-colors"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="animate-fade-in" dir="ltr">
          {activeTab === 'overview' && <LifeOverview />}
          {activeTab === 'habits' && <HabitsTracker />}
          {activeTab === 'gym' && (
            <GymTracker
              targetDays={targetDays}
              setTargetDays={setTargetDays}
              workoutSystem={workoutSystem}
              setWorkoutSystem={setWorkoutSystem}
              exportCSV={exportCSV}
              stats={stats}
              markTodayComplete={markTodayComplete}
              enrichedData={enrichedData}
              toggleDay={toggleDay}
              updateWeight={updateWeight}
              updateBodyFat={updateBodyFat}
              updateSession={updateSession}
              deleteSession={deleteSession}
            />
          )}
        </div>
      </div>
    </div>
  );
}
