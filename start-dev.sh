#!/bin/bash

# Start development environment with Firebase Emulator
# This script starts both the Firebase Auth Emulator and Expo dev server

echo "🚀 Starting development environment..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if Java is installed (required for emulators)
if ! command -v java &> /dev/null; then
    echo "⚠️  Java not found (required for Firebase Emulators)"
    echo "Install on macOS: brew install openjdk@11"
    echo ""
    echo "Continuing anyway..."
fi

# Create a function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $EMULATOR_PID $EXPO_PID 2>/dev/null
    exit 0
}

trap cleanup EXIT INT TERM

# Start Firebase Emulator in background
echo "📦 Starting Firebase Auth Emulator..."
firebase emulators:start --only auth &
EMULATOR_PID=$!

# Wait for emulator to start
echo "⏳ Waiting for emulator to initialize..."
sleep 5

# Check if emulator is running
if ! curl -s http://localhost:9099 > /dev/null; then
    echo "❌ Failed to start Firebase Emulator"
    kill $EMULATOR_PID 2>/dev/null
    exit 1
fi

echo "✅ Firebase Auth Emulator running on http://localhost:9099"
echo "📱 Emulator UI available at http://localhost:4000"
echo ""

# Start Expo
echo "📱 Starting Expo dev server..."
npm start &
EXPO_PID=$!

echo ""
echo "✨ Development environment ready!"
echo ""
echo "🔥 Firebase Emulator UI: http://localhost:4000"
echo "📱 Expo DevTools: http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait