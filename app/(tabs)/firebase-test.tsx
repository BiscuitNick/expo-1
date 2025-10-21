import { getAuth, onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { app } from '../../firebaseConfig';

export default function FirebaseTestScreen() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [authStatus, setAuthStatus] = useState<string>('Not authenticated');
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Not tested');
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testFirebaseConnection = async () => {
    try {
      // Test 1: Check if Firebase app is initialized
      if (app) {
        setConnectionStatus('✅ Firebase app initialized successfully');
        addTestResult('Firebase app initialization: SUCCESS');
      } else {
        setConnectionStatus('❌ Firebase app not initialized');
        addTestResult('Firebase app initialization: FAILED');
        return;
      }

      // Test 2: Test Firestore connection
      await testFirestore();
      
      // Test 3: Test Authentication
      await testAuthentication();

    } catch (error) {
      setConnectionStatus('❌ Firebase connection failed');
      addTestResult(`Connection test failed: ${error}`);
    }
  };

  const testFirestore = async () => {
    try {
      const db = getFirestore(app);
      
      // Test write operation
      const testDocRef = doc(db, 'test', 'connection-test');
      await setDoc(testDocRef, {
        message: 'Hello from Expo!',
        timestamp: new Date().toISOString(),
        platform: 'iOS'
      });
      
      // Test read operation
      const docSnap = await getDoc(testDocRef);
      if (docSnap.exists()) {
        setFirestoreStatus('✅ Firestore read/write successful');
        addTestResult('Firestore read/write: SUCCESS');
      } else {
        setFirestoreStatus('❌ Firestore read failed');
        addTestResult('Firestore read: FAILED');
      }
    } catch (error) {
      setFirestoreStatus('❌ Firestore connection failed');
      addTestResult(`Firestore test failed: ${error}`);
    }
  };

  const testAuthentication = async () => {
    try {
      const auth = getAuth(app);
      
      // Listen for auth state changes
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setAuthStatus(`✅ Authenticated as: ${user.uid}`);
          addTestResult(`Authentication: SUCCESS (UID: ${user.uid})`);
        } else {
          setAuthStatus('❌ Not authenticated');
          addTestResult('Authentication: NOT AUTHENTICATED');
        }
      });

      // Try anonymous authentication
      await signInAnonymously(auth);
      
    } catch (error) {
      setAuthStatus('❌ Authentication failed');
      addTestResult(`Authentication test failed: ${error}`);
    }
  };

  const signOutUser = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      addTestResult('User signed out successfully');
    } catch (error) {
      addTestResult(`Sign out failed: ${error}`);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const runFullTest = () => {
    setConnectionStatus('Testing...');
    setAuthStatus('Testing...');
    setFirestoreStatus('Testing...');
    setTestResults([]);
    testFirebaseConnection();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Firebase Configuration Test</Text>
        <Text style={styles.subtitle}>Verify your Firebase setup is working correctly</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Firebase App:</Text>
          <Text style={styles.statusValue}>{connectionStatus}</Text>
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Authentication:</Text>
          <Text style={styles.statusValue}>{authStatus}</Text>
        </View>

        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Firestore:</Text>
          <Text style={styles.statusValue}>{firestoreStatus}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={runFullTest}>
          <Text style={styles.buttonText}>Run Full Test</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={signOutUser}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearTestResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No test results yet. Tap "Run Full Test" to begin.</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultItem}>
              {result}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statusContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FF9500',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  noResults: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  resultItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
