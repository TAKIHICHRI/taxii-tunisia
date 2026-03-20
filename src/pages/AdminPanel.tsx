import React, { useState, useEffect } from 'react';
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
