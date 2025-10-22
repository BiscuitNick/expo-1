import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { createGroupConversation, getAllUsers, UserProfile } from '../../services/firestoreService';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Fetch available users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const users = await getAllUsers();
        // Filter out current user
        const filteredUsers = users.filter(u => u.uid !== user?.uid);
        setAvailableUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [user?.uid]);

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedUsers.size === 0) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'You must be signed in to create a group');
      return;
    }

    setCreating(true);
    try {
      // Build participants array and details
      const participants = [user.uid, ...Array.from(selectedUsers)];
      const participantDetails: { [userId: string]: { displayName: string; photoURL?: string; email: string } } = {
        [user.uid]: {
          displayName: user.displayName || user.email || 'Unknown User',
          email: user.email || '',
          ...(user.photoURL ? { photoURL: user.photoURL } : {}),
        },
      };

      // Add selected users' details
      selectedUsers.forEach(userId => {
        const userProfile = availableUsers.find(u => u.uid === userId);
        if (userProfile) {
          participantDetails[userId] = {
            displayName: userProfile.displayName,
            email: userProfile.email,
            ...(userProfile.photoURL ? { photoURL: userProfile.photoURL } : {}),
          };
        }
      });

      const groupId = await createGroupConversation(
        participants,
        participantDetails,
        groupName.trim()
      );

      Alert.alert('Success', 'Group created successfully', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
            router.push(`/chat/${groupId}`);
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Group</Text>
          <Text style={styles.subtitle}>
            Create a new group chat with multiple participants
          </Text>
        </View>

        {/* Group Name Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Enter group name"
            placeholderTextColor="#999"
            maxLength={50}
            editable={!creating}
          />
          <Text style={styles.hint}>
            Choose a name that describes your group
          </Text>
        </View>

        {/* Participant Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Participants ({selectedUsers.size} selected)
          </Text>

          {loadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#007AFF" />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : availableUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No other users found</Text>
              <Text style={styles.emptySubtext}>
                Create test conversations to see other users
              </Text>
            </View>
          ) : (
            <View style={styles.userList}>
              {availableUsers.map(userProfile => (
                <TouchableOpacity
                  key={userProfile.uid}
                  style={styles.userItem}
                  onPress={() => toggleUserSelection(userProfile.uid)}
                  disabled={creating}
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

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            (creating || !groupName.trim() || selectedUsers.size === 0) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateGroup}
          disabled={creating || !groupName.trim() || selectedUsers.size === 0}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Group</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={creating}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
  },
  hint: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
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
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 17,
  },
});
