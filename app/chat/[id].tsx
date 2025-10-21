import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import MessageBubble, { Message } from '../../components/MessageBubble';
import MessageInput from '../../components/MessageInput';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';

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
  } = useMessages(id);

  const [isTyping, setIsTyping] = useState(false);

  // Convert Firestore messages to UI format
  const messages: Message[] = useMemo(() => {
    return firestoreMessages.map(msg => ({
      id: msg.id,
      text: msg.text,
      senderId: msg.senderId,
      senderName: msg.senderName,
      timestamp: msg.timestamp,
      status: msg.status,
      isOwn: msg.senderId === user?.uid,
    }));
  }, [firestoreMessages, user?.uid]);

  // Scroll to bottom on mount and when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Use a slight delay to ensure the FlatList has rendered
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [messages]);

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

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const isSameSender = previousMessage?.senderId === item.senderId;

    return (
      <MessageBubble
        message={item}
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
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
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
