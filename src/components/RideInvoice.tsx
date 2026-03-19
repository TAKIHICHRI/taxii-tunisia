import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Share2, Printer } from 'lucide-react';
import type { Ride } from '../types';

interface RideInvoiceProps {
  ride: Ride;
  onClose: () => void;
}

const RideInvoice: React.FC<RideInvoiceProps> = ({ ride, onClose }) => {
  const { t } = useTranslation();
  const invoiceRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = [
      `Alou - ${t('rideDetails')}`,
      `${t('from')}: ${ride.pickup.address}`,
      `${t('to')}: ${ride.destination.address}`,
      `${t('date')}: ${new Date(ride.createdAt).toLocaleString()}`,
      `${t('price')}: ${ride.price} ${t('currency')}`,
      ride.driver ? `Driver: ${ride.driver.name} - ${ride.driver.vehicleModel}` : '',
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Alou - ' + t('rideDetails'),
          text,
        });
      } catch {
        navigator.clipboard.writeText(text);
      }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        ref={invoiceRef}
        className="bg-white dark:bg-dark-800 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl print:shadow-none print:max-h-none"
      >
        <div className="sticky top-0 bg-white dark:bg-dark-800 p-4 border-b border-dark-100 dark:border-dark-600 flex justify-between items-center print:hidden">
          <h2 className="font-bold text-dark-900 dark:text-white">{t('invoice')}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center"
              title={t('shareRide')}
            >
              <Share2 size={20} />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="w-10 h-10 rounded-xl bg-dark-100 dark:bg-dark-600 flex items-center justify-center"
              title={t('print')}
            >
              <Printer size={20} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-dark-100 dark:bg-dark-600 flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 print:p-6">
          <div className="text-center border-b border-dark-100 dark:border-dark-600 pb-4">
            <h1 className="text-xl font-extrabold text-primary-600">Alou</h1>
            <p className="text-dark-500 dark:text-dark-400 text-sm">{t('invoice')}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-dark-400">{t('date')}</span>
            <span className="text-end font-medium">{new Date(ride.createdAt).toLocaleString()}</span>
            <span className="text-dark-400">{t('from')}</span>
            <span className="text-end">{ride.pickup.address}</span>
            <span className="text-dark-400">{t('to')}</span>
            <span className="text-end">{ride.destination.address}</span>
            <span className="text-dark-400">{t('distance')}</span>
            <span className="text-end">{ride.distance} {t('km')}</span>
            <span className="text-dark-400">{t('duration')}</span>
            <span className="text-end">{ride.duration} {t('minutes')}</span>
            <span className="text-dark-400">{t('rideType')}</span>
            <span className="text-end">{t(ride.rideType)}</span>
          </div>

          {ride.driver && (
            <div className="bg-dark-50 dark:bg-dark-700 rounded-xl p-3 text-sm">
              <p className="text-dark-500 dark:text-dark-400">{t('driver')}</p>
              <p className="font-medium">{ride.driver.name} • {ride.driver.vehicleModel} • {ride.driver.plateNumber}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t-2 border-dark-200 dark:border-dark-600">
            <span className="font-bold text-dark-900 dark:text-white">{t('total')}</span>
            <span className="text-xl font-extrabold text-primary-600">{ride.price} {t('currency')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideInvoice;
