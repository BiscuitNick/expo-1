/**
 * Test page for Google Authentication
 * This page helps debug and test the Google OAuth flow on iOS
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Import all three approaches for testing
import { authenticateWithGoogle as originalAuth } from '../services/googleAuthService';
import { authenticateWithGoogle as fixedAuth } from '../services/googleAuthServiceFixed';
import { signInWithGoogle as firebaseAuth } from '../services/firebaseGoogleAuth';
import { useAuth } from '../hooks/useAuth';

interface TestResult {
  approach: string;
  success: boolean;
  error?: string;
  user?: any;
  timestamp: string;
}

export default function TestGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentApproach, setCurrentApproach] = useState<string>('');
  const router = useRouter();
  const { signInWithGoogle: hookSignIn, user, signOut } = useAuth();

  const addResult = (result: Omit<TestResult, 'timestamp'>) => {
    setTestResults((prev) => [
      ...prev,
      {
        ...result,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const testOriginalApproach = async () => {
    setLoading(true);
    setCurrentApproach('Original AuthSession');
    try {
      const result = await originalAuth();
      addResult({
        approach: 'Original AuthSession',
        success: true,
        user: result.user,
      });
      Alert.alert('Success', `Signed in as ${result.user.email}`);
    } catch (error: any) {
      addResult({
        approach: 'Original AuthSession',
        success: false,
        error: error.message,
      });
      if (error.message !== 'USER_CANCELLED') {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
      setCurrentApproach('');
    }
  };

  const testFixedApproach = async () => {
    setLoading(true);
    setCurrentApproach('Fixed AuthSession');
    try {
      const result = await fixedAuth();
      addResult({
        approach: 'Fixed AuthSession',
        success: true,
        user: result.user,
      });
      Alert.alert('Success', `Signed in as ${result.user.email}`);
    } catch (error: any) {
      addResult({
        approach: 'Fixed AuthSession',
        success: false,
        error: error.message,
      });
      if (error.message !== 'USER_CANCELLED') {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
      setCurrentApproach('');
    }
  };

  const testFirebaseApproach = async () => {
    setLoading(true);
    setCurrentApproach('Firebase Provider');
    try {
      const result = await firebaseAuth();
      addResult({
        approach: 'Firebase Provider',
        success: true,
        user: {
          email: result.user.email,
          uid: result.user.uid,
          displayName: result.user.displayName,
        },
      });
      Alert.alert('Success', `Signed in as ${result.user.email}`);
    } catch (error: any) {
      addResult({
        approach: 'Firebase Provider',
        success: false,
        error: error.message,
      });
      if (error.message !== 'USER_CANCELLED') {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
      setCurrentApproach('');
    }
  };

  const testHookApproach = async () => {
    setLoading(true);
    setCurrentApproach('useAuth Hook');
    try {
      await hookSignIn();
      addResult({
        approach: 'useAuth Hook',
        success: true,
        user: user,
      });
      Alert.alert('Success', 'Signed in successfully');
    } catch (error: any) {
      addResult({
        approach: 'useAuth Hook',
        success: false,
        error: error.message,
      });
      if (error.message !== 'USER_CANCELLED') {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
      setCurrentApproach('');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Success', 'Signed out successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Google Auth Test</Text>
          <Text style={styles.subtitle}>Platform: {Platform.OS}</Text>
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.userText}>Signed in as: {user.email}</Text>
              <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.buttonsContainer}>
          <Text style={styles.sectionTitle}>Test Different Approaches</Text>

          <TouchableOpacity
            style={[styles.button, styles.originalButton]}
            onPress={testOriginalApproach}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Original Implementation</Text>
            <Text style={styles.buttonSubtext}>Current googleAuthService.ts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.fixedButton]}
            onPress={testFixedApproach}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Fixed AuthSession</Text>
            <Text style={styles.buttonSubtext}>googleAuthServiceFixed.ts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.firebaseButton]}
            onPress={testFirebaseApproach}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Firebase Provider</Text>
            <Text style={styles.buttonSubtext}>firebaseGoogleAuth.ts (Recommended)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.hookButton]}
            onPress={testHookApproach}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test useAuth Hook</Text>
            <Text style={styles.buttonSubtext}>Current hook implementation</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>Testing {currentApproach}...</Text>
          </View>
        )}

        {testResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>Test Results</Text>
              <TouchableOpacity onPress={clearResults}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            </View>

            {testResults.map((result, index) => (
              <View
                key={index}
                style={[
                  styles.resultItem,
                  result.success ? styles.successResult : styles.errorResult,
                ]}
              >
                <Text style={styles.resultApproach}>{result.approach}</Text>
                <Text style={styles.resultStatus}>
                  {result.success ? '✅ Success' : '❌ Failed'}
                </Text>
                {result.error && (
                  <Text style={styles.resultError}>Error: {result.error}</Text>
                )}
                {result.user && (
                  <Text style={styles.resultUser}>User: {result.user.email}</Text>
                )}
                <Text style={styles.resultTime}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  userInfo: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  userText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 10,
  },
  signOutButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontWeight: '600',
  },
  buttonsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  originalButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#9e9e9e',
  },
  fixedButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  firebaseButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  hookButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: '600',
  },
  resultItem: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  successResult: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  errorResult: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  resultApproach: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  resultError: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
  resultUser: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 4,
  },
  resultTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  backButton: {
    marginTop: 30,
    padding: 14,
    backgroundColor: '#666',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});