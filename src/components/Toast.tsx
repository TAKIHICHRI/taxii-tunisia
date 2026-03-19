import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { X } from 'lucide-react';

const Toast: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] p-4 pt-[calc(env(safe-area-inset-top)+1rem)] max-w-lg mx-auto pointer-events-none flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  onClose: () => void;
}> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    info: 'bg-dark-800 text-white border-dark-700',
    success: 'bg-emerald-600 text-white border-emerald-700',
    error: 'bg-red-600 text-white border-red-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-2xl shadow-lg border px-4 py-3 flex items-center justify-between gap-3 pointer-events-auto ${styles[type]}`}
    >
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-white/20 active:scale-95 transition-transform"
        aria-label="إغلاق"
      >
        <X size={18} />
      </button>
    </motion.div>
  );
};

export default Toast;
