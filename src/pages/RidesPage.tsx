import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, FileText, Share2 } from 'lucide-react';
import { useAppStore } from '../store';
import RideInvoice from '../components/RideInvoice';
import type { Ride } from '../types';
import { listenToUserRides } from '../services/firestore';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'completed' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'cancelled' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'ongoing' },
};

const RidesPage: React.FC = () => {
  const { t } = useTranslation();
  const { rideHistory, addRideToHistory, addToast, user } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [invoiceRide, setInvoiceRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const unsub = listenToUserRides(user.id, (rides) => {
      rides.forEach((ride) => {
        const exists = useAppStore.getState().rideHistory.find(r => r.id === ride.id);
        if (!exists) addRideToHistory(ride);
      });
      setLoading(false);
    });
    return unsub;
  }, [user?.id]);

  const filtered = filter === 'all' ? rideHistory : rideHistory.filter(r => r.status === filter);

  const handleShareRide = (ride: Ride) => {
    const text = `Alou\n${t('from')}: ${ride.pickup.address}\n${t('to')}: ${ride.destination.address}\n${t('price')}: ${ride.price} ${t('currency')}`;
    if (navigator.share) navigator.share({ title: 'Alou', text }).catch(() => navigator.clipboard.writeText(text));
    else navigator.clipboard.writeText(text);
    addToast(t('shareRide') + ' ✓', 'success');
  };

  return (
    <div className="min-h-dvh bg-dark-50 dark:bg-dark-900 safe-top pb-24">
      <div className="bg-white dark:bg-dark-800 px-5 pt-5 pb-4 border-b border-dark-100 dark:border-dark-600">
        <h1 className="font-extrabold text-dark-900 dark:text-white text-xl mb-4">{t('rideHistory')}</h1>
        <div className="flex gap-2">
          {(['all', 'completed', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-primary-500 text-dark-900' : 'bg-dark-50 dark:bg-dark-700 text-dark-500'}`}>
              {f === 'all' ? t('navRides') : t(f)}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 pt-4 space-y-3">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-dark-400 text-sm">جاري تحميل الرحلات...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🚕</span>
            <p className="text-dark-400 font-medium">{t('noRides')}</p>
          </div>
        ) : (
          filtered.map((ride, i) => {
            const status = statusColors[ride.status] || statusColors.completed;
            return (
              <motion.div key={ride.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card dark:bg-dark-800 dark:border-dark-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ride.rideType === 'economy' ? '🚕' : ride.rideType === 'comfort' ? '🚙' : '🏎️'}</span>
                    <div>
                      <p className="font-bold text-dark-800 dark:text-white text-sm">{t(ride.rideType)}</p>
                      <p className="text-dark-400 text-xs">{new Date(ride.createdAt).toLocaleDateString('ar-TN')}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-extrabold text-dark-900 dark:text-white">{ride.price} {t('currency')}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${status.bg} ${status.text}`}>{t(status.label)}</span>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-dark-600 dark:text-dark-300 truncate">{ride.pickup.name || ride.pickup.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm text-dark-600 dark:text-dark-300 truncate">{ride.destination.name || ride.destination.address}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-dark-100 dark:border-dark-700">
                  <div className="flex items-center gap-3 text-xs text-dark-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> {ride.duration} {t('minutes')}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {ride.distance.toFixed(1)} {t('km')}</span>
                  </div>
                  {ride.rating && (
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} size={12} className={s < ride.rating! ? 'text-primary-500 fill-primary-500' : 'text-dark-200'} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-dark-100 dark:border-dark-700">
                  <button onClick={() => setInvoiceRide(ride)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-dark-50 dark:bg-dark-700 text-dark-700 dark:text-dark-300 text-xs font-medium">
                    <FileText size={14} /> {t('invoice')}
                  </button>
                  <button onClick={() => handleShareRide(ride)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary-50 text-primary-600 text-xs font-medium">
                    <Share2 size={14} /> {t('shareRide')}
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      {invoiceRide && <RideInvoice ride={invoiceRide} onClose={() => setInvoiceRide(null)} />}
    </div>
  );
};

export default RidesPage;
