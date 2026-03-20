import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Wifi, WifiOff, Car, Phone, MapPin, Star } from 'lucide-react';
import { useAppStore } from '../store';

const DriverDashboard: React.FC = () => {
  const { generatedDriverCodes, addToast } = useAppStore();

  const [codeInput, setCodeInput] = useState('');
  const [status, setStatus] = useState<'offline' | 'online' | 'busy'>('offline');
  const [driverInfo, setDriverInfo] = useState<{ code: string; expiresAt: string } | null>(null);
  const [error, setError] = useState('');
  const [currentRequest, setCurrentRequest] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // حساب الوقت المتبقي للكود
  useEffect(() => {
    if (!driverInfo) return;
    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(driverInfo.expiresAt);
      const diff = expires.getTime() - now.getTime();
      if (diff <= 0) {
        setStatus('offline');
        setDriverInfo(null);
        addToast('انتهت صلاحية الكود، يرجى تجديده', 'error');
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) setTimeLeft(`${days} يوم و ${hours} ساعة`);
      else if (hours > 0) setTimeLeft(`${hours} ساعة و ${mins} دقيقة`);
      else setTimeLeft(`${mins} دقيقة`);
    }, 60000);
    // حساب فوري
    const now = new Date();
    const expires = new Date(driverInfo.expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) setTimeLeft(`${days} يوم و ${hours} ساعة`);
    else if (hours > 0) setTimeLeft(`${hours} ساعة و ${mins} دقيقة`);
    else setTimeLeft(`${mins} دقيقة`);
    return () => clearInterval(interval);
  }, [driverInfo]);

  // محاكاة طلب رحلة عشوائي
  useEffect(() => {
    if (status !== 'online') return;
    const timer = setTimeout(() => {
      const requests = [
        { id: 'r1', passenger: 'محمد بن سالم', from: 'حي النور', to: 'المستشفى الجهوي', price: 4.5, distance: 3.2 },
        { id: 'r2', passenger: 'فاطمة الزهراء', from: 'المحطة المركزية', to: 'سوق المركزي', price: 2.5, distance: 1.8 },
        { id: 'r3', passenger: 'علي الحمادي', from: 'وسط المدينة', to: 'حي الأمل', price: 6.0, distance: 4.5 },
      ];
      const req = requests[Math.floor(Math.random() * requests.length)];
      setCurrentRequest(req);
    }, 5000 + Math.random() * 10000);
    return () => clearTimeout(timer);
  }, [status, currentRequest]);

  const handleActivate = () => {
    setError('');
    const code = codeInput.trim().toUpperCase();
    if (!code) { setError('أدخل الكود'); return; }

    // البحث في الأكواد المولّدة
    const found = generatedDriverCodes.find(c => c.code === code);
    if (!found) { setError('الكود غير صحيح'); return; }

    const now = new Date();
    const expires = new Date(found.expiresAt);
    if (expires < now) { setError('انتهت صلاحية هذا الكود'); return; }

    setDriverInfo({ code: found.code, expiresAt: found.expiresAt });
    setStatus('online');
    setCodeInput('');
    addToast('أصبحت EN LIGNE ✓', 'success');
  };

  const handleAccept = () => {
    setStatus('busy');
    addToast('تم قبول الطلب! توجه لنقطة الانطلاق', 'success');
    // محاكاة إنهاء الرحلة بعد 30 ثانية
    setTimeout(() => {
      setCurrentRequest(null);
      setStatus('online');
      addToast('تم إنهاء الرحلة! +' + currentRequest?.price + ' د.ت', 'success');
    }, 30000);
  };

  const handleReject = () => {
    setCurrentRequest(null);
    addToast('تم رفض الطلب', 'info');
  };

  return (
    <div className="min-h-dvh bg-dark-900 text-white safe-top safe-bottom">
      {/* Header */}
      <div className="bg-dark-800 px-5 pt-8 pb-5 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-xl">لوحة السائق</h1>
            <p className="text-dark-400 text-xs mt-0.5">Alou Taxi — القصرين</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            status === 'online' ? 'bg-emerald-900/50 text-emerald-400' :
            status === 'busy'   ? 'bg-blue-900/50 text-blue-400' :
                                  'bg-dark-700 text-dark-400'
          }`}>
            {status === 'online' ? <Wifi size={12} /> : status === 'busy' ? <Car size={12} /> : <WifiOff size={12} />}
            {status === 'online' ? 'متصل' : status === 'busy' ? 'في رحلة' : 'غير متصل'}
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4">

        {/* إدخال الكود */}
        {status === 'offline' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-dark-800 rounded-2xl border border-dark-700 p-5">
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Car size={32} className="text-primary-400" />
              </div>
              <h2 className="font-bold text-lg">أدخل كود التفعيل</h2>
              <p className="text-dark-400 text-sm mt-1">أدخل الكود الذي اشتريته للبدء في استقبال الطلبات</p>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                <XCircle size={16} />{error}
              </div>
            )}
            <input
              type="text"
              placeholder="مثال: ALOU-ABC123"
              className="w-full bg-dark-700 border border-dark-600 rounded-2xl px-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-lg font-bold tracking-widest mb-4"
              value={codeInput}
              onChange={e => setCodeInput(e.target.value.toUpperCase())}
              dir="ltr"
            />
            <button onClick={handleActivate}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <CheckCircle size={18} /> تفعيل الكود
            </button>

            {/* أسعار الاشتراك */}
            <div className="mt-5 pt-5 border-t border-dark-700">
              <p className="text-dark-400 text-xs text-center mb-3">لا يوجد كود؟ تواصل مع المدير</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'يوم واحد', price: '5 د.ت', color: 'border-dark-600' },
                  { label: 'أسبوع', price: '20 د.ت', color: 'border-primary-500' },
                  { label: 'شهر', price: '60 د.ت', color: 'border-emerald-500' },
                ].map((plan, i) => (
                  <div key={i} className={`border ${plan.color} rounded-xl p-3 text-center`}>
                    <p className="text-white font-bold text-sm">{plan.price}</p>
                    <p className="text-dark-400 text-xs mt-0.5">{plan.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* متصل */}
        {status !== 'offline' && driverInfo && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-900/20 border border-emerald-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-emerald-400">أنت EN LIGNE الآن</p>
                <p className="text-dark-400 text-xs">الكود: <span className="text-white font-mono">{driverInfo.code}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-dark-400">
              <Clock size={12} />
              <span>الوقت المتبقي: <span className="text-primary-400 font-medium">{timeLeft}</span></span>
            </div>
            <button
              onClick={() => { setStatus('offline'); setDriverInfo(null); setCurrentRequest(null); }}
              className="mt-4 w-full py-2 rounded-xl bg-dark-700 text-dark-300 text-sm font-medium">
              قطع الاتصال
            </button>
          </motion.div>
        )}

        {/* انتظار طلب */}
        {status === 'online' && !currentRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-dark-800 rounded-2xl border border-dark-700 p-8 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping" />
              <div className="w-16 h-16 bg-primary-500/30 rounded-full flex items-center justify-center">
                <Wifi size={24} className="text-primary-400" />
              </div>
            </div>
            <p className="font-bold text-lg">في انتظار الطلبات...</p>
            <p className="text-dark-400 text-sm mt-2">سيصلك إشعار عند وجود طلب قريب منك</p>
          </motion.div>
        )}

        {/* طلب رحلة جديد */}
        <AnimatePresence>
          {currentRequest && status === 'online' && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-dark-800 rounded-2xl border border-primary-500/50 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-primary-400 text-lg">طلب رحلة جديد! 🚕</h3>
                <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-lg font-bold animate-pulse">جديد</span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">👤</span>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">الراكب</p>
                    <p className="font-bold">{currentRequest.passenger}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">من</p>
                    <p className="font-medium text-sm">{currentRequest.from}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">إلى</p>
                    <p className="font-medium text-sm">{currentRequest.to}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 bg-dark-700 rounded-xl p-3">
                <div className="text-center">
                  <p className="text-dark-400 text-xs">المسافة</p>
                  <p className="font-bold text-white">{currentRequest.distance} كم</p>
                </div>
                <div className="w-px h-8 bg-dark-600" />
                <div className="text-center">
                  <p className="text-dark-400 text-xs">السعر</p>
                  <p className="font-extrabold text-primary-400 text-xl">{currentRequest.price} د.ت</p>
                </div>
                <div className="w-px h-8 bg-dark-600" />
                <div className="text-center">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* في رحلة */}
        {status === 'busy' && !currentRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-blue-900/20 border border-blue-700/50 rounded-2xl p-5 text-center">
            <Car size={40} className="text-blue-400 mx-auto mb-3" />
            <p className="font-bold text-blue-400 text-lg">أنت في رحلة الآن</p>
            <p className="text-dark-400 text-sm mt-1">ستعود للوضع المتصل بعد إنهاء الرحلة</p>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-dark-400">
              <Clock size={12} />
              <span>جاري احتساب الوقت...</span>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default DriverDashboard;
