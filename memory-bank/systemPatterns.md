# System Patterns: MessageAI

## Architecture Overview
MessageAI follows a hybrid architecture combining real-time messaging infrastructure with AI enhancement capabilities.

## Core System Architecture
```
Mobile App (React Native/Expo)
    ↓
Firebase SDK (Real-time listeners)
    ↓
Firebase Firestore (Primary data store)
    ↓
Firebase Cloud Functions (AI processing)
    ↓
OpenAI/Claude API (AI features)
```

## Key Technical Decisions

### 1. Firebase-First Approach
- **Firestore**: Primary database with real-time listeners
- **Authentication**: Firebase Auth for user management
- **Storage**: Firebase Storage for media files
- **Functions**: Cloud Functions for AI API calls
- **Messaging**: FCM for push notifications

### 2. Offline-First Design
- **Firebase Offline Persistence**: Enabled by default
- **Message Queuing**: Queue messages when offline
- **Automatic Sync**: Sync when connectivity returns
- **Conflict Resolution**: Firebase handles automatically

### 3. Optimistic UI Updates
- **Immediate Display**: Show messages instantly when sent
- **Server Confirmation**: Update with delivery status
- **Error Handling**: Graceful handling of failed sends
- **Retry Logic**: Automatic retry for failed operations

## Component Relationships

### Navigation Structure
- **Root Layout**: Authentication state management
- **Tab Navigation**: Main app navigation (Chats, Profile, Firebase Test)
- **Stack Navigation**: Chat screens and modals
- **File-based Routing**: Expo Router for navigation

### Data Flow Patterns
1. **Real-time Listeners**: Firestore listeners for instant updates
2. **State Management**: React hooks for local state
3. **Service Layer**: Firebase service functions
4. **Component Layer**: UI components with data binding

### Message Flow
1. **User Input**: Message input component
2. **Optimistic Update**: Add to local state immediately
3. **Firestore Write**: Send to database
4. **Real-time Sync**: Update all connected clients
5. **Status Updates**: Update delivery/read status

## Design Patterns in Use

### 1. Service Layer Pattern
- **authService.ts**: Authentication operations
- **firestoreService.ts**: Database operations
- **notificationService.ts**: Push notification handling
- **aiService.ts**: AI feature integration

### 2. Custom Hooks Pattern
- **useAuth.ts**: Authentication state management
- **useMessages.ts**: Message state and real-time updates
- **useNetworkStatus.ts**: Network connectivity monitoring

### 3. Component Composition
- **MessageBubble.tsx**: Individual message display
- **ConversationItem.tsx**: Chat list items
- **MessageInput.tsx**: Message composition
- **TypingIndicator.tsx**: Real-time typing status

## Data Models

### Firestore Collections
- **users**: User profiles and presence
- **conversations**: Chat metadata and participants
- **messages**: Individual messages with status
- **ai_interactions**: AI feature usage tracking

### Local Storage (AsyncStorage)
- User preferences and settings
- Draft messages
- UI state persistence
- Offline message queue

## Security Patterns
- **Firebase Security Rules**: Control data access
- **API Key Security**: Keep keys in Cloud Functions
- **Authentication**: Require auth for all operations
- **Input Validation**: Sanitize all user inputs

## Performance Patterns
- **Pagination**: Load older messages on scroll
- **Image Optimization**: Compress before upload
- **Lazy Loading**: Load media on demand
- **Efficient Queries**: Use indexed fields in Firestore
- **Memory Management**: Clean up unused resources

## Error Handling Patterns
- **Graceful Degradation**: App works even with errors
- **User Feedback**: Clear error messages
- **Retry Logic**: Automatic retry for failed operations
- **Offline Handling**: Queue operations when offline
- **Network Detection**: Handle connectivity changes
