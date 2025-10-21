import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import MessageBubble, { Message } from '../../components/MessageBubble';
import MessageInput from '../../components/MessageInput';
import { useAuth } from '../../hooks/useAuth';

// Mock messages for testing
const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Hey! How are you?',
    senderId: 'other-user',
    senderName: 'John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    status: 'read',
    isOwn: false,
  },
  {
    id: '2',
    text: "I'm doing great! Thanks for asking. How about you?",
    senderId: 'current-user',
    timestamp: new Date(Date.now() - 1000 * 60 * 55), // 55 min ago
    status: 'read',
    isOwn: true,
  },
  {
    id: '3',
    text: "Pretty good! Working on a new project.",
    senderId: 'other-user',
    senderName: 'John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 50), // 50 min ago
    status: 'read',
    isOwn: false,
  },
  {
    id: '4',
    text: "That's awesome! What kind of project?",
    senderId: 'current-user',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    status: 'read',
    isOwn: true,
  },
  {
    id: '5',
    text: "It's a messaging app built with React Native and Firebase. Real-time chat with all the features!",
    senderId: 'other-user',
    senderName: 'John Doe',
    timestamp: new Date(Date.now() - 1000 * 60 * 40), // 40 min ago
    status: 'read',
    isOwn: false,
  },
  {
    id: '6',
    text: "Sounds interesting! Would love to see it when you're done.",
    senderId: 'current-user',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
    status: 'delivered',
    isOwn: true,
  },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isTyping, setIsTyping] = useState(false);

  // Scroll to bottom on mount and when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      senderId: user?.uid || 'current-user',
      timestamp: new Date(),
      status: 'sending',
      isOwn: true,
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate message status updates
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' as const } : msg
        )
      );
    }, 500);

    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'delivered' as const } : msg
        )
      );
    }, 1000);
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

  return (
    <View style={styles.container}>
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
});
