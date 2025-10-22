import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DateSeparator from '../../components/DateSeparator';
import MessageBubble, { Message } from '../../components/MessageBubble';
import MessageInput from '../../components/MessageInput';
import StatusIndicator from '../../components/StatusIndicator';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import { useUserPresence } from '../../hooks/usePresence';
import {
  getConversation,
  ConversationData,
  listenToConversation,
  setUserTyping,
  removeUserTyping
} from '../../services/firestoreService';
import { shouldShowDateSeparator } from '../../utils/dateUtils';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const {
    messages: firestoreMessages,
    loading,
    error,
    sendMessage: sendFirestoreMessage,
    loadMore,
    hasMore,
    loadingMore,
  } = useMessages(id);

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen to conversation changes (including typing indicators)
  useEffect(() => {
    if (!id) return;

    setLoadingConversation(true);

    // Set up real-time listener for conversation
    const unsubscribe = listenToConversation(id, (conv) => {
      setConversation(conv);
      setLoadingConversation(false);
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  // Clean up typing indicator when user leaves
  useEffect(() => {
    return () => {
      if (user?.uid && id) {
        removeUserTyping(id, user.uid).catch((error) => {
          console.error('Error removing typing indicator on unmount:', error);
        });
      }
    };
  }, [user?.uid, id]);

  // Old fetch logic (keeping as fallback)
  useEffect(() => {
    if (!id || conversation) return;

    const fetchConversation = async () => {
      try {
        const conv = await getConversation(id);
        setConversation(conv);
      } catch (error) {
        console.error('Error fetching conversation:', error);
      } finally {
        setLoadingConversation(false);
      }
    };

    fetchConversation();
  }, [id]);

  // Get other participant ID for 1-on-1 chats
  const otherParticipantId = useMemo(() => {
    if (!conversation || conversation.isGroup) return undefined;
    return conversation.participants.find(pid => pid !== user?.uid);
  }, [conversation, user?.uid]);

  // Subscribe to other user's presence (for 1-on-1 chats only)
  const { isOnline, lastSeen } = useUserPresence(otherParticipantId);

  // Convert Firestore messages to UI format and add date separators
  type ListItem =
    | { type: 'message'; data: Message }
    | { type: 'dateSeparator'; data: { id: string; date: Date } };

  const listItems: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];

    firestoreMessages.forEach((msg, index) => {
      const previousMsg = index > 0 ? firestoreMessages[index - 1] : null;

      // Add date separator if needed
      if (shouldShowDateSeparator(msg.timestamp, previousMsg?.timestamp || null)) {
        items.push({
          type: 'dateSeparator',
          data: {
            id: `separator-${msg.timestamp.getTime()}`,
            date: msg.timestamp,
          },
        });
      }

      // Add message
      items.push({
        type: 'message',
        data: {
          id: msg.id,
          text: msg.text,
          senderId: msg.senderId,
          senderName: msg.senderName,
          timestamp: msg.timestamp,
          status: msg.status,
          isOwn: msg.senderId === user?.uid,
          readBy: msg.readBy,
        },
      });
    });

    return items;
  }, [firestoreMessages, user?.uid]);

  // Scroll to bottom on mount and when new messages arrive
  useEffect(() => {
    if (listItems.length > 0) {
      // Use a slight delay to ensure the FlatList has rendered
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [listItems]);

  const handleSend = async (text: string) => {
    try {
      // Remove typing indicator when sending message
      if (user?.uid && id) {
        await removeUserTyping(id, user.uid);
      }

      await sendFirestoreMessage(text);
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error to user
    }
  };

  const handleTypingStart = async () => {
    if (!user?.uid || !id) return;

    try {
      // Set typing indicator
      await setUserTyping(id, user.uid, user.displayName || 'Unknown');

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-remove typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        await removeUserTyping(id, user.uid);
      }, 3000);
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  };

  const handleTypingStop = async () => {
    if (!user?.uid || !id) return;

    try {
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Remove typing indicator
      await removeUserTyping(id, user.uid);
    } catch (error) {
      console.error('Error removing typing indicator:', error);
    }
  };

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    if (item.type === 'dateSeparator') {
      return <DateSeparator date={item.data.date} />;
    }

    // Find previous message (skip date separators)
    let previousMessage: Message | null = null;
    for (let i = index - 1; i >= 0; i--) {
      if (listItems[i].type === 'message') {
        previousMessage = listItems[i].data as Message;
        break;
      }
    }

    const isSameSender = previousMessage?.senderId === item.data.senderId;

    return (
      <MessageBubble
        message={item.data}
        showSenderName={conversation?.isGroup || false}
        previousMessageSameSender={isSameSender}
        totalParticipants={conversation?.participants.length || 0}
      />
    );
  };

  const renderTypingIndicator = () => {
    if (!conversation?.typingUsers || !user?.uid) return null;

    // Get typing users excluding the current user
    const typingUsersList = Object.entries(conversation.typingUsers)
      .filter(([userId]) => userId !== user.uid)
      .map(([_, userData]) => userData.displayName);

    if (typingUsersList.length === 0) return null;

    // Format the typing indicator text
    let typingText = '';
    if (typingUsersList.length === 1) {
      typingText = `${typingUsersList[0]} is typing...`;
    } else if (typingUsersList.length === 2) {
      typingText = `${typingUsersList[0]} and ${typingUsersList[1]} are typing...`;
    } else {
      typingText = `${typingUsersList[0]} and ${typingUsersList.length - 1} others are typing...`;
    }

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>{typingText}</Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (!loadingMore) {
      return hasMore ? (
        <View style={styles.loadMoreContainer}>
          <Text style={styles.loadMoreText}>Pull to load older messages</Text>
        </View>
      ) : null;
    }

    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadMoreText}>Loading older messages...</Text>
      </View>
    );
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadMore();
    }
  };

  if (loading || loadingConversation) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load messages</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header: Group Info or Online Status */}
      {conversation?.isGroup ? (
        <TouchableOpacity
          style={styles.groupInfoButton}
          onPress={() => router.push(`/group/info/${id}`)}
        >
          <Text style={styles.groupInfoButtonText}>ℹ️ Group Info</Text>
        </TouchableOpacity>
      ) : (
        otherParticipantId && (
          <View style={styles.statusBar}>
            <StatusIndicator
              isOnline={isOnline}
              lastSeen={lastSeen || undefined}
              showText={true}
              showDot={true}
              size="small"
            />
          </View>
        )
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={listItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.data.id}
        contentContainerStyle={styles.messagesList}
        ListHeaderComponent={renderHeader}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        onContentSizeChange={() => {
          // Scroll to bottom when content size changes (new messages)
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }}
        onLayout={() => {
          // Scroll to bottom on initial layout
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }}
      />

      {/* Typing Indicator */}
      {renderTypingIndicator()}

      {/* Message Input */}
      <MessageInput
        onSend={handleSend}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 12,
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  groupInfoButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  groupInfoButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  statusBar: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
});
