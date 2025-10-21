import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Google OAuth configuration
// NOTE: For expo-auth-session OAuth flow, we use the WEB client ID for all platforms
// The iOS/Android client IDs are only needed for native Google Sign-In SDK
const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientIdWeb || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;

// Use platform-specific redirect URI
const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: Platform.OS === 'web' ? undefined : 'expo1',
  useProxy: Platform.OS !== 'web',
  path: Platform.OS === 'web' ? undefined : undefined,
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
    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID is not configured for this platform');
    }

    console.log('Starting Google OAuth flow...');
    console.log('Client ID:', GOOGLE_CLIENT_ID);
    console.log('Redirect URI:', GOOGLE_REDIRECT_URI);

    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const config = getGoogleAuthConfig();

    // Create auth request
    const request = new AuthSession.AuthRequest({
      clientId: config.clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: config.redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      codeChallenge: codeChallenge,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      extraParams: {
        access_type: 'offline',
      },
    });

    // Prompt for authentication
    const result = await request.promptAsync({
      authorizationEndpoint: GOOGLE_AUTH_URL,
      useProxy: true,
    });

    console.log('Auth result type:', result.type);
    console.log('Auth result:', JSON.stringify(result, null, 2));

    if (result.type !== 'success') {
      console.error('Authentication failed with type:', result.type);
      throw new Error(`Google authentication ${result.type}`);
    }

    // Exchange authorization code for tokens
    console.log('Exchanging code for tokens...');
    const { code } = result.params;
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
  } catch (error) {
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
