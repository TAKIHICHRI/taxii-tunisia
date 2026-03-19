import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Ride, Offer, DriverApplication } from '../types';

type ToastType = 'info' | 'success' | 'error';

type AppState = {
  user: User | null;
  authenticated: boolean;
  language: 'ar' | 'fr' | 'en';
  isDarkMode: boolean;
  onboardingSeen: boolean;
  selectedRideType: 'economy' | 'comfort' | 'premium';
  offers: Offer[];
  rideHistory: Ride[];
  toasts: { id: string; message: string; type?: ToastType }[];
  adminAuthenticated: boolean;
  driverApplications: Array<
    DriverApplication & { id: string; status: 'pending' | 'accepted' | 'rejected' }
  >;
  generatedDriverCodes: Array<{ id: string; code: string; createdAt: string; expiresAt: string }>;
  extraRevenue: number;
  myReferralCode: string | null;
  appliedReferralCode: string | null;
  referralCredits: number;
  favoriteHome: { lat: number; lng: number; address: string } | null;
  favoriteWork: { lat: number; lng: number; address: string } | null;
  notifications: Array<{ id: string; title: string; body: string; createdAt: string; type?: 'info' | 'offer' | 'alert' }>;
  setUser: (u: User | null) => void;
  setAuthenticated: (v: boolean) => void;
  setLanguage: (lang: 'ar' | 'fr' | 'en') => void;
  setDarkMode: (v: boolean) => void;
  setOnboardingSeen: () => void;
  setSelectedRideType: (t: 'economy' | 'comfort' | 'premium') => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  addRideToHistory: (r: Ride) => void;
  setRideRating: (id: string, rating: number) => void;
  setAdminAuthenticated: (v: boolean) => void;
  addDriverApplication: (d: Omit<DriverApplication, 'hasLicense'> & Partial<Pick<DriverApplication, 'hasLicense'>>) => void;
  setDriverApplicationStatus: (id: string, status: 'pending' | 'accepted' | 'rejected') => void;
  addGeneratedDriverCode: (code: string, expiresAt: string) => void;
  setExtraRevenue: (v: number) => void;
  ensureReferralCode: () => void;
  applyReferral: (code: string) => void;
  setFavoritePlace: (kind: 'home' | 'work', lat: number, lng: number, address: string) => void;
  addNotification: (title: string, body: string, type?: 'info' | 'offer' | 'alert') => void;
  clearNotifications: () => void;
};

const initialOffers: Offer[] = [
  {
    id: 'o1',
    title: 'firstRideFree',
    description: 'خصم على أول رحلة لك مع Alou',
    code: 'WELCOME10',
    discount: 10,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'o2',
    title: 'Loyalty',
    description: 'اجمع نقاط الولاء واستبدلها بخصومات',
    code: 'LOYAL5',
    discount: 5,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      authenticated: false,
      language: (localStorage.getItem('alou_lang') as 'ar' | 'fr' | 'en') || 'ar',
      isDarkMode: localStorage.getItem('alou_dark') === '1',
      onboardingSeen: !!localStorage.getItem('alou_onboarding'),
      selectedRideType: 'economy',
      offers: initialOffers,
      rideHistory: [],
      toasts: [],
      adminAuthenticated: false,
      driverApplications: [],
      generatedDriverCodes: [],
      extraRevenue: 0,
      myReferralCode: null,
      appliedReferralCode: null,
      referralCredits: 0,
      favoriteHome: null,
      favoriteWork: null,
      notifications: [],
      setUser: (u) => set({ user: u }),
      setAuthenticated: (v) => set({ authenticated: v }),
      setLanguage: (lang) => {
        localStorage.setItem('alou_lang', lang);
        set({ language: lang });
      },
      setDarkMode: (v) => {
        localStorage.setItem('alou_dark', v ? '1' : '0');
        set({ isDarkMode: v });
      },
      setOnboardingSeen: () => {
        localStorage.setItem('alou_onboarding', '1');
        set({ onboardingSeen: true });
      },
      setSelectedRideType: (t) => set({ selectedRideType: t }),
      addToast: (message, type) =>
        set((s) => ({
          toasts: [...s.toasts, { id: Math.random().toString(36).slice(2), message, type }],
        })),
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      addRideToHistory: (r) => set((s) => ({ rideHistory: [r, ...s.rideHistory] })),
      setRideRating: (id, rating) =>
        set((s) => ({
          rideHistory: s.rideHistory.map((r) => (r.id === id ? { ...r, rating } : r)),
        })),
      setAdminAuthenticated: (v) => set({ adminAuthenticated: v }),
      addDriverApplication: (d) =>
        set((s) => ({
          driverApplications: [
            ...s.driverApplications,
            {
              id: Math.random().toString(36).slice(2),
              fullName: d.fullName,
              phone: d.phone,
              email: d.email,
              city: d.city,
              experience: Number(d.experience) || 0,
              vehicleType: d.vehicleType,
              vehicleModel: d.vehicleModel,
              vehicleYear: d.vehicleYear,
              plateNumber: d.plateNumber,
              hasLicense: !!d.hasLicense,
              status: 'pending',
            },
          ],
        })),
      setDriverApplicationStatus: (id, status) =>
        set((s) => ({
          driverApplications: s.driverApplications.map((a) => (a.id === id ? { ...a, status } : a)),
        })),
      addGeneratedDriverCode: (code, expiresAt) =>
        set((s) => ({
          generatedDriverCodes: [
            ...s.generatedDriverCodes,
            { id: Math.random().toString(36).slice(2), code, createdAt: new Date().toISOString(), expiresAt },
          ],
        })),
      setExtraRevenue: (v) => set({ extraRevenue: v }),
      ensureReferralCode: () =>
        set((s) => {
          if (s.myReferralCode) return {};
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          let r = '';
          for (let i = 0; i < 6; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
          return { myReferralCode: `ALOU-${r}` };
        }),
      applyReferral: (code) =>
        set((s) => {
          const c = code.trim().toUpperCase();
          if (!c || s.appliedReferralCode) {
            return {};
          }
          if (!/^ALOU-[A-Z0-9]{6}$/.test(c)) {
            return {};
          }
          if (s.myReferralCode && c === s.myReferralCode) {
            return {};
          }
          const days = 14 * 24 * 60 * 60 * 1000;
          const offer: Offer = {
            id: 'ref-' + Math.random().toString(36).slice(2),
            title: 'دعوة صديق',
            description: 'خصم 20% على رحلتك القادمة برمز الدعوة',
            code: 'REF20',
            discount: 20,
            validUntil: new Date(Date.now() + days).toISOString(),
          };
          return {
            appliedReferralCode: c,
            referralCredits: s.referralCredits + 1,
            offers: [offer, ...s.offers],
          };
        }),
      setFavoritePlace: (kind, lat, lng, address) =>
        set(() => (kind === 'home' ? { favoriteHome: { lat, lng, address } } : { favoriteWork: { lat, lng, address } })),
      addNotification: (title, body, type) =>
        set((s) => ({
          notifications: [
            { id: Math.random().toString(36).slice(2), title, body, createdAt: new Date().toISOString(), type },
            ...s.notifications.slice(0, 19),
          ],
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'alou_store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        authenticated: s.authenticated,
        language: s.language,
        isDarkMode: s.isDarkMode,
        onboardingSeen: s.onboardingSeen,
        selectedRideType: s.selectedRideType,
        offers: s.offers,
        rideHistory: s.rideHistory,
        driverApplications: s.driverApplications,
        generatedDriverCodes: s.generatedDriverCodes,
        extraRevenue: s.extraRevenue,
        myReferralCode: s.myReferralCode,
        appliedReferralCode: s.appliedReferralCode,
        referralCredits: s.referralCredits,
        favoriteHome: s.favoriteHome,
        favoriteWork: s.favoriteWork,
        notifications: s.notifications,
      }),
    }
  )
);
