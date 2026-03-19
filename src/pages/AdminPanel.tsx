import React from 'react';
import { useAppStore } from '../store';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

/**
 * منطقة الإدارة: منفصلة عن تسجيل دخول الراكب (AuthPage/OTP).
 * - الدخول هنا بكلمة مرور المدير فقط (adminAuthenticated).
 * - مرتبطة بالتطبيق: الوصول من Profile → "لوحة الإدارة"، والخروج يعيد إلى /home.
 */
const AdminPanel: React.FC = () => {
  const adminAuthenticated = useAppStore((s) => s.adminAuthenticated);

  if (!adminAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
};

export default AdminPanel;
