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

export interface UseAuthReturn {
  // State
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  signUp: (data: SignUpData) => Promise<AuthUser>;
  signIn: (data: SignInData) => Promise<void>;
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
      return userData; // Return user data for further processing
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
      console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setUser(user);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
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
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    resetPassword: handleResetPassword,
    clearError,

    // Utilities
    getCurrentUserId: getCurrentUserIdCallback,
    isEmailVerified: isEmailVerifiedCallback,
  };
};
