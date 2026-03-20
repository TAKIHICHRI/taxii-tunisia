import React, { useEffect } from 'react';
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
