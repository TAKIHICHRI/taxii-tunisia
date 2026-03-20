import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-white dark:bg-dark-900 safe-top safe-bottom">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-100 dark:border-dark-700">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-50 dark:bg-dark-800">
          <ArrowRight size={20} className="text-dark-700 dark:text-dark-300" />
        </button>
        <h1 className="font-bold text-dark-900 dark:text-white text-lg">سياسة الخصوصية</h1>
      </div>

      <div className="px-5 py-6 space-y-6 pb-24">
        <p className="text-dark-400 text-sm">آخر تحديث: مارس 2025</p>

        {[
          { title: '1. البيانات التي نجمعها', body: 'نجمع رقم الهاتف للتحقق من الهوية، الموقع الجغرافي لتحديد نقطة الانطلاق والوجهة، وبيانات الرحلات (المسار، السعر، التاريخ).' },
          { title: '2. كيف نستخدم بياناتك', body: 'نستخدم بياناتك فقط لتقديم خدمة التاكسي: ربطك بأقرب سائق، معالجة الدفع، وعرض سجل رحلاتك. لا نبيع بياناتك لأطراف ثالثة.' },
          { title: '3. الموقع الجغرافي', body: 'نطلب إذن الوصول إلى موقعك فقط أثناء استخدام التطبيق. لا نتتبع موقعك في الخلفية. يمكنك رفض هذا الإذن من إعدادات هاتفك في أي وقت.' },
          { title: '4. الأمان', body: 'نحمي بياناتك باستخدام Firebase (Google) الذي يوفر تشفيراً كاملاً للبيانات أثناء النقل وفي حالة السكون.' },
          { title: '5. حذف بياناتك', body: 'يمكنك طلب حذف حسابك وجميع بياناتك في أي وقت عن طريق التواصل معنا.' },
          { title: '6. التواصل', body: 'للأسئلة المتعلقة بالخصوصية: alou.taxi.kasserine@gmail.com' },
        ].map((s, i) => (
          <section key={i}>
            <h2 className="font-bold text-dark-800 dark:text-white mb-2">{s.title}</h2>
            <p className="text-dark-600 dark:text-dark-300 text-sm leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
