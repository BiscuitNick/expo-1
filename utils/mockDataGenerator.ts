/**
 * Mock data generator for testing the messaging UI
 * Generates realistic conversations and messages spanning multiple days
 */

import { collection, doc, getFirestore, serverTimestamp, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

// Mock user data
const MOCK_USERS = [
  {
    uid: 'user_alice',
    displayName: 'Alice Johnson',
    email: 'alice@example.com',
    photoURL: 'https://i.pravatar.cc/150?img=1',
  },
  {
    uid: 'user_bob',
    displayName: 'Bob Smith',
    email: 'bob@example.com',
    photoURL: 'https://i.pravatar.cc/150?img=2',
  },
  {
    uid: 'user_charlie',
    displayName: 'Charlie Davis',
    email: 'charlie@example.com',
    photoURL: 'https://i.pravatar.cc/150?img=3',
  },
];

// Mock message templates for realistic conversation
const MESSAGE_TEMPLATES = [
  "Hey! How are you doing?",
  "I'm good, thanks for asking!",
  "Did you see the game last night?",
  "Yeah, it was amazing!",
  "Want to grab lunch today?",
  "Sure! What time works for you?",
  "How about noon?",
  "Perfect! See you then 👍",
  "Just finished the meeting",
  "How did it go?",
  "Really well, they loved the presentation",
  "That's awesome! Congrats!",
  "Thanks! Couldn't have done it without your help",
  "Happy to help anytime",
  "Are you free this weekend?",
  "Saturday morning works for me",
  "Great! Let's meet at the park",
  "Sounds like a plan",
  "Don't forget to bring the documents",
  "Already packed them!",
  "You're the best",
  "😊 Thanks!",
  "Did you finish the project?",
  "Almost done, just need to review it",
  "Take your time, no rush",
  "I'll have it ready by tomorrow",
  "Perfect timing",
  "Let me know if you need anything",
  "Will do, thanks!",
  "Good morning! ☀️",
  "Morning! How's it going?",
  "Pretty good! Started my day with coffee",
  "Same here! Coffee is life ☕",
  "Absolutely! Can't function without it",
  "Have a great day!",
  "You too! Talk later",
  "Catch you later! 👋",
];

/**
 * Generate a random timestamp within the last N days
 */
function getRandomTimestamp(daysAgo: number, hoursOffset: number = 0): Date {
  const now = new Date();
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  // Add some random variation (hours offset +/- random minutes)
  date.setHours(date.getHours() - hoursOffset);
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(Math.floor(Math.random() * 60));

  return date;
}

/**
 * Generate mock conversations and messages
 */
export async function generateMockData(currentUserId: string): Promise<{
  conversationsCreated: number;
  messagesCreated: number;
}> {
  let conversationsCreated = 0;
  let messagesCreated = 0;

  try {
    // Note: We don't create mock user profiles because our security rules
    // only allow users to create their own profile (uid must match auth.uid)
    // The mock users will be referenced in conversations but won't have full profiles

    // Create conversations and messages one at a time to avoid batch limits
    // and handle security rules properly
    for (let i = 0; i < MOCK_USERS.length; i++) {
      const otherUser = MOCK_USERS[i];
      const conversationId = `conv_${currentUserId}_${otherUser.uid}`;

      // Determine how many days ago this conversation was active
      const daysAgo = i; // 0, 1, 2 days ago for variety

      // Create conversation
      const lastMessageIndex = Math.floor(Math.random() * MESSAGE_TEMPLATES.length);
      const lastMessageTimestamp = getRandomTimestamp(daysAgo, 2);

      const conversationData = {
        participants: [currentUserId, otherUser.uid],
        participantDetails: {
          [currentUserId]: {
            displayName: 'You',
            email: 'you@example.com',
          },
          [otherUser.uid]: {
            displayName: otherUser.displayName,
            photoURL: otherUser.photoURL,
            email: otherUser.email,
          },
        },
        lastMessage: MESSAGE_TEMPLATES[lastMessageIndex],
        lastMessageTimestamp: Timestamp.fromDate(lastMessageTimestamp),
        lastMessageSenderId: currentUserId, // Always set to current user to avoid permission issues
        isGroup: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(), // Use serverTimestamp() instead of manual timestamp
      };

      // Create conversation
      const conversationDocRef = doc(db, 'conversations', conversationId);
      await setDoc(conversationDocRef, conversationData);
      conversationsCreated++;

      // Generate messages for this conversation spanning multiple days
      // Reduced to 20 messages to avoid batch issues
      const numMessages = 20;

      // Create messages one at a time to avoid permission issues with batches
      for (let j = 0; j < numMessages; j++) {
        // Calculate timestamp - spread messages across different days
        let messageDaysAgo;
        if (j < 5) {
          // First 5 messages: today
          messageDaysAgo = 0;
        } else if (j < 12) {
          // Next 7 messages: yesterday
          messageDaysAgo = 1;
        } else if (j < 17) {
          // Next 5 messages: 2 days ago
          messageDaysAgo = 2;
        } else {
          // Remaining: 3-5 days ago
          messageDaysAgo = 3 + Math.floor(Math.random() * 3);
        }

        // Calculate hours offset to ensure chronological order within each day
        const hoursOffset = (numMessages - j) / 2; // Spread messages throughout the day
        const messageTimestamp = getRandomTimestamp(messageDaysAgo, hoursOffset);

        // Alternate between current user and other user for realistic conversation
        const isOwnMessage = j % 2 === 0;
        const senderId = isOwnMessage ? currentUserId : otherUser.uid;
        const senderName = isOwnMessage ? 'You' : otherUser.displayName;

        const messageData = {
          conversationId: conversationId,
          senderId: senderId,
          senderName: senderName,
          text: MESSAGE_TEMPLATES[j % MESSAGE_TEMPLATES.length],
          timestamp: Timestamp.fromDate(messageTimestamp),
          status: 'read' as const,
          readBy: [currentUserId, otherUser.uid],
        };

        // Create each message individually to avoid batch permission issues
        const messageDocRef = doc(collection(db, 'messages'));
        await setDoc(messageDocRef, messageData);
        messagesCreated++;
      }
    }

    return {
      conversationsCreated,
      messagesCreated,
    };
  } catch (error) {
    console.error('Error generating mock data:', error);
    throw error;
  }
}

/**
 * Clear all mock data from Firestore
 */
export async function clearMockData(): Promise<{
  conversationsDeleted: number;
  messagesDeleted: number;
  usersDeleted: number;
}> {
  const batch = writeBatch(db);
  let conversationsDeleted = 0;
  let messagesDeleted = 0;
  let usersDeleted = 0;

  try {
    // Delete mock users
    for (const user of MOCK_USERS) {
      const userDocRef = doc(db, 'users', user.uid);
      batch.delete(userDocRef);
      usersDeleted++;
    }

    // Note: For conversations and messages, we'd need to query them first
    // This is a simplified version - in production, use Cloud Functions for bulk deletes

    await batch.commit();

    return {
      conversationsDeleted,
      messagesDeleted,
      usersDeleted,
    };
  } catch (error) {
    console.error('Error clearing mock data:', error);
    throw error;
  }
}
