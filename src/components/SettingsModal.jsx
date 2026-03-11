import React, { useState, useRef, useEffect } from 'react';
import {
  X, User, Palette, Upload, LogOut, Navigation, ChevronUp, ChevronDown,
  Eye, EyeOff, GripVertical, Shield, Monitor, Moon, Sun, Sparkles,
  Check, Camera, Mail, Globe, RotateCcw, Plus, Settings, ChevronRight,
} from 'lucide-react';
import usePreferences from '../hooks/usePreferences';
import { useAuthStore } from '../stores/useAuthStore';
import { t } from '../config/translations';

/* ─── Section wrapper ─── */
function SettingsSection({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={16} className="text-[var(--accent-primary)] shrink-0" />}
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-[10px] text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Saved toast ─── */
function SavedToast({ show }) {
  if (!show) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/90 text-white text-sm font-bold shadow-2xl backdrop-blur-sm animate-fade-in">
      <Check size={16} />
      Saved!
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose, onLogout, navConfig, onNavConfigChange, allNavPages }) {
  const {
    profile, updateProfile,
    theme, updateTheme,
    language, updateLanguage,
  } = usePreferences();

  const user = useAuthStore((s) => s.user);

  const L = language;
  const [activeTab, setActiveTab] = useState('account');
  const [localName, setLocalName] = useState(profile.name || '');
  const [localPhoto, setLocalPhoto] = useState(profile.photoURL || '');
  const [showSaved, setShowSaved] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);
  const fileInputRef = useRef(null);

  // Sync from profile when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalName(profile.name || '');
      setLocalPhoto(profile.photoURL || '');
      setProfileDirty(false);
    }
  }, [isOpen, profile.name, profile.photoURL]);

  if (!isOpen) return null;

  const flash = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('Image must be smaller than 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => { setLocalPhoto(reader.result); setProfileDirty(true); };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    updateProfile({ name: localName, photoURL: localPhoto });
    setProfileDirty(false);
    flash();
  };

  // ── Nav config helpers ──
  const moveNavItem = (index, direction) => {
    const newConfig = [...navConfig];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newConfig.length) return;
    [newConfig[index], newConfig[swapIndex]] = [newConfig[swapIndex], newConfig[index]];
    onNavConfigChange(newConfig);
  };

  const toggleNavVisibility = (id) => {
    const visibleCount = navConfig.filter(p => p.visible).length;
    const item = navConfig.find(p => p.id === id);
    if (item?.visible && visibleCount <= 1) return;
    const newConfig = navConfig.map(p =>
      p.id === id ? { ...p, visible: !p.visible } : p
    );
    onNavConfigChange(newConfig);
  };

  const addNavPage = (pageId) => {
    if (navConfig.find(p => p.id === pageId)) return;
    const newConfig = [...navConfig, { id: pageId, visible: true }];
    onNavConfigChange(newConfig);
  };

  const removeNavPage = (pageId) => {
    const visibleCount = navConfig.filter(p => p.visible).length;
    const item = navConfig.find(p => p.id === pageId);
    if (item?.visible && visibleCount <= 1) return;
    const newConfig = navConfig.filter(p => p.id !== pageId);
    onNavConfigChange(newConfig);
  };

  const availableToAdd = allNavPages?.filter(
    ap => !navConfig?.find(nc => nc.id === ap.id)
  ) || [];

  const getPageLabel = (id) => {
    const page = allNavPages?.find(p => p.id === id);
    return page ? t(page.labelKey, L) : id;
  };

  const TABS = [
    { id: 'account', label: t('settings_account', L), icon: User, emoji: '👤' },
    { id: 'appearance', label: t('settings_appearance', L), icon: Palette, emoji: '🎨' },
    { id: 'navigation', label: t('settings_navigation', L) || 'Navigation', icon: Navigation, emoji: '🧭' },
  ];

  const THEMES = [
    { id: 'dark', label: t('theme_dark', L), icon: Moon, color: '#8b5cf6', preview: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
    { id: 'light', label: t('theme_light', L), icon: Sun, color: '#f59e0b', preview: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' },
    { id: 'midnight', label: t('theme_midnight', L), icon: Sparkles, color: '#06b6d4', preview: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)' },
  ];

  return (
    <>
      <SavedToast show={showSaved} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md"
        style={{
          paddingTop: 'max(0.75rem, var(--safe-top))',
          paddingBottom: 'max(0.75rem, var(--safe-bottom))',
          paddingLeft: 'max(0.75rem, var(--safe-left))',
          paddingRight: 'max(0.75rem, var(--safe-right))',
        }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-xl max-h-[88vh] overflow-hidden flex flex-col animate-fade-in rounded-2xl border border-[var(--border-glass)]"
          style={{
            background: 'var(--bg-card, rgba(15,15,25,0.95))',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
            backdropFilter: 'blur(20px)',
          }}
          onClick={e => e.stopPropagation()}
        >

          {/* ═══ Header ═══ */}
          <div className="relative shrink-0 px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
            {/* Decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981)' }} />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <Settings size={20} className="text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">{t('settings', L)}</h2>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium">
                    {L === 'ar' ? 'خصص تجربتك' : 'Customize your experience'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-glass)] transition-all"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mt-4 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                    }`}
                  >
                    <span className="text-sm">{tab.emoji}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ Content ═══ */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-5 sm:pb-6 space-y-6 custom-scrollbar min-h-0">

            {/* ═══ ACCOUNT TAB ═══ */}
            {activeTab === 'account' && (
              <div className="space-y-6">

                {/* Profile card */}
                <div className="relative rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.05))' }}>
                  <div className="absolute top-0 left-0 right-0 h-16 opacity-30" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }} />
                  <div className="relative px-4 pt-8 pb-4">
                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-4">
                      <div className="relative group mb-3">
                        <div
                          className="w-20 h-20 rounded-2xl border-3 overflow-hidden flex items-center justify-center shadow-xl transition-transform group-hover:scale-105"
                          style={{
                            background: localPhoto ? 'transparent' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            borderColor: 'rgba(139,92,246,0.4)',
                          }}
                        >
                          {localPhoto ? (
                            <img src={localPhoto} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User size={32} className="text-white/70" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110"
                          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                        >
                          <Camera size={13} />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </div>
                      {user?.email && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <Mail size={12} />
                          {user.email}
                        </div>
                      )}
                    </div>

                    {/* Name input */}
                    <SettingsSection icon={User} title={t('display_name', L)}>
                      <input
                        type="text"
                        value={localName}
                        onChange={e => { setLocalName(e.target.value); setProfileDirty(true); }}
                        placeholder={t('your_name', L)}
                        className="w-full bg-black/20 px-4 py-3 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 border border-[var(--border-glass)] transition-all"
                      />
                    </SettingsSection>

                    {/* Photo URL */}
                    <div className="mt-3">
                      <input
                        type="url"
                        value={localPhoto && !localPhoto.startsWith('data:') ? localPhoto : ''}
                        onChange={e => { setLocalPhoto(e.target.value); setProfileDirty(true); }}
                        placeholder={t('paste_url', L)}
                        className="w-full bg-black/20 px-4 py-2.5 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 border border-[var(--border-glass)] transition-all"
                      />
                      <span className="text-[9px] text-[var(--text-muted)] mt-1 block">{t('max_size', L)}</span>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveProfile}
                  disabled={!profileDirty}
                  className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    profileDirty ? 'hover:scale-[1.02] active:scale-95 shadow-xl' : 'opacity-40 cursor-default'
                  }`}
                  style={{
                    background: profileDirty
                      ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                      : 'rgba(139,92,246,0.2)',
                    boxShadow: profileDirty ? '0 8px 30px rgba(139,92,246,0.3)' : 'none',
                  }}
                >
                  <Check size={16} />
                  {t('save_profile', L)}
                </button>

                {/* Danger zone */}
                <div className="pt-2">
                  <div className="rounded-xl border border-red-500/10 p-4" style={{ background: 'rgba(239,68,68,0.03)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield size={14} className="text-red-400/60" />
                      <span className="text-[10px] uppercase font-bold text-red-400/60 tracking-widest">
                        {L === 'ar' ? 'منطقة الخطر' : 'Danger Zone'}
                      </span>
                    </div>
                    <button
                      onClick={() => { onLogout?.(); onClose(); }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-red-400 transition-all hover:scale-[1.01] active:scale-95"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                    >
                      <LogOut size={16} />
                      {t('logout', L)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ APPEARANCE TAB ═══ */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">

                {/* Theme */}
                <SettingsSection icon={Palette} title={t('theme', L)} subtitle={L === 'ar' ? 'اختار مظهر التطبيق' : 'Choose your app theme'}>
                  <div className="grid grid-cols-3 gap-3">
                    {THEMES.map(th => {
                      const isActive = theme === th.id;
                      const Icon = th.icon;
                      return (
                        <button
                          key={th.id}
                          onClick={() => { updateTheme(th.id); flash(); }}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            isActive
                              ? 'scale-[1.03] shadow-xl'
                              : 'hover:scale-[1.02] opacity-60 hover:opacity-90'
                          }`}
                          style={{
                            borderColor: isActive ? th.color + '80' : 'var(--border-glass)',
                            background: isActive ? th.color + '12' : 'transparent',
                            boxShadow: isActive ? `0 8px 25px ${th.color}20` : 'none',
                          }}
                        >
                          {/* Preview swatch */}
                          <div
                            className="w-full h-8 rounded-lg mb-1"
                            style={{ background: th.preview, border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          <Icon size={18} style={{ color: isActive ? th.color : 'var(--text-muted)' }} />
                          <span className="text-[11px] font-bold" style={{ color: isActive ? th.color : 'var(--text-muted)' }}>
                            {th.label}
                          </span>
                          {isActive && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: th.color }}>
                              <Check size={11} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </SettingsSection>

                {/* Divider */}
                <div className="border-t border-[var(--border-glass)]" />

                {/* Language */}
                <SettingsSection icon={Globe} title={t('language', L)} subtitle={L === 'ar' ? 'اختار لغة التطبيق' : 'Choose your interface language'}>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'en', label: 'English', flag: '🇬🇧', dir: 'LTR' },
                      { id: 'ar', label: 'العربية', flag: '🇪🇬', dir: 'RTL' },
                    ].map(l => {
                      const isActive = language === l.id;
                      return (
                        <button
                          key={l.id}
                          onClick={() => { updateLanguage(l.id); flash(); }}
                          className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            isActive
                              ? 'shadow-lg'
                              : 'opacity-60 hover:opacity-90'
                          }`}
                          style={{
                            borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-glass)',
                            background: isActive ? 'rgba(139,92,246,0.08)' : 'transparent',
                          }}
                        >
                          <span className="text-2xl">{l.flag}</span>
                          <div className="text-left">
                            <span className={`text-sm font-bold block ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{l.label}</span>
                            <span className="text-[9px] text-[var(--text-muted)]">{l.dir}</span>
                          </div>
                          {isActive && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                              <Check size={11} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </SettingsSection>
              </div>
            )}

            {/* ═══ NAVIGATION TAB ═══ */}
            {activeTab === 'navigation' && (
              <div className="space-y-5">
                <SettingsSection
                  icon={Navigation}
                  title={L === 'ar' ? 'ترتيب التنقل' : 'Navigation Order'}
                  subtitle={L === 'ar' ? 'رتب وأظهر/أخفِ الصفحات في شريط التنقل' : 'Reorder, show, or hide pages in the navigation bar'}
                >
                  <div className="space-y-2">
                    {navConfig?.map((item, idx) => {
                      const pageDef = allNavPages?.find(p => p.id === item.id);
                      if (!pageDef) return null;

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2.5 p-3 rounded-xl transition-all ${
                            item.visible
                              ? 'bg-black/10 border border-[var(--border-glass)]'
                              : 'bg-black/5 border border-[var(--border-glass)] opacity-40'
                          }`}
                        >
                          {/* Number indicator */}
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shrink-0">
                            {idx + 1}
                          </span>

                          {/* Page name */}
                          <span className={`flex-1 text-sm font-bold ${item.visible ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                            {getPageLabel(item.id)}
                          </span>

                          {/* Controls */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => moveNavItem(idx, -1)}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] disabled:opacity-20 transition-all"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => moveNavItem(idx, 1)}
                              disabled={idx === navConfig.length - 1}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] disabled:opacity-20 transition-all"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              onClick={() => toggleNavVisibility(item.id)}
                              className={`p-1.5 rounded-lg transition-all ${
                                item.visible ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-[var(--text-muted)] hover:bg-white/10'
                              }`}
                            >
                              {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button
                              onClick={() => removeNavPage(item.id)}
                              className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SettingsSection>

                {/* Add pages */}
                {availableToAdd.length > 0 && (
                  <>
                    <div className="border-t border-[var(--border-glass)]" />
                    <SettingsSection icon={Plus} title={L === 'ar' ? 'إضافة صفحات' : 'Add Pages'}>
                      <div className="grid grid-cols-2 gap-2">
                        {availableToAdd.map(page => (
                          <button
                            key={page.id}
                            onClick={() => addNavPage(page.id)}
                            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-[var(--accent-primary)] border-2 border-dashed border-[var(--accent-primary)]/20 hover:border-[var(--accent-primary)]/50 hover:bg-[var(--accent-primary)]/5 transition-all"
                          >
                            <Plus size={14} />
                            {t(page.labelKey, L)}
                          </button>
                        ))}
                      </div>
                    </SettingsSection>
                  </>
                )}

                {/* Reset */}
                <div className="border-t border-[var(--border-glass)] pt-3">
                  <button
                    onClick={() => {
                      const defaultConfig = allNavPages.map(p => ({ id: p.id, visible: true }));
                      onNavConfigChange(defaultConfig);
                      flash();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-[var(--text-muted)] bg-black/10 hover:bg-black/20 border border-[var(--border-glass)] transition-all"
                  >
                    <RotateCcw size={12} />
                    {L === 'ar' ? 'إعادة التعيين للافتراضي' : 'Reset to Default'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
