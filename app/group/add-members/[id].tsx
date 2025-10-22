import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import {
  addMembersToGroup,
  ConversationData,
  getAllUsers,
  getConversation,
  UserProfile
} from '../../../services/firestoreService';

export default function AddMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  // Fetch conversation data
  useEffect(() => {
    if (!id) return;

    const fetchConversation = async () => {
      setLoadingConversation(true);
      try {
        const conv = await getConversation(id);
        setConversation(conv);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        Alert.alert('Error', 'Failed to load group information');
      } finally {
        setLoadingConversation(false);
      }
    };

    fetchConversation();
  }, [id]);

  // Fetch available users (excluding current members)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const users = await getAllUsers();

        console.log('📋 Total users from Firestore:', users.length);
        console.log('👥 Current group members:', conversation?.participants || []);

        // Filter out users that are already in the group
        const currentMemberIds = conversation?.participants || [];
        const filteredUsers = users.filter(u => !currentMemberIds.includes(u.uid));

        console.log('✅ Available users to add:', filteredUsers.length);
        console.log('Users:', filteredUsers.map(u => ({ uid: u.uid, name: u.displayName })));

        setAvailableUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };

    if (conversation) {
      fetchUsers();
    }
  }, [conversation]);

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleAddMembers = async () => {
    if (selectedUsers.size === 0) {
      Alert.alert('Error', 'Please select at least one member to add');
      return;
    }

    if (!id) {
      Alert.alert('Error', 'Invalid group');
      return;
    }

    setAdding(true);
    try {
      // Build member details for selected users
      const memberDetails: { [userId: string]: { displayName: string; photoURL?: string; email: string } } = {};

      selectedUsers.forEach(userId => {
        const userProfile = availableUsers.find(u => u.uid === userId);
        if (userProfile) {
          memberDetails[userId] = {
            displayName: userProfile.displayName,
            email: userProfile.email,
            ...(userProfile.photoURL ? { photoURL: userProfile.photoURL } : {}),
          };
        }
      });

      await addMembersToGroup(id, Array.from(selectedUsers), memberDetails);

      Alert.alert(
        'Success',
        `Added ${selectedUsers.size} ${selectedUsers.size === 1 ? 'member' : 'members'} to the group`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Error', 'Failed to add members. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  if (loadingConversation) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading group...</Text>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Members</Text>
            <Text style={styles.subtitle}>
              to {conversation.groupName || 'Group Chat'}
            </Text>
          </View>

          {/* Selected count */}
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedText}>
              {selectedUsers.size} {selectedUsers.size === 1 ? 'member' : 'members'} selected
            </Text>
          </View>

          {/* User List */}
          {loadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#007AFF" />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : availableUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users available to add</Text>
              <Text style={styles.emptySubtext}>
                All users are already members of this group
              </Text>
            </View>
          ) : (
            <View style={styles.userList}>
              {availableUsers.map(userProfile => (
                <TouchableOpacity
                  key={userProfile.uid}
                  style={styles.userItem}
                  onPress={() => toggleUserSelection(userProfile.uid)}
                  disabled={adding}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {userProfile.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{userProfile.displayName}</Text>
                    <Text style={styles.userEmail}>{userProfile.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      selectedUsers.has(userProfile.uid) && styles.checkboxSelected,
                    ]}
                  >
                    {selectedUsers.has(userProfile.uid) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.addButton,
            (adding || selectedUsers.size === 0) && styles.addButtonDisabled,
          ]}
          onPress={handleAddMembers}
          disabled={adding || selectedUsers.size === 0}
        >
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>
              Add {selectedUsers.size > 0 ? `(${selectedUsers.size})` : ''}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={adding}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  selectedContainer: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  userList: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    overflow: 'hidden',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 17,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
  },
});
