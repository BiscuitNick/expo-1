import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete auth session on web when the redirect happens
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

// Check if we're using the emulator - only if explicitly enabled
const USE_EMULATOR = process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

// Google OAuth configuration
// For expo-auth-session with PKCE, use Web client ID for all platforms
// This is the recommended approach as it works consistently across platforms
const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdWeb || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
// Client secret is only required when NOT using PKCE, but we'll include it for web
const GOOGLE_CLIENT_SECRET = Platform.OS === 'web'
  ? (Constants.expoConfig?.extra?.googleClientSecretWeb || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET_WEB)
  : undefined;

// Use platform-specific redirect URI
// When using emulator, use localhost-based URIs
const GOOGLE_REDIRECT_URI = USE_EMULATOR
  ? Platform.select({
      ios: 'http://localhost:8081',
      android: 'http://10.0.2.2:8081',
      web: 'http://localhost:8081',
      default: 'http://localhost:8081',
    })
  : Platform.select({
      ios: 'https://auth.expo.io/@nickkenkel/expo-1',
      android: 'https://auth.expo.io/@nickkenkel/expo-1',
      web: 'http://localhost:8081',
      default: AuthSession.makeRedirectUri({ useProxy: true }),
    });

// Google OAuth endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export interface GoogleAuthResult {
  idToken: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export interface GoogleAuthConfig {
  clientId: string;
  redirectUri: string;
}

// Get Google OAuth configuration
export const getGoogleAuthConfig = (): GoogleAuthConfig => {
  // Make sure we're using the correct redirect URI
  const redirectUri = Platform.select({
    ios: 'https://auth.expo.io/@nickkenkel/expo-1',
    android: 'https://auth.expo.io/@nickkenkel/expo-1',
    web: 'http://localhost:8081',
    default: GOOGLE_REDIRECT_URI,
  }) || GOOGLE_REDIRECT_URI;

  return {
    clientId: GOOGLE_CLIENT_ID!,
    redirectUri: redirectUri,
  };
};

// Generate code verifier for PKCE
export const generateCodeVerifier = (): string => {
  const bytes = Crypto.getRandomBytes(32);
  return bytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Generate code challenge for PKCE
export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  
  // Convert base64 to base64url format
  return digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Initiate Google OAuth flow
export const initiateGoogleAuth = async (): Promise<AuthSession.AuthRequest> => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  const config = getGoogleAuthConfig();
  
  const request = new AuthSession.AuthRequest({
    clientId: config.clientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: config.redirectUri,
    responseType: AuthSession.ResponseType.Code,
    codeChallenge: codeChallenge,
    codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
    additionalParameters: {},
    prompt: AuthSession.Prompt.SelectAccount,
  });

  return request;
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (
  code: string,
  codeVerifier: string
): Promise<{ idToken: string; accessToken: string }> => {
  const config = getGoogleAuthConfig();

  const params: Record<string, string> = {
    client_id: config.clientId,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  };

  // Add client secret if available (required for web clients)
  if (GOOGLE_CLIENT_SECRET) {
    params.client_secret = GOOGLE_CLIENT_SECRET;
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    console.error('Token exchange failed:', errorData);
    throw new Error(`Failed to exchange code for tokens: ${errorData.error || 'Unknown error'}`);
  }

  const tokens = await tokenResponse.json();
  return {
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
  };
};

// Get user info from Google
export const getGoogleUserInfo = async (accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
}> => {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error('Failed to get user info from Google');
  }

  const userInfo = await response.json();
  return {
    id: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture,
  };
};

// Complete Google authentication flow
export const authenticateWithGoogle = async (): Promise<GoogleAuthResult> => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID is not configured for this platform');
    }

    const config = getGoogleAuthConfig();

    console.log('=== Google OAuth Flow ===');
    console.log('Emulator Mode:', USE_EMULATOR ? 'YES (using localhost)' : 'NO (using production)');
    console.log('Client ID:', config.clientId);
    console.log('Redirect URI:', config.redirectUri);
    console.log('Platform:', Platform.OS);
    console.log('========================');

    // Create auth request - let AuthSession handle PKCE automatically
    const request = new AuthSession.AuthRequest({
      clientId: config.clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: config.redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true, // This will auto-generate code_verifier and code_challenge
      extraParams: {
        access_type: 'offline',
      },
    });

    // Prompt for authentication
    const discovery = {
      authorizationEndpoint: GOOGLE_AUTH_URL,
      tokenEndpoint: GOOGLE_TOKEN_URL,
    };

    const result = await request.promptAsync(discovery);

    console.log('Auth result type:', result.type);
    console.log('Auth result:', JSON.stringify(result, null, 2));

    if (result.type !== 'success') {
      // User dismissed the authentication - don't log as error
      if (result.type === 'dismiss' || result.type === 'cancel') {
        console.log('User dismissed authentication');
        throw new Error('USER_CANCELLED');
      }

      console.error('Authentication failed with type:', result.type);
      throw new Error(`Google authentication ${result.type}`);
    }

    // Exchange authorization code for tokens
    console.log('Exchanging code for tokens...');
    const { code } = result.params;

    // Get the code_verifier from the request (generated by AuthSession)
    const codeVerifier = request.codeVerifier;
    if (!codeVerifier) {
      throw new Error('Code verifier not found in auth request');
    }

    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    console.log('Tokens received, fetching user info...');
    // Get user info
    const userInfo = await getGoogleUserInfo(tokens.accessToken);

    console.log('User info received:', userInfo.email);

    return {
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
      user: userInfo,
    };
  } catch (error: any) {
    // Don't log user cancellation as an error
    if (error?.message === 'USER_CANCELLED') {
      throw error;
    }

    console.error('Google authentication error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
};

// Check if Google authentication is available
export const isGoogleAuthAvailable = (): boolean => {
  return !!GOOGLE_CLIENT_ID;
};

// Get Google sign-in button configuration
export const getGoogleSignInConfig = () => {
  return {
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: GOOGLE_REDIRECT_URI,
    isAvailable: isGoogleAuthAvailable(),
  };
};
