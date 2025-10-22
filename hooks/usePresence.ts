import { useEffect, useState } from 'react';
import { listenToUserPresence, listenToUsersPresence, UserPresence } from '../services/presenceService';

export interface UsePresenceReturn {
  isOnline: boolean;
  lastSeen: Date | null;
  loading: boolean;
}

// Hook to listen to a single user's presence
export const useUserPresence = (userId: string | undefined): UsePresenceReturn => {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const listener = listenToUserPresence(userId, (newPresence) => {
      console.log('👤 Presence update for user:', userId, 'isOnline:', newPresence?.isOnline, 'status:', newPresence?.status);
      setPresence(newPresence);
      setLoading(false);
    });

    return () => {
      listener.unsubscribe();
    };
  }, [userId]);

  return {
    isOnline: presence?.isOnline || false,
    lastSeen: presence?.lastSeen ? new Date(presence.lastSeen.seconds * 1000) : null,
    loading,
  };
};

// Hook to listen to multiple users' presences
export const useMultiplePresences = (userIds: string[]): { [userId: string]: UsePresenceReturn } => {
  const [presences, setPresences] = useState<{ [userId: string]: UserPresence | null }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const listener = listenToUsersPresence(userIds, (newPresences) => {
      setPresences(newPresences);
      setLoading(false);
    });

    return () => {
      listener.unsubscribe();
    };
  }, [JSON.stringify(userIds)]); // Use JSON.stringify to properly compare arrays

  const result: { [userId: string]: UsePresenceReturn } = {};

  userIds.forEach((userId) => {
    const presence = presences[userId];
    result[userId] = {
      isOnline: presence?.isOnline || false,
      lastSeen: presence?.lastSeen ? new Date(presence.lastSeen.seconds * 1000) : null,
      loading,
    };
  });

  return result;
};
