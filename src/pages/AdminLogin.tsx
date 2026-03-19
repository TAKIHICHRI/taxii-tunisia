import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, ArrowLeft, User, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../store';

const SALT = 'alou-admin-v1';

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const bytes = Array.from(new Uint8Array(buf));
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const setAdminAuthenticated = useAppStore((s) => s.setAdminAuthenticated);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [challenge, setChallenge] = useState<{ a: number; b: number; answer: string } | null>(null);
  const [challengeInput, setChallengeInput] = useState('');

  const ADMIN_HASH = (import.meta as any).env?.VITE_ADMIN_HASH as string | undefined;
  const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD as string | undefined;
  const isProd = ((import.meta as any).env?.MODE || 'development') === 'production';
  const adminConfigured = isProd ? !!ADMIN_HASH : !!(ADMIN_PASSWORD || ADMIN_HASH);

  useEffect(() => {
    const until = Number(localStorage.getItem('alou_admin_lock_until') || '0');
    if (until && until > Date.now()) setLockedUntil(until);
  }, []);

  const attempts = useMemo(() => Number(localStorage.getItem('alou_admin_attempts') || '0'), []);

  useEffect(() => {
    if (!challenge && attempts >= 2) {
      const a = Math.floor(10 + Math.random() * 40);
      const b = Math.floor(10 + Math.random() * 40);
      setChallenge({ a, b, answer: String(a + b) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (lockedUntil && lockedUntil > Date.now()) {
      setError('تم إقفال المحاولات مؤقتاً. حاول لاحقاً.');
      return;
    }
    if (challenge && challengeInput.trim() !== challenge.answer) {
      setError('تحقق الأمان غير صحيح');
      return;
    }
    if (!isProd && ADMIN_PASSWORD) {
      if (password === ADMIN_PASSWORD) {
        localStorage.removeItem('alou_admin_attempts');
        localStorage.removeItem('alou_admin_lock_until');
        setAdminAuthenticated(true);
        return;
      }
    } else if (ADMIN_HASH) {
      const candidate = await sha256Hex(`${password}:${SALT}`);
      if (candidate === ADMIN_HASH) {
        localStorage.removeItem('alou_admin_attempts');
        localStorage.removeItem('alou_admin_lock_until');
        setAdminAuthenticated(true);
        return;
      }
    } else {
      setError('لم يتم ضبط مصادقة المدير. الرجاء ضبط VITE_ADMIN_PASSWORD أو VITE_ADMIN_HASH.');
      return;
    }
    const prev = Number(localStorage.getItem('alou_admin_attempts') || '0') + 1;
    localStorage.setItem('alou_admin_attempts', String(prev));
    if (prev >= 5) {
      const until = Date.now() + 15 * 60 * 1000;
      localStorage.setItem('alou_admin_lock_until', String(until));
      setLockedUntil(until);
      setError('تم إقفال المحاولات 15 دقيقة بسبب محاولات فاشلة متكررة');
    } else {
      setError('كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-dvh bg-dark-900 flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <div className="w-full max-w-sm">
        {!adminConfigured && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-3 mb-6 text-center">
            <p className="text-red-400 text-xs font-medium">
              يجب ضبط متغير البيئة VITE_ADMIN_PASSWORD أو VITE_ADMIN_HASH قبل الدخول.
            </p>
          </div>
        )}

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-primary-500" />
          </div>
          <h1 className="text-xl font-extrabold text-white mb-1">لوحة التحكم (Admin)</h1>
          <p className="text-dark-400 text-sm">مدخل خاص بالمدراء فقط — بكلمة مرور مُعماة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">كلمة مرور المدير</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="أدخل كلمة مرور المدير"
              className="input-field w-full bg-dark-800 border-dark-600 text-white placeholder:text-dark-500"
              autoFocus
            />
          </div>
          {challenge && (
            <div>
              <label className="block text-dark-300 text-sm font-medium mb-2 flex items-center gap-2">
                <ShieldAlert size={16} /> تحقق إضافي
              </label>
              <div className="flex items-center gap-2">
                <span className="text-dark-200">{challenge.a} + {challenge.b} =</span>
                <input
                  type="text"
                  className="input-field bg-dark-800 border-dark-600 text-white w-24"
                  value={challengeInput}
                  onChange={(e) => setChallengeInput(e.target.value)}
                />
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={!!lockedUntil && lockedUntil > Date.now()}>
            دخول لوحة التحكم
            <ArrowRight size={18} />
          </button>
        </form>

        {lockedUntil && lockedUntil > Date.now() && (
          <p className="text-center text-amber-400 text-xs mt-4">الحساب مقفل حتى {new Date(lockedUntil).toLocaleTimeString('ar-TN')}</p>
        )}

        {/* الربط مع تطبيق الركاب: العودة للتطبيق */}
        <div className="mt-8 pt-6 border-t border-dark-700">
          <p className="text-dark-500 text-xs text-center mb-3">تسجيل دخول الركاب من التطبيق العادي</p>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            العودة لتطبيق الركاب
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dark-600 text-dark-400 text-xs"
          >
            <User size={16} />
            تسجيل دخول الراكب (OTP)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
