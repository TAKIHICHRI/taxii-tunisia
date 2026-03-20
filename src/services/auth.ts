import {
  signInWithPhoneNumber, signOut, onAuthStateChanged,
  type ConfirmationResult, type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import { saveUser, getUser } from './firestore';
import type { User } from '../types';

export const sendOTP = async (
  phoneNumber: string, recaptchaVerifier: any
): Promise<ConfirmationResult> => {
  if (!auth) throw new Error('Firebase not initialized');
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

export const verifyOTP = async (
  confirmationResult: ConfirmationResult, otp: string
): Promise<User> => {
  const credential = await confirmationResult.confirm(otp);
  const firebaseUser = credential.user;
  let userData = await getUser(firebaseUser.uid);
  if (!userData) {
    userData = {
      id: firebaseUser.uid,
      name: 'مستخدم Alou',
      phone: firebaseUser.phoneNumber || '',
      rating: 5.0, totalRides: 0,
      memberSince: new Date().toISOString().split('T')[0],
      walletBalance: 0, loyaltyPoints: 0,
    };
    await saveUser(userData);
  }
  return userData;
};

export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  await signOut(auth);
};

export const onAuthChange = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};
