import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// Web app's Firebase configuration loaded dynamically via Vite environment variables.
// These will be filled by the user in the .env file.
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "PLACEHOLDER_API_KEY",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "PLACEHOLDER_AUTH_DOMAIN",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "PLACEHOLDER_PROJECT_ID",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "PLACEHOLDER_MESSAGING_SENDER_ID",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "PLACEHOLDER_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Providers
export const googleProvider = new GoogleAuthProvider();

// HTTPS Callable function endpoints
export const convertSketchFn = httpsCallable<{
  image: string; // Base64 png data
  prompt: string;
  action: "vision" | "generate";
}, {
  success: boolean;
  data?: string; // base64 response image or text
  error?: string;
}>(functions, "convertSketch");

export default app;
