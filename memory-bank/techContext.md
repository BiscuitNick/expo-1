# Technical Context: MessageAI

## Technologies Used

### Frontend Stack
- **React Native**: 0.81.4 - Cross-platform mobile framework
- **Expo**: ~54.0.15 - Development platform and SDK
- **Expo Router**: ~6.0.13 - File-based navigation system
- **TypeScript**: 5.9.2 - Type safety and development experience
- **React**: 19.1.0 - UI library

### Backend Stack
- **Firebase JS SDK**: 12.4.0 - Backend-as-a-Service platform
- **Firestore**: Real-time NoSQL database
- **Firebase Auth**: User authentication
- **Firebase Storage**: Media file storage
- **Firebase Cloud Functions**: Serverless backend
- **Firebase Cloud Messaging**: Push notifications

### AI Integration
- **Vercel AI SDK**: Agent framework and tool calling
- **OpenAI GPT-4**: Large language model (via Cloud Functions)
- **Anthropic Claude**: Alternative LLM option
- **Function Calling**: Agent capabilities and tool integration

### Development Tools
- **ESLint**: 9.25.0 - Code linting
- **Expo CLI**: Development and build tools
- **TypeScript**: Type checking and IntelliSense
- **Git**: Version control

## Development Setup

### Prerequisites
- Node.js (latest LTS)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- Firebase CLI (`npm install -g firebase-tools`)

### Project Structure
```
expo-1/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home tab
│   │   ├── explore.tsx    # Explore tab
│   │   ├── firebase-test.tsx # Firebase test tab
│   │   └── _layout.tsx    # Tab layout
│   ├── _layout.tsx        # Root layout
│   └── modal.tsx          # Modal screens
├── components/            # Reusable components
├── constants/             # App constants
├── hooks/                 # Custom React hooks
├── memory-bank/           # Project documentation
├── firebaseConfig.js      # Firebase configuration
├── package.json           # Dependencies
└── app.json              # Expo configuration
```

### Firebase Configuration
- **Project ID**: messageai-expo
- **Auth Domain**: messageai-expo.firebaseapp.com
- **Storage Bucket**: messageai-expo.firebasestorage.app
- **API Key**: Configured in firebaseConfig.js
- **Services Enabled**: Auth, Firestore, Storage, Functions, FCM

## Technical Constraints

### Platform Limitations
- **iOS**: Requires iOS 13.4+ for Expo Go
- **Android**: Requires Android 6.0+ (API level 23)
- **Expo Go**: Limited to Expo SDK features
- **Custom Dev Client**: Required for some native modules

### Firebase Limitations
- **Firestore**: 1MB document size limit
- **Storage**: 5GB free tier
- **Functions**: 2GB memory limit
- **Auth**: 10,000 users free tier
- **FCM**: 1,000 messages/day free tier

### Performance Considerations
- **Real-time Listeners**: Limit concurrent listeners
- **Image Upload**: Compress before upload
- **Message Pagination**: Load messages in batches
- **Memory Usage**: Clean up unused listeners
- **Network Usage**: Optimize for mobile data

## Dependencies

### Core Dependencies
```json
{
  "expo": "~54.0.15",
  "react": "19.1.0",
  "react-native": "0.81.4",
  "firebase": "^12.4.0",
  "expo-router": "~6.0.13"
}
```

### Additional Dependencies Needed
- `@react-native-async-storage/async-storage` - Local storage
- `expo-image-picker` - Media selection
- `expo-notifications` - Push notifications
- `date-fns` - Date formatting
- `ai` - Vercel AI SDK

**Note**: Using Firebase JS SDK instead of React Native Firebase for better Expo compatibility

### Development Dependencies
```json
{
  "@types/react": "~19.1.0",
  "typescript": "~5.9.2",
  "eslint": "^9.25.0",
  "eslint-config-expo": "~10.0.0"
}
```

## Environment Configuration

### Development Environment
- **Expo Go**: For rapid development and testing
- **iOS Simulator**: For iOS-specific testing
- **Android Emulator**: For Android-specific testing
- **Firebase Emulators**: For local development (optional)

### Production Environment
- **Expo Go**: For MVP deployment
- **Custom Dev Client**: For final submission
- **Firebase Production**: Live backend services
- **App Store/Play Store**: For distribution

## Build and Deployment

### Development Commands
```bash
npm start              # Start Expo development server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run on web browser
npm run lint          # Run ESLint
```

### Build Commands
```bash
expo build:ios         # Build iOS app
expo build:android     # Build Android app
expo publish           # Publish to Expo Go
```

### Firebase Commands
```bash
firebase login         # Login to Firebase
firebase init          # Initialize Firebase project
firebase deploy        # Deploy Cloud Functions
firebase emulators:start # Start local emulators
```

## Security Considerations
- **API Keys**: Stored in Cloud Functions, not client
- **Firebase Rules**: Restrict data access by user
- **Input Validation**: Sanitize all user inputs
- **Authentication**: Required for all operations
- **Data Encryption**: Firebase handles at rest
