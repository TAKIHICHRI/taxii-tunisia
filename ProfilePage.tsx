import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, LogOut, ChevronRight, Bell, Globe, Moon, Sun,
  Shield, Gift, Car, HelpCircle, X, Check, Edit3,
} from 'lucide-react';
import { useAppStore } from '../store';
import { logoutUser } from '../services/auth';
import { updateUserProfile } from '../services/firestore';

const ProfilePage: React.FC = () => {
  const { t, i18n }  = useTranslation();
  const navigate      = useNavigate();
  const {
    user, notifications, clearNotifications,
    language, setLanguage, isDarkMode, setDarkMode,
    myReferralCode, ensureReferralCode, referralCredits,
    rideHistory, logout, addToast,
  } = useAppStore();

  const adminSlug      = import.meta.env.VITE_ADMIN_SLUG || 'admin';
  const [tapCount, setTapCount]   = useState(0);
  const tapTimer                  = useRef<number | null>(null);

  // ── تعديل الملف الشخصي ──────────────────────────────────────────────────
  const [showEdit, setShowEdit]   = useState(false);
  const [editName, setEditName]   = useState(user?.name || '');
  const [isSaving, setIsSaving]   = useState(false);

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.id, { name: editName.trim() });
      // تحديث الـ store
      useAppStore.setState((s) => ({
        user: s.user ? { ...s.user, name: editName.trim() } : null,
      }));
      addToast('تم حفظ التعديلات ✓', 'success');
      setShowEdit(false);
    } catch {
      addToast('فشل الحفظ، حاول مجدداً', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── تسجيل الخروج ────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logoutUser();
    logout();
    navigate('/login', { replace: true });
  };

  // ── اللغة ────────────────────────────────────────────────────────────────
  const langs: { code: 'ar' | 'fr' | 'en'; label: string }[] = [
    { code: 'ar', label: 'العربية' },
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
  ];

  // ── رمز الإحالة ──────────────────────────────────────────────────────────
  const handleReferral = () => {
    ensureReferralCode();
    const code = useAppStore.getState().myReferralCode;
    if (!code) return;
    const text = `انضم إلى Alou تاكسي القصرين باستخدام رمزي: ${code}`;
    if (navigator.share) {
      navigator.share({ title: 'Alou', text }).catch(() => navigator.clipboard.writeText(text));
    } else {
      navigator.clipboard.writeText(text);
      addToast('تم نسخ الرمز ✓', 'success');
    }
  };

  const totalRides   = rideHistory.length || user?.totalRides || 0;
  const walletBal    = user?.walletBalance ?? 0;
  const userRating   = user?.rating ?? 5.0;

  return (
    <div className="min-h-dvh bg-dark-50 dark:bg-dark-900 safe-top pb-24">

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-5 pt-5 pb-12 rounded-b-3xl relative overflow-hidden">
        <div className="absolute -top-10 -end-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -start-10 w-32 h-32 bg-white/5 rounded-full" />
        <h1 className="text-white font-extrabold text-xl mb-6 relative">{t('profile')}</h1>
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <span className="text-3xl">👤</span>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">{user?.name || 'مستخدم Alou'}</h2>
            <p className="text-white/60 text-sm" dir="ltr">{user?.phone || ''}</p>
          </div>
          <button
            onClick={() => { setEditName(user?.name || ''); setShowEdit(true); }}
            className="text-white/80 text-xs font-medium bg-white/15 px-3 py-1.5 rounded-xl backdrop-blur-sm active:scale-95 flex items-center gap-1"
          >
            <Edit3 size={12} />
            {t('editProfile')}
          </button>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-white dark:bg-dark-800 rounded-t-3xl w-full max-w-lg mx-auto p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-dark-900 dark:text-white">تعديل الملف الشخصي</h3>
                <button onClick={() => setShowEdit(false)} className="w-8 h-8 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>
              <label className="text-dark-600 dark:text-dark-300 text-sm font-medium block mb-2">الاسم</label>
              <input
                type="text"
                className="input-field mb-4 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="اسمك الكامل"
                maxLength={40}
              />
              <button
                onClick={handleSaveProfile}
                disabled={isSaving || !editName.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? 'جاري الحفظ...' : <><Check size={16} /> حفظ التعديلات</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats ── */}
      <div className="px-5 -mt-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg border border-dark-100 dark:border-dark-600 p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-primary-600 font-extrabold text-xl">{totalRides}</p>
            <p className="text-dark-400 text-[10px] font-medium">{t('totalRides')}</p>
          </div>
          <div className="text-center border-x border-dark-100 dark:border-dark-700">
            <div className="flex items-center justify-center gap-1">
              <Star size={14} className="text-primary-500 fill-primary-500" />
              <span className="text-primary-600 font-extrabold text-xl">{userRating.toFixed(1)}</span>
            </div>
            <p className="text-dark-400 text-[10px] font-medium">{t('rating')}</p>
          </div>
          <div className="text-center">
            <p className="text-primary-600 font-extrabold text-xl">{walletBal.toFixed(1)}</p>
            <p className="text-dark-400 text-[10px] font-medium">{t('currency')}</p>
          </div>
        </motion.div>
      </div>

      <div className="px-5 mt-5 space-y-4">

        {/* ── Notifications ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-600 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary-600" />
              <span className="font-bold text-sm text-dark-800 dark:text-dark-100">التنبيهات</span>
            </div>
            {notifications.length > 0 && (
              <button onClick={clearNotifications} className="text-xs text-dark-500">مسح</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-dark-400 text-sm">لا توجد تنبيهات</div>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <div key={n.id} className="px-4 py-3 flex items-start gap-3 border-b border-dark-50 dark:border-dark-700 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.type === 'alert' ? 'bg-amber-500' : n.type === 'offer' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="font-bold text-sm text-dark-800 dark:text-dark-100">{n.title}</p>
                  <p className="text-xs text-dark-500 dark:text-dark-300 mt-0.5">{n.body}</p>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* ── Language ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-600 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-100 dark:border-dark-700">
            <Globe size={16} className="text-primary-600" />
            <span className="font-bold text-sm text-dark-800 dark:text-dark-100">اللغة</span>
          </div>
          <div className="flex p-3 gap-2">
            {langs.map((l) => (
              <button key={l.code} onClick={() => setLanguage(l.code)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${language === l.code ? 'bg-primary-500 text-dark-900' : 'bg-dark-50 dark:bg-dark-700 text-dark-600 dark:text-dark-300'}`}>
                {l.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Dark Mode ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-600">
          <button onClick={() => setDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-dark-50 transition-colors">
            <div className="w-9 h-9 bg-dark-100 dark:bg-dark-700 rounded-xl flex items-center justify-center">
              {isDarkMode ? <Sun size={18} className="text-primary-500" /> : <Moon size={18} className="text-dark-500" />}
            </div>
            <span className="flex-1 text-start font-medium text-dark-800 dark:text-dark-100 text-sm">
              {isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            </span>
            <div className={`w-10 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-primary-500' : 'bg-dark-200'} relative`}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
            </div>
          </button>
        </motion.div>

        {/* ── Other links ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-600 overflow-hidden">
          {[
            { icon: <Gift size={18} />, bg: 'bg-emerald-50', color: 'text-emerald-600', label: `رمز الإحالة${myReferralCode ? ` · ${myReferralCode}` : ''}`, action: handleReferral },
            { icon: <Car  size={18} />, bg: 'bg-blue-50',    color: 'text-blue-600',    label: 'كن سائقاً', action: () => navigate('/driver-apply') },
            { icon: <Shield size={18} />, bg: 'bg-purple-50', color: 'text-purple-600', label: 'سياسة الخصوصية', action: () => navigate('/privacy-policy') },
            { icon: <HelpCircle size={18} />, bg: 'bg-amber-50', color: 'text-amber-600', label: 'المساعدة', action: () => addToast('قريباً...', 'info') },
          ].map((item, i) => (
            <button key={i} onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-dark-50 transition-colors border-b border-dark-100 dark:border-dark-700 last:border-0">
              <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center ${item.color}`}>{item.icon}</div>
              <span className="flex-1 text-start font-medium text-dark-800 dark:text-dark-100 text-sm">{item.label}</span>
              <ChevronRight size={14} className="text-dark-300 rtl:rotate-180" />
            </button>
          ))}
        </motion.div>

        {/* ── Logout ── */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform">
          <LogOut size={18} />
          {t('logout')}
        </motion.button>

        {/* Version — اضغط 5 مرات للوصول للأدمن */}
        <p className="text-center text-xs text-dark-300 pb-4 select-none cursor-default"
          onClick={() => {
            const next = tapCount + 1;
            setTapCount(next);
            if (tapTimer.current) window.clearTimeout(tapTimer.current);
            tapTimer.current = window.setTimeout(() => setTapCount(0), 1200);
            if (next >= 5) {
              setTapCount(0);
              navigate(`/${adminSlug}`);
            }
          }}>
          Alou v1.0.0
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
