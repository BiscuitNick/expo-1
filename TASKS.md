# MessageAI MVP - Detailed Task List

## Overview
This document contains a comprehensive breakdown of tasks for building the MessageAI MVP - a cross-platform messaging application with real-time capabilities, built using React Native/Expo and Firebase.

**Scope**: Core messaging MVP only (no AI features)  
**Platform**: iOS  
**Timeline**: 24-hour MVP checkpoint  

---

## **Task 1: Firebase Project Setup and Configuration**

### **1.1 Create Firebase Project** (COMPLETE)

## **Task 2: User Authentication System**

### **2.1 Create Authentication Screens** ✅ COMPLETE
- [x] Create `screens/auth/LoginScreen.tsx`:
  - [x] Email input field with validation
  - [x] Password input field with validation
  - [x] Login button
  - [x] "Sign up" navigation link
  - [x] Loading states and error handling
- [x] Create `screens/auth/SignupScreen.tsx`:
  - [x] Email input field with validation
  - [x] Password input field with validation
  - [x] Confirm password field
  - [x] Display name input field
  - [x] Sign up button
  - [x] "Login" navigation link
  - [x] Loading states and error handling
- [x] Create `screens/auth/ProfileSetupScreen.tsx`:
  - [x] Display name input (pre-filled from signup)
  - [x] Profile picture selection/upload
  - [x] "Complete Setup" button
  - [x] Skip option for profile picture

### **2.2 Implement Firebase Auth Integration** ✅ COMPLETE
- [x] Create `services/authService.ts`:
  - [x] `signUp(email, password, displayName)` function
  - [x] `signIn(email, password)` function
  - [x] `signOut()` function
  - [x] `getCurrentUser()` function
  - [x] `updateProfile(displayName, photoURL)` function
  - [x] `resetPassword(email)` function
- [x] Add Firebase Auth listeners:
  - [x] `onAuthStateChanged` listener
  - [x] Handle user state changes
  - [x] Redirect to appropriate screens

### **2.3 Add Form Validation** ✅ COMPLETE
- [x] Create `utils/validation.ts`:
  - [x] Email validation function
  - [x] Password strength validation
  - [x] Display name validation
  - [x] Form error message helpers
- [x] Implement real-time validation:
  - [x] Show validation errors as user types
  - [x] Disable submit buttons when form invalid
  - [x] Clear errors when user corrects input

### **2.4 Create User Profile Management** ✅ COMPLETE
- [x] Create `services/userService.ts`:
  - [x] `createUserProfile(userData)` function
  - [x] `updateUserProfile(uid, updates)` function
  - [x] `getUserProfile(uid)` function
  - [x] `uploadProfilePicture(file)` function
- [x] Create `hooks/useAuth.ts`:
  - [x] Custom hook for authentication state
  - [x] User data management
  - [x] Loading states
  - [x] Error handling

### **2.5 Implement Online/Offline Status** ✅ COMPLETE
- [x] Create `services/presenceService.ts`:
  - [x] `setUserOnline()` function
  - [x] `setUserOffline()` function
  - [x] `getUserPresence(uid)` function
  - [x] `listenToUserPresence(uid, callback)` function
- [x] Add presence tracking:
  - [x] Update status on app foreground/background
  - [x] Update status on authentication changes
  - [x] Handle app lifecycle events

---

## **Task 3: Core UI Structure and Navigation**

### **3.1 Set Up Navigation Structure**
- [ ] Update `app/_layout.tsx`:
  - [ ] Add authentication state management
  - [ ] Conditional rendering (auth vs main app)
  - [ ] Loading screen while checking auth
- [ ] Update `app/(tabs)/_layout.tsx`:
  - [ ] Create tab navigation structure
  - [ ] Add "Chats" tab (main chat list)
  - [ ] Add "Profile" tab (user settings)
  - [ ] Configure tab bar styling

### **3.2 Create Chat List Screen**
- [ ] Create `screens/ChatListScreen.tsx`:
  - [ ] FlatList for conversations
  - [ ] Conversation item component
  - [ ] Pull-to-refresh functionality
  - [ ] Search bar (basic implementation)
  - [ ] "New Chat" button
- [ ] Create `components/ConversationItem.tsx`:
  - [ ] Display conversation name/avatar
  - [ ] Show last message preview
  - [ ] Show timestamp (relative format)
  - [ ] Show unread count badge
  - [ ] Show online/offline status

### **3.3 Create Chat Screen**
- [ ] Create `screens/ChatScreen.tsx`:
  - [ ] Header with contact/group info
  - [ ] Messages FlatList
  - [ ] Message input area
  - [ ] Send button
  - [ ] Typing indicator area
- [ ] Create `components/MessageBubble.tsx`:
  - [ ] Text message display
  - [ ] Sender identification
  - [ ] Timestamp display
  - [ ] Message status indicators
  - [ ] Different styling for sent/received

### **3.4 Create Profile Screen**
- [ ] Create `screens/ProfileScreen.tsx`:
  - [ ] User profile display
  - [ ] Profile picture
  - [ ] Display name
  - [ ] Email address
  - [ ] Online/offline status
  - [ ] Sign out button
  - [ ] Settings options

### **3.5 Implement Navigation Logic**
- [ ] Create `navigation/types.ts`:
  - [ ] Define navigation parameter types
  - [ ] Type safety for navigation
- [ ] Add navigation handlers:
  - [ ] Navigate to chat screen
  - [ ] Navigate to profile screen
  - [ ] Handle deep linking
  - [ ] Back button handling

---

## **Task 4: One-on-One Messaging Implementation**

### **4.1 Set Up Firestore Collections**
- [ ] Create `services/firestoreService.ts`:
  - [ ] `createConversation(participants)` function
  - [ ] `getConversation(conversationId)` function
  - [ ] `getUserConversations(userId)` function
  - [ ] `sendMessage(conversationId, messageData)` function
  - [ ] `getMessages(conversationId, limit)` function
- [ ] Define Firestore security rules:
  - [ ] Users can only access their conversations
  - [ ] Messages can only be read by participants
  - [ ] Validate message data structure

### **4.2 Implement Real-time Message Listening**
- [ ] Create `hooks/useMessages.ts`:
  - [ ] Real-time message listener
  - [ ] Message state management
  - [ ] Loading states
  - [ ] Error handling
- [ ] Add message pagination:
  - [ ] Load older messages on scroll
  - [ ] Implement infinite scroll
  - [ ] Handle loading states

### **4.3 Create Message Input Component**
- [ ] Create `components/MessageInput.tsx`:
  - [ ] Text input field
  - [ ] Send button
  - [ ] Typing indicator trigger
  - [ ] Message validation
  - [ ] Auto-resize input
- [ ] Add message sending logic:
  - [ ] Optimistic UI updates
  - [ ] Error handling and retry
  - [ ] Message status tracking

### **4.4 Implement Optimistic UI Updates**
- [ ] Add immediate message display:
  - [ ] Show message instantly when sent
  - [ ] Update with server confirmation
  - [ ] Handle failed sends gracefully
- [ ] Create message state management:
  - [ ] Sending â†’ Sent â†’ Delivered â†’ Read
  - [ ] Visual indicators for each state
  - [ ] Retry mechanism for failed sends

### **4.5 Add Message Timestamps**
- [ ] Create `utils/dateUtils.ts`:
  - [ ] Relative time formatting (e.g., "2m ago")
  - [ ] Absolute time formatting
  - [ ] Date grouping logic
- [ ] Implement timestamp display:
  - [ ] Show relative time for recent messages
  - [ ] Show absolute time for older messages
  - [ ] Group messages by date

---

## **Task 5: Group Chat Functionality**

### **5.1 Create Group Management**
- [ ] Create `screens/CreateGroupScreen.tsx`:
  - [ ] Group name input
  - [ ] User selection (multi-select)
  - [ ] Group avatar selection
  - [ ] Create group button
- [ ] Create `services/groupService.ts`:
  - [ ] `createGroup(groupData)` function
  - [ ] `addGroupMembers(groupId, userIds)` function
  - [ ] `removeGroupMember(groupId, userId)` function
  - [ ] `updateGroupInfo(groupId, updates)` function

### **5.2 Implement Group Chat UI**
- [ ] Update `ChatScreen.tsx` for groups:
  - [ ] Show group name in header
  - [ ] Show group avatar
  - [ ] Display member count
  - [ ] Add group info button
- [ ] Create `components/GroupInfoModal.tsx`:
  - [ ] Group details display
  - [ ] Member list
  - [ ] Group settings
  - [ ] Leave group option

### **5.3 Add Message Attribution**
- [ ] Update `MessageBubble.tsx`:
  - [ ] Show sender name for group messages
  - [ ] Different styling for own messages
  - [ ] Sender avatar for group messages
- [ ] Implement sender identification:
  - [ ] Fetch sender details
  - [ ] Cache sender information
  - [ ] Handle missing sender data

### **5.4 Implement Group Message Delivery Tracking**
- [ ] Update message data structure:
  - [ ] Add `readBy` field for each participant
  - [ ] Track delivery status per user
- [ ] Create delivery status indicators:
  - [ ] Show read receipts per user
  - [ ] Visual indicators for delivery status
  - [ ] Group delivery summary

---

## **Task 6: Message Management Features**

### **6.1 Implement Read Receipts**
- [ ] Create `services/readReceiptService.ts`:
  - [ ] `markMessageAsRead(messageId, userId)` function
  - [ ] `getReadReceipts(messageId)` function
  - [ ] `listenToReadReceipts(messageId, callback)` function
- [ ] Add read receipt UI:
  - [ ] Show read status in message bubbles
  - [ ] Display read timestamps
  - [ ] Handle group read receipts

### **6.2 Add Typing Indicators**
- [ ] Create `services/typingService.ts`:
  - [ ] `startTyping(conversationId, userId)` function
  - [ ] `stopTyping(conversationId, userId)` function
  - [ ] `listenToTyping(conversationId, callback)` function
- [ ] Implement typing UI:
  - [ ] Show typing indicator in chat
  - [ ] Display who is typing
  - [ ] Handle multiple users typing
  - [ ] Auto-stop typing after inactivity

### **6.3 Create Message Status System**
- [ ] Define message status types:
  - [ ] `sending` - Message being sent
  - [ ] `sent` - Message sent to server
  - [ ] `delivered` - Message delivered to recipient
  - [ ] `read` - Message read by recipient
- [ ] Implement status updates:
  - [ ] Update status on send
  - [ ] Update status on delivery
  - [ ] Update status on read
  - [ ] Visual indicators for each status

### **6.4 Add Message Timestamps**
- [ ] Implement timestamp display:
  - [ ] Show relative time for recent messages
  - [ ] Show absolute time for older messages
  - [ ] Group messages by date
  - [ ] Handle timezone differences
- [ ] Create timestamp utilities:
  - [ ] Format timestamps consistently
  - [ ] Handle edge cases (same minute, same day)
  - [ ] Update timestamps in real-time

---

## **Task 7: Offline Support and Persistence**

### **7.1 Enable Firebase Offline Persistence**
- [ ] Configure Firebase offline settings:
  - [ ] Enable offline persistence
  - [ ] Set cache size limits
  - [ ] Configure sync settings
- [ ] Test offline functionality:
  - [ ] Send messages while offline
  - [ ] Verify message queuing
  - [ ] Test sync on reconnection

### **7.2 Implement Message Queuing**
- [ ] Create `services/offlineService.ts`:
  - [ ] `queueMessage(messageData)` function
  - [ ] `processQueuedMessages()` function
  - [ ] `clearQueuedMessages()` function
- [ ] Add offline indicators:
  - [ ] Show offline status in UI
  - [ ] Display queued message count
  - [ ] Show sync progress

### **7.3 Handle App Lifecycle Events**
- [ ] Implement app state listeners:
  - [ ] Handle app backgrounding
  - [ ] Handle app foregrounding
  - [ ] Handle app termination
- [ ] Add data persistence:
  - [ ] Save draft messages
  - [ ] Persist UI state
  - [ ] Handle app restarts

### **7.4 Add Network Status Detection**
- [ ] Install network status library:
  - [ ] `npm install @react-native-community/netinfo`
- [ ] Create `hooks/useNetworkStatus.ts`:
  - [ ] Monitor network connectivity
  - [ ] Handle online/offline transitions
  - [ ] Show network status in UI
- [ ] Implement reconnection logic:
  - [ ] Auto-retry failed operations
  - [ ] Sync queued data
  - [ ] Update UI status

---

## **Task 8: Push Notifications Implementation**

### **8.1 Set Up Expo Notifications**
- [ ] Install notification dependencies:
  - [ ] `npx expo install expo-notifications expo-device expo-constants`
- [ ] Configure `app.json`:
  - [ ] Add notification permissions
  - [ ] Configure notification settings
  - [ ] Set up notification channels

### **8.2 Implement Notification Service**
- [ ] Create `services/notificationService.ts`:
  - [ ] `requestPermissions()` function
  - [ ] `registerForPushNotifications()` function
  - [ ] `sendNotification(notificationData)` function
  - [ ] `handleNotification(notification)` function
- [ ] Add notification handlers:
  - [ ] Handle foreground notifications
  - [ ] Handle background notifications
  - [ ] Handle notification taps

### **8.3 Integrate with Firebase Cloud Messaging**
- [ ] Set up FCM in Firebase Console:
  - [ ] Generate APNs key for iOS
  - [ ] Upload APNs certificate
  - [ ] Configure FCM settings
- [ ] Create Cloud Functions for notifications:
  - [ ] Function to send notifications on new messages
  - [ ] Function to handle notification delivery
  - [ ] Function to update notification tokens

### **8.4 Add Notification UI**
- [ ] Create notification components:
  - [ ] In-app notification display
  - [ ] Notification settings screen
  - [ ] Permission request flow
- [ ] Implement notification logic:
  - [ ] Show notifications for new messages
  - [ ] Handle notification interactions
  - [ ] Update badge counts

---

## **Task 9: Testing and Validation**

### **9.1 Set Up Testing Environment**
- [ ] Configure iOS Simulator:
  - [ ] Set up two iOS simulators
  - [ ] Install app on both simulators
  - [ ] Configure different user accounts
- [ ] Set up testing data:
  - [ ] Create test user accounts
  - [ ] Set up test conversations
  - [ ] Prepare test scenarios

### **9.2 Test Core Messaging Features**
- [ ] Test one-on-one messaging:
  - [ ] Send messages between devices
  - [ ] Verify real-time delivery
  - [ ] Test message persistence
  - [ ] Verify optimistic UI updates
- [ ] Test group messaging:
  - [ ] Create group with 3+ users
  - [ ] Send messages in group
  - [ ] Verify message attribution
  - [ ] Test delivery tracking

### **9.3 Test Offline Functionality**
- [ ] Test offline scenarios:
  - [ ] Send messages while offline
  - [ ] Verify message queuing
  - [ ] Test sync on reconnection
  - [ ] Verify no data loss
- [ ] Test app lifecycle:
  - [ ] Background/foreground app
  - [ ] Force quit and restart
  - [ ] Verify message persistence

### **9.4 Test Push Notifications**
- [ ] Test notification delivery:
  - [ ] Send messages to backgrounded app
  - [ ] Verify notification display
  - [ ] Test notification interactions
  - [ ] Verify badge updates
- [ ] Test notification permissions:
  - [ ] Request permissions
  - [ ] Handle permission denial
  - [ ] Test notification settings

### **9.5 Performance Testing**
- [ ] Test rapid messaging:
  - [ ] Send 20+ messages quickly
  - [ ] Verify app performance
  - [ ] Check memory usage
  - [ ] Test UI responsiveness
- [ ] Test with multiple conversations:
  - [ ] Create multiple chat threads
  - [ ] Switch between conversations
  - [ ] Verify data consistency

### **9.6 Bug Fixes and Polish**
- [ ] Fix any identified issues:
  - [ ] UI/UX improvements
  - [ ] Performance optimizations
  - [ ] Error handling improvements
  - [ ] Edge case handling
- [ ] Final validation:
  - [ ] All MVP requirements met
  - [ ] No critical bugs
  - [ ] Smooth user experience
  - [ ] Ready for demo

---

## Success Criteria

### MVP Success Criteria
- [ ] One-on-one chat functionality working
- [ ] Real-time message delivery between 2+ users
- [ ] Message persistence (survives app restarts)
- [ ] Optimistic UI updates (messages appear instantly)
- [ ] Online/offline status indicators
- [ ] Message timestamps
- [ ] User authentication (Firebase Auth)
- [ ] Basic group chat (3+ users)
- [ ] Message read receipts
- [ ] Push notifications (foreground minimum)

---

## Notes

- This task list is designed for the 24-hour MVP checkpoint
- Focus on core messaging infrastructure first
- AI features are out of scope for this MVP
- All tasks are designed for iOS platform
- Firebase setup is included and will be guided through step-by-step
- Each task includes specific, actionable subtasks that can be completed systematically