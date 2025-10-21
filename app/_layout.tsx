import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '../hooks/useAuth';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {!user ? (
          // Auth screens - shown when user is not authenticated
          <>
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
          </>
        ) : (
          // Main app screens - shown when user is authenticated
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="chat/[id]"
              options={{
                headerShown: true,
                title: 'Chat',
                headerBackTitle: 'Back'
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </>
        )}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
