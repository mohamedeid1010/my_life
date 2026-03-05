export const DEFAULT_LAYOUTS = {
  overview: [
    { id: 'life_balance', visible: true },
    { id: 'gym_progress', visible: true },
    { id: 'habits_unified', visible: true }
  ],
  gym: [
    { id: 'gym_hero', visible: true },
    { id: 'gym_heatmap', visible: true, locked: true }, // Main tracker locked
    { id: 'gym_progress', visible: true }
  ],
  habits: [
    { id: 'habits_stats', visible: true },
    { id: 'habits_weekly', visible: true, locked: true }, // Main tracker locked
    { id: 'habits_monthly', visible: true },
    { id: 'habits_grid', visible: true }
  ]
};

export const AVAILABLE_WIDGETS = {
  // Overview special widgets
  life_balance: { label: 'Life Balance Tracker', type: 'overview' },
  // Gym widgets
  gym_hero: { label: 'Gym Hero Summary', type: 'gym' },
  gym_heatmap: { label: 'Gym Heatmap', type: 'gym' },
  gym_progress: { label: 'Weight & Body Fat Table', type: 'gym' },
  // Habits widgets
  habits_stats: { label: 'Habits Analytics', type: 'habits' },
  habits_weekly: { label: 'Weekly Habits Tracker', type: 'habits' },
  habits_monthly: { label: 'Monthly Habits View', type: 'habits' },
  habits_grid: { label: 'All Time Habits Grid', type: 'habits' },
  habits_unified: { label: 'Unified Habits Dashboard', type: 'habits' }
};
