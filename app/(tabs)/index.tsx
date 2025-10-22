import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ConversationItem, { Conversation } from '../../components/ConversationItem';
import { useAuth } from '../../hooks/useAuth';
import { useConversations } from '../../hooks/useConversations';
import { createConversation, sendMessage } from '../../services/firestoreService';

export default function ChatListScreen() {
  const { user } = useAuth();
  const { conversations: firestoreConversations, loading, error: conversationsError } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [creatingConvo, setCreatingConvo] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Firestore already handles real-time updates
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  // Convert Firestore conversations to UI format
  const conversations: Conversation[] = useMemo(() => {
    if (!user) return []; // Return empty array if no user
    return firestoreConversations.map(conv => {
      // Get the other participant's info (for 1-on-1 chats)
      const otherParticipantId = conv.participants.find(id => id !== user?.uid);
      const otherParticipant = otherParticipantId
        ? conv.participantDetails[otherParticipantId]
        : null;

      return {
        id: conv.id,
        name: conv.isGroup
          ? (conv.groupName || 'Group Chat')
          : (otherParticipant?.displayName || 'Unknown User'),
        avatar: conv.isGroup
          ? conv.groupAvatar
          : otherParticipant?.photoURL,
        lastMessage: conv.lastMessage || 'No messages yet',
        timestamp: conv.lastMessageTimestamp,
        unreadCount: 0, // TODO: Implement unread count
        isOnline: false, // TODO: Implement online status
        isGroup: conv.isGroup,
      };
    });
  }, [firestoreConversations, user?.uid]);

  const handleConversationPress = (conversation: Conversation) => {
    router.push(`/chat/${conversation.id}`);
  };

  const handleNewChat = () => {
    // TODO: Navigate to new chat screen
    console.log('New chat');
  };

  const createTestConversation = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be signed in to create a conversation');
      return;
    }

    setCreatingConvo(true);
    try {
      // Create a mock other user (only include photoURL if it exists)
      const mockOtherUser: any = {
        displayName: 'Test User',
        email: 'test@example.com',
      };

      const currentUserData: any = {
        displayName: user.displayName || 'You',
        email: user.email || '',
      };

      // Only add photoURL if it exists (Firestore doesn't allow undefined)
      if (user.photoURL) {
        currentUserData.photoURL = user.photoURL;
      }

      // Create conversation
      const conversationId = await createConversation(
        user.uid,
        currentUserData,
        'test-user-123',
        mockOtherUser
      );

      // Send a welcome message
      await sendMessage(
        conversationId,
        'test-user-123',
        'Test User',
        'Hey! This is a test conversation. Try sending a message!'
      );

      Alert.alert(
        'Success!',
        'Test conversation created! You can now send messages.',
        [{ text: 'OK', onPress: () => router.push(`/chat/${conversationId}`) }]
      );
    } catch (error) {
      console.error('Error creating test conversation:', error);
      Alert.alert('Error', 'Failed to create test conversation. Check console for details.');
    } finally {
      setCreatingConvo(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      onPress={() => handleConversationPress(item)}
    />
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyText}>Loading conversations...</Text>
        </View>
      );
    }

    if (conversationsError) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorTitle}>⏳ Indexes Building</Text>
          <Text style={styles.errorText}>{conversationsError}</Text>
          <Text style={styles.debugText}>
            Check Firebase Console → Firestore → Indexes tab for progress
          </Text>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleRefresh}
          >
            <Text style={styles.newChatButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Conversations Yet</Text>
        <Text style={styles.emptyText}>
          Start a new conversation to get chatting!
        </Text>

        {/* Debug: Create Test Conversation */}
        <TouchableOpacity
          style={[styles.newChatButton, styles.debugButton]}
          onPress={createTestConversation}
          disabled={creatingConvo}
        >
          {creatingConvo ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.newChatButtonText}>🧪 Create Test Conversation</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.debugText}>
          This will create a test chat so you can try out messaging!
        </Text>
      </View>
    );
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <View style={styles.authPromptContainer}>
        <Text style={styles.authPromptTitle}>Sign in to view chats</Text>
        <Text style={styles.authPromptSubtitle}>
          You need to be logged in to access your messages
        </Text>
        <TouchableOpacity
          style={styles.authPromptButton}
          onPress={() => router.push('/auth/GoogleAuthScreen')}
        >
          <Text style={styles.authPromptButtonText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredConversations.length === 0 ? styles.emptyList : undefined
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* New Chat FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleNewChat}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#FF9500',
    marginTop: 16,
  },
  debugText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  authPromptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  authPromptSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  authPromptButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authPromptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
