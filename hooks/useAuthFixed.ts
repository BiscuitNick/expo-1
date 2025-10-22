import { useCallback, useEffect, useState } from 'react';
import {
    AuthUser,
    getAuthErrorMessage,
    getCurrentUser,
    getCurrentUserId,
    isEmailVerified,
    onAuthStateChange,
    resetPassword,
    signIn,
    SignInData,
    signOutUser,
    signUp,
    SignUpData,
    UpdateProfileData,
    updateUserProfile
} from '../services/authService';
import { signInWithGoogle as firebaseGoogleSignIn } from '../services/firebaseGoogleAuth';

export interface UseAuthReturn {
  // State
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;

  // Utilities
  getCurrentUserId: () => string | null;
  isEmailVerified: () => boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Sign up function
  const handleSignUp = useCallback(async (data: SignUpData) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await signUp(data);
      setUser(userData);
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in function
  const handleSignIn = useCallback(async (data: SignInData) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await signIn(data);
      setUser(userData);
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Google sign in function - Updated to use Firebase approach
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting Google Sign-In with Firebase approach...');

      // Use the Firebase Google Sign-In approach
      const result = await firebaseGoogleSignIn();

      // Firebase auth will automatically update the auth state
      // The user will be set via the onAuthStateChange listener
      console.log('Google Sign-In successful:', result.user.email);

      // Convert Firebase user to AuthUser format
      const authUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified,
        createdAt: result.user.metadata.creationTime,
        lastSignInTime: result.user.metadata.lastSignInTime,
      };

      setUser(authUser);
    } catch (err: any) {
      // Don't set error state if user cancelled
      if (err?.message === 'USER_CANCELLED') {
        console.log('User cancelled Google sign-in');
        // Don't throw the error for cancellation
        return;
      }

      const errorMessage = getAuthErrorMessage(err);
      console.error('Google Sign-In error:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out function
  const handleSignOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await signOutUser();
      setUser(null);
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile function
  const handleUpdateProfile = useCallback(async (data: UpdateProfileData) => {
    try {
      setLoading(true);
      setError(null);
      await updateUserProfile(data);

      // Update local user state
      if (user) {
        setUser({
          ...user,
          ...data,
        });
      }
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Reset password function
  const handleResetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await resetPassword(email);
    } catch (err: any) {
      const errorMessage = getAuthErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current user ID
  const getCurrentUserIdCallback = useCallback(() => {
    return getCurrentUserId();
  }, []);

  // Check if email is verified
  const isEmailVerifiedCallback = useCallback(() => {
    return isEmailVerified();
  }, []);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Initialize user state
  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  return {
    // State
    user,
    loading,
    error,
    isAuthenticated: !!user,

    // Actions
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    resetPassword: handleResetPassword,
    clearError,

    // Utilities
    getCurrentUserId: getCurrentUserIdCallback,
    isEmailVerified: isEmailVerifiedCallback,
  };
};