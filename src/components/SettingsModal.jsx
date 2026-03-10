import React, { useState, useRef } from 'react';
import { X, User, Palette, Upload, LogOut, Navigation, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import usePreferences from '../hooks/usePreferences';
import { useAuthStore } from '../stores/useAuthStore';
import { t } from '../config/translations';

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
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('Image must be smaller than 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setLocalPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    updateProfile({ name: localName, photoURL: localPhoto });
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
    // Don't allow hiding the last visible page
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
    // Don't remove if it's the only visible one
    if (item?.visible && visibleCount <= 1) return;
    
    const newConfig = navConfig.filter(p => p.id !== pageId);
    onNavConfigChange(newConfig);
  };

  // Pages not in current config (can be added)
  const availableToAdd = allNavPages?.filter(
    ap => !navConfig?.find(nc => nc.id === ap.id)
  ) || [];

  const getPageLabel = (id) => {
    const page = allNavPages?.find(p => p.id === id);
    return page ? t(page.labelKey, L) : id;
  };

  const TABS = [
    { id: 'account', label: t('settings_account', L), icon: User },
    { id: 'appearance', label: t('settings_appearance', L), icon: Palette },
    { id: 'navigation', label: t('settings_navigation', L) || 'Navigation', icon: Navigation },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
      style={{
        paddingTop: 'max(0.75rem, var(--safe-top))',
        paddingBottom: 'max(0.75rem, var(--safe-bottom))',
        paddingLeft: 'max(0.75rem, var(--safe-left))',
        paddingRight: 'max(0.75rem, var(--safe-right))',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-0 shrink-0">
          <h2 className="text-lg sm:text-xl font-black text-white/90 truncate">⚙️ {t('settings', L)}</h2>
          <button type="button" onClick={onClose} className="touch-target p-2 -m-2 text-white/30 hover:text-white/70 transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 px-4 sm:px-6 pt-3 sm:pt-4 border-b border-white/5 overflow-x-auto custom-scrollbar shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`touch-target flex items-center gap-2 px-3 md:px-4 py-2.5 text-xs md:text-sm font-bold rounded-t-xl transition-all whitespace-nowrap min-h-[44px] ${
                  activeTab === tab.id
                    ? 'bg-violet-500/15 text-violet-300 border-b-2 border-violet-500'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar min-h-0">

          {/* ─── ACCOUNT TAB ─── */}
          {activeTab === 'account' && (
            <div className="space-y-5">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 block">{t('display_name', L)}</label>
                <input
                  type="text"
                  value={localName}
                  onChange={e => setLocalName(e.target.value)}
                  placeholder={t('your_name', L)}
                  className="w-full bg-white/5 px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-white/10"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 block">{t('profile_photo', L)}</label>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 rounded-full border-2 border-violet-500/30 overflow-hidden flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                  >
                    {localPhoto ? (
                      <img src={localPhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} className="text-white/60" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {user?.email && (
                      <span className="text-xs font-medium text-white/50 mb-1">{user.email}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-violet-300 transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
                    >
                      <Upload size={14} />
                      {t('upload_photo', L)}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <span className="text-[10px] text-white/20">{t('max_size', L)}</span>
                  </div>
                </div>
                <input
                  type="url"
                  value={localPhoto && !localPhoto.startsWith('data:') ? localPhoto : ''}
                  onChange={e => setLocalPhoto(e.target.value)}
                  placeholder={t('paste_url', L)}
                  className="w-full bg-white/5 px-4 py-2.5 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30 border border-white/10"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
                }}
              >
                {t('save_profile', L)}
              </button>

              {/* Logout */}
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => { onLogout?.(); onClose(); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-red-400 transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  <LogOut size={16} />
                  {t('logout', L)}
                </button>
              </div>
            </div>
          )}

          {/* ─── APPEARANCE TAB ─── */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-3 block">{t('theme', L)}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dark', label: t('theme_dark', L) },
                    { id: 'light', label: t('theme_light', L) },
                    { id: 'midnight', label: t('theme_midnight', L) }
                  ].map(th => (
                    <button
                      key={th.id}
                      onClick={() => updateTheme(th.id)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${
                        theme === th.id
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-lg'
                          : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-3 block">{t('language', L)}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ id: 'en', label: t('lang_en', L) }, { id: 'ar', label: t('lang_ar', L) }].map(l => (
                    <button
                      key={l.id}
                      onClick={() => updateLanguage(l.id)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${
                        language === l.id
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-lg'
                          : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── NAVIGATION TAB ─── */}
          {activeTab === 'navigation' && (
            <div className="space-y-5">
              <p className="text-xs text-white/40">
                {L === 'ar' ? 'رتب وأظهر/أخفِ الصفحات في شريط التنقل' : 'Reorder, show, or hide pages in the navigation bar'}
              </p>

              {/* Current nav items with reorder + visibility */}
              <div className="space-y-2">
                {navConfig?.map((item, idx) => {
                  const pageDef = allNavPages?.find(p => p.id === item.id);
                  if (!pageDef) return null;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        item.visible
                          ? 'bg-white/5 border border-white/10'
                          : 'bg-white/[0.02] border border-white/5 opacity-50'
                      }`}
                    >
                      {/* Grip indicator */}
                      <GripVertical size={14} className="text-white/20 shrink-0" />

                      {/* Page name */}
                      <span className={`flex-1 text-sm font-bold ${item.visible ? 'text-white/80' : 'text-white/30'}`}>
                        {getPageLabel(item.id)}
                      </span>

                      {/* Move up */}
                      <button
                        onClick={() => moveNavItem(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                      >
                        <ChevronUp size={14} />
                      </button>

                      {/* Move down */}
                      <button
                        onClick={() => moveNavItem(idx, 1)}
                        disabled={idx === navConfig.length - 1}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                      >
                        <ChevronDown size={14} />
                      </button>

                      {/* Toggle visibility */}
                      <button
                        onClick={() => toggleNavVisibility(item.id)}
                        className={`p-1.5 rounded-lg transition-all ${
                          item.visible
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-white/20 hover:bg-white/10'
                        }`}
                      >
                        {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => removeNavPage(item.id)}
                        className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title={L === 'ar' ? 'إزالة' : 'Remove'}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add pages */}
              {availableToAdd.length > 0 && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 block">
                    {L === 'ar' ? 'إضافة صفحات' : 'Add Pages'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableToAdd.map(page => (
                      <button
                        key={page.id}
                        onClick={() => addNavPage(page.id)}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-violet-300 transition-all hover:scale-[1.02]"
                        style={{ background: 'rgba(139,92,246,0.1)', border: '1px dashed rgba(139,92,246,0.3)' }}
                      >
                        + {t(page.labelKey, L)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset to default */}
              <button
                onClick={() => {
                  const defaultConfig = allNavPages.map(p => ({ id: p.id, visible: true }));
                  onNavConfigChange(defaultConfig);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white/30 bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
              >
                {L === 'ar' ? 'إعادة التعيين للافتراضي' : 'Reset to Default'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
