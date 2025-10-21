import {
    doc,
    getFirestore,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    Unsubscribe,
    updateDoc,
} from 'firebase/firestore';
import { AppState, AppStateStatus } from 'react-native';
import { app } from '../firebaseConfig';

// Initialize Firestore
const db = getFirestore(app);

// Types
export interface UserPresence {
  uid: string;
  isOnline: boolean;
  lastSeen: Timestamp;
  status?: 'online' | 'away' | 'offline';
}

export interface PresenceListener {
  unsubscribe: () => void;
}

// Set user online status
export const setUserOnline = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isOnline: true,
      lastSeen: serverTimestamp(),
      status: 'online',
    });
  } catch (error) {
    console.error('Error setting user online:', error);
    throw error;
  }
};

// Set user offline status
export const setUserOffline = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isOnline: false,
      lastSeen: serverTimestamp(),
      status: 'offline',
    });
  } catch (error) {
    console.error('Error setting user offline:', error);
    throw error;
  }
};

// Set user away status
export const setUserAway = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isOnline: true,
      lastSeen: serverTimestamp(),
      status: 'away',
    });
  } catch (error) {
    console.error('Error setting user away:', error);
    throw error;
  }
};

// Update last seen timestamp
export const updateLastSeen = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating last seen:', error);
    throw error;
  }
};

// Get user presence
export const getUserPresence = async (uid: string): Promise<UserPresence | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await userRef.get();
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        uid,
        isOnline: data.isOnline || false,
        lastSeen: data.lastSeen || serverTimestamp(),
        status: data.status || 'offline',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user presence:', error);
    throw error;
  }
};

// Listen to user presence changes
export const listenToUserPresence = (
  uid: string,
  callback: (presence: UserPresence | null) => void
): PresenceListener => {
  const userRef = doc(db, 'users', uid);
  
  const unsubscribe = onSnapshot(
    userRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const presence: UserPresence = {
          uid,
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen || serverTimestamp(),
          status: data.status || 'offline',
        };
        callback(presence);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error listening to user presence:', error);
      callback(null);
    }
  );

  return { unsubscribe };
};

// Listen to multiple users' presence
export const listenToUsersPresence = (
  uids: string[],
  callback: (presences: { [uid: string]: UserPresence | null }) => void
): PresenceListener => {
  const unsubscribes: Unsubscribe[] = [];
  const presences: { [uid: string]: UserPresence | null } = {};

  // Initialize presences
  uids.forEach(uid => {
    presences[uid] = null;
  });

  // Set up listeners for each user
  uids.forEach(uid => {
    const listener = listenToUserPresence(uid, (presence) => {
      presences[uid] = presence;
      callback({ ...presences });
    });
    unsubscribes.push(listener.unsubscribe);
  });

  return {
    unsubscribe: () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    }
  };
};

// Handle app state changes for presence
export class PresenceManager {
  private uid: string | null = null;
  private isInitialized = false;
  private appStateSubscription: any = null;
  private lastActiveTime: number = Date.now();
  private awayTimeout: NodeJS.Timeout | null = null;
  private readonly AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  constructor(uid: string) {
    this.uid = uid;
  }

  // Initialize presence management
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set user online initially
      await setUserOnline(this.uid!);
      
      // Set up app state listener
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
      
      // Set up periodic last seen updates
      this.startPeriodicUpdates();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing presence manager:', error);
      throw error;
    }
  }

  // Handle app state changes
  private handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    if (!this.uid) return;

    try {
      switch (nextAppState) {
        case 'active':
          await this.handleAppActive();
          break;
        case 'background':
        case 'inactive':
          await this.handleAppInactive();
          break;
      }
    } catch (error) {
      console.error('Error handling app state change:', error);
    }
  };

  // Handle app becoming active
  private async handleAppActive(): Promise<void> {
    if (!this.uid) return;

    try {
      // Clear away timeout
      if (this.awayTimeout) {
        clearTimeout(this.awayTimeout);
        this.awayTimeout = null;
      }

      // Set user online
      await setUserOnline(this.uid);
      this.lastActiveTime = Date.now();
    } catch (error) {
      console.error('Error handling app active:', error);
    }
  }

  // Handle app becoming inactive
  private async handleAppInactive(): Promise<void> {
    if (!this.uid) return;

    try {
      // Set user away initially
      await setUserAway(this.uid);
      
      // Set timeout to go offline
      this.awayTimeout = setTimeout(async () => {
        try {
          await setUserOffline(this.uid!);
        } catch (error) {
          console.error('Error setting user offline after timeout:', error);
        }
      }, this.AWAY_TIMEOUT);
    } catch (error) {
      console.error('Error handling app inactive:', error);
    }
  }

  // Start periodic updates for last seen
  private startPeriodicUpdates(): void {
    setInterval(async () => {
      if (!this.uid || !this.isInitialized) return;

      try {
        // Only update if user is active and app is in foreground
        if (AppState.currentState === 'active') {
          const now = Date.now();
          const timeSinceLastActive = now - this.lastActiveTime;
          
          // If user has been active recently, update last seen
          if (timeSinceLastActive < this.AWAY_TIMEOUT) {
            await updateLastSeen(this.uid);
          }
        }
      } catch (error) {
        console.error('Error in periodic presence update:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  // Cleanup presence management
  public async cleanup(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Set user offline
      if (this.uid) {
        await setUserOffline(this.uid);
      }

      // Clear away timeout
      if (this.awayTimeout) {
        clearTimeout(this.awayTimeout);
        this.awayTimeout = null;
      }

      // Remove app state listener
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      this.isInitialized = false;
    } catch (error) {
      console.error('Error cleaning up presence manager:', error);
    }
  }

  // Manually set presence status
  public async setStatus(status: 'online' | 'away' | 'offline'): Promise<void> {
    if (!this.uid) return;

    try {
      switch (status) {
        case 'online':
          await setUserOnline(this.uid);
          break;
        case 'away':
          await setUserAway(this.uid);
          break;
        case 'offline':
          await setUserOffline(this.uid);
          break;
      }
    } catch (error) {
      console.error('Error setting status:', error);
      throw error;
    }
  }
}

// Create presence manager instance
export const createPresenceManager = (uid: string): PresenceManager => {
  return new PresenceManager(uid);
};
