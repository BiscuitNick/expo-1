import Constants from 'expo-constants';

// Firebase configuration using environment variables
export const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDGPq8rBgy2_tE5u2PtLK5X5UDrMt81ges",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "messageai-expo.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "messageai-expo",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "messageai-expo.firebasestorage.app",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "995887465511",
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:995887465511:web:889e33faa9ae2fbc1d7a02"
};

// Validation function to ensure all required config values are present
export const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    console.warn('Missing Firebase configuration values:', missingKeys);
    console.warn('Using default values. Please configure environment variables for production.');
  }
  
  return missingKeys.length === 0;
};

// Log configuration status (without sensitive data)
export const logFirebaseConfigStatus = () => {
  console.log('Firebase Configuration Status:');
  console.log('- API Key:', firebaseConfig.apiKey ? '✓ Set' : '✗ Missing');
  console.log('- Auth Domain:', firebaseConfig.authDomain ? '✓ Set' : '✗ Missing');
  console.log('- Project ID:', firebaseConfig.projectId ? '✓ Set' : '✗ Missing');
  console.log('- Storage Bucket:', firebaseConfig.storageBucket ? '✓ Set' : '✗ Missing');
  console.log('- Messaging Sender ID:', firebaseConfig.messagingSenderId ? '✓ Set' : '✗ Missing');
  console.log('- App ID:', firebaseConfig.appId ? '✓ Set' : '✗ Missing');
};
