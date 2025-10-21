import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = Platform.select({
  ios: 'your-ios-client-id.apps.googleusercontent.com',
  android: 'your-android-client-id.apps.googleusercontent.com',
  web: 'your-web-client-id.apps.googleusercontent.com',
});

const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  useProxy: true,
});

// Google OAuth endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/oauth/authorize';
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
  return {
    clientId: GOOGLE_CLIENT_ID!,
    redirectUri: GOOGLE_REDIRECT_URI,
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
  
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for tokens');
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
    // For now, return a mock Google auth result for testing
    // In production, you would implement the full OAuth flow
    console.log('Google authentication - using mock for testing');
    
    // Mock Google auth result
    const mockResult: GoogleAuthResult = {
      idToken: 'mock_id_token_' + Date.now(),
      accessToken: 'mock_access_token_' + Date.now(),
      user: {
        id: 'mock_user_' + Date.now(),
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://via.placeholder.com/150',
      },
    };

    return mockResult;
  } catch (error) {
    console.error('Google authentication error:', error);
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
