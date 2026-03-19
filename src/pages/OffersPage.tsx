import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Gift, Copy, Clock, Star, Zap } from 'lucide-react';
import { useAppStore } from '../store';

const OffersPage: React.FC = () => {
  const { t } = useTranslation();
  const { offers } = useAppStore();
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-dvh bg-dark-50 safe-top pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-5 pt-5 pb-8 rounded-b-3xl">
        <h1 className="text-white font-extrabold text-xl mb-1">{t('specialOffers')}</h1>
        <p className="text-white/70 text-sm">{t('appSlogan')}</p>
      </div>

      <div className="px-5 -mt-4 space-y-4">
        

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Zap size={22} className="text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-dark-800 text-sm">{t('loyaltyProgram')}</p>
            <p className="text-dark-400 text-xs">{t('loyaltyDesc')}</p>
          </div>
          <div className="text-center">
            <p className="text-primary-600 font-extrabold text-lg">120</p>
            <p className="text-dark-400 text-[10px]">{t('points')}</p>
          </div>
        </motion.div>

        {/* Offer Cards */}
        {offers.map((offer, i) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 2) * 0.1 }}
            className="card"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gift size={22} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-dark-900 text-sm">{offer.title === 'firstRideFree' ? t('firstRideFree') : offer.title}</p>
                <p className="text-dark-400 text-xs mt-0.5">{offer.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={12} className="text-dark-300" />
                  <span className="text-xs text-dark-400">{t('validUntil')} {new Date(offer.validUntil).toLocaleDateString('ar-TN')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-100">
              <div className="flex-1 bg-dark-50 rounded-xl px-3 py-2 text-center" dir="ltr">
                <span className="font-bold text-dark-800 text-sm tracking-wider">{offer.code}</span>
              </div>
              <button
                onClick={() => copyCode(offer.code)}
                className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  copied === offer.code
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-primary-50 text-primary-600'
                }`}
              >
                <Copy size={14} />
                {copied === offer.code ? '✓' : t('apply')}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OffersPage;
