// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGPq8rBgy2_tE5u2PtLK5X5UDrMt81ges",
  authDomain: "messageai-expo.firebaseapp.com",
  projectId: "messageai-expo",
  storageBucket: "messageai-expo.firebasestorage.app",
  messagingSenderId: "995887465511",
  appId: "1:995887465511:web:e20b2055f05437a11d7a02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app };
