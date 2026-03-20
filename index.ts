import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Ride, Offer } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────
interface Notification {
  id: string; title: string; body: string;
  createdAt: string; type?: 'info' | 'offer' | 'alert';
}
interface Toast {
  id: string; message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
interface FavoritePlace { lat: number; lng: number; address: string; }
interface GeneratedCode  { id: string; code: string; createdAt: string; expiresAt: string; }
interface DriverApplicationRecord {
  id: string; fullName: string; phone: string; email: string;
  city: string; experience: number; vehicleType: string;
  vehicleModel: string; vehicleYear: string; plateNumber: string;
  hasLicense: boolean; status: 'pending' | 'approved' | 'rejected';
}

interface AppState {
  user: User | null;
  authenticated: boolean;
  language: 'ar' | 'fr' | 'en';
  isDarkMode: boolean;
  onboardingSeen: boolean;
  selectedRideType: 'economy' | 'comfort' | 'premium';
  rideHistory: Ride[];
  offers: Offer[];
  myReferralCode: string | null;
  appliedReferralCode: string | null;
  referralCredits: number;
  favoriteHome: FavoritePlace | null;
  favoriteWork: FavoritePlace | null;
  notifications: Notification[];
  toasts: Toast[];
  adminAuthenticated: boolean;
  driverApplications: DriverApplicationRecord[];
  generatedDriverCodes: GeneratedCode[];
  extraRevenue: number;

  setUser: (u: User | null) => void;
  setAuthenticated: (v: boolean) => void;
  setLanguage: (lang: 'ar' | 'fr' | 'en') => void;
  setDarkMode: (v: boolean) => void;
  setOnboardingSeen: () => void;
  setSelectedRideType: (t: 'economy' | 'comfort' | 'premium') => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  addRideToHistory: (r: Ride) => void;
  setRideRating: (id: string, rating: number) => void;
  setAdminAuthenticated: (v: boolean) => void;
  addDriverApplication: (d: Omit<DriverApplicationRecord, 'id' | 'status'>) => void;
  setDriverApplicationStatus: (id: string, status: DriverApplicationRecord['status']) => void;
  addGeneratedDriverCode: (code: string, expiresAt: string) => void;
  setExtraRevenue: (v: number) => void;
  ensureReferralCode: () => void;
  applyReferral: (code: string) => void;
  setFavoritePlace: (kind: 'home' | 'work', lat: number, lng: number, address: string) => void;
  addNotification: (title: string, body: string, type?: Notification['type']) => void;
  clearNotifications: () => void;
  logout: () => void;  // ✅ مضاف
}

const initialOffers: Offer[] = [
  {
    id: 'o1', title: 'firstRideFree',
    description: 'خصم على أول رحلة لك مع Alou',
    code: 'WELCOME10', discount: 10,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'o2', title: 'Loyalty',
    description: 'اجمع نقاط الولاء واستبدلها بخصومات',
    code: 'LOYAL5', discount: 5,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ── State ──
      user: null,
      authenticated: false,
      // ✅ إزالة القراءة المكررة من localStorage — Zustand persist يتولى ذلك
      language: 'ar',
      isDarkMode: false,
      onboardingSeen: false,
      selectedRideType: 'economy',
      rideHistory: [],
      offers: initialOffers,
      myReferralCode: null,
      appliedReferralCode: null,
      referralCredits: 0,
      favoriteHome: null,
      favoriteWork: null,
      notifications: [],
      toasts: [],
      adminAuthenticated: false,
      driverApplications: [],
      generatedDriverCodes: [],
      extraRevenue: 0,

      // ── Actions ──
      setUser: (u) => set({ user: u }),
      setAuthenticated: (v) => set({ authenticated: v }),
      setLanguage: (lang) => set({ language: lang }),
      setDarkMode: (v) => set({ isDarkMode: v }),
      setOnboardingSeen: () => set({ onboardingSeen: true }),
      setSelectedRideType: (t) => set({ selectedRideType: t }),

      addToast: (message, type) =>
        set((s) => ({
          toasts: [...s.toasts, { id: Math.random().toString(36).slice(2), message, type }],
        })),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      addRideToHistory: (r) =>
        set((s) => ({ rideHistory: [r, ...s.rideHistory] })),
      setRideRating: (id, rating) =>
        set((s) => ({
          rideHistory: s.rideHistory.map((r) => r.id === id ? { ...r, rating } : r),
        })),

      setAdminAuthenticated: (v) => set({ adminAuthenticated: v }),

      addDriverApplication: (d) =>
        set((s) => ({
          driverApplications: [
            ...s.driverApplications,
            {
              id: Math.random().toString(36).slice(2),
              ...d,
              experience: Number(d.experience) || 0,
              hasLicense: !!d.hasLicense,
              status: 'pending',
            },
          ],
        })),
      setDriverApplicationStatus: (id, status) =>
        set((s) => ({
          driverApplications: s.driverApplications.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
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
          for (let i = 0; i < 6; i++)
            r += chars.charAt(Math.floor(Math.random() * chars.length));
          return { myReferralCode: `ALOU-${r}` };
        }),

      applyReferral: (code) =>
        set((s) => {
          const c = code.trim().toUpperCase();
          if (!c || s.appliedReferralCode) return {};
          if (!/^ALOU-[A-Z0-9]{6}$/.test(c)) return {};
          if (s.myReferralCode && c === s.myReferralCode) return {};
          const offer: Offer = {
            id: 'ref-' + Math.random().toString(36).slice(2),
            title: 'دعوة صديق',
            description: 'خصم 20% على رحلتك القادمة برمز الدعوة',
            code: 'REF20', discount: 20,
            validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          };
          return { appliedReferralCode: c, referralCredits: s.referralCredits + 1, offers: [offer, ...s.offers] };
        }),

      setFavoritePlace: (kind, lat, lng, address) =>
        set(() => kind === 'home'
          ? { favoriteHome: { lat, lng, address } }
          : { favoriteWork: { lat, lng, address } }
        ),

      addNotification: (title, body, type) =>
        set((s) => ({
          notifications: [
            { id: Math.random().toString(36).slice(2), title, body, createdAt: new Date().toISOString(), type },
            ...s.notifications.slice(0, 19),
          ],
        })),
      clearNotifications: () => set({ notifications: [] }),

      // ✅ تسجيل خروج حقيقي يمسح كل بيانات المستخدم
      logout: () => set({
        user: null,
        authenticated: false,
        rideHistory: [],
        myReferralCode: null,
        appliedReferralCode: null,
        referralCredits: 0,
        favoriteHome: null,
        favoriteWork: null,
        notifications: [],
        offers: initialOffers,
      }),
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
