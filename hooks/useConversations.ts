import { useEffect, useState } from 'react';
import { ConversationData, getUserConversations } from '../services/firestoreService';
import { useAuth } from './useAuth';

export interface UseConversationsReturn {
  conversations: ConversationData[];
  loading: boolean;
  error: string | null;
}

export const useConversations = (): UseConversationsReturn => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time updates
    const unsubscribe = getUserConversations(
      user.uid,
      (updatedConversations) => {
        setConversations(updatedConversations);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error loading conversations:', err);
        setLoading(false);

        // Check if it's an index error
        if (err.message?.includes('index')) {
          setError('Firestore indexes are building. This may take a few minutes. Please wait...');
        } else {
          setError(err.message || 'Failed to load conversations');
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  return {
    conversations,
    loading,
    error,
  };
};
