import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Star, Clock, Wallet, Globe, Bell, HelpCircle, Info, LogOut, Share2, Car, Award, Shield, Moon } from 'lucide-react';
import { useAppStore } from '../store';

const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, language, setLanguage, setAuthenticated, isDarkMode, setDarkMode, addToast, notifications, clearNotifications } = useAppStore();
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<number | null>(null);
  const adminSlug = (import.meta as any).env?.VITE_ADMIN_SLUG || 'admin';

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setDarkMode(next);
    addToast(next ? t('darkModeOn') : t('darkModeOff'), 'success');
  };

  const toggleLanguage = () => {
    const next: 'ar' | 'fr' | 'en' = language === 'ar' ? 'fr' : language === 'fr' ? 'en' : 'ar';
    setLanguage(next);
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next === 'en' ? 'en' : next === 'fr' ? 'fr' : 'ar';
  };

  const handleLogout = () => {
    setAuthenticated(false);
    navigate('/login');
  };

  type MenuItem = {
    icon: React.ReactNode;
    label: string;
    color: string;
    bg: string;
    badge?: string;
    action?: () => void;
  };
  const menuSections: { items: MenuItem[] }[] = [
    {
      items: [
        { icon: <Clock size={18} />, label: t('myRides'), color: 'text-blue-500', bg: 'bg-blue-50', action: () => navigate('/rides') },
        { icon: <Wallet size={18} />, label: t('myWallet'), color: 'text-emerald-500', bg: 'bg-emerald-50', badge: `${user?.walletBalance || 0} ${t('currency')}` },
        { icon: <Award size={18} />, label: t('loyaltyProgram'), color: 'text-purple-500', bg: 'bg-purple-50', badge: `${user?.loyaltyPoints || 0} ${t('points')}` },
      ],
    },
    {
      items: [
        { icon: <Moon size={18} />, label: t('darkMode'), color: 'text-amber-500', bg: 'bg-amber-50', badge: isDarkMode ? 'مفعّل' : 'معطّل', action: toggleDarkMode },
        { icon: <Globe size={18} />, label: t('language'), color: 'text-orange-500', bg: 'bg-orange-50', badge: language === 'ar' ? 'العربية' : language === 'fr' ? 'Français' : 'English', action: toggleLanguage },
        { icon: <Bell size={18} />, label: t('notifications'), color: 'text-pink-500', bg: 'bg-pink-50' },
        { icon: <Shield size={18} />, label: t('privacyPolicy'), color: 'text-teal-500', bg: 'bg-teal-50' },
      ],
    },
    {
      items: [
        { icon: <Car size={18} />, label: t('becomeDriver'), color: 'text-primary-600', bg: 'bg-primary-50', action: () => navigate('/driver-apply') },
        { icon: <Share2 size={18} />, label: t('shareApp'), color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { icon: <HelpCircle size={18} />, label: t('helpSupport'), color: 'text-cyan-500', bg: 'bg-cyan-50' },
        { icon: <Info size={18} />, label: t('aboutApp'), color: 'text-dark-400', bg: 'bg-dark-50' },
      ],
    },
  ];

  return (
    <div className="min-h-dvh bg-dark-50 dark:bg-dark-900 safe-top pb-24">
      {/* Profile Header */}
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
            <p className="text-white/60 text-sm" dir="ltr">{user?.phone || '+216 98 000 000'}</p>
          </div>
          <button className="text-white/80 text-xs font-medium bg-white/15 px-3 py-1.5 rounded-xl backdrop-blur-sm active:scale-95">
            {t('editProfile')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 -mt-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg border border-dark-100 dark:border-dark-600 p-4 grid grid-cols-3 gap-4"
        >
          <div className="text-center">
            <p className="text-primary-600 font-extrabold text-xl">{user?.totalRides || 12}</p>
            <p className="text-dark-400 text-[10px] font-medium">{t('totalRides')}</p>
          </div>
          <div className="text-center border-x border-dark-100">
            <div className="flex items-center justify-center gap-1">
              <Star size={14} className="text-primary-500 fill-primary-500" />
              <span className="text-primary-600 font-extrabold text-xl">{user?.rating || 4.9}</span>
            </div>
            <p className="text-dark-400 text-[10px] font-medium">{t('rating')}</p>
          </div>
          <div className="text-center">
            <p className="text-primary-600 font-extrabold text-xl">{user?.walletBalance || 51.5}</p>
            <p className="text-dark-400 text-[10px] font-medium">{t('currency')}</p>
          </div>
        </motion.div>
      </div>

      {/* Menu Sections */}
      <div className="px-5 mt-5 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-600 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary-600" />
              <span className="font-bold text-sm text-dark-800 dark:text-dark-100">مركز التنبيهات</span>
            </div>
            {notifications.length > 0 && (
              <button onClick={clearNotifications} className="text-xs text-dark-500 hover:text-dark-700">مسح</button>
            )}
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-700">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-dark-400 text-sm">لا توجد تنبيهات حالياً</div>
            ) : (
              notifications.slice(0, 6).map((n) => (
                <div key={n.id} className="px-4 py-3 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${n.type === 'alert' ? 'bg-amber-500' : n.type === 'offer' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-dark-800 dark:text-dark-100">{n.title}</p>
                    <p className="text-xs text-dark-500 dark:text-dark-300 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-dark-400 mt-0.5" dir="ltr">{new Date(n.createdAt).toLocaleString('ar-TN')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
        {menuSections.map((section, si) => (
          <motion.div
            key={si}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.1 }}
            className="bg-white dark:bg-dark-800 rounded-2xl border border-dark-100 dark:border-dark-600 overflow-hidden"
          >
            {section.items.map((item, ii) => (
              <button
                key={ii}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-dark-50 transition-colors"
              >
                <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  {item.icon}
                </div>
                <span className="flex-1 text-start font-medium text-dark-800 text-sm">{item.label}</span>
                {item.badge && (
                  <span className="text-xs font-bold text-dark-500 bg-dark-50 px-2 py-1 rounded">
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={14} className="text-dark-300 rtl:rotate-180" />
              </button>
            ))}
          </motion.div>
        ))}

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-3.5 rounded-2xl active:scale-95 transition-transform"
        >
          <LogOut size={18} />
          {t('logout')}
        </motion.button>

        {/* Version */}
        <p
          className="text-center text-xs text-dark-300 pb-4 select-none"
          onClick={() => {
            const next = tapCount + 1;
            setTapCount(next);
            if (tapTimer.current) {
              window.clearTimeout(tapTimer.current);
            }
            tapTimer.current = window.setTimeout(() => setTapCount(0), 1200);
            if (next >= 5) {
              setTapCount(0);
              if (tapTimer.current) window.clearTimeout(tapTimer.current);
              navigate(`/${adminSlug}`);
            }
          }}
          title=" "
        >
          Alou {t('version')} 1.0.0
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
