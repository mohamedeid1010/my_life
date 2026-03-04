import React, { useState } from 'react';
import { X, Target, Heart, Briefcase, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'health', label: 'Health', icon: <Heart size={16} /> },
  { id: 'productivity', label: 'Productivity', icon: <Briefcase size={16} /> },
  { id: 'spirituality', label: 'Spirituality', icon: <Sparkles size={16} /> },
  { id: 'other', label: 'Other', icon: <Target size={16} /> },
];

const ICONS = ['💧', '📚', '🏃‍♂️', '🧘‍♀️', '🍎', '✍️', ' 기도', '🛌', '💪', '💻'];

export default function CreateHabitForm({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💧');
  const [category, setCategory] = useState('health');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="glass-card w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-violet-400" />
            Build a New Habit
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh] space-y-6" dir="ltr">
          
          {/* Name & Icon */}
          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Icon</label>
              <div className="relative group">
                <select 
                  value={icon} 
                  onChange={e => setIcon(e.target.value)}
                  className="w-14 h-14 bg-black/30 border border-white/10 rounded-xl text-3xl flex items-center justify-center text-center appearance-none focus:outline-none focus:border-violet-500 transition-colors"
                >
                  {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <div className="absolute inset-0 rounded-xl bg-violet-400/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

            <div className="flex-grow flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Habit Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Read 20 pages"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors text-lg font-medium"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors font-medium color-scheme-dark"
              style={{ colorScheme: 'dark' }}
            />
            <p className="text-[10px] text-white/40 mt-1">If you started this habit in the past, set the date here to track your true progress.</p>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Category</label>
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
                  <span className="font-bold text-sm tracking-wide">{cat.label}</span>
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
    </div>
  );
}
