import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, User, Phone, Mail, MapPin, FileText, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import { submitDriverApplication } from '../services/firestore';

const DriverApplyPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast, addDriverApplication, user } = useAppStore();
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '', phone: user?.phone?.replace('+216', '') || '',
    email: '', city: 'القصرين', experience: '',
    vehicleType: '', vehicleModel: '', vehicleYear: '', plateNumber: '', hasLicense: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitDriverApplication({ ...formData, experience: Number(formData.experience) || 0, hasLicense: !!formData.hasLicense, userId: user?.id });
      addDriverApplication({ ...formData, experience: Number(formData.experience) || 0, hasLicense: !!formData.hasLicense });
      setStep('success');
      addToast('تم إرسال طلبك بنجاح! ✓', 'success');
    } catch { addToast('فشل الإرسال، حاول مجدداً', 'error'); }
    finally { setIsSubmitting(false); }
  };

  if (step === 'success') return (
    <div className="min-h-dvh bg-white dark:bg-dark-900 flex flex-col items-center justify-center px-6 safe-top">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
        <CheckCircle size={80} className="text-emerald-500" />
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="font-extrabold text-dark-900 dark:text-white text-2xl mb-3 text-center">تم استلام طلبك! 🎉</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="text-dark-500 text-center mb-8">سنتواصل معك خلال 24-48 ساعة</motion.p>
      <button onClick={() => navigate('/home')} className="btn-primary w-full max-w-xs">العودة للرئيسية</button>
    </div>
  );

  if (step === 'info') return (
    <div className="min-h-dvh bg-white dark:bg-dark-900 safe-top safe-bottom">
      <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 px-6 pt-12 pb-10">
        <button onClick={() => navigate(-1)} className="absolute top-12 start-4 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <ArrowRight size={20} className="text-white" />
        </button>
        <div className="text-center pt-6">
          <span className="text-5xl block mb-4">🚗</span>
          <h1 className="text-white font-extrabold text-2xl">{t('becomeDriver')}</h1>
        </div>
      </div>
      <div className="px-5 py-6 space-y-4">
        {[{ icon: '💰', title: 'دخل إضافي', desc: 'اكسب ما يصل إلى 800 د.ت شهرياً' },
          { icon: '🕐', title: 'جدول مرن', desc: 'اعمل في الأوقات التي تناسبك' },
          { icon: '📱', title: 'تطبيق سهل', desc: 'استقبال الطلبات بضغطة واحدة' }
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className="flex items-center gap-4 p-4 bg-dark-50 dark:bg-dark-800 rounded-2xl">
            <span className="text-2xl">{item.icon}</span>
            <div><p className="font-bold text-dark-800 dark:text-white text-sm">{item.title}</p>
              <p className="text-dark-500 text-xs mt-0.5">{item.desc}</p></div>
          </motion.div>
        ))}
        <button onClick={() => setStep('form')} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
          {t('applyNow')} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-white dark:bg-dark-900 safe-top safe-bottom">
      <div className="bg-white dark:bg-dark-800 px-5 py-4 border-b border-dark-100 dark:border-dark-600 flex items-center gap-3">
        <button onClick={() => setStep('info')} className="w-10 h-10 bg-dark-50 dark:bg-dark-700 rounded-xl flex items-center justify-center">
          <ArrowRight size={20} className="text-dark-700 dark:text-dark-200" />
        </button>
        <h1 className="font-bold text-dark-900 dark:text-white">تقديم الطلب</h1>
      </div>
      <form onSubmit={handleSubmit} className="px-5 pb-8 pt-4 space-y-4">
        <h3 className="font-bold text-dark-800 dark:text-white">{t('personalInfo')}</h3>
        <div className="relative"><User size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
          <input type="text" placeholder="الاسم الكامل" className="input-field ps-10 text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required /></div>
        <div className="relative"><Phone size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
          <input type="tel" placeholder="+216 98 000 000" className="input-field ps-10 text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} dir="ltr" required /></div>
        <div className="relative"><Mail size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
          <input type="email" placeholder="البريد الإلكتروني" className="input-field ps-10 text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} dir="ltr" /></div>
        <div className="relative"><MapPin size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
          <input type="text" placeholder="المدينة" className="input-field ps-10 text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
        <h3 className="font-bold text-dark-800 dark:text-white pt-2">{t('vehicleInfo')}</h3>
        <select className="input-field text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
          value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })} required>
          <option value="">نوع السيارة</option>
          <option value="sedan">Sedan</option><option value="suv">SUV</option><option value="van">Van</option>
        </select>
        <input type="text" placeholder="موديل السيارة (مثال: Peugeot 208)"
          className="input-field text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
          value={formData.vehicleModel} onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <input type="text" placeholder="سنة الصنع" className="input-field text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.vehicleYear} onChange={e => setFormData({ ...formData, vehicleYear: e.target.value })} dir="ltr" required />
          <input type="text" placeholder="رقم اللوحة" className="input-field text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
            value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} dir="ltr" required />
        </div>
        <input type="number" placeholder="سنوات الخبرة" className="input-field text-sm dark:bg-dark-800 dark:border-dark-600 dark:text-white"
          value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} min="0" max="50" />
        <label className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-2xl cursor-pointer">
          <input type="checkbox" className="w-5 h-5 accent-primary-500"
            checked={formData.hasLicense} onChange={e => setFormData({ ...formData, hasLicense: e.target.checked })} />
          <span className="text-sm text-dark-700 dark:text-dark-200">لدي رخصة قيادة سارية المفعول</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {['صورة رخصة القيادة', 'صورة السيارة'].map((label, i) => (
            <div key={i} className="border-2 border-dashed border-dark-200 dark:border-dark-600 rounded-2xl p-4 flex flex-col items-center gap-2">
              <Upload size={20} className="text-dark-400" />
              <span className="text-xs text-dark-500 font-medium text-center">{label}</span>
              <span className="text-[10px] text-dark-400">قريباً</span>
            </div>
          ))}
        </div>
        <button type="submit" disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          {isSubmitting ? 'جاري الإرسال...' : t('submitApplication')}
        </button>
      </form>
    </div>
  );
};

export default DriverApplyPage;
