// Quick test to verify redirect URI generation
// Run with: node test-redirect-uri.js

const AuthSession = require('expo-auth-session');

console.log('Testing Expo Auth Session Redirect URI Generation\n');
console.log('=====================================\n');

// Test different configurations
const configs = [
  { useProxy: true },
  { useProxy: true, native: undefined },
  { useProxy: false },
  { },
];

configs.forEach((config, index) => {
  try {
    const uri = AuthSession.makeRedirectUri(config);
    console.log(`Config ${index + 1}:`, JSON.stringify(config));
    console.log(`Result: ${uri}`);
    console.log(`Is HTTPS: ${uri.startsWith('https://')}`);
    console.log('---\n');
  } catch (error) {
    console.log(`Config ${index + 1} failed:`, error.message);
    console.log('---\n');
  }
});

console.log('\n=====================================');
console.log('IMPORTANT: For Google OAuth to work on iOS:');
console.log('1. The redirect URI MUST start with https://');
console.log('2. Add this exact URI to Google Console:');
console.log('   https://auth.expo.io/@nickkenkel/expo-1');
console.log('=====================================');