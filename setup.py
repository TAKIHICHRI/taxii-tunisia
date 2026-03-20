#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Alou Taxi - Setup Script
# Run: python setup.py

import os, subprocess

BASE = os.path.dirname(os.path.abspath(__file__))

def write(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  [OK] {path}")

# ── 1. src/services/firestore.ts ──────────────────────────────
write("src/services/firestore.ts", """import {
  collection, doc, setDoc, getDoc, updateDoc,
  addDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, onSnapshot, type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { User, Ride, DriverApplication } from '../types';

export const saveUser = async (user: User): Promise<void> => {
  if (!db) return;
  await setDoc(doc(db, 'users', user.id), {
    ...user, updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const getUser = async (uid: string): Promise<User | null> => {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
};

export const updateUserProfile = async (uid: string, data: Partial<User>): Promise<void> => {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
};

export const saveRide = async (ride: Ride, userId: string): Promise<void> => {
  if (!db) return;
  await setDoc(doc(db, 'rides', ride.id), {
    ...ride, userId, createdAt: serverTimestamp(),
  });
};

export const getUserRides = async (userId: string): Promise<Ride[]> => {
  if (!db) return [];
  const q = query(
    collection(db, 'rides'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Ride);
};

export const listenToUserRides = (
  userId: string,
  callback: (rides: Ride[]) => void
): Unsubscribe => {
  if (!db) return () => {};
  const q = query(
    collection(db, 'rides'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => d.data() as Ride));
  });
};

export const updateRideRating = async (rideId: string, rating: number): Promise<void> => {
  if (!db) return;
  await updateDoc(doc(db, 'rides', rideId), { rating });
};

export const submitDriverApplication = async (
  data: DriverApplication & { userId?: string }
): Promise<string> => {
  if (!db) return '';
  const ref = await addDoc(collection(db, 'driverApplications'), {
    ...data, status: 'pending', createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getDriverApplications = async (): Promise<any[]> => {
  if (!db) return [];
  const snap = await getDocs(
    query(collection(db, 'driverApplications'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateDriverApplicationStatus = async (
  id: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> => {
  if (!db) return;
  await updateDoc(doc(db, 'driverApplications', id), {
    status, updatedAt: serverTimestamp(),
  });
};

export const saveNotification = async (
  userId: string, title: string, body: string, type = 'info'
): Promise<void> => {
  if (!db) return;
  await addDoc(collection(db, 'notifications'), {
    userId, title, body, type, read: false, createdAt: serverTimestamp(),
  });
};
""")

# ── 2. src/services/auth.ts ───────────────────────────────────
write("src/services/auth.ts", """import {
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
""")

# ── 3. src/pages/PrivacyPolicyPage.tsx ───────────────────────
write("src/pages/PrivacyPolicyPage.tsx", """import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-white dark:bg-dark-900 safe-top safe-bottom">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-100 dark:border-dark-700">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-50 dark:bg-dark-800">
          <ArrowRight size={20} className="text-dark-700 dark:text-dark-300" />
        </button>
        <h1 className="font-bold text-dark-900 dark:text-white text-lg">سياسة الخصوصية</h1>
      </div>
      <div className="px-5 py-6 space-y-6 pb-24">
        <p className="text-dark-400 text-sm">آخر تحديث: مارس 2025</p>
        {[
          { title: '1. البيانات التي نجمعها', body: 'نجمع رقم الهاتف للتحقق من الهوية، الموقع الجغرافي، وبيانات الرحلات.' },
          { title: '2. كيف نستخدم بياناتك', body: 'نستخدم بياناتك فقط لتقديم خدمة التاكسي. لا نبيع بياناتك لأطراف ثالثة.' },
          { title: '3. الموقع الجغرافي', body: 'نطلب إذن الوصول فقط أثناء الاستخدام. لا نتتبع موقعك في الخلفية.' },
          { title: '4. الأمان', body: 'نحمي بياناتك باستخدام Firebase مع تشفير كامل.' },
          { title: '5. حذف بياناتك', body: 'يمكنك طلب حذف حسابك في أي وقت.' },
          { title: '6. التواصل', body: 'alou.taxi.kasserine@gmail.com' },
        ].map((s, i) => (
          <section key={i}>
            <h2 className="font-bold text-dark-800 dark:text-white mb-2">{s.title}</h2>
            <p className="text-dark-600 dark:text-dark-300 text-sm leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
""")

# ── 4. firestore.rules ────────────────────────────────────────
write("firestore.rules", """rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /rides/{rideId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /driverApplications/{appId} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null;
    }
    match /notifications/{notifId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
""")

# ── Git push ──────────────────────────────────────────────────
print("\nPushing to GitHub...")
subprocess.run(["git", "add", "."], cwd=BASE)
result = subprocess.run(
    ["git", "commit", "-m", "add Firebase services - firestore auth privacy"],
    cwd=BASE, capture_output=True, text=True
)
if "nothing to commit" in result.stdout:
    print("  Nothing new to commit")
else:
    subprocess.run(["git", "push"], cwd=BASE)
    print("  [OK] Pushed to GitHub!")

print("\n[DONE] All files ready!")
print("Wait 1 minute then open your Vercel app and test.")
