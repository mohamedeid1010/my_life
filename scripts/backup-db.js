const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with Service Account from Environment Variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Recursively fetches all data from a collection and its subcollections.
 */
async function exportCollection(collectionPath) {
  const snapshot = await db.collection(collectionPath).get();
  const data = {};

  for (const doc of snapshot.docs) {
    const docData = doc.data();
    
    // Check for subcollections (this is a simplified approach)
    // Note: In a production environment with deep nesting, you might need a more robust recursive strategy
    const subCollections = await doc.ref.listCollections();
    for (const subCol of subCollections) {
      docData[subCol.id] = await exportCollection(`${collectionPath}/${doc.id}/${subCol.id}`);
    }
    
    data[doc.id] = docData;
  }
  
  return data;
}

async function runBackup() {
  console.log('🚀 Starting Database Backup...');
  
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      collections: {}
    };

    // List of top-level collections to back up
    const collections = ['users', 'habits', 'gym_logs', 'preferences']; // Adjust based on your actual collections
    
    for (const colName of collections) {
      console.log(`- Backing up collection: ${colName}`);
      backupData.collections[colName] = await exportCollection(colName);
    }

    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`;
    const filePath = path.join(backupDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup completed successfully! Saved to: backups/${fileName}`);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

runBackup();
