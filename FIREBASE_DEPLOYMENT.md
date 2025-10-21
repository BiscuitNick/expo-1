# Firebase Security Rules Deployment Guide

This document explains how to deploy Firestore security rules and storage rules to your Firebase project.

## Files Created

1. **firestore.rules** - Security rules for Firestore database
2. **storage.rules** - Security rules for Firebase Storage
3. **firestore.indexes.json** - Database indexes for optimal query performance
4. **firebase.json** - Firebase configuration file
5. **.firebaserc** - Firebase project configuration

## Security Rules Overview

### Firestore Rules (firestore.rules)

The Firestore security rules ensure:

- **Users Collection**:
  - Any authenticated user can read profiles (for search/display)
  - Users can only create/update/delete their own profile
  - Email and createdAt fields cannot be changed after creation

- **Conversations Collection**:
  - Only participants can read their conversations
  - Users must be a participant to create/update conversations
  - One-on-one chats require exactly 2 participants
  - Group chats require 3+ participants and a groupName
  - Participants list cannot be changed (prevents unauthorized access)

- **Messages Collection**:
  - Only conversation participants can read messages
  - Users can only send messages as themselves
  - Users can mark messages as read (adds themselves to readBy array)
  - Only the sender can delete their own messages
  - All message data is validated (required fields, data types)

- **Presence Collection**:
  - Anyone authenticated can read online/offline status
  - Users can only update their own presence

- **Typing Indicators**:
  - Only conversation participants can see typing indicators
  - Users can only update their own typing status

### Storage Rules (storage.rules)

The Storage security rules ensure:

- **Profile Pictures**:
  - Any authenticated user can view profile pictures
  - Users can only upload/update/delete their own profile picture
  - Only image files allowed
  - Maximum file size: 5MB

- **Group Avatars**:
  - Any authenticated user can view group avatars
  - Any authenticated user can upload (authorization checked at Firestore level)
  - Only image files allowed
  - Maximum file size: 5MB

## Deployment Steps

### Option 1: Deploy via Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `messageai-expo`
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` and paste into the editor
5. Click **Publish**
6. Navigate to **Storage** → **Rules**
7. Copy the contents of `storage.rules` and paste into the editor
8. Click **Publish**

### Option 2: Deploy via Firebase CLI (Recommended)

#### Prerequisites

1. Make sure Firebase CLI is installed:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

#### Deploy All Rules

Deploy both Firestore and Storage rules:

```bash
firebase deploy --only firestore,storage
```

#### Deploy Firestore Rules Only

```bash
firebase deploy --only firestore:rules
```

#### Deploy Firestore Indexes Only

```bash
firebase deploy --only firestore:indexes
```

#### Deploy Storage Rules Only

```bash
firebase deploy --only storage
```

## Testing Security Rules

### Testing Locally (Firestore Emulator)

You can test your security rules locally before deploying:

1. Start the Firestore emulator:
   ```bash
   firebase emulators:start --only firestore
   ```

2. Update your app to connect to the emulator (in development mode)

3. Test your app's functionality to ensure rules work as expected

### Testing in Production

After deploying, test the rules with your app:

1. **Test User Authentication**:
   - Create a new user
   - Verify they can create their profile
   - Verify they cannot modify other users' profiles

2. **Test Conversations**:
   - Create a one-on-one conversation
   - Verify only participants can see it
   - Try to access a conversation you're not part of (should fail)

3. **Test Messages**:
   - Send messages in a conversation
   - Verify they appear for all participants
   - Try to send a message as another user (should fail)
   - Mark messages as read

4. **Test Storage**:
   - Upload a profile picture
   - Verify file size limits work
   - Try to upload non-image files (should fail)

## Database Indexes

The `firestore.indexes.json` file defines composite indexes for efficient queries:

1. **Conversations by User**: Query conversations for a user, sorted by last message timestamp
2. **Messages by Conversation**: Query messages in a conversation, sorted by timestamp
3. **Online Users**: Query users by online status and last seen time
4. **User Search**: Search users by display name

These indexes will be automatically created when you deploy.

## Important Notes

- **Never commit sensitive data**: The rules files don't contain secrets, but be careful not to commit any API keys or credentials
- **Test before deploying**: Always test rules in a development environment first
- **Backup existing rules**: If you have existing rules in Firebase, save them before deploying new ones
- **Monitor usage**: After deployment, monitor Firebase Console for any security issues or rule violations

## Troubleshooting

### "Permission denied" errors

If users are getting permission denied errors:

1. Check Firebase Console → Authentication → Users to verify users are authenticated
2. Check Firestore Console → Rules to see which rule is failing
3. Use Firebase Console → Firestore → Simulator to test specific operations

### Rules not updating

If rules don't seem to update after deployment:

1. Wait a few seconds (rules can take a moment to propagate)
2. Clear your app's cache
3. Verify deployment succeeded: `firebase deploy --only firestore:rules --debug`

### Index errors

If you see index errors when querying:

1. Firebase will show a link to create the required index
2. Click the link or manually deploy: `firebase deploy --only firestore:indexes`
3. Wait for indexes to build (can take a few minutes)

## Next Steps

After deploying the security rules, you should:

1. ✅ Deploy the rules to Firebase
2. ✅ Test all authentication flows
3. ✅ Test conversation creation and messaging
4. ✅ Monitor Firebase Console for any rule violations
5. Continue with Task 4.2: Implement Real-time Message Listening
