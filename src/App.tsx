import React from 'react'; // 👈 هذا السطر هو الذي سيحل مشكلة الصفحة البيضاء
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import './i18n';
import BottomNav from './components/BottomNav';
import SplashPage from './pages/SplashPage';
import OnboardingPage from './pages/OnboardingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import RidesPage from './pages/RidesPage';
import OffersPage from './pages/OffersPage';
import ProfilePage from './pages/ProfilePage';
import DriverApplyPage from './pages/DriverApplyPage';
import { useAppStore } from './store';
import AdminPanel from './pages/AdminPanel';
import Toast from './components/Toast';

function AppContent() {
  const location = useLocation();
  const ADMIN_SLUG = (import.meta as any).env?.VITE_ADMIN_SLUG || 'admin';
  const adminPath = `/${ADMIN_SLUG}`;
  return (
    <>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/rides" element={<RidesPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/driver-apply" element={<DriverApplyPage />} />
        {/* منطقة الإدارة: مسار سري عبر متغير بيئة VITE_ADMIN_SLUG */}
        <Route path={adminPath} element={<AdminPanel />} />
        {/* منع الوصول عبر /admin المكشوف */}
        <Route path="/admin" element={<Navigate to="/" replace />} />
        <Route path="/admin-panel" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {location.pathname !== adminPath && !location.pathname.startsWith('/admin') && <BottomNav />}
    </>
  );
}

function App() {
  const { i18n } = useTranslation();
  const { language, isDarkMode } = useAppStore();

  useEffect(() => {
    const lang = language || 'ar';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang === 'en' ? 'en' : lang === 'fr' ? 'fr' : 'ar';
    i18n.changeLanguage(lang);
  }, [language, i18n]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <div className="max-w-lg mx-auto bg-white dark:bg-dark-900 min-h-dvh relative shadow-2xl border-x border-gray-100 dark:border-dark-700">
        <Toast />
        <AppContent />

        {/* 💡 ملاحظة: لقد تأكدت من عدم وجود أي عنصر يسمى Watermark هنا لحذف اللوجو */}
      </div>
    </BrowserRouter>
  );
}

export default App;
