import React, { useState, useMemo } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { HABIT_SUGGESTIONS } from '../../data/habitSuggestions';
import usePreferences from '../../hooks/usePreferences';

const CATEGORY_META = [
  { id: 'all',          ar: 'الكل',       en: 'All',           emoji: '✨', activeClass: 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 border-violet-500/60 text-violet-300' },
  { id: 'islamic',      ar: 'إسلامي',     en: 'Islamic',       emoji: '🕌', activeClass: 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-emerald-500/60 text-emerald-300' },
  { id: 'health',       ar: 'صحة',        en: 'Health',        emoji: '❤️', activeClass: 'bg-gradient-to-r from-rose-500/30 to-pink-500/30 border-rose-500/60 text-rose-300' },
  { id: 'fitness',      ar: 'لياقة',      en: 'Fitness',       emoji: '💪', activeClass: 'bg-gradient-to-r from-orange-500/30 to-amber-500/30 border-orange-500/60 text-orange-300' },
  { id: 'productivity', ar: 'إنتاجية',    en: 'Productivity',  emoji: '⚡', activeClass: 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border-yellow-500/60 text-yellow-300' },
  { id: 'learning',     ar: 'تعلّم',       en: 'Learning',      emoji: '📚', activeClass: 'bg-gradient-to-r from-blue-500/30 to-sky-500/30 border-blue-500/60 text-blue-300' },
  { id: 'spirituality', ar: 'روحانية',    en: 'Spirituality',  emoji: '🧘', activeClass: 'bg-gradient-to-r from-purple-500/30 to-violet-500/30 border-purple-500/60 text-purple-300' },
  { id: 'social',       ar: 'اجتماعي',   en: 'Social',        emoji: '👥', activeClass: 'bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border-teal-500/60 text-teal-300' },
  { id: 'finance',      ar: 'مالي',       en: 'Finance',       emoji: '💰', activeClass: 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-green-500/60 text-green-300' },
  { id: 'mindfulness',  ar: 'وعي ذاتي',  en: 'Mindfulness',   emoji: '🌸', activeClass: 'bg-gradient-to-r from-pink-500/30 to-rose-500/30 border-pink-500/60 text-pink-300' },
  { id: 'other',        ar: 'أخرى',       en: 'Other',         emoji: '🌟', activeClass: 'bg-gradient-to-r from-slate-500/30 to-gray-500/30 border-slate-500/60 text-slate-300' },
];

export default function BrowseHabitsModal({ onSelect, onClose }) {
  const { language } = usePreferences();
  const isAr = language === 'ar';
  const [q, setQ] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const filtered = useMemo(() => {
    let list = HABIT_SUGGESTIONS;
    if (activeCat !== 'all') list = list.filter(h => h.category === activeCat);
    if (q.trim()) {
      const lower = q.toLowerCase();
      list = list.filter(h =>
        h.en.toLowerCase().includes(lower) || h.ar.includes(q)
      );
    }
    return list;
  }, [q, activeCat]);

  const habitName = (habit) => isAr ? habit.ar : habit.en;

  const catMeta = (id) => CATEGORY_META.find(c => c.id === id) || CATEGORY_META[0];

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-[#0a0a0f]/95 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-white/50 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-white">{isAr ? 'مكتبة العادات' : 'Habit Library'}</h2>
          <p className="text-[11px] text-white/40">{isAr ? 'اختر عادة جاهزة لتتم تعبئة البيانات تلقائياً' : 'Pick a ready-made habit to auto-fill the form'}</p>
        </div>
        <span className="text-xs text-white/30 font-bold bg-white/5 px-2 py-1 rounded-lg">
          {filtered.length} {isAr ? 'عادة' : 'habits'}
        </span>
      </div>

      {/* ── Search ── */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={isAr ? 'ابحث عن عادة...' : 'Search habits...'}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors text-sm"
            dir={isAr ? 'rtl' : 'ltr'}
          />
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-white/5"
        style={{ scrollbarWidth: 'none' }}>
        {CATEGORY_META.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              activeCat === cat.id
                ? cat.activeClass
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{isAr ? cat.ar : cat.en}</span>
          </button>
        ))}
      </div>

      {/* ── Habits Grid ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-bold text-lg">{isAr ? 'لا توجد عادات مطابقة' : 'No habits found'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((habit, i) => {
              const meta = catMeta(habit.category);
              return (
                <button
                  key={i}
                  onClick={() => { onSelect(habit); onClose(); }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10
                             hover:bg-white/[0.08] hover:border-violet-500/40 hover:shadow-lg
                             transition-all text-left group active:scale-[0.98]"
                >
                  {/* Emoji */}
                  <div className="text-2xl w-11 h-11 flex items-center justify-center bg-black/40 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {habit.icon}
                  </div>

                  {/* Info */}
                  <div className={`flex-1 min-w-0 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
                    <p className="text-white font-bold text-sm truncate">{habitName(habit)}</p>
                    <p className="text-white/40 text-xs truncate">{isAr ? habit.en : habit.ar}</p>
                    {habit.targetType === 'numeric' && (
                      <p className="text-white/25 text-[10px] mt-0.5">
                        {habit.targetValue} {habit.unit}
                      </p>
                    )}
                  </div>

                  {/* Category badge + Add icon */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 ${meta.activeClass.split(' ').find(c => c.startsWith('text-')) || 'text-white/40'}`}>
                      {meta.emoji}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30
                                    flex items-center justify-center opacity-0 group-hover:opacity-100
                                    transition-all group-hover:bg-violet-500/30">
                      <Plus size={13} className="text-violet-400" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
