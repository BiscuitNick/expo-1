/**
 * Script to reset all users to offline status
 * Run this with: npx tsx scripts/resetUserPresence.ts
 */

import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetAllUsersToOffline() {
  console.log('🔄 Starting to reset all users to offline...');

  try {
    // Get all users
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    console.log(`📊 Found ${snapshot.size} users`);

    let updated = 0;
    const promises = snapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data();

      // Only update if user is currently online
      if (userData.isOnline) {
        console.log(`  Setting ${userData.displayName || userDoc.id} to offline`);
        await updateDoc(doc(db, 'users', userDoc.id), {
          isOnline: false,
          status: 'offline',
          lastSeen: serverTimestamp(),
        });
        updated++;
      }
    });

    await Promise.all(promises);

    console.log(`✅ Reset complete! Updated ${updated} users to offline`);
    console.log(`ℹ️  ${snapshot.size - updated} users were already offline`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting users:', error);
    process.exit(1);
  }
}

resetAllUsersToOffline();
