export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  rating: number;
  totalRides: number;
  memberSince: string;
  walletBalance: number;
  loyaltyPoints: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  vehicleType: string;
  vehicleModel: string;
  vehicleColor: string;
  plateNumber: string;
  totalRides: number;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

export interface RideType {
  id: 'economy' | 'comfort' | 'premium';
  name: string;
  description: string;
  icon: string;
  multiplier: number;
  estimatedTime: number;
  estimatedPrice: number;
}

export interface Ride {
  id: string;
  pickup: Location;
  destination: Location;
  rideType: RideType['id'];
  status: 'searching' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
  driver?: Driver;
  price: number;
  distance: number;
  duration: number;
  rating?: number;
  createdAt: string;
  paymentMethod: 'cash' | 'wallet' | 'd17';
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  discount: number;
  validUntil: string;
  image?: string;
}

export interface Transaction {
  id: string;
  type: 'ride_payment' | 'topup' | 'refund' | 'bonus' | 'referral';
  amount: number;
  description: string;
  date: string;
}

export interface DriverApplication {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  experience: number;
  vehicleType: string;
  vehicleModel: string;
  vehicleYear: string;
  plateNumber: string;
  hasLicense: boolean;
}
