# Firebase Configuration Guide

This project uses environment variables for Firebase configuration to improve security and flexibility.

## Configuration Sources (in order of priority)

1. **app.json extra section** - Current values (for development)
2. **Environment variables** - For production and different environments
3. **Default values** - Fallback values (not recommended for production)

## Setting Up Environment Variables

### Option 1: Using .env file (Recommended)

Create a `.env` file in the project root:

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Option 2: Using app.json extra section

Update the `extra` section in `app.json`:

```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "your_api_key_here",
      "firebaseAuthDomain": "your_project_id.firebaseapp.com",
      "firebaseProjectId": "your_project_id",
      "firebaseStorageBucket": "your_project_id.firebasestorage.app",
      "firebaseMessagingSenderId": "your_sender_id",
      "firebaseAppId": "your_app_id"
    }
  }
}
```

## Getting Firebase Configuration Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on your web app or create a new one
6. Copy the configuration values from the `firebaseConfig` object

## Security Notes

- **Never commit sensitive keys to version control**
- **Use different Firebase projects for development and production**
- **Consider using Firebase App Check for additional security**
- **Rotate API keys regularly in production**

## Environment-Specific Configuration

### Development
- Use the values in `app.json` extra section
- Or create a `.env` file with development values

### Production
- Use environment variables set by your deployment platform
- Or update `app.json` with production values before building

### Testing
- Use a separate Firebase project for testing
- Set up environment variables for the test project

## Troubleshooting

### Configuration Not Loading
- Check that environment variable names start with `EXPO_PUBLIC_`
- Verify that `expo-constants` is installed
- Restart the Expo development server after changing environment variables

### Missing Values
- The app will log warnings for missing configuration values
- Check the console for configuration status
- Ensure all required values are provided

## Current Configuration Status

The app will log the configuration status on startup. Look for:
```
Firebase Configuration Status:
- API Key: ✓ Set
- Auth Domain: ✓ Set
- Project ID: ✓ Set
- Storage Bucket: ✓ Set
- Messaging Sender ID: ✓ Set
- App ID: ✓ Set
```

If any values show as "Missing", update your configuration accordingly.
