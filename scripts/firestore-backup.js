/**
 * Export All Firestore Data to JSON
 * استخدم هذا لعمل backup من البيانات الحالية
 * 
 * يحتاج إلى service account key من Firebase Console
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// تحتاج إلى تحديد مسار file الـ service account
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found at:', serviceAccountPath);
  console.error('📝 Steps:');
  console.error('1. Go to: https://console.firebase.google.com/project/my-life-3519c');
  console.error('2. Project Settings → Service Accounts');
  console.error('3. Click "Generate New Private Key"');
  console.error('4. Save as: ./serviceAccountKey.json');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function exportAllData() {
  console.log('📥 Starting complete Firestore backup...\n');

  try {
    const backup = {
      timestamp: new Date().toISOString(),
      collections: {}
    };

    // Export all top-level collections
    const collections = ['user', 'users', 'system_settingg', 'features'];

    for (const collectionName of collections) {
      console.log(`📂 Exporting collection: ${collectionName}`);
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.get();

      const collectionData = {};

      for (const doc of snapshot.docs) {
        const docData = doc.data();
        const docId = doc.id;

        // Try to export subcollections
        const subCollections = await doc.ref.listCollections();
        if (subCollections.length > 0) {
          docData._subcollections = {};
          
          for (const subCol of subCollections) {
            console.log(`   └─ ${collectionName}/${docId}/${subCol.id}`);
            const subSnapshot = await doc.ref.collection(subCol.id).get();
            const subData = {};
            
            subSnapshot.forEach(subDoc => {
              subData[subDoc.id] = subDoc.data();
            });

            docData._subcollections[subCol.id] = subData;
          }
        }

        collectionData[docId] = docData;
      }

      backup.collections[collectionName] = collectionData;
      console.log(`   ✅ Exported ${snapshot.size} documents\n`);
    }

    // Save to file
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `firestore-backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));

    console.log(`\n✅ Backup Complete!`);
    console.log(`📁 Saved to: ${filePath}`);
    console.log(`\n📊 Summary:`);
    Object.entries(backup.collections).forEach(([colName, colData]) => {
      console.log(`   ${colName}: ${Object.keys(colData).length} documents`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

exportAllData();
