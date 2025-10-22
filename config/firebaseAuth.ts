/**
 * Re-export auth from firebaseConfig to ensure all services use the same instance
 * This ensures the emulator connection is applied everywhere
 */
export { app, auth } from '../firebaseConfig';