import { signInWithPhoneNumber, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

// إنشاء reCAPTCHA verifier
export const createRecaptchaVerifier = (containerId: string): RecaptchaVerifier | null => {
  if (typeof window === 'undefined') return null;
  
  // Remove existing recaptcha
  const existing = document.getElementById('recaptcha-container');
  if (existing) existing.remove();

  try {
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
    });
    return verifier;
  } catch (error) {
    console.error('Recaptcha error:', error);
    return null;
  }
};

// إرسال رمز OTP
export const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    const verifier = createRecaptchaVerifier('recaptcha-container');
    if (!verifier) {
      throw new Error('Failed to create recaptcha verifier');
    }
    
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult;
  } catch (error: any) {
    console.error('OTP send error:', error);
    throw error;
  }
};

// التحقق من OTP وإنشاء/تحديث المستخدم
export const verifyOTP = async (
  confirmationResult: ConfirmationResult, 
  otpCode: string
) => {
  try {
    const result = await confirmationResult.confirm(otpCode);
    const user = result.user;
    
    // إنشاء أو تحديث بيانات المستخدم في Firestore
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // مستخدم جديد - إنشاء سجل
      await setDoc(userRef, {
        phone: user.phoneNumber,
        name: 'مستخدم Alou',
        rating: 5.0,
        totalRides: 0,
        walletBalance: 0,
        loyaltyPoints: 0,
        memberSince: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
    }
    
    return user;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

// تسجيل الخروج
export const logoutUser = async () => {
  await auth.signOut();
};

// الحصول على بيانات المستخدم
export const getUserData = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  return null;
};
