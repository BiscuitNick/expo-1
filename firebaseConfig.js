// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { browserLocalPersistence, connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
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

// Connect to Auth Emulator only if explicitly enabled
// Changed: Removed __DEV__ check - now only uses emulator if explicitly set to 'true'
const USE_EMULATOR = process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

console.log('=== EMULATOR CONFIGURATION ===');
console.log('EXPO_PUBLIC_USE_EMULATOR:', process.env.EXPO_PUBLIC_USE_EMULATOR);
console.log('__DEV__:', __DEV__);
console.log('USE_EMULATOR:', USE_EMULATOR);
console.log('Platform:', Platform.OS);
console.log('==============================');

if (USE_EMULATOR) {
  const EMULATOR_HOST = Platform.select({
    // For iOS simulator, use localhost
    ios: 'localhost',
    // For Android emulator, use 10.0.2.2 (Android emulator's special alias to host machine)
    android: '10.0.2.2',
    // For web, use localhost
    web: 'localhost',
    default: 'localhost',
  });

  const AUTH_EMULATOR_PORT = 9099;

  try {
    const emulatorUrl = `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`;
    console.log(`🔧 Attempting to connect to Auth Emulator at: ${emulatorUrl}`);

    connectAuthEmulator(auth, emulatorUrl, {
      disableWarnings: false,
    });

    console.log(`✅ Firebase Auth Emulator connected at ${emulatorUrl}`);
    console.log('📱 Emulator UI available at http://localhost:4000');
    console.log('🔍 All auth requests will now go to the emulator');
  } catch (error) {
    console.error('❌ Failed to connect to Auth Emulator:', error);
    console.error('Error details:', error.message);

    // Check if it's the "already connected" error
    if (error.message && error.message.includes('already')) {
      console.log('⚠️  Emulator already connected (this is OK)');
    }
  }
}

export { app, auth };
