import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Car,
  Users,
  UserPlus,
  Key,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Copy,
  LogOut,
  Plus,
  Smartphone,
  BarChart3,
} from 'lucide-react';
import { useAppStore } from '../store';

type AdminTab = 'revenue' | 'rides' | 'drivers' | 'applications' | 'codes' | 'analytics';

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    rideHistory,
    driverApplications,
    generatedDriverCodes,
    setDriverApplicationStatus,
    setAdminAuthenticated,
    addGeneratedDriverCode,
    extraRevenue,
    setExtraRevenue,
    addToast,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('revenue');
  const [d17Input, setD17Input] = useState('');

  const completedRides = rideHistory.filter((r) => r.status === 'completed');
  const totalFromRides = completedRides.reduce((sum, r) => sum + r.price, 0);
  const totalRevenue = totalFromRides + extraRevenue;
  const acceptedDrivers = driverApplications.filter((d) => d.status === 'accepted').length + 2;
  const pendingApplications = driverApplications.filter((d) => d.status === 'pending');

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'revenue', label: 'المداخيل', icon: DollarSign },
    { id: 'analytics', label: 'إحصائيات', icon: BarChart3 },
    { id: 'rides', label: 'الرحلات', icon: Car },
    { id: 'drivers', label: 'السائقون', icon: Users },
    { id: 'applications', label: 'مطالب السائقين', icon: UserPlus },
    { id: 'codes', label: 'توليد كود', icon: Key },
  ];

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const ridesByDay = last7Days.map((day) => ({
    day,
    label: new Date(day).toLocaleDateString('ar-TN', { weekday: 'short', day: 'numeric', month: 'short' }),
    rides: rideHistory.filter((r) => r.createdAt.slice(0, 10) === day).length,
    revenue: rideHistory
      .filter((r) => r.status === 'completed' && r.createdAt.slice(0, 10) === day)
      .reduce((s, r) => s + r.price, 0),
  }));
  const maxRides = Math.max(1, ...ridesByDay.map((d) => d.rides));
  const maxRevenue = Math.max(0.1, ...ridesByDay.map((d) => d.revenue));

  const handleGenerateCode = () => {
    const code = generateCode(8);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    addGeneratedDriverCode(code, expiresAt.toISOString());
    addToast(`تم توليد الكود: ${code} (صالح 24 ساعة)`, 'success');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => addToast('تم نسخ الكود', 'success'));
  };

  const handleAddD17Revenue = () => {
    const val = parseFloat(d17Input.replace(/,/, '.'));
    if (!Number.isFinite(val) || val <= 0) return;
    setExtraRevenue(extraRevenue + val);
    setD17Input('');
    addToast(`تم إضافة ${val} د.ت من تحويل D17`, 'success');
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    navigate('/home'); // العودة لتطبيق الركاب بعد إنهاء جلسة الإدارة
  };

  return (
    <div className="min-h-dvh bg-dark-50 dark:bg-dark-900 safe-top safe-bottom flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-dark-800 to-dark-900 text-white px-5 pt-5 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-extrabold text-lg">لوحة التحكم</h1>
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl bg-red-500/30 flex items-center justify-center active:scale-95"
            title="تسجيل خروج"
          >
            <LogOut size={18} />
          </button>
        </div>
        <p className="text-white/70 text-sm">منطقة الإدارة — مستقلة عن تسجيل دخول الراكب</p>
        <p className="text-white/50 text-xs mt-1">مرتبطة بالتطبيق • إنهاء الجلسة يعيدك لتطبيق الركاب</p>
      </div>

      {/* Tabs */}
      <div className="px-3 -mt-2 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-dark-900 shadow-lg'
                  : 'bg-white dark:bg-dark-800 text-dark-500 dark:text-dark-400 border border-dark-100 dark:border-dark-600'
              }`}
            >
              <Icon size={18} />
              {tab.label}
              {tab.id === 'applications' && pendingApplications.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingApplications.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'revenue' && (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 pt-4"
            >
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 border border-dark-100 dark:border-dark-600 shadow-sm">
                <p className="text-dark-400 dark:text-dark-400 text-sm mb-1">إجمالي المداخيل</p>
                <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">{totalRevenue.toFixed(1)} د.ت</p>
                <p className="text-dark-400 text-xs mt-1">
                  من الرحلات: {totalFromRides.toFixed(1)} د.ت
                  {extraRevenue > 0 && ` + تحويلات D17: ${extraRevenue.toFixed(1)} د.ت`}
                </p>
              </div>
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 border border-dark-100 dark:border-dark-600 shadow-sm">
                <h3 className="font-bold text-dark-900 dark:text-white mb-3 flex items-center gap-2">
                  <Smartphone size={18} />
                  إضافة إيراد من تحويل D17
                </h3>
                <p className="text-dark-500 dark:text-dark-400 text-xs mb-2">
                  عندما يدفع لك سائق عبر D17، سجّل المبلغ هنا.
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="المبلغ (د.ت)"
                    className="input-field flex-1 dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                    value={d17Input}
                    onChange={(e) => setD17Input(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddD17Revenue}
                    className="btn-primary px-4 flex items-center gap-1"
                  >
                    <Plus size={18} />
                    إضافة
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pt-4 space-y-6"
            >
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 border border-dark-100 dark:border-dark-600 shadow-sm">
                <h3 className="font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={20} />
                  الرحلات خلال 7 أيام
                </h3>
                <div className="space-y-3">
                  {ridesByDay.map((d) => (
                    <div key={d.day} className="flex items-center gap-3">
                      <span className="text-dark-600 dark:text-dark-300 text-xs w-20 flex-shrink-0">{d.label}</span>
                      <div className="flex-1 h-6 bg-dark-100 dark:bg-dark-700 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-lg transition-all"
                          style={{ width: `${(d.rides / maxRides) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-end">{d.rides}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 border border-dark-100 dark:border-dark-600 shadow-sm">
                <h3 className="font-bold text-dark-900 dark:text-white mb-4">الإيراد اليومي (د.ت)</h3>
                <div className="space-y-3">
                  {ridesByDay.map((d) => (
                    <div key={d.day} className="flex items-center gap-3">
                      <span className="text-dark-600 dark:text-dark-300 text-xs w-20 flex-shrink-0">{d.label}</span>
                      <div className="flex-1 h-6 bg-dark-100 dark:bg-dark-700 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-lg transition-all"
                          style={{ width: `${(d.revenue / maxRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-end">{d.revenue.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'rides' && (
            <motion.div
              key="rides"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pt-4 space-y-4"
            >
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 border border-dark-100 dark:border-dark-600 shadow-sm">
                <p className="text-dark-400 dark:text-dark-400 text-sm">عدد الرحلات</p>
                <p className="text-2xl font-extrabold text-dark-900 dark:text-white">{rideHistory.length}</p>
              </div>
              {rideHistory.length === 0 ? (
                <div className="text-center py-12 text-dark-400">
                  <Car size={48} className="mx-auto mb-3 opacity-50" />
                  <p>لا توجد رحلات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rideHistory.slice(0, 25).map((ride) => (
                    <div
                      key={ride.id}
                      className="bg-white dark:bg-dark-800 rounded-2xl p-4 border border-dark-100 dark:border-dark-600 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-dark-400">{new Date(ride.createdAt).toLocaleString('ar-TN')}</span>
                        <span className="font-bold text-primary-600">{ride.price} د.ت</span>
                      </div>
                      <p className="text-dark-700 dark:text-dark-300 text-sm">{ride.pickup.address} → {ride.destination.address}</p>
                      <p className="text-dark-400 text-xs mt-1">{ride.rideType} • {ride.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'drivers' && (
            <motion.div
              key="drivers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pt-4"
            >
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 border border-dark-100 dark:border-dark-600 shadow-sm">
                <p className="text-dark-400 dark:text-dark-400 text-sm">عدد السائقين النشطين</p>
                <p className="text-3xl font-extrabold text-dark-900 dark:text-white">{acceptedDrivers}</p>
                <p className="text-dark-500 dark:text-dark-400 text-xs mt-1">
                  سائقون مقبولون ويدفعون (بالكود أو D17) لاستقبال الطلبات.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'applications' && (
            <motion.div
              key="applications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pt-4 space-y-3"
            >
              <p className="text-dark-500 dark:text-dark-400 text-sm">
                مطالب أشخاص يريدون أن يصبحوا سائقين في التطبيق. قبول أو رفض.
              </p>
              {driverApplications.length === 0 ? (
                <div className="text-center py-12 text-dark-400">
                  <UserPlus size={48} className="mx-auto mb-3 opacity-50" />
                  <p>لا توجد مطالب</p>
                </div>
              ) : (
                driverApplications.map((driver) => (
                  <div
                    key={driver.id}
                    className="bg-white dark:bg-dark-800 rounded-2xl p-4 border border-dark-100 dark:border-dark-600 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-dark-900 dark:text-white">{driver.fullName}</p>
                        <p className="text-dark-500 text-sm" dir="ltr">{driver.phone}</p>
                        <p className="text-dark-400 text-xs">{driver.vehicleModel} • {driver.plateNumber}</p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          driver.status === 'pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : driver.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {driver.status === 'pending' ? 'معلق' : driver.status === 'accepted' ? 'مقبول' : 'مرفوض'}
                      </span>
                    </div>
                    {driver.status === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-dark-100 dark:border-dark-600">
                        <button
                          onClick={() => setDriverApplicationStatus(driver.id, 'accepted')}
                          className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm"
                        >
                          <CheckCircle size={18} />
                          قبول
                        </button>
                        <button
                          onClick={() => setDriverApplicationStatus(driver.id, 'rejected')}
                          className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm"
                        >
                          <XCircle size={18} />
                          رفض
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'codes' && (
            <motion.div
              key="codes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pt-4 space-y-4"
            >
              <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 border border-dark-100 dark:border-dark-600 shadow-sm">
                <h3 className="font-bold text-dark-900 dark:text-white mb-2">توليد كود للسائق</h3>
                <p className="text-dark-500 dark:text-dark-400 text-sm mb-4">
                  الكود يسمح للسائق باستقبال الطلبات ورؤية الركاب لمدة <strong>24 ساعة</strong>. يعطى للسائق بعد أن يدفع لك عبر D17 أو يمكنك إعطاءه مجاناً.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Key size={20} />
                  توليد كود جديد
                </button>
              </div>

              {generatedDriverCodes.length === 0 ? (
                <div className="text-center py-8 text-dark-400 text-sm">
                  لم يتم توليد أكواد بعد. اضغط "توليد كود جديد" ثم انسخ الكود وأعطه للسائق.
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-bold text-dark-800 dark:text-dark-200 text-sm">الأكواد المولدة حديثاً</h4>
                  {generatedDriverCodes.slice(0, 15).map((item) => {
                    const expired = new Date(item.expiresAt) < new Date();
                    return (
                      <div
                        key={item.id}
                        className={`bg-white dark:bg-dark-800 rounded-2xl p-4 border shadow-sm flex items-center justify-between gap-3 ${
                          expired ? 'border-amber-200 dark:border-amber-800 opacity-75' : 'border-dark-100 dark:border-dark-600'
                        }`}
                      >
                        <div>
                          <p className="font-mono font-bold text-lg text-dark-900 dark:text-white" dir="ltr">{item.code}</p>
                          <p className="text-dark-400 text-xs mt-1">
                            صالح حتى {new Date(item.expiresAt).toLocaleString('ar-TN')}
                            {expired && <span className="text-amber-600 mr-1"> (منتهي)</span>}
                          </p>
                        </div>
                        {!expired && (
                          <button
                            type="button"
                            onClick={() => copyCode(item.code)}
                            className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center"
                            title="نسخ"
                          >
                            <Copy size={18} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
