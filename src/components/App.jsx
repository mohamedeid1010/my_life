import { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useGymData from '../hooks/useGymData';
import useHabitsData from '../hooks/useHabitsData';
import useExportCSV from '../hooks/useExportCSV';
import { Activity, Target, Dumbbell, Settings, Loader2, Cloud, CloudOff } from 'lucide-react';
import { t } from '../config/translations';
import usePreferences from '../hooks/usePreferences';

// ── Lazy-loaded page components (code splitting for faster initial load) ──
const GymTracker = lazy(() => import('./GymTracker'));
const HabitsTracker = lazy(() => import('./HabitsTracker'));
const LifeOverview = lazy(() => import('./LifeOverview'));
const LoginPage = lazy(() => import('./LoginPage'));
const SettingsModal = lazy(() => import('./SettingsModal'));

// ── All available nav pages (add future pages here) ──
const ALL_NAV_PAGES = [
  { id: 'overview', labelKey: 'nav_overview', icon: 'Activity' },
  { id: 'gym', labelKey: 'nav_gym', icon: 'Dumbbell' },
  { id: 'habits', labelKey: 'nav_habits', icon: 'Target' },
];

const ICON_MAP = { Activity, Dumbbell, Target };
const NAV_STORAGE_KEY = 'herizon_nav_config';

function loadNavConfig() {
  try {
    const saved = localStorage.getItem(NAV_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  // Default: all pages visible in original order
  return ALL_NAV_PAGES.map(p => ({ id: p.id, visible: true }));
}

function saveNavConfig(config) {
  try {
    localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

// ── Page loading fallback ──
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <Loader2 size={32} className="text-violet-400 animate-spin" />
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

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

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    );
  }

  return <Dashboard user={user} logout={logout} />;
}

function Dashboard({ user, logout }) {
  const {
    targetDays, setTargetDays,
    workoutSystem, setWorkoutSystem,
    toggleDay, updateWeight, updateBodyFat,
    updateSession, deleteSession,
    enrichedData, stats, markTodayComplete,
    loaded, saving,
  } = useGymData();

  const habitsData = useHabitsData();
  const exportCSV = useExportCSV(enrichedData);

  const [showSettings, setShowSettings] = useState(false);
  const [navConfig, setNavConfig] = useState(loadNavConfig);
  const { profile, theme, language } = usePreferences();

  // Active tab: first visible page
  const visiblePages = navConfig.filter(p => p.visible);
  const [activeTab, setActiveTab] = useState(() => visiblePages[0]?.id || 'overview');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Build visible nav items in the user's custom order
  const navItems = navConfig
    .filter(p => p.visible)
    .map(p => {
      const pageDef = ALL_NAV_PAGES.find(ap => ap.id === p.id);
      if (!pageDef) return null;
      return {
        id: p.id,
        label: t(pageDef.labelKey, language),
        icon: ICON_MAP[pageDef.icon] || Activity,
      };
    })
    .filter(Boolean);

  const handleNavConfigChange = (newConfig) => {
    setNavConfig(newConfig);
    saveNavConfig(newConfig);
    // If the active tab was hidden, switch to first visible
    const firstVisible = newConfig.find(p => p.visible);
    if (!newConfig.find(p => p.id === activeTab && p.visible) && firstVisible) {
      setActiveTab(firstVisible.id);
    }
  };

  const isAr = language === 'ar';

  // Don't show loading if we have cache
  if (!loaded && !enrichedData?.length) {
    return (
      <div
        className="min-h-screen flex items-center justify-center font-sans"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 size={40} className="text-violet-400 animate-spin" />
          <p className="text-sm text-white/30 font-semibold">{t('loading_data', language)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen font-sans"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* ═══ Professional Top Navbar ═══ */}
      <nav
        className="sticky top-0 z-40 px-4 md:px-6 py-3"
        style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-glass)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo + Nav Tabs */}
          <div className="flex items-center gap-2 md:gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2 mr-2 md:mr-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              >
                <span className="text-white text-sm font-black">H</span>
              </div>
              <span className="hidden md:block text-base font-black text-white/80 tracking-tight">Horizon</span>
            </div>

            {/* Dynamic Navigation tabs */}
            <div className="flex bg-white/[0.03] rounded-xl p-1 gap-0.5" style={{ border: '1px solid var(--border-glass)' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? 'text-violet-400 shadow-sm'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                    style={isActive ? {
                      background: 'rgba(139,92,246,0.12)',
                      boxShadow: '0 1px 4px rgba(139,92,246,0.15)',
                    } : {}}
                  >
                    <Icon size={15} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Sync + User Avatar + Settings */}
          <div className="flex items-center gap-3" dir="ltr">
            {/* Sync Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider"
              style={{ background: saving ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)' }}
            >
              {saving ? (
                <><CloudOff size={10} className="text-amber-400" /> <span className="text-amber-400/80">{t('saving', language)}</span></>
              ) : (
                <><Cloud size={10} className="text-emerald-400" /> <span className="text-emerald-400/80">{t('synced', language)}</span></>
              )}
            </div>

            {/* User Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 cursor-pointer hover:ring-2 hover:ring-violet-500/30 transition-all"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              onClick={() => setShowSettings(true)}
            >
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                (profile.name || user.displayName || user.email || '?')[0].toUpperCase()
              )}
            </div>

            {/* Settings Gear */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ Main Content — Suspense for lazy-loaded pages ═══ */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Suspense fallback={<PageLoader />}>
          <div className="animate-fade-in">
            {activeTab === 'overview' && (
              <LifeOverview
                habitsData={habitsData}
                gymData={{ enrichedData, stats, workoutSystem, updateWeight, updateBodyFat }}
              />
            )}
            {activeTab === 'habits' && <HabitsTracker habitsData={habitsData} />}
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
        </Suspense>
      </div>

      {/* Settings Modal — with Navbar config */}
      <Suspense fallback={null}>
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onLogout={logout}
          navConfig={navConfig}
          onNavConfigChange={handleNavConfigChange}
          allNavPages={ALL_NAV_PAGES}
        />
      </Suspense>
    </div>
  );
}
