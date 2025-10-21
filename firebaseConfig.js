// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { Platform } from 'react-native';
import { firebaseConfig, logFirebaseConfigStatus, validateFirebaseConfig } from "./config/firebase";

// Validate Firebase configuration
validateFirebaseConfig();
logFirebaseConfigStatus();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
let auth;
if (Platform.OS === 'web') {
  // For web, use the default getAuth which includes browserLocalPersistence
  auth = getAuth(app);
} else {
  // For React Native (iOS/Android), use AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { app, auth };
