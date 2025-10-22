import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

// Collection names
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';
const USERS_COLLECTION = 'users';

// Types
export interface ConversationData {
  id: string;
  participants: string[]; // Array of user IDs
  participantDetails: {
    [userId: string]: {
      displayName: string;
      photoURL?: string;
      email: string;
    };
  };
  lastMessage: string;
  lastMessageTimestamp: Date;
  lastMessageSenderId: string;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  readBy: string[]; // Array of user IDs who have read the message
}

// Create a new one-on-one conversation
export const createConversation = async (
  currentUserId: string,
  currentUserData: { displayName: string; photoURL?: string; email: string },
  otherUserId: string,
  otherUserData: { displayName: string; photoURL?: string; email: string }
): Promise<string> => {
  try {
    // Check if conversation already exists
    const existingConversation = await findExistingConversation(currentUserId, otherUserId);
    if (existingConversation) {
      return existingConversation.id;
    }

    const conversationData = {
      participants: [currentUserId, otherUserId],
      participantDetails: {
        [currentUserId]: currentUserData,
        [otherUserId]: otherUserData,
      },
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSenderId: '',
      isGroup: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

// Find existing conversation between two users
const findExistingConversation = async (
  userId1: string,
  userId2: string
): Promise<ConversationData | null> => {
  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', userId1),
      where('isGroup', '==', false)
    );

    const snapshot = await getDocs(q);
    const conversations = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ConversationData))
      .filter(conv => conv.participants.includes(userId2));

    return conversations.length > 0 ? conversations[0] : null;
  } catch (error) {
    console.error('Error finding existing conversation:', error);
    return null;
  }
};

// Get user's conversations
export const getUserConversations = (
  userId: string,
  callback: (conversations: ConversationData[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lastMessageTimestamp: data.lastMessageTimestamp?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ConversationData;
      });
      callback(conversations);
    },
    (error) => {
      console.error('Firestore error in getUserConversations:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  );
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<string> => {
  try {
    const messageData = {
      conversationId,
      senderId,
      senderName,
      text,
      timestamp: serverTimestamp(),
      status: 'sent',
      readBy: [senderId],
    };

    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

    // Update conversation's last message
    await updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId), {
      lastMessage: text,
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSenderId: senderId,
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Listen to messages in a conversation (with optional limit for initial load)
export const listenToMessages = (
  conversationId: string,
  callback: (messages: MessageData[]) => void,
  messageLimit?: number
) => {
  let q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'desc')
  );

  // If limit is specified, get the most recent N messages
  if (messageLimit) {
    q = query(q, limit(messageLimit));
  }

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as MessageData;
    });
    // Reverse to get chronological order (oldest first)
    callback(messages.reverse());
  });
};

// Load older messages (pagination)
export const loadOlderMessages = async (
  conversationId: string,
  oldestMessageTimestamp: Date,
  limitCount: number = 20
): Promise<MessageData[]> => {
  try {
    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      startAfter(Timestamp.fromDate(oldestMessageTimestamp)),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as MessageData;
    });

    // Reverse to get chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    console.error('Error loading older messages:', error);
    throw error;
  }
};

// Mark message as read
export const markMessageAsRead = async (messageId: string, userId: string): Promise<void> => {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);

    if (messageDoc.exists()) {
      const data = messageDoc.data();
      const readBy = data.readBy || [];

      if (!readBy.includes(userId)) {
        await updateDoc(messageRef, {
          readBy: [...readBy, userId],
          status: 'read',
        });
      }
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Get conversation by ID
export const getConversation = async (conversationId: string): Promise<ConversationData | null> => {
  try {
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        lastMessageTimestamp: data.lastMessageTimestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ConversationData;
    }

    return null;
  } catch (error) {
    console.error('Error getting conversation:', error);
    return null;
  }
};

// Create a group conversation
export const createGroupConversation = async (
  participants: string[],
  participantDetails: { [userId: string]: { displayName: string; photoURL?: string; email: string } },
  groupName: string,
  groupAvatar?: string
): Promise<string> => {
  try {
    const conversationData: any = {
      participants,
      participantDetails,
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSenderId: '',
      isGroup: true,
      groupName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add groupAvatar if it's provided (Firestore doesn't allow undefined)
    if (groupAvatar) {
      conversationData.groupAvatar = groupAvatar;
    }

    const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating group conversation:', error);
    throw error;
  }
};

// Get all users (for user selection in group creation)
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    } as UserProfile));

    console.log('🔍 getAllUsers() returned:', users.length, 'users');
    console.log('User details:', users.map(u => ({ uid: u.uid, name: u.displayName, email: u.email })));

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Add members to a group conversation
export const addMembersToGroup = async (
  conversationId: string,
  newMemberIds: string[],
  newMemberDetails: { [userId: string]: { displayName: string; photoURL?: string; email: string } }
): Promise<void> => {
  try {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const data = conversationDoc.data();
    const currentParticipants = data.participants || [];
    const currentParticipantDetails = data.participantDetails || {};

    // Filter out members that are already in the group
    const membersToAdd = newMemberIds.filter(id => !currentParticipants.includes(id));

    if (membersToAdd.length === 0) {
      console.log('All selected members are already in the group');
      return;
    }

    // Merge participant details
    const updatedParticipantDetails = {
      ...currentParticipantDetails,
      ...newMemberDetails,
    };

    // Update the conversation with new members
    await updateDoc(conversationRef, {
      participants: [...currentParticipants, ...membersToAdd],
      participantDetails: updatedParticipantDetails,
      updatedAt: serverTimestamp(),
    });

    console.log(`Added ${membersToAdd.length} new members to group`);
  } catch (error) {
    console.error('Error adding members to group:', error);
    throw error;
  }
};

// Remove a member from a group conversation
export const removeMemberFromGroup = async (
  conversationId: string,
  memberId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const data = conversationDoc.data();
    const currentParticipants = data.participants || [];
    const currentParticipantDetails = data.participantDetails || {};

    // Check if user is in the group
    if (!currentParticipants.includes(memberId)) {
      throw new Error('User is not a member of this group');
    }

    // Remove the member from participants
    const updatedParticipants = currentParticipants.filter((id: string) => id !== memberId);

    // Remove member from participant details
    const updatedParticipantDetails = { ...currentParticipantDetails };
    delete updatedParticipantDetails[memberId];

    // If this is the last member, you might want to delete the conversation
    // For now, we'll just update it
    if (updatedParticipants.length === 0) {
      console.warn('Last member leaving group - conversation will be empty');
    }

    // Update the conversation
    await updateDoc(conversationRef, {
      participants: updatedParticipants,
      participantDetails: updatedParticipantDetails,
      updatedAt: serverTimestamp(),
    });

    console.log(`Removed member ${memberId} from group`);
  } catch (error) {
    console.error('Error removing member from group:', error);
    throw error;
  }
};

// Get Firestore instance (for advanced usage)
export const getFirestoreInstance = () => db;
