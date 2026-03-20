import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  PhoneAuthProvider,
  RecaptchaVerifier,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? '',
};

let app:  FirebaseApp | undefined;
let auth: Auth        | undefined;
let db:   Firestore   | undefined;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db   = getFirestore(app);
    console.log('✅ Firebase initialized');
  } catch (e) {
    console.error('❌ Firebase error:', e);
  }
} else {
  console.warn('⚠️ Firebase credentials missing — add them to .env');
}

export const firebaseAuth = auth;
export const firebaseDb   = db;
export const phoneProvider = auth ? new PhoneAuthProvider(auth) : undefined;
export { RecaptchaVerifier, auth, db };
export default app;
