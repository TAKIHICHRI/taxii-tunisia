import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const seen = localStorage.getItem('alou_onboarding');
    const timer = setTimeout(() => {
      navigate(seen ? '/login' : '/onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-20 -start-10 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute bottom-32 -end-10 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute top-1/3 end-10 w-20 h-20 bg-white/5 rounded-full" />

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15, delay: 0.2 }}
        className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-6"
      >
        <span className="text-5xl">🚕</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-white font-black text-5xl mb-2"
      >
        Alou
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-white/80 text-base font-medium"
      >
        {t('appSlogan')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-10"
      >
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-white/60 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SplashPage;
