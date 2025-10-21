import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
