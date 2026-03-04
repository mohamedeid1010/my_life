// Workout system configuration — session types for each training program
// Smart session naming: when a system has more days than unique session types,
// sessions get numbered (e.g. Push 1, Push 2) to track progression separately.

export const WORKOUT_SYSTEMS = {
  ppl: {
    label: 'Push / Pull / Legs',
    sessions: [
      { value: 'push_1', label: '💪 Push 1', color: '#f59e0b' },
      { value: 'pull_1', label: '🔙 Pull 1', color: '#3b82f6' },
      { value: 'legs_1', label: '🦵 Legs', color: '#10b981' },
      { value: 'push_2', label: '💪 Push 2', color: '#fb923c' },
      { value: 'pull_2', label: '🔙 Pull 2', color: '#60a5fa' },
      { value: 'legs_2', label: '🦵 Legs 2', color: '#34d399' },
    ],
  },
  ul: {
    label: 'Upper / Lower',
    sessions: [
      { value: 'upper_1', label: '🔝 Upper 1', color: '#8b5cf6' },
      { value: 'lower_1', label: '🦵 Lower 1', color: '#10b981' },
      { value: 'upper_2', label: '🔝 Upper 2', color: '#a78bfa' },
      { value: 'lower_2', label: '🦵 Lower 2', color: '#34d399' },
    ],
  },
  ppl_ul: {
    label: 'PPL + Upper/Lower',
    sessions: [
      { value: 'push', label: '💪 Push', color: '#f59e0b' },
      { value: 'pull', label: '🔙 Pull', color: '#3b82f6' },
      { value: 'legs', label: '🦵 Legs', color: '#10b981' },
      { value: 'upper', label: '🔝 Upper', color: '#8b5cf6' },
      { value: 'lower', label: '🦿 Lower', color: '#ec4899' },
    ],
  },
  fullbody: {
    label: 'Full Body',
    sessions: [
      { value: 'fullbody_a', label: '🏋️ Full Body A', color: '#f59e0b' },
      { value: 'fullbody_b', label: '🏋️ Full Body B', color: '#3b82f6' },
      { value: 'fullbody_c', label: '🏋️ Full Body C', color: '#10b981' },
    ],
  },
  bro: {
    label: 'Bro Split',
    sessions: [
      { value: 'chest', label: '🫁 Chest', color: '#ef4444' },
      { value: 'back', label: '🔙 Back', color: '#3b82f6' },
      { value: 'shoulders', label: '🔱 Shoulders', color: '#f59e0b' },
      { value: 'arms', label: '💪 Arms', color: '#8b5cf6' },
      { value: 'legs', label: '🦵 Legs', color: '#10b981' },
    ],
  },
  arnoldSplit: {
    label: 'Arnold Split',
    sessions: [
      { value: 'chest_back_1', label: '🫁 Chest & Back 1', color: '#ef4444' },
      { value: 'shoulders_arms_1', label: '🔱 Shoulders & Arms 1', color: '#f59e0b' },
      { value: 'legs_1', label: '🦵 Legs 1', color: '#10b981' },
      { value: 'chest_back_2', label: '🫁 Chest & Back 2', color: '#f87171' },
      { value: 'shoulders_arms_2', label: '🔱 Shoulders & Arms 2', color: '#fbbf24' },
      { value: 'legs_2', label: '🦵 Legs 2', color: '#34d399' },
    ],
  },
  phul: {
    label: 'PHUL',
    sessions: [
      { value: 'upper_power', label: '⚡ Upper Power', color: '#ef4444' },
      { value: 'lower_power', label: '⚡ Lower Power', color: '#f59e0b' },
      { value: 'upper_hyp', label: '💪 Upper Hypertrophy', color: '#8b5cf6' },
      { value: 'lower_hyp', label: '🦵 Lower Hypertrophy', color: '#10b981' },
    ],
  },
  phat: {
    label: 'PHAT',
    sessions: [
      { value: 'upper_power', label: '⚡ Upper Power', color: '#ef4444' },
      { value: 'lower_power', label: '⚡ Lower Power', color: '#f59e0b' },
      { value: 'back_shoulders', label: '🔙 Back & Shoulders', color: '#3b82f6' },
      { value: 'lower_hyp', label: '🦵 Lower Hypertrophy', color: '#10b981' },
      { value: 'chest_arms', label: '💪 Chest & Arms', color: '#8b5cf6' },
    ],
  },
  gzclp: {
    label: 'GZCLP',
    sessions: [
      { value: 'day_a1', label: '📊 Day A1 (Squat)', color: '#10b981' },
      { value: 'day_b1', label: '📊 Day B1 (OHP)', color: '#f59e0b' },
      { value: 'day_a2', label: '📊 Day A2 (Bench)', color: '#3b82f6' },
      { value: 'day_b2', label: '📊 Day B2 (Deadlift)', color: '#ef4444' },
    ],
  },
  '531': {
    label: 'Wendler 5/3/1',
    sessions: [
      { value: 'squat', label: '🎯 Squat Day', color: '#10b981' },
      { value: 'bench', label: '🎯 Bench Day', color: '#3b82f6' },
      { value: 'deadlift', label: '🎯 Deadlift Day', color: '#ef4444' },
      { value: 'ohp', label: '🎯 OHP Day', color: '#f59e0b' },
    ],
  },
  stronglifts: {
    label: 'StrongLifts 5×5',
    sessions: [
      { value: 'workout_a', label: '🏗️ Workout A (SQ/BP/Row)', color: '#3b82f6' },
      { value: 'workout_b', label: '🏗️ Workout B (SQ/OHP/DL)', color: '#f59e0b' },
    ],
  },
  greyskull: {
    label: 'Greyskull LP',
    sessions: [
      { value: 'day_a', label: '💀 Day A (Bench/Row)', color: '#3b82f6' },
      { value: 'day_b', label: '💀 Day B (OHP/Chin)', color: '#f59e0b' },
    ],
  },
  texas: {
    label: 'Texas Method',
    sessions: [
      { value: 'volume', label: '🤠 Volume Day', color: '#3b82f6' },
      { value: 'recovery', label: '🤠 Recovery Day', color: '#10b981' },
      { value: 'intensity', label: '🤠 Intensity Day', color: '#ef4444' },
    ],
  },
  custom: {
    label: 'Custom',
    sessions: [
      { value: 'session_a', label: '✏️ Session A', color: '#3b82f6' },
      { value: 'session_b', label: '✏️ Session B', color: '#f59e0b' },
      { value: 'session_c', label: '✏️ Session C', color: '#10b981' },
      { value: 'session_d', label: '✏️ Session D', color: '#8b5cf6' },
      { value: 'session_e', label: '✏️ Session E', color: '#ec4899' },
      { value: 'session_f', label: '✏️ Session F', color: '#06b6d4' },
    ],
  },
};
