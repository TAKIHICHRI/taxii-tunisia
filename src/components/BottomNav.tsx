import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, Tag, User } from 'lucide-react';

const navItems = [
  { key: 'navHome', path: '/home', Icon: Home },
  { key: 'navRides', path: '/rides', Icon: Clock },
  { key: 'navOffers', path: '/offers', Icon: Tag },
  { key: 'navProfile', path: '/profile', Icon: User },
];

const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenPaths = ['/', '/onboarding', '/login', '/signup', '/driver-apply', '/admin', '/admin-panel'];
  if (hiddenPaths.includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-dark-200/30 safe-bottom bg-white/95 backdrop-blur-lg">
      <div className="flex items-center justify-around min-h-[64px] max-w-lg mx-auto px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ key, path, Icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[52px] rounded-2xl transition-all duration-300 active:scale-95
                ${isActive 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-dark-400 hover:text-dark-600'
                }`}
            >
              <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {t(key)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
