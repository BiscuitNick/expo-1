import { useEffect, useState } from 'react';
import { listenToMessages, markMessageAsRead, MessageData, sendMessage } from '../services/firestoreService';
import { useAuth } from './useAuth';

export interface UseMessagesReturn {
  messages: MessageData[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
}

export const useMessages = (conversationId: string | undefined): UseMessagesReturn => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time message updates
    const unsubscribe = listenToMessages(conversationId, (updatedMessages) => {
      console.log('📨 Received', updatedMessages.length, 'messages from Firestore');

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

        // Combine real messages with remaining optimistic messages
        return [...updatedMessages, ...optimisticMessages];
      });

      setLoading(false);

      // Auto-mark messages as read (from other users)
      updatedMessages.forEach(msg => {
        if (msg.senderId !== user?.uid && !msg.readBy?.includes(user?.uid || '')) {
          markMessageAsRead(msg.id, user?.uid || '').catch(console.error);
        }
      });
    });

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

  return {
    messages,
    loading,
    error,
    sendMessage: handleSendMessage,
    markAsRead: handleMarkAsRead,
  };
};
