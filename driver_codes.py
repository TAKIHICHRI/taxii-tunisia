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

# ── 1. DriverDashboard.tsx — صفحة السائق ─────────────────────
write("src/pages/DriverDashboard.tsx", """import React, { useState, useEffect } from 'react';
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
""")

# ── 2. تحديث AdminPanel — إضافة توليد الأكواد ────────────────
write("src/pages/AdminPanel.tsx", """import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Car, TrendingUp, Check, X, LogOut, RefreshCw, Plus, Copy, Clock } from 'lucide-react';
import { useAppStore } from '../store';
import { getDriverApplications, updateDriverApplicationStatus } from '../services/firestore';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'alou2025';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const {
    adminAuthenticated, setAdminAuthenticated,
    rideHistory, extraRevenue,
    generatedDriverCodes, addGeneratedDriverCode,
  } = useAppStore();

  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'codes'>('overview');
  const [codeDuration, setCodeDuration] = useState<'day' | 'week' | 'month'>('week');
  const [codePrice, setCodePrice] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  const loadApplications = async () => {
    setLoading(true);
    try { const data = await getDriverApplications(); setApplications(data); }
    catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (adminAuthenticated) loadApplications(); }, [adminAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) { setAdminAuthenticated(true); setLoginError(''); }
    else setLoginError('كلمة المرور غير صحيحة');
  };

  // توليد كود عشوائي
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ALOU-';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

    const now = new Date();
    let expiresAt: Date;
    if (codeDuration === 'day')   expiresAt = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    else if (codeDuration === 'week') expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    else expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    addGeneratedDriverCode(code, expiresAt.toISOString());
    return code;
  };

  const handleGenerateCode = () => {
    const code = generateCode();
    setCopiedCode(code);
    navigator.clipboard.writeText(code).catch(() => {});
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    await updateDriverApplicationStatus(id, status);
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const durationLabel = { day: 'يوم', week: 'أسبوع', month: 'شهر' };
  const durationPrice = { day: '5 د.ت', week: '20 د.ت', month: '60 د.ت' };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const formatExpiry = (expiresAt: string) => {
    const d = new Date(expiresAt);
    return d.toLocaleDateString('ar-TN') + ' ' + d.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!adminAuthenticated) return (
    <div className="min-h-dvh bg-dark-900 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-800 rounded-3xl p-8 w-full max-w-sm border border-dark-600">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-black text-dark-900">A</span>
          </div>
          <h1 className="text-white font-extrabold text-xl">لوحة الإدارة</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && <div className="p-3 bg-red-900/30 rounded-xl text-red-400 text-sm text-center">{loginError}</div>}
          <input type="password" placeholder="كلمة المرور"
            className="w-full bg-dark-700 border border-dark-600 rounded-2xl px-4 py-3 text-white placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="btn-primary w-full">دخول</button>
        </form>
      </motion.div>
    </div>
  );

  const totalRides = rideHistory.length;
  const totalRevenue = rideHistory.reduce((s, r) => s + (r.price || 0), 0) + extraRevenue;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const activeCodesCount = generatedDriverCodes.filter(c => !isExpired(c.expiresAt)).length;

  return (
    <div className="min-h-dvh bg-dark-900 text-white pb-10">
      <div className="bg-dark-800 px-5 pt-8 pb-5 border-b border-dark-700 flex items-center justify-between">
        <div>
          <h1 className="font-extrabold text-xl">لوحة الإدارة</h1>
          <p className="text-dark-400 text-xs mt-0.5">Alou Taxi — القصرين</p>
        </div>
        <button onClick={() => { setAdminAuthenticated(false); navigate('/'); }}
          className="flex items-center gap-2 text-dark-400 text-sm">
          <LogOut size={16} /> خروج
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto">
        {[
          { key: 'overview', label: 'نظرة عامة' },
          { key: 'codes',    label: `الأكواد (${activeCodesCount})` },
          { key: 'drivers',  label: `الطلبات (${pendingApps})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-primary-500 text-dark-900' : 'bg-dark-800 text-dark-400'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="px-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <TrendingUp size={20} />, label: 'الإيرادات', value: `${totalRevenue.toFixed(1)} د.ت`, color: 'text-emerald-400' },
              { icon: <Car size={20} />,        label: 'الرحلات',   value: totalRides,                        color: 'text-blue-400'    },
              { icon: <Users size={20} />,      label: 'أكواد نشطة', value: activeCodesCount,                 color: 'text-primary-400' },
              { icon: <RefreshCw size={20} />,  label: 'طلبات جديدة', value: pendingApps,                     color: 'text-amber-400'   },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
                <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-dark-400 text-xs mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-700"><h3 className="font-bold text-sm">آخر الرحلات</h3></div>
            {rideHistory.slice(0, 5).length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-6">لا توجد رحلات بعد</p>
            ) : rideHistory.slice(0, 5).map((ride) => (
              <div key={ride.id} className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50 last:border-0">
                <div>
                  <p className="text-sm font-medium truncate max-w-[180px]">{ride.pickup.address}</p>
                  <p className="text-dark-400 text-xs">{new Date(ride.createdAt).toLocaleDateString('ar-TN')}</p>
                </div>
                <span className="text-primary-400 font-bold text-sm">{ride.price} د.ت</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Codes Tab */}
      {activeTab === 'codes' && (
        <div className="px-5 space-y-4">

          {/* توليد كود جديد */}
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Plus size={16} className="text-primary-400" /> توليد كود جديد
            </h3>

            {/* اختيار المدة */}
            <p className="text-dark-400 text-xs mb-2">اختر مدة الاشتراك:</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { key: 'day',   label: 'يوم',   price: '5 د.ت' },
                { key: 'week',  label: 'أسبوع', price: '20 د.ت' },
                { key: 'month', label: 'شهر',   price: '60 د.ت' },
              ].map(d => (
                <button key={d.key} onClick={() => setCodeDuration(d.key as any)}
                  className={`py-3 rounded-xl text-center transition-all border ${codeDuration === d.key ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-600 text-dark-400'}`}>
                  <p className="font-bold text-sm">{d.price}</p>
                  <p className="text-xs mt-0.5 opacity-80">{d.label}</p>
                </button>
              ))}
            </div>

            <button onClick={handleGenerateCode}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={18} /> توليد كود لـ {durationLabel[codeDuration]}
            </button>

            {copiedCode && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-xl text-center">
                <p className="text-emerald-400 text-xs mb-1">تم التوليد والنسخ ✓</p>
                <p className="font-mono font-extrabold text-2xl text-white tracking-widest">{copiedCode}</p>
                <p className="text-dark-400 text-xs mt-1">أرسل هذا الكود للسائق</p>
              </motion.div>
            )}
          </div>

          {/* قائمة الأكواد */}
          <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between">
              <h3 className="font-bold text-sm">جميع الأكواد ({generatedDriverCodes.length})</h3>
            </div>
            {generatedDriverCodes.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-6">لا توجد أكواد بعد</p>
            ) : (
              [...generatedDriverCodes].reverse().map((c) => {
                const expired = isExpired(c.expiresAt);
                return (
                  <div key={c.id} className="px-4 py-3 border-b border-dark-700/50 last:border-0 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-white">{c.code}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${expired ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                          {expired ? 'منتهي' : 'نشط'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={10} className="text-dark-500" />
                        <p className="text-dark-500 text-xs">{formatExpiry(c.expiresAt)}</p>
                      </div>
                    </div>
                    <button onClick={() => handleCopyCode(c.code)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${copiedCode === c.code ? 'bg-emerald-900/50 text-emerald-400' : 'bg-dark-700 text-dark-400'}`}>
                      <Copy size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Drivers Tab */}
      {activeTab === 'drivers' && (
        <div className="px-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-dark-400 text-sm">{applications.length} طلب</p>
            <button onClick={loadApplications} className="text-primary-400 text-sm flex items-center gap-1">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> تحديث
            </button>
          </div>
          {loading ? <div className="text-center py-10 text-dark-400">جاري التحميل...</div>
            : applications.length === 0 ? <div className="text-center py-10 text-dark-500">لا توجد طلبات بعد</div>
            : applications.map((app) => (
              <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-dark-800 rounded-2xl border border-dark-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold">{app.fullName}</p>
                    <p className="text-dark-400 text-xs" dir="ltr">{app.phone}</p>
                    <p className="text-dark-500 text-xs mt-0.5">{app.city} · {app.vehicleModel}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${app.status === 'approved' ? 'bg-emerald-900/50 text-emerald-400' : app.status === 'rejected' ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'}`}>
                    {app.status === 'approved' ? 'مقبول' : app.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </span>
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleStatusChange(app.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-900/30 text-emerald-400 text-sm font-medium">
                      <Check size={14} /> قبول
                    </button>
                    <button onClick={() => handleStatusChange(app.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-900/30 text-red-400 text-sm font-medium">
                      <X size={14} /> رفض
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
""")

# ── 3. تحديث App.tsx — إضافة مسار السائق ────────────────────
write("src/App.tsx", """import React, { useEffect } from 'react';
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
import DriverDashboard from './pages/DriverDashboard';
import AdminPanel from './pages/AdminPanel';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import { useAppStore } from './store';

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
  const hideNav = [adminPath, '/driver'].some(p => location.pathname.startsWith(p));

  return (
    <>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

        <Route path="/login"  element={<PublicOnlyRoute><AuthPage mode="login"  /></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><AuthPage mode="signup" /></PublicOnlyRoute>} />

        <Route path="/home"         element={<PrivateRoute><HomePage        /></PrivateRoute>} />
        <Route path="/rides"        element={<PrivateRoute><RidesPage       /></PrivateRoute>} />
        <Route path="/offers"       element={<PrivateRoute><OffersPage      /></PrivateRoute>} />
        <Route path="/profile"      element={<PrivateRoute><ProfilePage     /></PrivateRoute>} />
        <Route path="/driver-apply" element={<PrivateRoute><DriverApplyPage /></PrivateRoute>} />

        {/* لوحة السائق — مسار منفصل */}
        <Route path="/driver" element={<DriverDashboard />} />

        <Route path={adminPath}    element={<AdminPanel />} />
        <Route path="/admin"       element={<Navigate to="/" replace />} />
        <Route path="/admin-panel" element={<Navigate to="/" replace />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </>
  );
}

export default function App() {
  const { i18n } = useTranslation();
  const { language, isDarkMode } = useAppStore();

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
""")

# ── Git push ──────────────────────────────────────────────────
print("\nPushing to GitHub...")
subprocess.run(["git", "add", "."], cwd=BASE)
result = subprocess.run(
    ["git", "commit", "-m", "add driver activation code system + driver dashboard"],
    cwd=BASE, capture_output=True, text=True
)
if "nothing to commit" in result.stdout:
    print("  Already up to date")
else:
    subprocess.run(["git", "push"], cwd=BASE)
    print("  [OK] Pushed!")

print("""
[DONE] Driver code system is ready!

HOW IT WORKS:
  Admin:  taxii-tunisia.vercel.app/admin  (password: alou2025)
          → Codes tab → Generate code for 1 day / 1 week / 1 month
          → Copy the code → Send to driver

  Driver: taxii-tunisia.vercel.app/driver
          → Enter code → Goes ONLINE
          → Receives ride requests
          → Accept or reject
""")
