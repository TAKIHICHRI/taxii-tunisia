import React, { useState, useEffect, useRef } from 'react';
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
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
      const newOtp = [...otp];
      digits.split('').forEach((d, i) => { if (index + i < OTP_LENGTH) newOtp[index + i] = d; });
      setOtp(newOtp);
      document.querySelector<HTMLInputElement>(`input[name="otp-${Math.min(index + digits.length, OTP_LENGTH - 1)}"]`)?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
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
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))} dir="ltr" maxLength={8} />
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
