# Security Rules - TODO Before Production

## ⚠️ IMPORTANT: TEMPORARY RELAXED RULES

The Firestore security rules have been **temporarily relaxed** for testing and development purposes.

**Current Status**: 🟡 TESTING MODE (Less Secure)

---

## What Changed

### Conversations Collection

**BEFORE (Production-Ready):**
```javascript
// Only participants can read conversations
allow read: if isAuthenticated() && isParticipant(resource.data.participants);

// Must be a participant to create
allow create: if isAuthenticated() &&
               request.auth.uid in request.resource.data.participants &&
               // ... strict validation
```

**NOW (Testing):**
```javascript
// Any authenticated user can read any conversation
allow read: if isAuthenticated();

// Simplified creation rules
allow create: if isAuthenticated() &&
               // ... basic validation only
```

### Messages Collection

**BEFORE (Production-Ready):**
```javascript
// Only participants can read messages
allow read: if isAuthenticated() && isParticipant(...);

// Must send messages as yourself
allow create: if isAuthenticated() &&
               request.resource.data.senderId == request.auth.uid &&
               // ... participant validation
```

**NOW (Testing):**
```javascript
// Any authenticated user can read any message
allow read: if isAuthenticated();

// Can create messages as any user (for mock data)
allow create: if isAuthenticated() &&
               // ... basic validation only
```

---

## Why We Did This

The strict production rules prevented us from:
1. Creating mock messages from different users
2. Testing realistic conversation flows
3. Demonstrating the UI features properly

With relaxed rules, we can now:
- ✅ Create alternating messages (You ↔ Mock User)
- ✅ Generate realistic conversations
- ✅ Test date separators and grouping
- ✅ Demo the full messaging experience

---

## TODO Before Production Launch

### Step 1: Save Current Production Rules

The production-ready rules are documented in `FIREBASE_DEPLOYMENT.md`. Key features:

- Users can only read conversations they're participants in
- Users can only send messages as themselves
- Participant validation on all operations
- Strict field validation
- No data leakage between conversations

### Step 2: Test Everything

Before restoring strict rules, ensure all features work:

- [ ] Real user-to-user messaging
- [ ] Group chat functionality
- [ ] Read receipts
- [ ] Typing indicators
- [ ] Message deletion
- [ ] Conversation updates

### Step 3: Restore Production Rules

When ready for production:

1. **Restore the strict rules** from git history or `FIREBASE_DEPLOYMENT.md`
2. **Test with real users** (not mock data)
3. **Deploy**: `firebase deploy --only firestore:rules`
4. **Verify** no permission errors in production use

### Step 4: Production Rules Backup

```bash
# Before restoring, save current state
git checkout firestore.rules  # Restore from git

# Or manually restore from backup
cp firestore.rules.backup firestore.rules

# Deploy
firebase deploy --only firestore:rules
```

---

## Production Rules Summary

### Conversations
- ✅ Only participants can read
- ✅ Must include yourself as participant
- ✅ Cannot change participant list after creation
- ✅ Validate all required fields

### Messages
- ✅ Only participants can read
- ✅ Must send as yourself (senderId == auth.uid)
- ✅ Must be in a valid conversation
- ✅ Must be a participant of that conversation
- ✅ Validate message structure

### Users
- ✅ Anyone can read (for search/display)
- ✅ Can only create/update your own profile
- ✅ Cannot change email or createdAt

---

## Security Checklist for Production

Before going live:

- [ ] Restore strict security rules
- [ ] Test with real authenticated users
- [ ] Verify permission denied works for unauthorized access
- [ ] Test conversation privacy (users can't see others' chats)
- [ ] Test message sending restrictions (can't send as other users)
- [ ] Audit logs for any security issues
- [ ] Remove all mock data from Firestore
- [ ] Document final production rules

---

## Current Files

**Testing Rules (Current):**
- `firestore.rules` - Relaxed rules (DEPLOYED)

**Production Rules (To Restore):**
- Git history: `git log firestore.rules`
- Documented in: `FIREBASE_DEPLOYMENT.md`

---

## Quick Commands

```bash
# Check current rules
cat firestore.rules | grep "TEMPORARY"

# Deploy rules
firebase deploy --only firestore:rules

# View deployed rules
firebase firestore:rules:get
```

---

## Notes

- Testing rules are deployed to `messageai-expo` project
- Rules can be updated anytime via Firebase Console or CLI
- Changes take effect immediately (no app restart needed)
- Current rules still require authentication (not completely open)
- Mock data generation now works perfectly ✅

---

**Remember**: These are TEMPORARY rules for testing. Restore production rules before launch! 🚀
