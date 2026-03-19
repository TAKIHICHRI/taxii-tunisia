import { initializeApp, getApps } from 'firebase/app';
import { getAuth, PhoneAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - uses environment variables
const getFirebaseConfig = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env || {};
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY || "",
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: env.VITE_FIREBASE_APP_ID || ""
  };
  
  // Check if config is valid
  if (!config.apiKey || !config.projectId) {
    console.warn('⚠️ Firebase config not found. Please add your Firebase credentials to .env file');
    console.warn('Required env variables:');
    console.warn('- VITE_FIREBASE_API_KEY');
    console.warn('- VITE_FIREBASE_AUTH_DOMAIN');
    console.warn('- VITE_FIREBASE_PROJECT_ID');
    console.warn('- VITE_FIREBASE_STORAGE_BUCKET');
    console.warn('- VITE_FIREBASE_MESSAGING_SENDER_ID');
    console.warn('- VITE_FIREBASE_APP_ID');
  }
  
  return config;
};

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
} else {
  console.warn('⚠️ Firebase not initialized - missing configuration');
}

// Export Firebase services
export const firebaseAuth = auth;
export const firebaseDb = db;
export const phoneProvider = auth ? new PhoneAuthProvider(auth) : undefined;

// Export RecaptchaVerifier for use in auth
export { RecaptchaVerifier };

// Default exports - these are what the rest of the app expects
export { auth, db };
export default app;
