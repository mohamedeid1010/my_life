import React, { useState, useEffect } from 'react';
import { BookOpen, Save, CheckCircle2 } from 'lucide-react';
import type { ReflectionEntry } from '../../types/life-os.types';

const PROMPTS = {
  learned: 'What did you learn today?',
  improve: 'What will you improve tomorrow?',
  gratitude: 'What are you grateful for?',
};

interface DailyReflectionCardProps {
  /** Initial data (from Firestore, may be undefined on first load). */
  initialData?: Partial<ReflectionEntry>;
  /** Called when user saves. Parent is responsible for Firestore write. */
  onSave: (entry: Omit<ReflectionEntry, 'savedAt'>) => void | Promise<void>;
  date: string;
}

export default function DailyReflectionCard({
  initialData,
  onSave,
  date,
}: DailyReflectionCardProps) {
  const [learned, setLearned] = useState(initialData?.learned ?? '');
  const [improve, setImprove] = useState(initialData?.improve ?? '');
  const [gratitude, setGratitude] = useState(initialData?.gratitude ?? '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Sync if parent data loads late (e.g. Firestore snapshot arrives) */
  useEffect(() => {
    if (initialData?.learned !== undefined) setLearned(initialData.learned ?? '');
    if (initialData?.improve !== undefined) setImprove(initialData.improve ?? '');
    if (initialData?.gratitude !== undefined) setGratitude(initialData.gratitude ?? '');
  }, [initialData?.learned, initialData?.improve, initialData?.gratitude]);

  const hasContent = learned.trim() || improve.trim() || gratitude.trim();

  const handleSave = async () => {
    if (!hasContent) return;
    setSaving(true);
    try {
      await onSave({ date, learned: learned.trim(), improve: improve.trim(), gratitude: gratitude.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.1)' }}
        >
          <BookOpen size={14} className="text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Daily Reflection
          </h3>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {date}
          </p>
        </div>
      </div>

      {/* Prompt fields */}
      <div className="flex flex-col gap-3">
        {(
          [
            { key: 'learned', state: learned, setter: setLearned },
            { key: 'improve', state: improve, setter: setImprove },
            { key: 'gratitude', state: gratitude, setter: setGratitude },
          ] as const
        ).map(({ key, state, setter }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {PROMPTS[key]}
            </label>
            <textarea
              value={state}
              onChange={(e) => setter(e.target.value)}
              placeholder={`Type your ${key === 'learned' ? 'reflection' : key === 'improve' ? 'intention' : 'gratitude'}…`}
              rows={2}
              className="w-full resize-none text-sm rounded-xl px-3 py-2.5 outline-none transition-all duration-200 placeholder-transparent focus:placeholder-current"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                caretColor: 'var(--accent-primary)',
              }}
              onFocus={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(139,92,246,0.35)';
                (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)';
              }}
              onBlur={(e) => {
                (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border-glass)';
                (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
              }}
            />
          </div>
        ))}
      </div>

      {/* Save button */}
      <button
        type="button"
        disabled={!hasContent || saving}
        onClick={handleSave}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: saved
            ? 'rgba(16,185,129,0.15)'
            : hasContent
            ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.2))'
            : 'rgba(255,255,255,0.03)',
          color: saved ? '#10b981' : hasContent ? 'var(--accent-primary)' : 'var(--text-muted)',
          border: `1px solid ${saved ? 'rgba(16,185,129,0.25)' : hasContent ? 'rgba(139,92,246,0.25)' : 'var(--border-glass)'}`,
        }}
      >
        {saved ? (
          <>
            <CheckCircle2 size={15} />
            Reflection saved
          </>
        ) : saving ? (
          <>
            <Save size={15} className="animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save size={15} />
            Save reflection
          </>
        )}
      </button>
    </div>
  );
}
