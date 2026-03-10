/**
 * Seed Habits Tool
 * استخدم هذا لإضافة عادات تجريبية مباشرة
 * 
 * Usage:
 * 1. سجل دخول على التطبيق في localhost
 * 2. افتح Developer Tools (F12)
 * 3. اذهب إلى Console
 * 4. اعمل copy-paste للكود أدناه:
 */

(async () => {
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

  console.log('🌱 Starting to seed sample habits...\n');

  // محاولة الحصول على Zustand stores من الـ window
  if (!window.__ZUSTAND_DEVTOOLS__) {
    console.error('❌ Zustand not found. Make sure you have the app open.');
    return;
  }

  // استخدم Firebase مباشرة
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js');
  const { getFirestore, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');

  const firebaseConfig = {
    apiKey: "AIzaSyAWPGftVLRq_3y7d4ABOtAUaWMg5nF_QXM",
    authDomain: "my-life-3519c.firebaseapp.com",
    projectId: "my-life-3519c",
    storageBucket: "my-life-3519c.firebasestorage.app",
    messagingSenderId: "628407543082",
    appId: "1:628407543082:web:e281446795ab10b333aa53"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  const user = auth.currentUser;
  if (!user) {
    console.error('❌ Not authenticated! Please log in first.');
    return;
  }

  console.log(`👤 Adding habits for: ${user.email}\n`);

  for (const habit of sampleHabits) {
    try {
      const docRef = await addDoc(collection(db, `users/${user.uid}/habits`), {
        ...habit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        history: {},
      });
      console.log(`✅ Added: ${habit.name} (ID: ${docRef.id})`);
    } catch (err) {
      console.error(`❌ Failed to add ${habit.name}:`, err);
    }
  }

  console.log('\n✨ Done! Refresh the page to see the habits.');
})();
