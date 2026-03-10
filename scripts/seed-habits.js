/**
 * Script لإضافة عادات تجريبية مباشرة
 * شغل هذا من المتصفح console بعد تسجيل الدخول
 */

import { useAuthStore } from './src/stores/useAuthStore.js';
import { useHabitStore } from './src/stores/useHabitStore.ts';

const sampleHabits = [
  {
    name: '📚 القراءة',
    description: 'قراءة 30 دقيقة يومياً',
    targetType: 'boolean',
    frequency: 'daily',
    icon: '📚',
    graceDaysAllowance: 2,
  },
  {
    name: '🏃 الجري',
    description: 'الجري أو المشي',
    targetType: 'boolean',
    frequency: 'daily',
    icon: '🏃',
    graceDaysAllowance: 1,
  },
  {
    name: '💧 شرب الماء',
    description: 'شرب 8 أكواب ماء يومياً',
    targetType: 'numeric',
    targetValue: 8,
    unit: 'أكواب',
    frequency: 'daily',
    icon: '💧',
    graceDaysAllowance: 0,
  },
  {
    name: '🧘 التأمل',
    description: 'التأمل 10 دقائق',
    targetType: 'boolean',
    frequency: 'daily',
    icon: '🧘',
    graceDaysAllowance: 1,
  },
  {
    name: '✍️ الكتابة',
    description: 'كتابة يومية',
    targetType: 'boolean',
    frequency: 'daily',
    icon: '✍️',
    graceDaysAllowance: 2,
  },
];

async function seedHabits() {
  console.log('🌱 Starting to seed sample habits...\n');

  const user = useAuthStore.getState().user;
  if (!user) {
    console.error('❌ Not authenticated! Please log in first.');
    return;
  }

  console.log(`👤 Adding habits for: ${user.email}\n`);

  const addHabitToStore = useHabitStore.getState().addHabit;

  for (const habit of sampleHabits) {
    try {
      await addHabitToStore(user.uid, habit);
      console.log(`✅ Added: ${habit.name}`);
    } catch (err) {
      console.error(`❌ Failed to add ${habit.name}:`, err);
    }
  }

  console.log('\n✨ Done! Habits have been added.');
}

// Run it
seedHabits();
