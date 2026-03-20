import {
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  type ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import { saveUser, getUser } from './firestore';
import type { User } from '../types';

// ── إرسال OTP ───────────────────────────────────────────────────────────────
export const sendOTP = async (
  phoneNumber: string,
  recaptchaVerifier: any
): Promise<ConfirmationResult> => {
  if (!auth) throw new Error('Firebase not initialized');
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

// ── التحقق من OTP وحفظ المستخدم ────────────────────────────────────────────
export const verifyOTP = async (
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<User> => {
  const credential = await confirmationResult.confirm(otp);
  const firebaseUser = credential.user;

  // حاول جلب بيانات موجودة
  let userData = await getUser(firebaseUser.uid);

  if (!userData) {
    // مستخدم جديد — أنشئ سجله
    userData = {
      id: firebaseUser.uid,
      name: 'مستخدم Alou',
      phone: firebaseUser.phoneNumber || '',
      rating: 5.0,
      totalRides: 0,
      memberSince: new Date().toISOString().split('T')[0],
      walletBalance: 0,
      loyaltyPoints: 0,
    };
    await saveUser(userData);
  }

  return userData;
};

// ── تسجيل الخروج ────────────────────────────────────────────────────────────
export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  await signOut(auth);
};

// ── مراقبة حالة المصادقة ────────────────────────────────────────────────────
export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};
