import admin from 'firebase-admin';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function exportHabitsData() {
  console.log('📥 Exporting habits data from Firestore...\n');

  try {
    // Get all users
    const usersSnap = await db.collection('users').get();
    const exportData = {};

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      console.log(`👤 Processing user: ${userId}`);

      // Get habits for this user
      const habitsSnap = await db.collection(`users/${userId}/habits`).get();
      const habits = {};

      habitsSnap.forEach((habitDoc) => {
        habits[habitDoc.id] = habitDoc.data();
      });

      exportData[userId] = {
        habitsCount: habitsSnap.size,
        habits,
      };

      console.log(`   ✅ Found ${habitsSnap.size} habits\n`);
    }

    // Save to file
    const exportsDir = join(process.cwd(), 'exports');
    if (!existsSync(exportsDir)) {
      mkdirSync(exportsDir, { recursive: true });
    }

    const fileName = `habits_export_${new Date().toISOString().split('T')[0]}.json`;
    const filePath = join(exportsDir, fileName);

    writeFileSync(filePath, JSON.stringify(exportData, null, 2));

    console.log(`\n✅ Export completed!`);
    console.log(`📁 Saved to: ${filePath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total users: ${usersSnap.size}`);
    console.log(`   Total habits: ${Object.values(exportData).reduce((sum, u) => sum + u.habitsCount, 0)}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportHabitsData();
