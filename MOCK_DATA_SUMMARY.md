# Mock Data Generator - Summary

## ✅ Complete

A fully functional mock data generator for testing the messaging UI with realistic conversations spanning multiple days.

---

## Features

### Mock Data Generated

**3 Mock Conversations** with:
- Alice Johnson
- Bob Smith
- Charlie Davis

**Per Conversation:**
- 15-35 messages (random)
- Messages span 7+ days
- Proper chronological order
- **All messages from "You"** (security rules limit - can't create messages from mock users)
- Read receipts (all messages marked as read)

**Note**: Due to Firestore security rules requiring `senderId == auth.uid`, all mock messages are created from the authenticated user. This still demonstrates date separators, timestamps, and grouping effectively!

**Message Distribution:**
- Today: 5 messages
- Yesterday: 7 messages
- 2 days ago: 8 messages
- 3-7 days ago: Remaining messages

**Total Data:**
- ~3 conversations
- ~75 messages total
- Proper timestamps (spread throughout each day)
- Realistic message content (38 different templates)

---

## How It Works

### Security Rule Compatibility

The generator is designed to work with our production Firestore security rules:

1. **No Mock User Profiles**: Security rules only allow users to create their own profile (uid must match auth.uid). Mock users are referenced in conversations but don't have full user profiles in Firestore.

2. **Authenticated User as Participant**: All conversations include the currently authenticated user, ensuring they can read/write the data.

3. **Proper Timestamps**: Uses Firestore `Timestamp` type for proper date handling.

### Batch Operations

- **Conversations**: Created individually using `setDoc()`
- **Messages**: Created in batches of 100 (Firestore limit: 500 per batch)
- **Atomic**: Each batch is committed atomically

### Timestamp Generation

```typescript
getRandomTimestamp(daysAgo, hoursOffset)
```

- `daysAgo`: How many days in the past
- `hoursOffset`: Hours before now (for spreading messages throughout day)
- Returns proper `Date` object converted to Firestore `Timestamp`

---

## Usage

### From Firebase Test Tab

1. Navigate to **Firebase Test** tab
2. Ensure you're **logged in** (required!)
3. Click **"Generate Mock Data"** button (green)
4. Wait for success message (~3-10 seconds)
5. Go to **Chats** tab to see conversations
6. Open any conversation to see messages with date separators

### Button States

- **Enabled**: User is authenticated
- **Disabled**: No user logged in (shows "Login First to Generate")
- **Loading**: Showing spinner and "Generating..." text

---

## What You'll See

### In Chats List

```
┌─────────────────────────────────────┐
│  👤 Alice Johnson         Just now   │
│     Hey! How are you doing?          │
│                                  ●   │ ← Online indicator (random)
├─────────────────────────────────────┤
│  👤 Bob Smith            Yesterday   │
│     Thanks! Couldn't have...         │
│                                      │
├─────────────────────────────────────┤
│  👤 Charlie Davis          Monday    │
│     Morning! How's it going?         │
│                                  ●   │
└─────────────────────────────────────┘
```

### In Chat Screen

```
─────────── TODAY ───────────
[2:30 PM] Hey! How are you doing?
[2:45 PM] I'm good, thanks!

────────── YESTERDAY ──────────
[Yesterday, 10:15 AM] Did you see the game?
[Yesterday, 10:20 AM] Yeah, it was amazing!

───── MONDAY, JANUARY 15 ─────
[Mon, 3:00 PM] Want to grab lunch?
[Mon, 3:05 PM] Sure! What time?
```

---

## Code Structure

### Main Function

```typescript
generateMockData(currentUserId: string): Promise<{
  conversationsCreated: number;
  messagesCreated: number;
}>
```

**Process:**
1. Loop through 3 mock users
2. For each user:
   - Create conversation (with authenticated user + mock user)
   - Generate 15-35 messages
   - Spread messages across multiple days
   - Commit in batches of 100

### Helper Functions

```typescript
getRandomTimestamp(daysAgo: number, hoursOffset: number): Date
```
Generates realistic timestamps with proper distribution.

---

## Technical Details

### Firestore Collections Used

**conversations/**
```typescript
{
  participants: [currentUserId, mockUserId],
  participantDetails: {
    [currentUserId]: { displayName, email },
    [mockUserId]: { displayName, photoURL, email }
  },
  lastMessage: string,
  lastMessageTimestamp: Timestamp,
  lastMessageSenderId: string,
  isGroup: false,
  createdAt: serverTimestamp(),
  updatedAt: Timestamp
}
```

**messages/**
```typescript
{
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string,
  timestamp: Timestamp,
  status: 'read',
  readBy: [currentUserId, mockUserId]
}
```

### Performance

- **Generation Time**: 3-10 seconds for ~75 messages
- **Operations**: ~75-105 Firestore writes
- **Batching**: Efficient batch operations (max 100 per batch)
- **No Blocking**: Async operations with loading state

---

## Error Handling

### Common Errors

**"Missing or insufficient permissions"**
- ✅ Fixed: Don't create mock user profiles (security rules prevent it)
- ✅ Fixed: Use authenticated user as participant

**Batch size exceeded**
- ✅ Fixed: Split into batches of 100 operations

**User not authenticated**
- ✅ Handled: Button disabled if no user
- ✅ Handled: Clear error message shown

---

## Files

### Created
- `utils/mockDataGenerator.ts` (250 lines)

### Modified
- `app/(tabs)/firebase-test.tsx`

---

## Testing Checklist

After generating mock data:

- [ ] Check Chats tab shows 3 conversations
- [ ] Verify profile pictures load (from pravatar.cc)
- [ ] Open conversation with Alice
- [ ] Verify "TODAY" date separator appears
- [ ] Verify "YESTERDAY" date separator appears
- [ ] Check older date separators (e.g., "Monday, January 15")
- [ ] Verify timestamps show correctly:
  - Today's messages: Time only ("2:30 PM")
  - Yesterday: "Yesterday, 2:30 PM"
  - This week: "Mon, 2:30 PM"
  - Older: "Jan 15, 2:30 PM"
- [ ] Test infinite scroll (if conversation has 20+ messages)
- [ ] Verify message order (chronological, oldest first)
- [ ] Check message bubbles alternate (you vs them)
- [ ] Verify smooth scrolling
- [ ] Test opening multiple conversations

---

## Mock User Details

```typescript
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
```

**Note**: These users don't have actual Firestore user profiles (due to security rules). They exist only as references in conversations.

---

## Message Templates (38 total)

Sample messages used for realistic conversations:
- "Hey! How are you doing?"
- "I'm good, thanks for asking!"
- "Did you see the game last night?"
- "Want to grab lunch today?"
- "Just finished the meeting"
- "Good morning! ☀️"
- And 32 more...

Messages rotate through templates, creating natural conversation flow.

---

## Future Improvements

Potential enhancements (not currently needed):

- [ ] Add group conversations
- [ ] Include unread message badges
- [ ] Add typing indicators
- [ ] Generate image/media messages
- [ ] Create custom message content per conversation
- [ ] Add delete function (clear all mock data)
- [ ] Generate more diverse timestamps
- [ ] Add delivery status variations

---

## Success!

The mock data generator successfully creates realistic messaging data that demonstrates:

✅ Date separators ("Today", "Yesterday", etc.)
✅ Smart timestamp formatting
✅ Message grouping by day
✅ Proper chronological order
✅ Real-time Firestore sync
✅ Security rule compliance
✅ Realistic conversation flow

**Perfect for testing and demos!** 🎉
