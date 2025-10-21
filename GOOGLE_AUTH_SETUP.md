# Google Authentication Setup Guide

This guide will help you set up Google OAuth authentication for your MessageAI app.

## Prerequisites

1. **Google Cloud Console Account** - You need a Google account
2. **Firebase Project** - Already set up
3. **Expo Development Build** - For testing on real devices

## Step 1: Enable Google Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `messageai-expo`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Toggle **Enable**
6. Add your project support email
7. Click **Save**

## Step 2: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (`messageai-expo`)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**

### For iOS:
- **Application type**: iOS
- **Bundle ID**: `com.yourcompany.messageai` (update in app.json)
- **App Store ID**: Leave blank for now
- Click **Create**

### For Android:
- **Application type**: Android
- **Package name**: `com.yourcompany.messageai` (update in app.json)
- **SHA-1 certificate fingerprint**: Get from your keystore
- Click **Create**

### For Web:
- **Application type**: Web application
- **Name**: MessageAI Web
- **Authorized redirect URIs**: 
  - `https://auth.expo.io/@your-expo-username/your-app-slug`
  - `https://auth.expo.io/@your-expo-username/your-app-slug/+/redirect`
- Click **Create**

## Step 3: Update Configuration

### Update `app.json`:
```json
{
  "expo": {
    "name": "MessageAI",
    "slug": "messageai",
    "ios": {
      "bundleIdentifier": "com.yourcompany.messageai"
    },
    "android": {
      "package": "com.yourcompany.messageai"
    },
    "extra": {
      "googleClientId": {
        "ios": "your-ios-client-id.apps.googleusercontent.com",
        "android": "your-android-client-id.apps.googleusercontent.com",
        "web": "your-web-client-id.apps.googleusercontent.com"
      }
    }
  }
}
```

### Update `services/googleAuthService.ts`:
Replace the placeholder client IDs with your actual OAuth client IDs:

```typescript
const GOOGLE_CLIENT_ID = Platform.select({
  ios: 'your-ios-client-id.apps.googleusercontent.com',
  android: 'your-android-client-id.apps.googleusercontent.com',
  web: 'your-web-client-id.apps.googleusercontent.com',
});
```

## Step 4: Test the Implementation

### Development Testing:
1. **Start your app**: `npm start`
2. **Navigate to Google Auth screen**: Use the test button
3. **Test Google Sign-In**: Should open Google OAuth flow
4. **Verify Firebase integration**: Check Firebase Console for new users

### Production Testing:
1. **Build development client**: `expo build:ios` or `expo build:android`
2. **Test on real device**: Google Sign-In requires real device for full testing
3. **Verify user creation**: Check Firebase Authentication users

## Step 5: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Choose **External** user type
4. Fill in required information:
   - **App name**: MessageAI
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
6. Add test users (for development)
7. Save and continue

## Step 6: Security Considerations

### For Production:
1. **Restrict OAuth client IDs** to your app's bundle ID
2. **Use different projects** for development and production
3. **Rotate credentials** regularly
4. **Monitor usage** in Google Cloud Console
5. **Set up App Check** for additional security

### Environment Variables:
```bash
# .env
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=your-ios-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-android-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=your-web-client-id
```

## Troubleshooting

### Common Issues:

1. **"Google Sign-In is not available"**
   - Check that client IDs are properly configured
   - Verify bundle ID matches OAuth client configuration

2. **"Invalid client" error**
   - Ensure client ID is correct
   - Check that OAuth client is enabled

3. **"Redirect URI mismatch"**
   - Verify redirect URIs in Google Cloud Console
   - Check that Expo redirect URI is correct

4. **"App not verified" warning**
   - This is normal for development
   - Submit for verification for production

### Debug Steps:
1. Check console logs for detailed error messages
2. Verify Firebase Authentication is enabled
3. Test with different Google accounts
4. Check network connectivity
5. Verify OAuth client configuration

## Testing Checklist

- [ ] Google Sign-In button appears
- [ ] OAuth flow opens correctly
- [ ] User can sign in with Google
- [ ] User data is created in Firebase
- [ ] User can sign out
- [ ] Error handling works properly
- [ ] Loading states display correctly

## Next Steps

After successful setup:
1. **Customize UI** to match your app's design
2. **Add error handling** for edge cases
3. **Implement user profile management**
4. **Add offline support**
5. **Set up analytics** for authentication events

## Support

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
