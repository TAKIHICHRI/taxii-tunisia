#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, subprocess

BASE = os.path.dirname(os.path.abspath(__file__))

def write(path, content):
    full = os.path.join(BASE, path.replace('/', os.sep))
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  [OK] {path}")

# ── App.tsx ───────────────────────────────────────────────────
write("src/App.tsx", """import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import SplashPage from './pages/SplashPage';
import OnboardingPage from './pages/OnboardingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import RidesPage from './pages/RidesPage';
import OffersPage from './pages/OffersPage';
import ProfilePage from './pages/ProfilePage';
import DriverApplyPage from './pages/DriverApplyPage';
import AdminPanel from './pages/AdminPanel';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import { useAppStore } from './store';
import { onAuthChange } from './services/auth';
import { getUser } from './services/firestore';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authenticated } = useAppStore();
  return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authenticated } = useAppStore();
  return !authenticated ? <>{children}</> : <Navigate to="/home" replace />;
};

function AppContent() {
  const location = useLocation();
  const ADMIN_SLUG = import.meta.env.VITE_ADMIN_SLUG || 'admin';
  const adminPath = `/${ADMIN_SLUG}`;
  return (
    <>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/login" element={<PublicOnlyRoute><AuthPage mode="login" /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><AuthPage mode="signup" /></PublicOnlyRoute>} />
        <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/rides" element={<PrivateRoute><RidesPage /></PrivateRoute>} />
        <Route path="/offers" element={<PrivateRoute><OffersPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/driver-apply" element={<PrivateRoute><DriverApplyPage /></PrivateRoute>} />
        <Route path={adminPath} element={<AdminPanel />} />
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/admin-panel" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {location.pathname !== adminPath && !location.pathname.startsWith('/admin') && <BottomNav />}
    </>
  );
}

export default function App() {
  const { i18n } = useTranslation();
  const { language, isDarkMode, setUser, setAuthenticated, logout } = useAppStore();

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid);
        if (userData) { setUser(userData); setAuthenticated(true); }
      } else {
        logout();
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <div className="max-w-lg mx-auto bg-white dark:bg-dark-900 min-h-dvh relative shadow-2xl border-x border-gray-100 dark:border-dark-700">
        <Toast />
        <AppContent />
      </div>
    </BrowserRouter>
  );
}
""")

# ── AuthPage.tsx ──────────────────────────────────────────────
write("src/pages/AuthPage.tsx", """import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../firebase';
import { sendOTP, verifyOTP } from '../services/auth';

const TUNISIA_PREFIX = '+216';
const OTP_LENGTH = 6;

const AuthPage: React.FC<{ mode: 'login' | 'signup' }> = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser, setAuthenticated, addToast } = useAppStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<any>(null);
  const fullPhone = `${TUNISIA_PREFIX}${phone}`;
  const isValidPhone = phone.length === 8;

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch {}
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const setupRecaptcha = (): Promise<RecaptchaVerifier> => {
    return new Promise((resolve, reject) => {
      if (!auth) { reject(new Error('Firebase not initialized')); return; }
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch {}
        recaptchaVerifierRef.current = null;
      }
      const container = document.getElementById('recaptcha-container');
      if (!container) { reject(new Error('recaptcha container not found')); return; }
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => setError('انتهت صلاحية التحقق، حاول مجدداً'),
        });
        verifier.render().then(() => {
          recaptchaVerifierRef.current = verifier;
          resolve(verifier);
        }).catch(reject);
      } catch (e) { reject(e); }
    });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone || isSending) return;
    setIsSending(true); setError(null);
    try {
      const verifier = await setupRecaptcha();
      const result = await sendOTP(fullPhone, verifier);
      confirmationResultRef.current = result;
      setStep('otp'); setResendCooldown(60);
      addToast('تم إرسال رمز التحقق ✓', 'success');
    } catch (err: any) {
      if (err.code === 'auth/invalid-phone-number') setError('رقم الهاتف غير صحيح');
      else if (err.code === 'auth/too-many-requests') setError('كثير من المحاولات، انتظر قليلاً');
      else if (err.code === 'auth/operation-not-allowed') setError('يرجى تفعيل Phone Auth في Firebase');
      else setError('فشل إرسال الرمز، تحقق من إعدادات Firebase');
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch {}
        recaptchaVerifierRef.current = null;
      }
    } finally { setIsSending(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\\D/g, '').slice(0, OTP_LENGTH);
      const newOtp = [...otp];
      digits.split('').forEach((d, i) => { if (index + i < OTP_LENGTH) newOtp[index + i] = d; });
      setOtp(newOtp);
      document.querySelector<HTMLInputElement>(`input[name="otp-${Math.min(index + digits.length, OTP_LENGTH - 1)}"]`)?.focus();
      return;
    }
    const digit = value.replace(/\\D/g, '').slice(-1);
    const newOtp = [...otp]; newOtp[index] = digit; setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1)
      document.querySelector<HTMLInputElement>(`input[name="otp-${index + 1}"]`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      document.querySelector<HTMLInputElement>(`input[name="otp-${index - 1}"]`)?.focus();
  };

  const otpString = otp.join('');
  const canVerify = otpString.length === OTP_LENGTH;

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canVerify || isVerifying) return;
    setIsVerifying(true); setError(null);
    try {
      if (!confirmationResultRef.current) throw new Error('no confirmation');
      const userData = await verifyOTP(confirmationResultRef.current, otpString);
      setUser(userData); setAuthenticated(true);
      addToast('مرحباً بك في Alou! 🚕', 'success');
      navigate('/home');
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') setError('رمز التحقق غير صحيح');
      else if (err.code === 'auth/code-expired') {
        setError('انتهت صلاحية الرمز، أرسل رمزاً جديداً');
        setStep('phone'); setOtp(Array(OTP_LENGTH).fill(''));
      } else setError('خطأ في التحقق، حاول مجدداً');
    } finally { setIsVerifying(false); }
  };

  return (
    <div className="min-h-dvh bg-white dark:bg-dark-900 safe-top safe-bottom flex flex-col">
      <div id="recaptcha-container" />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600" />
        <div className="relative px-8 pt-12 pb-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-black text-white">A</span>
            </div>
            <span className="text-white/80 text-xl font-bold">Alou</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold text-white mb-1">
            {t('welcomeBack')}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/70 text-sm">
            {step === 'phone' ? t('enterPhone') : t('enterOtp')}
          </motion.p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1 px-6 -mt-4">
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.form key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp} className="bg-white dark:bg-dark-800 rounded-3xl shadow-xl border border-dark-100 dark:border-dark-600 p-6">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} />{error}
                </motion.div>
              )}
              <div className="relative">
                <Phone size={20} className="absolute top-1/2 -translate-y-1/2 start-4 text-dark-400" />
                <span className="absolute top-1/2 -translate-y-1/2 start-12 text-dark-500 font-medium">{TUNISIA_PREFIX}</span>
                <input type="tel" inputMode="numeric" placeholder="98 000 000"
                  className="input-field ps-[4.5rem] text-left dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/\\D/g, '').slice(0, 8))} dir="ltr" maxLength={8} />
              </div>
              <p className="text-dark-400 text-xs mt-2">رقم الهاتف التونسي (8 أرقام بعد +216)</p>
              <button type="submit" disabled={!isValidPhone || isSending}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-50">
                {isSending ? <Loader2 size={20} className="animate-spin" /> : t('sendCode')}
                <ArrowRight size={18} />
              </button>
            </motion.form>
          ) : (
            <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp} className="bg-white dark:bg-dark-800 rounded-3xl shadow-xl border border-dark-100 dark:border-dark-600 p-6">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} />{error}
                </motion.div>
              )}
              <button type="button" onClick={() => { setStep('phone'); setError(null); setOtp(Array(OTP_LENGTH).fill('')); }}
                className="flex items-center gap-2 text-dark-500 text-sm mb-4">
                <ArrowLeft size={18} />{t('back')}
              </button>
              <p className="text-dark-600 text-sm mb-4">{t('otpSent')} <strong dir="ltr">{fullPhone}</strong></p>
              <div className="flex justify-center gap-2 mb-6" dir="ltr">
                {otp.map((digit, i) => (
                  <input key={i} name={`otp-${i}`} type="text" inputMode="numeric"
                    autoComplete="one-time-code" pattern="[0-9]*" maxLength={6}
                    className="w-11 h-12 rounded-xl border-2 border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-white text-center text-xl font-bold focus:border-primary-500 focus:outline-none"
                    value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} />
                ))}
              </div>
              <button type="submit" disabled={!canVerify || isVerifying}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {isVerifying ? <Loader2 size={20} className="animate-spin" /> : t('verify')}
              </button>
              <button type="button" onClick={() => { if (resendCooldown > 0) return; setStep('phone'); setOtp(Array(OTP_LENGTH).fill('')); setError(null); }}
                disabled={resendCooldown > 0}
                className="w-full mt-4 text-primary-600 text-sm font-medium disabled:opacity-50">
                {resendCooldown > 0 ? `إعادة الإرسال بعد ${resendCooldown}s` : t('resendCode')}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
        <button onClick={() => navigate('/driver-apply')}
          className="w-full mt-6 p-4 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50/50 flex items-center justify-between active:scale-[0.98]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <div className="text-start">
              <p className="font-bold text-dark-800 text-sm">كن سائقاً مع Alou</p>
              <p className="text-dark-400 text-xs">اكسب دخلاً إضافياً بجدول مرن</p>
            </div>
          </div>
          <ArrowLeft size={18} className="text-primary-500" />
        </button>
      </motion.div>
    </div>
  );
};

export default AuthPage;
""")

# ── RidesPage.tsx ─────────────────────────────────────────────
write("src/pages/RidesPage.tsx", """import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, FileText, Share2 } from 'lucide-react';
import { useAppStore } from '../store';
import RideInvoice from '../components/RideInvoice';
import type { Ride } from '../types';
import { listenToUserRides } from '../services/firestore';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'completed' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'cancelled' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'ongoing' },
};

const RidesPage: React.FC = () => {
  const { t } = useTranslation();
  const { rideHistory, addRideToHistory, addToast, user } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [invoiceRide, setInvoiceRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const unsub = listenToUserRides(user.id, (rides) => {
      rides.forEach((ride) => {
        const exists = useAppStore.getState().rideHistory.find(r => r.id === ride.id);
        if (!exists) addRideToHistory(ride);
      });
      setLoading(false);
    });
    return unsub;
  }, [user?.id]);

  const filtered = filter === 'all' ? rideHistory : rideHistory.filter(r => r.status === filter);

  const handleShareRide = (ride: Ride) => {
    const text = `Alou\\n${t('from')}: ${ride.pickup.address}\\n${t('to')}: ${ride.destination.address}\\n${t('price')}: ${ride.price} ${t('currency')}`;
    if (navigator.share) navigator.share({ title: 'Alou', text }).catch(() => navigator.clipboard.writeText(text));
    else navigator.clipboard.writeText(text);
    addToast(t('shareRide') + ' ✓', 'success');
  };

  return (
    <div className="min-h-dvh bg-dark-50 dark:bg-dark-900 safe-top pb-24">
      <div className="bg-white dark:bg-dark-800 px-5 pt-5 pb-4 border-b border-dark-100 dark:border-dark-600">
        <h1 className="font-extrabold text-dark-900 dark:text-white text-xl mb-4">{t('rideHistory')}</h1>
        <div className="flex gap-2">
          {(['all', 'completed', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-primary-500 text-dark-900' : 'bg-dark-50 dark:bg-dark-700 text-dark-500'}`}>
              {f === 'all' ? t('navRides') : t(f)}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 pt-4 space-y-3">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-dark-400 text-sm">جاري تحميل الرحلات...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🚕</span>
            <p className="text-dark-400 font-medium">{t('noRides')}</p>
          </div>
        ) : (
          filtered.map((ride, i) => {
            const status = statusColors[ride.status] || statusColors.completed;
            return (
              <motion.div key={ride.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card dark:bg-dark-800 dark:border-dark-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ride.rideType === 'economy' ? '🚕' : ride.rideType === 'comfort' ? '🚙' : '🏎️'}</span>
                    <div>
                      <p className="font-bold text-dark-800 dark:text-white text-sm">{t(ride.rideType)}</p>
                      <p className="text-dark-400 text-xs">{new Date(ride.createdAt).toLocaleDateString('ar-TN')}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-extrabold text-dark-900 dark:text-white">{ride.price} {t('currency')}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${status.bg} ${status.text}`}>{t(status.label)}</span>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-dark-600 dark:text-dark-300 truncate">{ride.pickup.name || ride.pickup.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm text-dark-600 dark:text-dark-300 truncate">{ride.destination.name || ride.destination.address}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-dark-100 dark:border-dark-700">
                  <div className="flex items-center gap-3 text-xs text-dark-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> {ride.duration} {t('minutes')}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {ride.distance.toFixed(1)} {t('km')}</span>
                  </div>
                  {ride.rating && (
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} size={12} className={s < ride.rating! ? 'text-primary-500 fill-primary-500' : 'text-dark-200'} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-dark-100 dark:border-dark-700">
                  <button onClick={() => setInvoiceRide(ride)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-dark-50 dark:bg-dark-700 text-dark-700 dark:text-dark-300 text-xs font-medium">
                    <FileText size={14} /> {t('invoice')}
                  </button>
                  <button onClick={() => handleShareRide(ride)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary-50 text-primary-600 text-xs font-medium">
                    <Share2 size={14} /> {t('shareRide')}
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      {invoiceRide && <RideInvoice ride={invoiceRide} onClose={() => setInvoiceRide(null)} />}
    </div>
  );
};

export default RidesPage;
""")

# ── DriverApplyPage.tsx ───────────────────────────────────────
write("src/pages/DriverApplyPage.tsx", """import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, User, Phone, Mail, MapPin, FileText, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import { submitDriverApplication } from '../services/firestore';

const DriverApplyPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast, addDriverApplication, user } = useAppStore();
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '', phone: user?.phone?.replace('+216', '') || '',
    email: '', city: 'القصرين', experience: '',
    vehicleType: '', vehicleModel: '', vehicleYear: '', plateNumber: '', hasLicense: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitDriverApplication({ ...formData, experience: Number(formData.experience) || 0, hasLicense: !!formData.hasLicense, userId: user?.id });
      addDriverApplication({ ...formData, experience: Number(formData.experience) || 0, hasLicense: !!formData.hasLicense });
      setStep('success');
      addToast('تم إرسال طلبك بنجاح! ✓', 'success');
    } catch { addToast('فشل الإرسال، حاول مجدداً', 'error'); }
    finally { setIsSubmitting(false); }
  };

  if (step === 'success') return (
    <div className="min-h-dvh bg-white dark:bg-dark-900 flex flex-col items-center justify-center px-6 safe-top">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
        <CheckCircle size={80} className="text-emerald-500" />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="font-extrabold text-dark-900 dark:text-white text-2xl mb-3 text-center">تم استلام طلبك! 🎉</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-dark-500 text-center mb-8">سنتواصل معك خلال 24-48 ساعة</motion.p>
      <button onClick={() => navigate('/home')} className="btn-primary w-full max-w-xs">العودة للرئيسية</button>
    </div>
  );

  if (step === 'info') return (
    <div className="min-h-dvh bg-white dark:bg-dark-900 safe-top safe-bottom">
      <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 px-6 pt-12 pb-10">
        <button onClick={() => navigate(-1)} className="absolute top-12 start-4 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <ArrowRight size={20} className="text-white" />
        </button>
        <div className="text-center pt-6">
          <span className="text-5xl block mb-4">🚗</span>
          <h1 className="text-white font-extrabold text-2xl">{t('becomeDriver')}</h1>
        </div>
      </div>
      <div className="px-5 py-6 space-y-4">
        {[{ icon: '💰', title: 'دخل إضافي', desc: 'اكسب ما يصل إلى 800 د.ت شهرياً' },
          { icon: '🕐', title: 'جدول مرن', desc: 'اعمل في الأوقات التي تناسبك' },
          { icon: '📱', title: 'تطبيق سهل', desc: 'استقبال الطلبات بضغطة واحدة' }
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 p-4 bg-dark-50 dark:bg-dark-800 rounded-2xl">
            <span className="text-2xl">{item.icon}</span>
            <div><p className="font-bold text-dark-800 dark:text-white text-sm">{item.title}</p>
              <p className="text-dark-500 text-xs mt-0.5">{item.desc}</p></div>
          </motion.div>
        ))}
        <button onClick={() => setStep('form')} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
          {t('applyNow')} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-white dark:bg-dark-900 safe-top safe-bottom">
      <div className="bg-white dark:bg-dark-800 px-5 py-4 border-b border-dark-100 dark:border-dark-600 flex items-center gap-3">
        <button onClick={() => setStep('info')} className="w-10 h-10 bg-dark-50 dark:bg-dark-700 rounded-xl flex items-center justify-center">
          <ArrowRight size={20} className="text-dark-700 dark:text-dark-200" />
        </button>
        <h1 className="font-bold text-dark-900 dark:text-white">تقديم الطلب</h1>
      </div>
      <form onSubmit={handleSubmit} className="px-5 pb-8 pt-4 space-y-4">
        <h3 className="font-bold text-dark-800 dark:text-white">{t('personalInfo')}</h3>
        <div className="relative"><User size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
          <input type="text" placeholder="الاسم الكامل" className="input-field ps-10 text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required /></div>
        <div className="relative"><Phone size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
          <input type="tel" placeholder="+216 98 000 000" className="input-field ps-10 text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} dir="ltr" required /></div>
        <div className="relative"><Mail size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
          <input type="email" placeholder="البريد الإلكتروني" className="input-field ps-10 text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} dir="ltr" /></div>
        <div className="relative"><MapPin size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
          <input type="text" placeholder="المدينة" className="input-field ps-10 text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
        <h3 className="font-bold text-dark-800 dark:text-white pt-2">{t('vehicleInfo')}</h3>
        <select className="input-field text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
          value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })} required>
          <option value="">نوع السيارة</option>
          <option value="sedan">Sedan</option><option value="suv">SUV</option><option value="van">Van</option>
        </select>
        <input type="text" placeholder="موديل السيارة (مثال: Peugeot 208)"
          className="input-field text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
          value={formData.vehicleModel} onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <input type="text" placeholder="سنة الصنع" className="input-field text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.vehicleYear} onChange={e => setFormData({ ...formData, vehicleYear: e.target.value })} dir="ltr" required />
          <input type="text" placeholder="رقم اللوحة" className="input-field text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} dir="ltr" required />
        </div>
        <input type="number" placeholder="سنوات الخبرة" className="input-field text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
          value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} min="0" max="50" />
        <label className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-2xl cursor-pointer">
          <input type="checkbox" className="w-5 h-5 accent-primary-500"
            checked={formData.hasLicense} onChange={e => setFormData({ ...formData, hasLicense: e.target.checked })} />
          <span className="text-sm text-dark-700 dark:text-dark-200">لدي رخصة قيادة سارية المفعول</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {['صورة رخصة القيادة', 'صورة السيارة'].map((label, i) => (
            <div key={i} className="border-2 border-dashed border-dark-200 dark:border-dark-600 rounded-2xl p-4 flex flex-col items-center gap-2">
              <Upload size={20} className="text-dark-400" />
              <span className="text-xs text-dark-500 font-medium text-center">{label}</span>
              <span className="text-[10px] text-dark-400">قريباً</span>
            </div>
          ))}
        </div>
        <button type="submit" disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          {isSubmitting ? 'جاري الإرسال...' : t('submitApplication')}
        </button>
      </form>
    </div>
  );
};

export default DriverApplyPage;
""")

# ── AdminPanel.tsx ────────────────────────────────────────────
write("src/pages/AdminPanel.tsx", """import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Car, TrendingUp, Check, X, LogOut, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store';
import { getDriverApplications, updateDriverApplicationStatus } from '../services/firestore';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'alou2025';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { adminAuthenticated, setAdminAuthenticated, rideHistory, extraRevenue } = useAppStore();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers'>('overview');

  const loadApplications = async () => {
    setLoading(true);
    try { const data = await getDriverApplications(); setApplications(data); }
    catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (adminAuthenticated) loadApplications(); }, [adminAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) { setAdminAuthenticated(true); setLoginError(''); }
    else setLoginError('كلمة المرور غير صحيحة');
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    await updateDriverApplicationStatus(id, status);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  if (!adminAuthenticated) return (
    <div className="min-h-dvh bg-dark-900 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-800 rounded-3xl p-8 w-full max-w-sm border border-dark-600">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-black text-dark-900">A</span>
          </div>
          <h1 className="text-white font-extrabold text-xl">لوحة الإدارة</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && <div className="p-3 bg-red-900/30 rounded-xl text-red-400 text-sm text-center">{loginError}</div>}
          <input type="password" placeholder="كلمة المرور"
            className="w-full bg-dark-700 border border-dark-600 rounded-2xl px-4 py-3 text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="btn-primary w-full">دخول</button>
        </form>
      </motion.div>
    </div>
  );

  const totalRides = rideHistory.length;
  const totalRevenue = rideHistory.reduce((s, r) => s + (r.price || 0), 0) + extraRevenue;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const approvedDrivers = applications.filter(a => a.status === 'approved').length;

  return (
    <div className="min-h-dvh bg-dark-900 text-white pb-10">
      <div className="bg-dark-800 px-5 pt-8 pb-5 border-b border-dark-700 flex items-center justify-between">
        <div><h1 className="font-extrabold text-xl">لوحة الإدارة</h1>
          <p className="text-dark-400 text-xs mt-0.5">Alou Taxi — القصرين</p></div>
        <button onClick={() => { setAdminAuthenticated(false); navigate('/'); }}
          className="flex items-center gap-2 text-dark-400 text-sm"><LogOut size={16} /> خروج</button>
      </div>
      <div className="flex gap-2 px-5 py-3">
        {(['overview', 'drivers'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary-500 text-dark-900' : 'bg-dark-800 text-dark-400'}`}>
            {tab === 'overview' ? 'نظرة عامة' : 'طلبات السائقين'}
          </button>
        ))}
      </div>
      {activeTab === 'overview' && (
        <div className="px-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <TrendingUp size={20} />, label: 'الإيرادات', value: `${totalRevenue.toFixed(1)} د.ت`, color: 'text-emerald-400' },
              { icon: <Car size={20} />, label: 'الرحلات', value: totalRides, color: 'text-blue-400' },
              { icon: <Users size={20} />, label: 'السائقون', value: approvedDrivers, color: 'text-primary-400' },
              { icon: <RefreshCw size={20} />, label: 'طلبات جديدة', value: pendingApps, color: 'text-amber-400' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
                <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-dark-400 text-xs mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-700"><h3 className="font-bold text-sm">آخر الرحلات</h3></div>
            {rideHistory.slice(0, 5).length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-6">لا توجد رحلات بعد</p>
            ) : rideHistory.slice(0, 5).map((ride) => (
              <div key={ride.id} className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50 last:border-0">
                <div><p className="text-sm font-medium truncate max-w-[180px]">{ride.pickup.address}</p>
                  <p className="text-dark-400 text-xs">{new Date(ride.createdAt).toLocaleDateString('ar-TN')}</p></div>
                <span className="text-primary-400 font-bold text-sm">{ride.price} د.ت</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'drivers' && (
        <div className="px-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-dark-400 text-sm">{applications.length} طلب</p>
            <button onClick={loadApplications} className="text-primary-400 text-sm flex items-center gap-1">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> تحديث
            </button>
          </div>
          {loading ? <div className="text-center py-10 text-dark-400">جاري التحميل...</div>
            : applications.length === 0 ? <div className="text-center py-10 text-dark-500">لا توجد طلبات بعد</div>
            : applications.map((app) => (
              <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-dark-800 rounded-2xl border border-dark-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div><p className="font-bold">{app.fullName}</p>
                    <p className="text-dark-400 text-xs" dir="ltr">{app.phone}</p>
                    <p className="text-dark-500 text-xs mt-0.5">{app.city} · {app.vehicleModel}</p></div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${app.status === 'approved' ? 'bg-emerald-900/50 text-emerald-400' : app.status === 'rejected' ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'}`}>
                    {app.status === 'approved' ? 'مقبول' : app.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </span>
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleStatusChange(app.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-900/30 text-emerald-400 text-sm font-medium">
                      <Check size={14} /> قبول
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-900/30 text-red-400 text-sm font-medium">
                      <X size={14} /> رفض
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
""")

# ── Git push ──────────────────────────────────────────────────
print("\nPushing to GitHub...")
subprocess.run(["git", "add", "."], cwd=BASE)
result = subprocess.run(
    ["git", "commit", "-m", "update all pages with Firebase integration"],
    cwd=BASE, capture_output=True, text=True
)
if "nothing to commit" in result.stdout:
    print("  Nothing new to commit - files already up to date")
else:
    subprocess.run(["git", "push"], cwd=BASE)
    print("  [OK] Pushed to GitHub!")

print("\n[DONE] All 6 files updated!")
print("Vercel will auto-deploy in ~1 minute.")
print("Then test: login -> request ride -> check Firestore!")
