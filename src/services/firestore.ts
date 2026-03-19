import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  addDoc,
  writeBatch,
  getCountFromServer,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { User, Ride, DriverApplication, Offer } from '../types';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  RIDES: 'rides',
  DRIVERS: 'drivers',
  DRIVER_APPLICATIONS: 'driverApplications',
  OFFERS: 'offers',
  TRANSACTIONS: 'transactions',
} as const;

// ==================== USERS ====================

export const createUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() } as User;
  }
  return null;
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    ...userData,
    updatedAt: serverTimestamp(),
  });
};

export const subscribeToUser = (
  userId: string,
  callback: (user: User | null) => void
): (() => void) => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as User);
    } else {
      callback(null);
    }
  });
};

// ==================== RIDES ====================

export const createRide = async (rideData: Omit<Ride, 'id'>): Promise<string> => {
  const ridesRef = collection(db, COLLECTIONS.RIDES);
  const docRef = await addDoc(ridesRef, {
    ...rideData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getRide = async (rideId: string): Promise<Ride | null> => {
  const rideRef = doc(db, COLLECTIONS.RIDES, rideId);
  const rideSnap = await getDoc(rideRef);
  if (rideSnap.exists()) {
    const data = rideSnap.data();
    return {
      id: rideSnap.id,
      pickup: data.pickup,
      destination: data.destination,
      rideType: data.rideType,
      status: data.status,
      driver: data.driver,
      price: data.price,
      distance: data.distance,
      duration: data.duration,
      rating: data.rating,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      paymentMethod: data.paymentMethod,
    };
  }
  return null;
};

export const updateRide = async (rideId: string, rideData: Partial<Ride>): Promise<void> => {
  const rideRef = doc(db, COLLECTIONS.RIDES, rideId);
  await updateDoc(rideRef, {
    ...rideData,
    updatedAt: serverTimestamp(),
  });
};

export const getUserRides = async (userId: string, status?: Ride['status']): Promise<Ride[]> => {
  const ridesRef = collection(db, COLLECTIONS.RIDES);
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  ];
  
  if (status) {
    constraints.push(where('status', '==', status));
  } else {
    constraints.push(limit(50));
  }

  const q = query(ridesRef, ...constraints);
  const ridesSnap = await getDocs(q);
  
  return ridesSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      pickup: data.pickup,
      destination: data.destination,
      rideType: data.rideType,
      status: data.status,
      driver: data.driver,
      price: data.price,
      distance: data.distance,
      duration: data.duration,
      rating: data.rating,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      paymentMethod: data.paymentMethod,
    };
  });
};

export const subscribeToRide = (
  rideId: string,
  callback: (ride: Ride | null) => void
): (() => void) => {
  const rideRef = doc(db, COLLECTIONS.RIDES, rideId);
  return onSnapshot(rideRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        id: snapshot.id,
        pickup: data.pickup,
        destination: data.destination,
        rideType: data.rideType,
        status: data.status,
        driver: data.driver,
        price: data.price,
        distance: data.distance,
        duration: data.duration,
        rating: data.rating,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        paymentMethod: data.paymentMethod,
      });
    } else {
      callback(null);
    }
  });
};

// ==================== DRIVERS ====================

export const getAvailableDrivers = async (lat: number, lng: number, radiusKm: number = 5): Promise<any[]> => {
  // Note: For production, use Geohash or Firestore geoqueries
  // This is a simplified version
  const driversRef = collection(db, COLLECTIONS.DRIVERS);
  const q = query(
    driversRef,
    where('isAvailable', '==', true),
    limit(10)
  );
  const driversSnap = await getDocs(q);
  
  return driversSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const updateDriverLocation = async (driverId: string, lat: number, lng: number): Promise<void> => {
  const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
  await updateDoc(driverRef, {
    'location.lat': lat,
    'location.lng': lng,
    lastActive: serverTimestamp(),
  });
};

export const setDriverAvailability = async (driverId: string, isAvailable: boolean): Promise<void> => {
  const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
  await updateDoc(driverRef, {
    isAvailable,
    lastActive: serverTimestamp(),
  });
};

// ==================== DRIVER APPLICATIONS ====================

export const submitDriverApplication = async (applicationData: Omit<DriverApplication, 'hasLicense'> & { hasLicense: boolean }): Promise<string> => {
  const applicationsRef = collection(db, COLLECTIONS.DRIVER_APPLICATIONS);
  const docRef = await addDoc(applicationsRef, {
    ...applicationData,
    status: 'pending',
    submittedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getDriverApplications = async (status?: 'pending' | 'accepted' | 'rejected'): Promise<DriverApplication[]> => {
  const applicationsRef = collection(db, COLLECTIONS.DRIVER_APPLICATIONS);
  const constraints: QueryConstraint[] = [orderBy('submittedAt', 'desc')];
  
  if (status) {
    constraints.push(where('status', '==', status));
  }
  
  const q = query(applicationsRef, ...constraints);
  const appsSnap = await getDocs(q);
  
  return appsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      city: data.city,
      experience: data.experience,
      vehicleType: data.vehicleType,
      vehicleModel: data.vehicleModel,
      vehicleYear: data.vehicleYear,
      plateNumber: data.plateNumber,
      hasLicense: data.hasLicense,
    };
  });
};

export const updateDriverApplicationStatus = async (
  applicationId: string,
  status: 'pending' | 'accepted' | 'rejected'
): Promise<void> => {
  const appRef = doc(db, COLLECTIONS.DRIVER_APPLICATIONS, applicationId);
  await updateDoc(appRef, {
    status,
    updatedAt: serverTimestamp(),
  });
};

// ==================== OFFERS ====================

export const getActiveOffers = async (): Promise<Offer[]> => {
  const offersRef = collection(db, COLLECTIONS.OFFERS);
  const now = new Date();
  const q = query(
    offersRef,
    where('validUntil', '>=', now.toISOString()),
    orderBy('validUntil', 'asc')
  );
  const offersSnap = await getDocs(q);
  
  return offersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || '',
      description: data.description || '',
      code: data.code || '',
      discount: data.discount || 0,
      validUntil: data.validUntil || '',
      image: data.image,
    };
  });
};

export const validateOffer = async (code: string): Promise<Offer | null> => {
  const offersRef = collection(db, COLLECTIONS.OFFERS);
  const q = query(
    offersRef,
    where('code', '==', code.toUpperCase()),
    where('validUntil', '>=', new Date().toISOString())
  );
  const offersSnap = await getDocs(q);
  
  if (!offersSnap.empty) {
    const doc = offersSnap.docs[0];
    return { id: doc.id, ...doc.data() } as Offer;
  }
  return null;
};

// ==================== TRANSACTIONS ====================

export interface TransactionData {
  userId: string;
  type: 'ride_payment' | 'topup' | 'refund' | 'bonus' | 'referral';
  amount: number;
  description: string;
}

export const addTransaction = async (transactionData: TransactionData): Promise<string> => {
  const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
  const docRef = await addDoc(transactionsRef, {
    ...transactionData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getUserTransactions = async (userId: string): Promise<any[]> => {
  const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
  const q = query(
    transactionsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const transactionsSnap = await getDocs(q);
  
  return transactionsSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// ==================== REAL-TIME RIDE REQUEST (for drivers) ====================

export const subscribeToNearbyRideRequests = (
  lat: number,
  lng: number,
  callback: (rides: Ride[]) => void
): (() => void) => {
  const ridesRef = collection(db, COLLECTIONS.RIDES);
  const q = query(
    ridesRef,
    where('status', '==', 'searching'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  
  return onSnapshot(q, (snapshot) => {
    const rides = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        pickup: data.pickup,
        destination: data.destination,
        rideType: data.rideType,
        status: data.status,
        driver: data.driver,
        price: data.price,
        distance: data.distance,
        duration: data.duration,
        rating: data.rating,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        paymentMethod: data.paymentMethod,
      };
    });
    callback(rides);
  });
};

export const acceptRide = async (rideId: string, driverId: string, driverData: any): Promise<void> => {
  const rideRef = doc(db, COLLECTIONS.RIDES, rideId);
  await updateDoc(rideRef, {
    status: 'accepted',
    driver: driverData,
    driverId,
    updatedAt: serverTimestamp(),
  });
};

export const cancelRide = async (rideId: string, reason?: string): Promise<void> => {
  const rideRef = doc(db, COLLECTIONS.RIDES, rideId);
  await updateDoc(rideRef, {
    status: 'cancelled',
    cancelReason: reason,
    updatedAt: serverTimestamp(),
  });
};

export const startRide = async (rideId: string): Promise<void> => {
  const rideRef = doc(db, COLLECTIONS.RIDES, rideId);
  await updateDoc(rideRef, {
    status: 'in_progress',
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const completeRide = async (rideId: string): Promise<void> => {
  const rideRef = doc(db, COLLECTIONS.RIDES, rideId);
  await updateDoc(rideRef, {
    status: 'completed',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const rateRide = async (rideId: string, rating: number): Promise<void> => {
  const rideRef = doc(db, COLLECTIONS.RIDES, rideId);
  await updateDoc(rideRef, {
    rating,
    updatedAt: serverTimestamp(),
  });
};
