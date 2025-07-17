// src/firebase-config.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCgPVt8FosoOJP9sfW9j-YS6BYr6pgA2hQ",
  authDomain: "sdc-chat-app-55e1a.firebaseapp.com",
  projectId: "sdc-chat-app-55e1a",
  storageBucket: "sdc-chat-app-55e1a.firebasestorage.app",
  messagingSenderId: "126327847030",
  appId: "1:126327847030:web:98af480764f26d9b3d8757",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with Local Persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Failed to set auth persistence:", error);
  });

// Initialize Firestore (for the chat app data)
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Default export of the app instance (if you need it elsewhere)
export default app;
