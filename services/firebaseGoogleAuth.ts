/**
 * Firebase Google Authentication Service
 * This approach uses Firebase's built-in Google authentication provider
 * which handles the OAuth flow internally and avoids redirect URI issues
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  OAuthCredential,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// Complete auth session on web
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

// Get platform-specific client ID
const getGoogleClientId = () => {
  switch (Platform.OS) {
    case 'ios':
      return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || '549721866433-9uds8p6p6mjuqdulfdi54sbc8q22b7g7.apps.googleusercontent.com';
    case 'android':
      return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID;
    default:
      return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '549721866433-72mkumaucc94eb4h3ecu70ihv65o21mn.apps.googleusercontent.com';
  }
};

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Configure the provider
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface GoogleAuthResult {
  user: User;
  credential: OAuthCredential | null;
  token?: string;
}

/**
 * Sign in with Google using Firebase's built-in provider
 * This method works best for web platforms
 */
export const signInWithGoogleFirebase = async (): Promise<GoogleAuthResult> => {
  try {
    console.log('Starting Firebase Google Sign-In...');
    console.log('Platform:', Platform.OS);

    if (Platform.OS === 'web') {
      // For web, use popup method
      const result = await signInWithPopup(auth, googleProvider);

      // Get the Google OAuth credential
      const credential = GoogleAuthProvider.credentialFromResult(result);

      console.log('Sign-in successful:', result.user.email);

      return {
        user: result.user,
        credential,
        token: credential?.accessToken
      };
    } else {
      // For mobile platforms, we need to use a different approach
      // since Firebase JS SDK doesn't support native OAuth on mobile
      throw new Error('Use native Google Sign-In for mobile platforms');
    }
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);

    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('USER_CANCELLED');
    }

    if (error.code === 'auth/popup-blocked') {
      console.log('Popup blocked, trying redirect...');
      // Fallback to redirect method
      return signInWithGoogleRedirect();
    }

    throw error;
  }
};

/**
 * Sign in with Google using redirect (fallback for blocked popups)
 */
export const signInWithGoogleRedirect = async (): Promise<GoogleAuthResult> => {
  try {
    if (Platform.OS === 'web') {
      // Initiate the redirect
      await signInWithRedirect(auth, googleProvider);

      // This will trigger a page redirect
      // The result will be handled when the page loads again
      return {
        user: auth.currentUser!,
        credential: null,
      };
    } else {
      throw new Error('Redirect method not supported on mobile');
    }
  } catch (error) {
    console.error('Redirect sign-in error:', error);
    throw error;
  }
};

/**
 * Handle redirect result after page reload
 * Call this on app initialization to complete the sign-in flow
 */
export const handleGoogleRedirectResult = async (): Promise<GoogleAuthResult | null> => {
  try {
    const result = await getRedirectResult(auth);

    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);

      console.log('Redirect sign-in completed:', result.user.email);

      return {
        user: result.user,
        credential,
        token: credential?.accessToken
      };
    }

    return null;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    throw error;
  }
};

/**
 * Hybrid approach for iOS using AuthSession with Firebase
 * This combines Expo AuthSession for the OAuth flow with Firebase for user management
 */
export const signInWithGoogleHybrid = async (): Promise<GoogleAuthResult> => {
  try {
    const clientId = getGoogleClientId();

    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    console.log('Starting hybrid Google Sign-In for iOS...');
    console.log('Client ID:', clientId);

    // Create redirect URI using Expo's auth proxy
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'expo-1',
      useProxy: true,
    });

    console.log('Redirect URI:', redirectUri);

    // Create the auth request
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      prompt: AuthSession.Prompt.SelectAccount,
    });

    // Discovery endpoints for Google
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    // Initiate the auth flow
    const result = await request.promptAsync(discovery);

    console.log('AuthSession result:', result.type);

    if (result.type === 'success') {
      const { id_token } = result.params;

      if (!id_token) {
        throw new Error('No ID token received');
      }

      // Create Firebase credential from the ID token
      const credential = GoogleAuthProvider.credential(id_token);

      // Sign in to Firebase with the credential
      const firebaseResult = await signInWithCredential(auth, credential);

      console.log('Firebase sign-in successful:', firebaseResult.user.email);

      return {
        user: firebaseResult.user,
        credential: credential as OAuthCredential,
      };
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('USER_CANCELLED');
    } else {
      throw new Error(`Authentication failed: ${result.type}`);
    }
  } catch (error: any) {
    console.error('Hybrid Google Sign-In error:', error);
    throw error;
  }
};

/**
 * Main function to handle Google Sign-In across all platforms
 */
export const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
  try {
    if (Platform.OS === 'web') {
      // Use Firebase's built-in popup method for web
      return await signInWithGoogleFirebase();
    } else if (Platform.OS === 'ios') {
      // Use hybrid approach for iOS
      return await signInWithGoogleHybrid();
    } else {
      // For Android, also use hybrid approach
      return await signInWithGoogleHybrid();
    }
  } catch (error: any) {
    console.error('Google Sign-In error:', error);

    // Rethrow with proper error message
    if (error.message === 'USER_CANCELLED') {
      throw error;
    }

    throw new Error(`Google sign-in failed: ${error.message}`);
  }
};

/**
 * Check if Google Sign-In is available
 */
export const isGoogleSignInAvailable = (): boolean => {
  return !!getGoogleClientId();
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await auth.signOut();
    console.log('Signed out from Google');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};