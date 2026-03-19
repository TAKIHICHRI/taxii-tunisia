import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Clock, Shield, Star, CreditCard } from 'lucide-react';
import { useAppStore } from '../store';

const slides = [
  {
    titleKey: 'onboarding1Title',
    descKey: 'onboarding1Desc',
    Icon: MapPin,
    gradient: 'from-primary-400 to-primary-600',
    bgEmoji: '🚕',
  },
  {
    titleKey: 'onboarding2Title',
    descKey: 'onboarding2Desc',
    Icon: Navigation,
    gradient: 'from-emerald-400 to-emerald-600',
    bgEmoji: '📍',
  },
  {
    titleKey: 'onboarding3Title',
    descKey: 'onboarding3Desc',
    Icon: CreditCard,
    gradient: 'from-blue-400 to-blue-600',
    bgEmoji: '💳',
  },
];

const features = [
  { Icon: Clock, label: 'سريع' },
  { Icon: Shield, label: 'آمن' },
  { Icon: Star, label: 'موثوق' },
];

const OnboardingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setOnboardingSeen = useAppStore((s) => s.setOnboardingSeen);
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      setOnboardingSeen();
      navigate('/login');
    }
  };

  const handleSkip = () => {
    setOnboardingSeen();
    navigate('/login');
  };

  return (
    <div className="h-dvh flex flex-col bg-white overflow-hidden safe-top safe-bottom">
      {/* Skip button */}
      <div className="flex justify-between items-center px-6 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center">
            <span className="text-dark-900 font-black text-sm">A</span>
          </div>
          <span className="font-bold text-dark-800 text-lg">Alou</span>
        </div>
        {current < slides.length - 1 && (
          <button onClick={handleSkip} className="text-dark-400 font-medium text-sm active:scale-95">
            {t('skip')}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center"
          >
            {/* Illustration */}
            {(() => { const CurrentIcon = slides[current].Icon; return (
            <div className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${slides[current].gradient} flex items-center justify-center mb-10 shadow-2xl`}>
              <CurrentIcon size={64} className="text-white" strokeWidth={1.5} />
              <span className="absolute -bottom-2 -right-2 text-5xl animate-bounce-soft">
                {slides[current].bgEmoji}
              </span>
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${slides[current].gradient} opacity-30 animate-pulse-ring`} />
            </div>
            ); })()}

            {/* Text */}
            <h2 className="text-2xl font-extrabold text-dark-900 mb-3 leading-tight">
              {t(slides[current].titleKey)}
            </h2>
            <p className="text-dark-500 text-base leading-relaxed max-w-xs">
              {t(slides[current].descKey)}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Feature badges on first slide */}
        {current === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 mt-8"
          >
            {features.map(({ Icon, label }, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-2xl bg-dark-50 flex items-center justify-center">
                  <Icon size={20} className="text-primary-600" />
                </div>
                <span className="text-xs text-dark-500 font-medium">{label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Bottom */}
      <div className="px-8 pb-8">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-primary-500' : 'w-2 bg-dark-200'
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleNext}
          className="btn-primary w-full text-lg"
        >
          {current === slides.length - 1 ? t('getStarted') : t('next')}
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
