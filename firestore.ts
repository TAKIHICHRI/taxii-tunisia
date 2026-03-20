import {
  collection, doc, setDoc, getDoc, updateDoc,
  addDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, onSnapshot, type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { User, Ride, DriverApplication } from '../types';

// ── المستخدمون ──────────────────────────────────────────────────────────────

export const saveUser = async (user: User): Promise<void> => {
  if (!db) return;
  await setDoc(doc(db, 'users', user.id), {
    ...user,
    updatedAt: serverTimestamp(),
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

// ── الرحلات ─────────────────────────────────────────────────────────────────

export const saveRide = async (ride: Ride, userId: string): Promise<void> => {
  if (!db) return;
  await setDoc(doc(db, 'rides', ride.id), {
    ...ride,
    userId,
    createdAt: serverTimestamp(),
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

// ── طلبات السائقين ──────────────────────────────────────────────────────────

export const submitDriverApplication = async (
  data: DriverApplication & { userId?: string }
): Promise<string> => {
  if (!db) return '';
  const ref = await addDoc(collection(db, 'driverApplications'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
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
  await updateDoc(doc(db, 'driverApplications', id), { status, updatedAt: serverTimestamp() });
};

// ── الإشعارات ────────────────────────────────────────────────────────────────

export const saveNotification = async (
  userId: string,
  title: string,
  body: string,
  type = 'info'
): Promise<void> => {
  if (!db) return;
  await addDoc(collection(db, 'notifications'), {
    userId, title, body, type,
    read: false,
    createdAt: serverTimestamp(),
  });
};
