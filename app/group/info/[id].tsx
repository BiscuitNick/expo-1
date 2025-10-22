import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import StatusIndicator from '../../../components/StatusIndicator';
import { useAuth } from '../../../hooks/useAuth';
import { useMultiplePresences } from '../../../hooks/usePresence';
import { ConversationData, getConversation, removeMemberFromGroup } from '../../../services/firestoreService';

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchConversation = async () => {
      setLoading(true);
      try {
        const conv = await getConversation(id);
        setConversation(conv);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        Alert.alert('Error', 'Failed to load group information');
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [id]);

  // Subscribe to all members' presence
  const memberIds = useMemo(() => conversation?.participants || [], [conversation]);
  const presences = useMultiplePresences(memberIds);

  // Sort members: online first, then by name
  const sortedMembers = useMemo(() => {
    if (!conversation) return [];
    return [...conversation.participants].sort((a, b) => {
      const aOnline = presences[a]?.isOnline || false;
      const bOnline = presences[b]?.isOnline || false;

      // Online users first
      if (aOnline !== bOnline) return aOnline ? -1 : 1;

      // Then sort by name
      const aName = conversation.participantDetails[a]?.displayName || '';
      const bName = conversation.participantDetails[b]?.displayName || '';
      return aName.localeCompare(bName);
    });
  }, [conversation, presences]);

  const handleLeaveGroup = () => {
    if (!user?.uid || !id) return;

    const isLastMember = conversation?.participants.length === 1;

    Alert.alert(
      'Leave Group',
      isLastMember
        ? 'You are the last member. Leaving will make this group empty. Are you sure?'
        : 'Are you sure you want to leave this group?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              await removeMemberFromGroup(id, user.uid);

              Alert.alert(
                'Left Group',
                'You have successfully left the group',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate back to chat list
                      router.replace('/(tabs)');
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group. Please try again.');
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  const handleAddMembers = () => {
    router.push(`/group/add-members/${id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Group Header */}
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {conversation.groupName?.charAt(0).toUpperCase() || 'G'}
            </Text>
          </View>
          <Text style={styles.groupName}>{conversation.groupName || 'Group Chat'}</Text>
          <Text style={styles.memberCount}>
            {conversation.participants.length} {conversation.participants.length === 1 ? 'member' : 'members'}
          </Text>
        </View>

        {/* Group Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {conversation.createdAt.toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Members List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <TouchableOpacity onPress={handleAddMembers}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {sortedMembers.map((participantId) => {
            const participant = conversation.participantDetails[participantId];
            const isCurrentUser = participantId === user?.uid;
            const presence = presences[participantId];

            return (
              <View key={participantId} style={styles.memberRow}>
                <View style={styles.memberAvatarContainer}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {participant?.displayName?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  {presence?.isOnline && (
                    <View style={styles.memberOnlineDot} />
                  )}
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {participant?.displayName || 'Unknown User'}
                    {isCurrentUser && ' (You)'}
                  </Text>
                  {isCurrentUser ? (
                    <Text style={styles.memberEmail}>{participant?.email || ''}</Text>
                  ) : (
                    <StatusIndicator
                      isOnline={presence?.isOnline || false}
                      lastSeen={presence?.lastSeen || undefined}
                      showText={true}
                      showDot={false}
                      size="small"
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.leaveButton, leaving && styles.leaveButtonDisabled]}
            onPress={handleLeaveGroup}
            disabled={leaving}
          >
            {leaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.leaveButtonText}>Leave Group</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  addButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  memberAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  memberOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  leaveButtonDisabled: {
    backgroundColor: '#FFA8A3',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
  },
});
