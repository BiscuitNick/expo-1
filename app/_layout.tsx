import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { createPresenceManager, PresenceManager } from '@/services/presenceService';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const presenceManagerRef = useRef<PresenceManager | null>(null);

  // Redirect to login if not authenticated (and not loading)
  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.replace('/auth/LoginScreen');
    }
  }, [user, loading]);

  // Initialize presence tracking when user logs in
  useEffect(() => {
    if (user?.uid) {
      // Create and initialize presence manager
      presenceManagerRef.current = createPresenceManager(user.uid);
      presenceManagerRef.current.initialize().catch((error) => {
        console.error('Failed to initialize presence manager:', error);
      });

      // Cleanup on unmount or user logout
      return () => {
        if (presenceManagerRef.current) {
          presenceManagerRef.current.cleanup().catch((error) => {
            console.error('Failed to cleanup presence manager:', error);
          });
          presenceManagerRef.current = null;
        }
      };
    }
  }, [user?.uid]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="auth/GoogleAuthScreen"
          options={{
            headerShown: false,
            title: 'Sign In'
          }}
        />
        <Stack.Screen
          name="auth/LoginScreen"
          options={{
            headerShown: false,
            title: 'Email Sign In'
          }}
        />
        <Stack.Screen
          name="auth/SignupScreen"
          options={{
            headerShown: false,
            title: 'Sign Up'
          }}
        />
        <Stack.Screen
          name="auth/ProfileSetupScreen"
          options={{
            headerShown: false,
            title: 'Complete Profile'
          }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: true,
            title: 'Chat'
          }}
        />
        <Stack.Screen
          name="group/create"
          options={{
            headerShown: true,
            title: 'Create Group'
          }}
        />
        <Stack.Screen
          name="group/info/[id]"
          options={{
            headerShown: true,
            title: 'Group Info'
          }}
        />
        <Stack.Screen
          name="group/add-members/[id]"
          options={{
            headerShown: true,
            title: 'Add Members'
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
