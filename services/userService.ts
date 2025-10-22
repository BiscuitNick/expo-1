import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from '../firebaseConfig';

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateUserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
}

export interface UpdateUserProfileData {
  displayName?: string;
  photoURL?: string;
  bio?: string;
  isOnline?: boolean;
}

export interface UserSearchResult {
  uid: string;
  displayName: string;
  photoURL?: string;
  isOnline: boolean;
}

// Create user profile in Firestore
export const createUserProfile = async (userData: CreateUserProfileData): Promise<UserProfile> => {
  try {
    const userRef = doc(db, 'users', userData.uid);
    const now = serverTimestamp();

    const profileData: any = {
      email: userData.email,
      displayName: userData.displayName,
      bio: userData.bio || '',
      isOnline: true,
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
    };

    // Only add photoURL if it exists (Firestore doesn't allow undefined)
    if (userData.photoURL) {
      profileData.photoURL = userData.photoURL;
    }

    await setDoc(userRef, profileData);

    return {
      uid: userData.uid,
      ...profileData,
    } as UserProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Get user profile by UID
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        uid,
        ...userSnap.data(),
      } as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (uid: string, updates: UpdateUserProfileData): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Delete user profile
export const deleteUserProfile = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
};

// Upload profile picture to Firebase Storage
export const uploadProfilePicture = async (uid: string, file: File | Blob): Promise<string> => {
  try {
    const storageRef = ref(storage, `profile-pictures/${uid}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

// Delete profile picture from Firebase Storage
export const deleteProfilePicture = async (uid: string): Promise<void> => {
  try {
    const storageRef = ref(storage, `profile-pictures/${uid}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
};

// Search users by display name
export const searchUsers = async (searchTerm: string, limitCount: number = 10): Promise<UserSearchResult[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      orderBy('displayName'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const users: UserSearchResult[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        displayName: data.displayName,
        photoURL: data.photoURL,
        isOnline: data.isOnline,
      });
    });

    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Get multiple user profiles by UIDs
export const getUserProfiles = async (uids: string[]): Promise<UserProfile[]> => {
  try {
    const profiles: UserProfile[] = [];
    
    // Firestore doesn't support 'in' queries with more than 10 items
    // So we'll batch them
    const batches = [];
    for (let i = 0; i < uids.length; i += 10) {
      batches.push(uids.slice(i, i + 10));
    }

    for (const batch of batches) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('__name__', 'in', batch));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        profiles.push({
          uid: doc.id,
          ...doc.data(),
        } as UserProfile);
      });
    }

    return profiles;
  } catch (error) {
    console.error('Error getting user profiles:', error);
    throw error;
  }
};

// Set user online status
export const setUserOnline = async (uid: string): Promise<void> => {
  try {
    await updateUserProfile(uid, {
      isOnline: true,
    });
  } catch (error) {
    console.error('Error setting user online:', error);
    throw error;
  }
};

// Set user offline status
export const setUserOffline = async (uid: string): Promise<void> => {
  try {
    await updateUserProfile(uid, {
      isOnline: false,
    });
  } catch (error) {
    console.error('Error setting user offline:', error);
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

// Get online users
export const getOnlineUsers = async (limitCount: number = 50): Promise<UserSearchResult[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('isOnline', '==', true),
      orderBy('lastSeen', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const users: UserSearchResult[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        displayName: data.displayName,
        photoURL: data.photoURL,
        isOnline: data.isOnline,
      });
    });

    return users;
  } catch (error) {
    console.error('Error getting online users:', error);
    throw error;
  }
};
