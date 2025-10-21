import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { getGoogleSignInConfig } from '../../services/googleAuthService';

export default function GoogleAuthScreen() {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, error, clearError } = useAuth();
  const googleConfig = getGoogleSignInConfig();

  const handleGoogleSignIn = async () => {
    if (!googleConfig.isAvailable) {
      Alert.alert('Error', 'Google Sign-In is not available. Please check your configuration.');
      return;
    }

    try {
      setLoading(true);
      await signInWithGoogle();
      console.log('Google sign-in successful');

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      // Don't log or show alert if user cancelled the authentication
      if (error?.message !== 'USER_CANCELLED') {
        console.error('Google sign-in error:', error);
        // Error will be shown by useEffect watching the error state
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = () => {
    router.push('/auth/LoginScreen');
  };

  const handleSignUp = () => {
    router.push('/auth/SignupScreen');
  };

  // Show error from useAuth hook
  React.useEffect(() => {
    if (error) {
      Alert.alert('Authentication Error', error);
      clearError();
    }
  }, [error, clearError]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to MessageAI</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.authContainer}>
          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.googleButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading || !googleConfig.isAvailable}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>
                  {googleConfig.isAvailable ? 'Continue with Google' : 'Google Sign-In Unavailable'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Sign-In Button */}
          <TouchableOpacity
            style={styles.emailButton}
            onPress={handleEmailSignIn}
            disabled={loading}
          >
            <Text style={styles.emailButtonText}>Sign in with Email</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Configuration Status */}
        <View style={styles.configWarning}>
          <Text style={styles.configWarningText}>
            ℹ️ Using mock Google authentication for testing. In production, configure Google OAuth client IDs.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  authContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleButtonDisabled: {
    backgroundColor: '#ccc',
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  emailButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 16,
    color: '#666',
  },
  signupLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  configWarning: {
    backgroundColor: '#d1ecf1',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  configWarningText: {
    color: '#0c5460',
    fontSize: 14,
    lineHeight: 20,
  },
});
