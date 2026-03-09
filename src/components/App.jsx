import { useState, useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import useGymData from '../hooks/useGymData';
import useHabitsData from '../hooks/useHabitsData';
import useExportCSV from '../hooks/useExportCSV';
import { Activity, Target, Dumbbell, Settings, Loader2, Cloud, CloudOff, Calendar } from 'lucide-react';
import { t } from '../config/translations';
import usePreferences from '../hooks/usePreferences';
import { useSyncStore } from '../stores/useSyncStore';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ── Lazy-loaded page components (code splitting for faster initial load) ──
const GymTracker = lazy(() => import('./GymTracker'));
const HabitsTracker = lazy(() => import('./HabitsTracker'));
const LifeOverview = lazy(() => import('./LifeOverview'));
const LoginPage = lazy(() => import('./LoginPage'));
const SettingsModal = lazy(() => import('./SettingsModal'));
const WeeklyPlanner = lazy(() => import('./WeeklyPlanner'));

// ── All available nav pages (add future pages here) ──
const ALL_NAV_PAGES = [
  { id: 'overview', labelKey: 'nav_overview', icon: 'Activity' },
  { id: 'habits', labelKey: 'nav_habits', icon: 'Target' },
  { id: 'gym', labelKey: 'nav_gym', icon: 'Dumbbell' },
  { id: 'planner', labelKey: 'nav_planner', icon: 'Calendar' },
];

const ICON_MAP = { Activity, Dumbbell, Target, Calendar };
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
  /**
   * Auth state from the Zustand store.
   * `user` is null when not authenticated.
   * `loading` is true while Firebase checks the initial auth state.
   */
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  /**
   * Initialize the Firebase Auth state listener ONCE on mount.
   * This replaces the old AuthProvider's useEffect.
   * The listener fires immediately with the current auth state,
   * then again on every login/logout event.
   */
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initAuthListener();
    return unsubscribe;
  }, []);

  /**
   * Initialize Offline Sync Engine.
   * - Listens to window 'online' / 'offline' events
   * - Flushes the pending actions queue when online
   */
  const isOnline = useSyncStore((s) => s.isOnline);
  const pendingCount = useSyncStore((s) => s.pendingActions.length);

  useEffect(() => {
    const unsubOnline = useSyncStore.getState().initOnlineListener();
    return unsubOnline;
  }, []);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      useSyncStore.getState().flushQueue(async (action) => {
        const payloadObj = action.payload;
        if (!payloadObj || !payloadObj.path) return;

        const docRef = doc(db, payloadObj.path);

        // Deletions vs Sets
        if (action.type.includes('DELETE') || action.type === 'HABIT_UPDATE' && payloadObj.data?.isHidden) {
          // Note: HABIT_UPDATE for delete actually sets { isHidden: true }. 
          // So it's technically a setDoc merge, handled in the else block normally.
          // Real deletions:
          if (action.type.includes('DELETE')) {
            await deleteDoc(docRef);
            return;
          }
        }
        
        // Default Set/Merge
        if (payloadObj.data) {
          await setDoc(docRef, payloadObj.data, { merge: true });
        }
      });
    }
  }, [isOnline, pendingCount]);

  // Thanks to Zustand 'persist', auth state is instantly hydrated.
  // We no longer block the initial render. The background Firebase listener
  // will seamlessly update the user state if the session expired.

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

  // Active tab: load from localStorage or first visible page
  const visiblePages = navConfig.filter(p => p.visible);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('herizon_active_tab');
    return (saved && visiblePages.find(p => p.id === saved)) ? saved : (visiblePages[0]?.id || 'overview');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('herizon_active_tab', activeTab);
  }, [activeTab]);

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
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        paddingTop: 'var(--safe-top)',
        paddingBottom: 'var(--safe-bottom)',
        paddingLeft: 'var(--safe-left)',
        paddingRight: 'var(--safe-right)',
      }}
    >
      {/* ═══ Professional Floating Glass Navbar ═══ */}
      <nav
        className="sticky z-50 mx-auto max-w-7xl transition-all duration-300 px-3 sm:px-4 md:px-6"
        style={{ top: 'calc(var(--safe-top) + 0.5rem)' }}
      >
        {/* Glass Pill Container */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 rounded-2xl md:rounded-full backdrop-blur-xl border min-h-[48px]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
            borderColor: 'var(--border-glass)',
          }}
        >
          {/* Logo + Nav Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-6 min-w-0 flex-1">
            {/* Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center p-1 shadow-sm"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.1))' }}
              >
                <img
                  src="/horizon-logo.png"
                  alt="Horizon"
                  className="w-full h-full object-contain brightness-110"
                />
              </div>
              <span className="hidden md:block text-base md:text-lg font-black tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                Horizon
              </span>
            </div>

            {/* Dynamic Navigation tabs — scroll on very small screens */}
            <div className="flex bg-white/[0.03] rounded-xl p-1 gap-0.5 overflow-x-auto custom-scrollbar flex-1 min-w-0 max-w-full" style={{ border: '1px solid var(--border-glass)' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    type="button"
                    className={`touch-target flex items-center justify-center gap-1.5 px-2.5 sm:px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 shrink-0 ${
                      isActive ? 'text-violet-400 shadow-sm' : 'text-white/40 hover:text-white/70'
                    }`}
                    style={isActive ? { background: 'rgba(139,92,246,0.12)', boxShadow: '0 1px 4px rgba(139,92,246,0.15)' } : {}}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="hidden sm:inline truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Sync + User Avatar + Settings */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0" dir="ltr">
            {/* Sync Badge — compact on mobile */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider ${saving ? 'text-amber-400/90' : 'text-emerald-400/90'}`}
              style={{ background: saving ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)' }}
            >
              {saving ? <CloudOff size={12} /> : <Cloud size={12} />}
              <span className="hidden sm:inline">{saving ? t('saving', language) : t('synced', language)}</span>
            </div>

            {/* User Avatar */}
            <button
              type="button"
              className="touch-target w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 hover:ring-2 hover:ring-violet-500/30 transition-all"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
            >
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                (profile?.name || user?.displayName || user?.email || '?')[0].toUpperCase()
              )}
            </button>

            {/* Settings Gear */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="touch-target p-2.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ Main Content — Suspense for lazy-loaded pages ═══ */}
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-5 md:p-6 space-y-4 sm:space-y-6" style={{ paddingBottom: 'max(2rem, var(--safe-bottom))' }}>
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
            {activeTab === 'planner' && <WeeklyPlanner />}
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
