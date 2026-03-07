import React, { useState } from 'react';
import { X, Target, Heart, Briefcase, Sparkles, BookOpen, Dumbbell, Users, DollarSign, Moon, Search } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import usePreferences from '../../hooks/usePreferences';
import { t } from '../../config/translations';
import { HABIT_SUGGESTIONS } from '../../data/habitSuggestions';

const CATEGORIES = [
  { id: 'health', labelKey: 'habit_category_health', icon: <Heart size={16} /> },
  { id: 'fitness', labelKey: 'habit_category_fitness', icon: <Dumbbell size={16} /> },
  { id: 'productivity', labelKey: 'habit_category_productivity', icon: <Briefcase size={16} /> },
  { id: 'learning', labelKey: 'habit_category_learning', icon: <BookOpen size={16} /> },
  { id: 'spirituality', labelKey: 'habit_category_spirituality', icon: <Sparkles size={16} /> },
  { id: 'islamic', labelKey: 'habit_category_islamic', icon: <Moon size={16} /> },
  { id: 'social', labelKey: 'habit_category_social', icon: <Users size={16} /> },
  { id: 'finance', labelKey: 'habit_category_finance', icon: <DollarSign size={16} /> },
  { id: 'mindfulness', labelKey: 'habit_category_mindfulness', icon: <Sparkles size={16} /> },
  { id: 'other', labelKey: 'habit_category_other', icon: <Target size={16} /> },
];

export default function CreateHabitForm({ onClose, onSave }) {
  const { language } = usePreferences();
  const L = language;
  const isAr = L === 'ar';
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💧');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [category, setCategory] = useState('health');

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  
  // Browse ideas modal
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [browseCategory, setBrowseCategory] = useState('all');

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    
    if (value.trim().length > 0) {
      const lowerVal = value.toLowerCase();
      const filtered = HABIT_SUGGESTIONS.filter(
        (h) => h.ar.includes(lowerVal) || h.en.toLowerCase().includes(lowerVal)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    setName(isAr ? suggestion.ar : suggestion.en);
    setIcon(suggestion.icon);
    setCategory(suggestion.category);
    setTargetType(suggestion.targetType);
    setTargetValue(suggestion.targetValue || 1);
    if (suggestion.targetType === 'numeric') {
      setUnit(suggestion.unit || '');
    }
    setGraceDaysAllowance(suggestion.graceDaysAllowance || 0);
    setShowSuggestions(false);
    setShowBrowseModal(false);
  };

  const type = 'daily'; // daily, weekly_target
  const [targetType, setTargetType] = useState('boolean'); // boolean, numeric
  const [targetValue, setTargetValue] = useState(1);
  const [unit, setUnit] = useState('times');
  const [graceDaysAllowance, setGraceDaysAllowance] = useState(0);
  
  // Format today as YYYY-MM-DD for the default
  const getTodayStr = () => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [startDate, setStartDate] = useState(getTodayStr());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      icon,
      category,
      type,
      targetType,
      targetValue: targetType === 'numeric' ? Number(targetValue) : null,
      unit: targetType === 'numeric' ? unit.trim() : null,
      graceDaysAllowance: Number(graceDaysAllowance),
      startDate
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="glass-card w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-violet-400" />
            {t('habits_build_new', L)}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh] space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
          
          {/* Name & Icon */}
          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest">{t('habit_icon', L)}</label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-14 h-14 bg-black/30 border border-white/10 rounded-xl text-3xl flex items-center justify-center hover:border-violet-500/50 focus:outline-none focus:border-violet-500 transition-all hover:scale-105 active:scale-95"
                >
                  {icon}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 z-50">
                    <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                    <div className="relative">
                      <EmojiPicker
                        value={icon}
                        onChange={(emoji) => { setIcon(emoji); setShowEmojiPicker(false); }}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-grow flex flex-col gap-2 relative">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest">{t('habits_form_name', L)}</label>
                <button
                  type="button"
                  onClick={() => setShowBrowseModal(true)}
                  className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded-md hover:bg-violet-500/20 transition-colors flex items-center gap-1"
                >
                  <Search size={12} />
                  {isAr ? 'تصفح الأفكار' : 'Browse Ideas'}
                </button>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                onFocus={() => {
                  if (name.trim() && filteredSuggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder={t('habit_placeholder_example', L)}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors text-lg font-medium"
              />
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-[84px] left-0 right-0 z-50 bg-[#1a1b26] border border-white/20 rounded-xl max-h-60 overflow-y-auto shadow-2xl flex flex-col">
                  {filteredSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSuggestion(sug)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors border-white/5 text-left ${idx !== filteredSuggestions.length - 1 ? 'border-b' : ''}`}
                      dir={isAr ? 'rtl' : 'ltr'}
                    >
                      <span className="text-2xl">{sug.icon}</span>
                      <div className="flex flex-col flex-1 items-start">
                        <span className="text-white font-medium text-base">
                          {isAr ? sug.ar : sug.en}
                        </span>
                        <span className="text-white/40 text-xs flex gap-2">
                          <span className="capitalize">{t(`habit_category_${sug.category}`, L) || sug.category}</span>
                          •
                          {sug.targetType === 'numeric' ? ` ${sug.targetValue} ${sug.unit}` : ' Yes/No'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">{t('habit_start_date', L)}</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors font-medium color-scheme-dark"
              style={{ colorScheme: 'dark' }}
            />
            <p className="text-[10px] text-white/40 mt-1">{t('habit_start_date_hint', L)}</p>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">{t('habit_category', L)}</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                    category === cat.id 
                      ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' 
                      : 'bg-black/30 border-white/5 text-white/40 hover:bg-white/5 hover:text-white/70'
                  }`}
                >
                  {cat.icon}
                  <span className="font-bold text-sm tracking-wide">{t(cat.labelKey, L)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Smart Flexibility: Grace Days */}
          <div className="flex flex-col gap-2 bg-gradient-to-br from-emerald-500/10 to-transparent p-4 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none" />
            <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-between">
              Smart Flexibility: Grace Days
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300">Pro Feature</span>
            </label>
            <p className="text-sm text-white/60 mb-2 leading-relaxed">
              How many days per month can you skip this habit without breaking your streak? Life happens.
            </p>
            <input
              type="range"
              min="0"
              max="10"
              value={graceDaysAllowance}
              onChange={e => setGraceDaysAllowance(e.target.value)}
              className="w-full accent-emerald-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs font-bold text-emerald-300 mt-2">
              <span>0 (Rigid)</span>
              <span className="text-lg text-emerald-400">{graceDaysAllowance} Days/Mo</span>
              <span>10 (Relaxed)</span>
            </div>
          </div>

          {/* Target Type & Quantitative Goals */}
          <div className="flex flex-col gap-2">
             <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Goal Type</label>
             <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setTargetType('boolean')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    targetType === 'boolean' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Yes / No
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('numeric')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    targetType === 'numeric' ? 'bg-fuchsia-500/20 text-fuchsia-300 shadow-lg' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Amount (e.g. L, Pages)
                </button>
             </div>
          </div>

          {targetType === 'numeric' && (
            <div className="flex gap-4 animate-fade-in">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Daily Target</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={targetValue}
                  onChange={e => setTargetValue(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Unit</label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="e.g. ml, pages, steps"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-fuchsia-500 transition-colors"
                />
              </div>
            </div>
          )}
          
          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl font-black text-white transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}
            >
              Save Habit
            </button>
          </div>
        </form>
      </div>

      {/* Browse Ideas Modal */}
      {showBrowseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="glass-card w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl relative border-violet-500/20">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Search className="text-violet-400" />
                {isAr ? 'مكتبة العادات' : 'Habit Library'}
              </h2>
              <button type="button" onClick={() => setShowBrowseModal(false)} className="p-2 rounded-full hover:bg-white/10 text-white/50 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Category Filter */}
            <div className="p-4 border-b border-white/5 overflow-x-auto whitespace-nowrap hide-scrollbar shrink-0 flex gap-2">
              <button
                type="button"
                onClick={() => setBrowseCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  browseCategory === 'all' ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setBrowseCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    browseCategory === cat.id ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.icon}
                  {t(cat.labelKey, L)}
                </button>
              ))}
            </div>

            {/* Habits Grid */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HABIT_SUGGESTIONS
                .filter(sug => browseCategory === 'all' || sug.category === browseCategory)
                .map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSuggestion(sug)}
                  className="flex items-start gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-violet-500/30 transition-all text-left group"
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  <div className="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">
                    {sug.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base mb-2">
                      {isAr ? sug.ar : sug.en}
                    </span>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="bg-white/10 text-white/60 px-2 py-0.5 rounded-md">
                        {t(`habit_category_${sug.category}`, L) || sug.category}
                      </span>
                      {sug.targetType === 'numeric' ? (
                        <span className="bg-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded-md">
                          {sug.targetValue} {sug.unit}
                        </span>
                      ) : (
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md">
                          Yes / No
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
