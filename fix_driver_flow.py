#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, subprocess

BASE = os.path.dirname(os.path.abspath(__file__))

def write(path, content):
    full = os.path.join(BASE, path.replace('/', os.sep))
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  [OK] {path}")

write("src/pages/DriverDashboard.tsx", """import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, Wifi, WifiOff, Car,
  User, Phone, Mail, MapPin, FileText, Loader2, ArrowRight,
} from 'lucide-react';
import { useAppStore } from '../store';
import { submitDriverApplication } from '../services/firestore';

type FlowStep = 'apply' | 'pending' | 'activate' | 'online' | 'busy';

const DriverDashboard: React.FC = () => {
  const { generatedDriverCodes, addToast, addDriverApplication, user } = useAppStore();

  // استعادة الحالة من localStorage
  const savedStep = localStorage.getItem('driver_flow_step') as FlowStep | null;
  const savedDriverInfo = localStorage.getItem('driver_flow_info');

  const [step, setStep] = useState<FlowStep>(savedStep || 'apply');
  const [driverInfo, setDriverInfo] = useState<{ code: string; expiresAt: string } | null>(
    savedDriverInfo ? JSON.parse(savedDriverInfo) : null
  );
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone?.replace('+216', '') || '',
    email: '',
    city: 'القصرين',
    experience: '',
    vehicleType: '',
    vehicleModel: '',
    vehicleYear: '',
    plateNumber: '',
    hasLicense: false,
  });

  // حفظ الحالة
  useEffect(() => {
    localStorage.setItem('driver_flow_step', step);
  }, [step]);

  useEffect(() => {
    if (driverInfo) localStorage.setItem('driver_flow_info', JSON.stringify(driverInfo));
    else localStorage.removeItem('driver_flow_info');
  }, [driverInfo]);

  // Countdown للكود
  useEffect(() => {
    if (!driverInfo || step !== 'online') return;
    const interval = setInterval(() => {
      const diff = new Date(driverInfo.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setStep('activate');
        setDriverInfo(null);
        addToast('انتهت صلاحية الكود، يرجى تجديده', 'error');
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (days > 0) setTimeLeft(`${days} يوم و ${hours} ساعة`);
      else if (hours > 0) setTimeLeft(`${hours} ساعة و ${mins} دقيقة`);
      else setTimeLeft(`${mins} دقيقة`);
    }, 30000);
    // حساب فوري
    const diff = new Date(driverInfo.expiresAt).getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) setTimeLeft(`${days} يوم و ${hours} ساعة`);
    else if (hours > 0) setTimeLeft(`${hours} ساعة و ${mins} دقيقة`);
    else setTimeLeft(`${mins} دقيقة`);
    return () => clearInterval(interval);
  }, [driverInfo, step]);

  // محاكاة طلب رحلة
  useEffect(() => {
    if (step !== 'online') return;
    const timer = setTimeout(() => {
      const requests = [
        { id: 'r1', passenger: 'محمد بن سالم', from: 'حي النور', to: 'المستشفى الجهوي', price: 4.5, distance: 3.2 },
        { id: 'r2', passenger: 'فاطمة الزهراء', from: 'المحطة المركزية', to: 'سوق المركزي', price: 2.5, distance: 1.8 },
        { id: 'r3', passenger: 'علي الحمادي', from: 'وسط المدينة', to: 'حي الأمل', price: 6.0, distance: 4.5 },
      ];
      setCurrentRequest(requests[Math.floor(Math.random() * requests.length)]);
    }, 8000 + Math.random() * 12000);
    return () => clearTimeout(timer);
  }, [step, currentRequest]);

  // إرسال طلب الانضمام
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitDriverApplication({
        ...formData,
        experience: Number(formData.experience) || 0,
        hasLicense: !!formData.hasLicense,
        userId: user?.id,
      });
      addDriverApplication({
        ...formData,
        experience: Number(formData.experience) || 0,
        hasLicense: !!formData.hasLicense,
      });
      setStep('pending');
      addToast('تم إرسال طلبك! سنتواصل معك قريباً', 'success');
    } catch {
      addToast('فشل الإرسال، حاول مجدداً', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // تفعيل الكود
  const handleActivate = () => {
    setCodeError('');
    const code = codeInput.trim().toUpperCase();
    if (!code) { setCodeError('أدخل الكود'); return; }
    const found = generatedDriverCodes.find(c => c.code === code);
    if (!found) { setCodeError('الكود غير صحيح'); return; }
    if (new Date(found.expiresAt) < new Date()) { setCodeError('انتهت صلاحية هذا الكود'); return; }
    setDriverInfo({ code: found.code, expiresAt: found.expiresAt });
    setStep('online');
    setCodeInput('');
    addToast('أصبحت EN LIGNE! ابدأ استقبال الطلبات 🚕', 'success');
  };

  const handleAccept = () => {
    setStep('busy');
    addToast('تم قبول الطلب! توجه لنقطة الانطلاق', 'success');
    setTimeout(() => {
      const price = currentRequest?.price;
      setCurrentRequest(null);
      setStep('online');
      addToast(`تم إنهاء الرحلة! +${price} د.ت 💰`, 'success');
    }, 30000);
  };

  const handleReject = () => {
    setCurrentRequest(null);
    addToast('تم رفض الطلب', 'info');
  };

  // ── Header ────────────────────────────────────────────────
  const statusColor = step === 'online' ? 'bg-emerald-900/50 text-emerald-400' : step === 'busy' ? 'bg-blue-900/50 text-blue-400' : 'bg-dark-700 text-dark-400';
  const statusLabel = step === 'online' ? 'متصل' : step === 'busy' ? 'في رحلة' : 'غير متصل';
  const statusIcon = step === 'online' ? <Wifi size={12} /> : step === 'busy' ? <Car size={12} /> : <WifiOff size={12} />;

  return (
    <div className="min-h-dvh bg-dark-900 text-white safe-top safe-bottom">
      {/* Header */}
      <div className="bg-dark-800 px-5 pt-8 pb-5 border-b border-dark-700 flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl">لوحة السائق</h1>
          <p className="text-dark-400 text-xs mt-0.5">Alou Taxi — القصرين</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusColor}`}>
          {statusIcon} {statusLabel}
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: نموذج التسجيل ── */}
          {step === 'apply' && (
            <motion.div key="apply" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Car size={32} className="text-primary-400" />
                </div>
                <h2 className="font-bold text-lg">انضم كسائق مع Alou</h2>
                <p className="text-dark-400 text-sm mt-1">املأ بياناتك وسنراجع طلبك</p>
              </div>

              <form onSubmit={handleApply} className="space-y-3">
                {/* معلومات شخصية */}
                <p className="text-primary-400 text-xs font-bold">المعلومات الشخصية</p>
                <div className="relative">
                  <User size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
                  <input type="text" placeholder="الاسم الكامل"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl ps-9 pe-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
                </div>
                <div className="relative">
                  <Phone size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
                  <input type="tel" placeholder="+216 98 000 000"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl ps-9 pe-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} dir="ltr" required />
                </div>
                <div className="relative">
                  <Mail size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
                  <input type="email" placeholder="البريد الإلكتروني (اختياري)"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl ps-9 pe-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} dir="ltr" />
                </div>
                <div className="relative">
                  <MapPin size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-dark-400" />
                  <input type="text" placeholder="المدينة"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl ps-9 pe-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                </div>

                {/* معلومات السيارة */}
                <p className="text-primary-400 text-xs font-bold pt-2">معلومات السيارة</p>
                <select className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                  value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })} required>
                  <option value="">نوع السيارة</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                </select>
                <input type="text" placeholder="موديل السيارة (مثال: Peugeot 208)"
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                  value={formData.vehicleModel} onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })} required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="سنة الصنع" dir="ltr"
                    className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    value={formData.vehicleYear} onChange={e => setFormData({ ...formData, vehicleYear: e.target.value })} required />
                  <input type="text" placeholder="رقم اللوحة" dir="ltr"
                    className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} required />
                </div>
                <input type="number" placeholder="سنوات الخبرة في القيادة"
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                  value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} min="0" max="50" />
                <label className="flex items-center gap-3 p-3 bg-dark-800 border border-dark-600 rounded-xl cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-primary-500"
                    checked={formData.hasLicense} onChange={e => setFormData({ ...formData, hasLicense: e.target.checked })} />
                  <span className="text-sm text-dark-300">لدي رخصة قيادة سارية المفعول</span>
                </label>

                <button type="submit" disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── STEP 2: انتظار الموافقة ── */}
          {step === 'pending' && (
            <motion.div key="pending" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center py-8">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
                <div className="w-20 h-20 bg-amber-500/30 rounded-full flex items-center justify-center">
                  <Clock size={36} className="text-amber-400" />
                </div>
              </div>
              <h2 className="font-bold text-xl mb-2">طلبك قيد المراجعة</h2>
              <p className="text-dark-400 text-sm mb-6 leading-relaxed">
                تم استلام طلبك بنجاح!<br />
                سنراجعه ونتواصل معك خلال 24 ساعة<br />
                بعد الموافقة ستتلقى كود التفعيل
              </p>
              <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 mb-4">
                <p className="text-dark-400 text-xs mb-1">للتحقق من حالة طلبك تواصل معنا:</p>
                <p className="text-primary-400 font-bold">alou.taxi.kasserine@gmail.com</p>
              </div>
              <button onClick={() => setStep('activate')}
                className="w-full py-3 rounded-2xl border border-dark-600 text-dark-300 text-sm">
                لدي كود تفعيل بالفعل
              </button>
            </motion.div>
          )}

          {/* ── STEP 3: إدخال الكود ── */}
          {step === 'activate' && (
            <motion.div key="activate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} className="text-primary-400" />
                </div>
                <h2 className="font-bold text-lg">أدخل كود التفعيل</h2>
                <p className="text-dark-400 text-sm mt-1">الكود الذي أرسله لك المدير بعد قبول طلبك</p>
              </div>

              {codeError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-900/30 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                  <XCircle size={16} />{codeError}
                </motion.div>
              )}

              <input type="text" placeholder="مثال: ALOU-ABC123"
                className="w-full bg-dark-800 border border-dark-600 rounded-2xl px-4 py-4 text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-xl font-bold tracking-widest mb-4"
                value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())} dir="ltr" />

              <button onClick={handleActivate} className="btn-primary w-full flex items-center justify-center gap-2 mb-4">
                <CheckCircle size={18} /> تفعيل الكود
              </button>

              {/* أسعار */}
              <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
                <p className="text-dark-400 text-xs text-center mb-3">لا يوجد كود؟ تواصل مع المدير للحصول على:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'يوم', price: '5 د.ت', color: 'border-dark-600' },
                    { label: 'أسبوع', price: '20 د.ت', color: 'border-primary-500' },
                    { label: 'شهر', price: '60 د.ت', color: 'border-emerald-500' },
                  ].map((p, i) => (
                    <div key={i} className={`border ${p.color} rounded-xl p-3 text-center`}>
                      <p className="text-white font-bold">{p.price}</p>
                      <p className="text-dark-400 text-xs mt-0.5">{p.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep('pending')}
                className="w-full mt-3 py-2 text-dark-400 text-sm">
                الرجوع لحالة الطلب
              </button>
            </motion.div>
          )}

          {/* ── STEP 4: متصل — انتظار طلب ── */}
          {step === 'online' && !currentRequest && (
            <motion.div key="online-wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* حالة الكود */}
              <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <p className="font-bold text-emerald-400">أنت EN LIGNE الآن</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-400">
                  <Clock size={11} />
                  <span>الوقت المتبقي: <span className="text-primary-400 font-medium">{timeLeft || 'يتم الحساب...'}</span></span>
                </div>
              </div>

              {/* انتظار */}
              <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8 text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping" />
                  <div className="w-16 h-16 bg-primary-500/30 rounded-full flex items-center justify-center">
                    <Wifi size={24} className="text-primary-400" />
                  </div>
                </div>
                <p className="font-bold text-lg">في انتظار الطلبات...</p>
                <p className="text-dark-400 text-sm mt-2">سيصلك إشعار عند وجود طلب قريب</p>
              </div>

              <button onClick={() => { setStep('activate'); setDriverInfo(null); setCurrentRequest(null); }}
                className="w-full mt-4 py-3 rounded-2xl bg-dark-800 border border-dark-700 text-dark-300 text-sm">
                قطع الاتصال
              </button>
            </motion.div>
          )}

          {/* ── STEP 4: طلب رحلة جديد ── */}
          {step === 'online' && currentRequest && (
            <motion.div key="new-request" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
              <div className="bg-dark-800 rounded-2xl border border-primary-500/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-primary-400 text-lg">طلب رحلة جديد! 🚕</h3>
                  <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-lg font-bold animate-pulse">جديد</span>
                </div>

                <div className="space-y-3 mb-4">
                  {[
                    { icon: '👤', label: 'الراكب', value: currentRequest.passenger },
                    { icon: '🟢', label: 'من', value: currentRequest.from },
                    { icon: '🔴', label: 'إلى', value: currentRequest.to },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">{item.icon}</div>
                      <div>
                        <p className="text-xs text-dark-400">{item.label}</p>
                        <p className="font-medium text-sm">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-4 bg-dark-700 rounded-xl p-3">
                  <div className="text-center flex-1">
                    <p className="text-dark-400 text-xs">المسافة</p>
                    <p className="font-bold text-white">{currentRequest.distance} كم</p>
                  </div>
                  <div className="w-px h-8 bg-dark-600" />
                  <div className="text-center flex-1">
                    <p className="text-dark-400 text-xs">السعر</p>
                    <p className="font-extrabold text-primary-400 text-xl">{currentRequest.price} د.ت</p>
                  </div>
                  <div className="w-px h-8 bg-dark-600" />
                  <div className="text-center flex-1">
                    <p className="text-dark-400 text-xs">الدفع</p>
                    <p className="font-bold text-white text-sm">نقداً</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleReject}
                    className="py-3 rounded-2xl bg-red-900/30 text-red-400 font-bold flex items-center justify-center gap-2">
                    <XCircle size={18} /> رفض
                  </button>
                  <button onClick={handleAccept}
                    className="py-3 rounded-2xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> قبول
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: في رحلة ── */}
          {step === 'busy' && (
            <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-blue-900/20 border border-blue-700/50 rounded-2xl p-8 text-center">
              <Car size={48} className="text-blue-400 mx-auto mb-3" />
              <p className="font-bold text-blue-400 text-xl">أنت في رحلة الآن</p>
              <p className="text-dark-400 text-sm mt-2">ستعود للوضع المتصل بعد إنهاء الرحلة</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-dark-400">
                <Clock size={12} />
                <span>جاري احتساب الوقت...</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default DriverDashboard;
""")

print("\nPushing to GitHub...")
subprocess.run(["git", "add", "."], cwd=BASE)
result = subprocess.run(
    ["git", "commit", "-m", "redesign driver flow: apply -> pending -> activate code -> online"],
    cwd=BASE, capture_output=True, text=True
)
if "nothing to commit" in result.stdout:
    print("  Already up to date")
else:
    subprocess.run(["git", "push"], cwd=BASE)
    print("  [OK] Pushed!")

print("""
[DONE] Driver flow redesigned!

New flow:
  1. Driver opens /driver
  2. Fills their info → sends to admin
  3. Waits for approval (pending screen)
  4. Admin approves in /admin → generates code
  5. Driver enters code → goes ONLINE
  6. Receives ride requests → accept or reject
""")
