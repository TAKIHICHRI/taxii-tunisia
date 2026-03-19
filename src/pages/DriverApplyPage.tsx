import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Car, FileText, Shield, Clock, DollarSign, Award, ChevronLeft, Upload, User, Phone, Mail, MapPin } from 'lucide-react';
import { useAppStore } from '../store';

const DriverApplyPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addDriverApplication = useAppStore((s) => s.addDriverApplication);
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: 'القصرين',
    experience: '',
    vehicleType: '',
    vehicleModel: '',
    vehicleYear: '',
    plateNumber: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDriverApplication({
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      experience: formData.experience,
      vehicleType: formData.vehicleType,
      vehicleModel: formData.vehicleModel,
      vehicleYear: formData.vehicleYear,
      plateNumber: formData.plateNumber,
    });
    setStep('success');
  };

  const requirements = [
    { icon: '👤', key: 'req1' },
    { icon: '📋', key: 'req2' },
    { icon: '🚗', key: 'req3' },
    { icon: '✅', key: 'req4' },
  ];

  const perks = [
    { Icon: Clock, key: 'perk1', color: 'text-blue-500', bg: 'bg-blue-50' },
    { Icon: DollarSign, key: 'perk2', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { Icon: Award, key: 'perk3', color: 'text-purple-500', bg: 'bg-purple-50' },
    { Icon: Shield, key: 'perk4', color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  if (step === 'success') {
    return (
      <div className="min-h-dvh bg-white safe-top safe-bottom flex flex-col items-center justify-center px-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
        >
          <CheckCircle size={48} className="text-emerald-500" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-extrabold text-dark-900 mb-2 text-center"
        >
          {t('applicationSent')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-dark-500 text-center mb-8"
        >
          {t('applicationReview')}
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => navigate('/home')}
          className="btn-primary px-8"
        >
          {t('navHome')}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 mb-4">
        <button
          onClick={() => step === 'form' ? setStep('info') : navigate(-1)}
          className="w-10 h-10 rounded-xl bg-dark-100 flex items-center justify-center active:scale-90 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-bold text-dark-900 text-lg">{step === 'info' ? t('becomeDriver') : t('driverForm')}</h1>
      </div>

      {step === 'info' ? (
        <div className="px-5 pb-8">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-primary-400 to-primary-600 rounded-3xl p-6 mb-6 overflow-hidden"
          >
            <div className="absolute -bottom-4 -end-4 text-8xl opacity-20">🚕</div>
            <h2 className="text-white font-extrabold text-2xl mb-2 relative">{t('becomeDriver')}</h2>
            <p className="text-white/80 text-sm relative">{t('driverBenefits')}</p>
          </motion.div>

          {/* Perks */}
          <h3 className="font-bold text-dark-800 mb-3">{t('driverPerks')}</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {perks.map(({ Icon, key, color, bg }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-dark-100/50 rounded-2xl p-4 shadow-sm"
              >
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                  <Icon size={20} className={color} />
                </div>
                <p className="font-semibold text-dark-800 text-sm">{t(key)}</p>
              </motion.div>
            ))}
          </div>

          {/* Requirements */}
          <h3 className="font-bold text-dark-800 mb-3">{t('driverRequirements')}</h3>
          <div className="space-y-2 mb-8">
            {requirements.map(({ icon, key }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 bg-dark-50 rounded-xl p-3"
              >
                <span className="text-lg">{icon}</span>
                <span className="text-dark-700 text-sm font-medium">{t(key)}</span>
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => setStep('form')}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base"
          >
            {t('applyNow')}
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        /* Form */
        <motion.form
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="px-5 pb-8 space-y-4"
        >
          <h3 className="font-bold text-dark-800">{t('personalInfo')}</h3>
          
          <div className="relative">
            <User size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
            <input
              type="text"
              placeholder={t('namePlaceholder')}
              className="input-field ps-10 text-sm"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>
          <div className="relative">
            <Phone size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
            <input
              type="tel"
              placeholder={t('phonePlaceholder')}
              className="input-field ps-10 text-sm"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              dir="ltr"
              required
            />
          </div>
          <div className="relative">
            <Mail size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              className="input-field ps-10 text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
            <input
              type="text"
              placeholder={t('city')}
              className="input-field ps-10 text-sm"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <h3 className="font-bold text-dark-800 pt-2">{t('vehicleInfo')}</h3>
          
          <select
            className="input-field text-sm"
            value={formData.vehicleType}
            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            required
          >
            <option value="">{t('vehicleType')}</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="van">Van</option>
          </select>
          <input
            type="text"
            placeholder={t('vehicleModel')}
            className="input-field text-sm"
            value={formData.vehicleModel}
            onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t('vehicleYear')}
              className="input-field text-sm"
              value={formData.vehicleYear}
              onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
              dir="ltr"
              required
            />
            <input
              type="text"
              placeholder={t('plateNumber')}
              className="input-field text-sm"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
              dir="ltr"
              required
            />
          </div>

          {/* Upload areas */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="border-2 border-dashed border-dark-200 rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <Upload size={20} className="text-dark-400" />
              <span className="text-xs text-dark-500 font-medium">{t('driverLicense')}</span>
            </button>
            <button type="button" className="border-2 border-dashed border-dark-200 rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <Upload size={20} className="text-dark-400" />
              <span className="text-xs text-dark-500 font-medium">{t('vehiclePhoto')}</span>
            </button>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 text-base mt-4">
            <FileText size={18} />
            {t('submitApplication')}
          </button>
        </motion.form>
      )}
    </div>
  );
};

export default DriverApplyPage;
