/**
 * Test script to verify Firebase Auth Emulator connection
 * Run with: node test-emulator-connection.js
 */

// Check if emulator is running
const http = require('http');

console.log('🔍 Testing Firebase Auth Emulator Connection...\n');

// Test 1: Check if emulator is running
console.log('Test 1: Checking if emulator is running on port 9099...');
http.get('http://localhost:9099', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.authEmulator && parsed.authEmulator.ready) {
        console.log('✅ Auth Emulator is running and ready!');
        console.log('   Emulator version:', parsed.authEmulator.version || 'unknown');
      } else {
        console.log('⚠️  Emulator responded but may not be ready:', data);
      }
    } catch (e) {
      console.log('⚠️  Emulator responded but response wasn't JSON:', data.substring(0, 100));
    }

    console.log('\n🔍 Next steps:');
    console.log('1. Make sure you started the emulator: npm run emulators');
    console.log('2. Restart your Expo app: npm run clear-cache');
    console.log('3. Look for these logs in your app console:');
    console.log('   - "=== EMULATOR CONFIGURATION ==="');
    console.log('   - "✅ Firebase Auth Emulator connected"');
    console.log('\n📱 Open Emulator UI: http://localhost:4000');
  });
}).on('error', (err) => {
  console.log('❌ Cannot connect to emulator on port 9099');
  console.log('   Error:', err.message);
  console.log('\n📝 To fix:');
  console.log('1. Start the emulator: npm run emulators');
  console.log('2. Make sure port 9099 is not blocked');
  console.log('3. Check firewall settings');
});