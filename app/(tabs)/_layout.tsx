import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';
import { createUserProfile, getUserProfile } from '@/services/userService';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  // Ensure user profile exists in Firestore (for users who signed up before this feature)
  useEffect(() => {
    const ensureUserProfile = async () => {
      if (!user?.uid) return;

      try {
        const existingProfile = await getUserProfile(user.uid);
        if (!existingProfile) {
          console.log('Creating missing user profile for:', user.uid);
          await createUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
          });
          console.log('User profile created successfully');
        }
      } catch (error) {
        console.error('Error ensuring user profile:', error);
        // Don't block the app if this fails
      }
    };

    ensureUserProfile();
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          headerTitle: 'Messages',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="firebase-test"
        options={{
          title: 'Status',
          headerTitle: 'Firebase Status',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="checkmark.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide explore from tabs
        }}
      />
      <Tabs.Screen
        name="debug-users"
        options={{
          title: 'Debug',
          headerTitle: 'Debug Users',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="wrench.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
