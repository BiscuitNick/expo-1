import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
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
  callback: (conversations: ConversationData[]) => void
) => {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
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
  });
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

// Listen to messages in a conversation
export const listenToMessages = (
  conversationId: string,
  callback: (messages: MessageData[]) => void
) => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as MessageData;
    });
    callback(messages);
  });
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
    const conversationData = {
      participants,
      participantDetails,
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSenderId: '',
      isGroup: true,
      groupName,
      groupAvatar,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating group conversation:', error);
    throw error;
  }
};

// Get Firestore instance (for advanced usage)
export const getFirestoreInstance = () => db;
