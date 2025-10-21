import { useEffect, useState } from 'react';
import { listenToMessages, loadOlderMessages, markMessageAsRead, MessageData, sendMessage } from '../services/firestoreService';
import { useAuth } from './useAuth';

export interface UseMessagesReturn {
  messages: MessageData[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
}

const INITIAL_MESSAGE_LIMIT = 50; // Load most recent 50 messages initially
const PAGINATION_LIMIT = 20; // Load 20 more messages at a time

export const useMessages = (conversationId: string | undefined): UseMessagesReturn => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [olderMessages, setOlderMessages] = useState<MessageData[]>([]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setOlderMessages([]);
      setLoading(false);
      setHasMore(true);
      return;
    }

    setLoading(true);
    setError(null);
    setOlderMessages([]); // Reset older messages when conversation changes

    // Subscribe to real-time message updates (limited to most recent messages)
    const unsubscribe = listenToMessages(conversationId, (updatedMessages) => {
      console.log('📨 Received', updatedMessages.length, 'messages from Firestore');

      // Check if we got fewer messages than the limit (means no more to load)
      if (updatedMessages.length < INITIAL_MESSAGE_LIMIT) {
        setHasMore(false);
      }

      // Merge with existing messages, removing optimistic ones that have real versions
      setMessages(prevMessages => {
        // Keep optimistic messages that don't have a real version yet
        const optimisticMessages = prevMessages.filter(msg =>
          msg.id.startsWith('temp-') &&
          !updatedMessages.some(realMsg =>
            realMsg.text === msg.text &&
            realMsg.senderId === msg.senderId &&
            Math.abs(realMsg.timestamp.getTime() - msg.timestamp.getTime()) < 5000 // Within 5 seconds
          )
        );

        // Combine older messages, real messages, and optimistic messages
        return [...updatedMessages, ...optimisticMessages];
      });

      setLoading(false);

      // Auto-mark messages as read (from other users)
      updatedMessages.forEach(msg => {
        if (msg.senderId !== user?.uid && !msg.readBy?.includes(user?.uid || '')) {
          markMessageAsRead(msg.id, user?.uid || '').catch(console.error);
        }
      });
    }, INITIAL_MESSAGE_LIMIT);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [conversationId, user?.uid]);

  const handleSendMessage = async (text: string): Promise<void> => {
    if (!conversationId || !user?.uid) {
      throw new Error('Cannot send message: missing conversation or user');
    }

    // Create optimistic message (shows immediately in UI)
    const optimisticMessage: MessageData = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: user.uid,
      senderName: user.displayName || user.email || 'You',
      text,
      timestamp: new Date(),
      status: 'sending',
      readBy: [user.uid],
    };

    // Add optimistic message to state immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send to Firestore (real-time listener will handle deduplication automatically)
      await sendMessage(
        conversationId,
        user.uid,
        user.displayName || user.email || 'Unknown',
        text
      );
      // No need to manually remove - the listener will deduplicate automatically
    } catch (err) {
      console.error('Error sending message:', err);

      // Update optimistic message to show error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...msg, status: 'sent' as const } // Mark as failed or keep as sending
            : msg
        )
      );

      setError('Failed to send message');
      throw err;
    }
  };

  const handleMarkAsRead = async (messageId: string): Promise<void> => {
    if (!user?.uid) return;

    try {
      await markMessageAsRead(messageId, user.uid);
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleLoadMore = async (): Promise<void> => {
    if (!conversationId || loadingMore || !hasMore) {
      return;
    }

    // Combine real messages and older paginated messages to find the oldest
    const allMessages = [...olderMessages, ...messages];
    if (allMessages.length === 0) {
      setHasMore(false);
      return;
    }

    // Get the oldest message timestamp
    const oldestMessage = allMessages[0]; // Messages are in chronological order (oldest first)

    setLoadingMore(true);
    setError(null);

    try {
      const older = await loadOlderMessages(
        conversationId,
        oldestMessage.timestamp,
        PAGINATION_LIMIT
      );

      console.log('📚 Loaded', older.length, 'older messages');

      if (older.length < PAGINATION_LIMIT) {
        // No more messages to load
        setHasMore(false);
      }

      if (older.length > 0) {
        setOlderMessages(prev => [...older, ...prev]);
      }

      setLoadingMore(false);
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError('Failed to load older messages');
      setLoadingMore(false);
    }
  };

  // Combine older paginated messages with real-time messages
  const allMessages = [...olderMessages, ...messages];

  return {
    messages: allMessages,
    loading,
    error,
    sendMessage: handleSendMessage,
    markAsRead: handleMarkAsRead,
    loadMore: handleLoadMore,
    hasMore,
    loadingMore,
  };
};
