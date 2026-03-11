/**
 * ═══════════════════════════════════════════════════════════
 * MASTER BACKUP SCRIPT (Firestore to JSON)
 * ═══════════════════════════════════════════════════════════
 * 
 * هذا السكربت يقوم بعمل نسخة احتياطية كاملة من قاعدة بيانات Firestore
 * بما في ذلك الـ Subcollections لكل المستخدمين.
 * 
 * طريقة الاستخدام:
 * 1. قم بتحميل ملف الـ Service Account من Firebase Console.
 * 2. ضعه في المجلد الرئيسي للمشروع باسم `serviceAccountKey.json`.
 * 3. قم بتشغيل الأمر: `node scripts/backup-db.js`
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. تحديد مصدر بيانات الـ Service Account
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // للعمل على GitHub Actions
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // للعمل محلياً على جهازك
  const localKeyPath = path.join(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(localKeyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
  } else {
    console.error('❌ Error: serviceAccountKey.json not found!');
    console.log('💡 To fix this:');
    console.log('1. Go to Firebase Console -> Project Settings -> Service Accounts');
    console.log('2. Click "Generate New Private Key"');
    console.log('3. Save the file as "serviceAccountKey.json" in this folder.');
    process.exit(1);
  }
}

// 2. تهيئة Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * دالة ذكية لسحب البيانات والـ subcollections بشكل متكرر
 */
async function exportCollection(collectionPath) {
  const snapshot = await db.collection(collectionPath).get();
  const data = {};

  for (const doc of snapshot.docs) {
    const docData = doc.data();
    
    // سحب الـ subcollections لهذا المستند إن وجدت
    const subCollections = await doc.ref.listCollections();
    for (const subCol of subCollections) {
      console.log(`   └─ Subcollection found: ${subCol.id} in ${doc.id}`);
      docData[subCol.id] = await exportCollection(`${collectionPath}/${doc.id}/${subCol.id}`);
    }
    
    data[doc.id] = docData;
  }
  
  return data;
}

async function runBackup() {
  console.log('🚀 Starting Master Database Backup...');
  console.log('------------------------------------');
  
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      project: serviceAccount.project_id,
      collections: {}
    };

    // قائمة الكولكشنز الأساسية في مشروعك
    const topLevelCollections = ['users', 'system_settings', 'features', 'gym_logs', 'habits'];
    
    for (const colName of topLevelCollections) {
      console.log(`📦 Backing up: ${colName}...`);
      backupData.collections[colName] = await exportCollection(colName);
    }

    // 3. حفظ البيانات في مجلد backups
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `local_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(backupDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    
    console.log('------------------------------------');
    console.log(`✅ Backup completed successfully!`);
    console.log(`📂 Saved to: backups/${fileName}`);
    console.log(`📊 Summary: Saved ${Object.keys(backupData.collections).length} main collections.`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

runBackup();
