import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import DateSeparator from '../../components/DateSeparator';
import MessageBubble, { Message } from '../../components/MessageBubble';
import MessageInput from '../../components/MessageInput';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
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

  const [isTyping, setIsTyping] = useState(false);

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
      await sendFirestoreMessage(text);
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error to user
    }
  };

  const handleTypingStart = () => {
    setIsTyping(true);
    // TODO: Send typing indicator to Firestore
  };

  const handleTypingStop = () => {
    setIsTyping(false);
    // TODO: Remove typing indicator from Firestore
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
        showSenderName={false} // Set to true for group chats
        previousMessageSameSender={isSameSender}
      />
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>John Doe is typing...</Text>
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

  if (loading) {
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
});
