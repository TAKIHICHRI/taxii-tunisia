# 🚕 دليل إعداد Firebase لتطبيق Alou

## الخطوة 1: إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اضغط "Add project" أو "إضافة مشروع"
3. أدخل اسم المشروع: `alou-taxi-app`
4._DISABLE_GA = true (تعطيل Google Analytics اختياري)
5. انتظر حتى ينشأ المشروع

---

## الخطوة 2: تفعيل المصادقة (Authentication)

1. من القائمة الجانبية: **Build** → **Authentication**
2. اضغط "Get Started"
3. اذهب إلى علامة تبويب **Sign-in method**
4. فعّل **Phone** (الهاتف)
5. أضف رقم الهاتف الخاص بك للاختبار (اختياري)
6. اضغط "Save"

---

## الخطوة 3: إنشاء قاعدة البيانات (Firestore)

1. من القائمة الجانبية: **Build** → **Firestore Database**
2. اضغط "Create database"
3. اختر موقع: `europe-west1` (أقرب لتونس)
4. ابدأ في وضع **Test mode** (للاختبار)
5. اضغط "Create"

---

## الخطوة 4: الحصول على إعدادات المشروع

1. من القائمة الجانبية: ⚙️ (Project Settings)
2. مرّر للأسفل واذهب إلى **Your apps**
3. اضغط على أيقونة **</>** (Web)
4. سجّل التطبيق (أدخل اسم: Alou Web)
5. انسخ إعدادات Firebase:

```
javascript
const firebaseConfig = {
  apiKey: "AIzaSy................",
  authDomain: "alou-taxi-app.firebaseapp.com",
  projectId: "alou-taxi-app",
  storageBucket: "alou-taxi-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:............"
};
```

---

## الخطوة 5: إضافة المتغيرات في Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اختر مشروعك (taxii)
3. اذهب إلى **Settings** → **Environment Variables**
4. أضف المتغيرات التالية:

| المتغير | القيمة |
|---------|--------|
| VITE_FIREBASE_API_KEY | انسخ من إعدادات Firebase |
| VITE_FIREBASE_AUTH_DOMAIN | مشروعك.firebaseapp.com |
| VITE_FIREBASE_PROJECT_ID | اسم مشروعك |
| VITE_FIREBASE_STORAGE_BUCKET | مشروعك.appspot.com |
| VITE_FIREBASE_MESSAGING_SENDER_ID | رقم المرسل |
| VITE_FIREBASE_APP_ID | معرف التطبيق |

5. اضغط "Save"

---

## الخطوة 6: إعادة النشر

1. اذهب إلى **Deployments** في Vercel
2. اضغط على آخر deployment
3. اضغط "Redeploy"

---

## ✅ التحقق من العمل

بعد الإعداد:
- افتح التطبيق
- أدخل رقم الهاتف
- يجب أن تصلك رسالة OTP حقيقية
- بعد التحقق، يتم إنشاء مستخدم في Firestore

---

## 💡 نصائح

- **التكلفة**: Firebase مجاني حتى 100k مستخدم شهرياً
- **الأمان**: في البداية، Firestore في وضع Test يسمح بالقراءة والكتابة للجميع
- **للإنتاج**: غيّر قواعد الأمان قبل الإطلاق الرسمي
