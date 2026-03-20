# 🚕 Alou — تطبيق تاكسي القصرين

تطبيق تاكسي محلي لمدينة القصرين، تونس.  
مبني بـ **React + TypeScript + Firebase + Capacitor**.

---

## ✨ الميزات

| الميزة | الحالة |
|--------|--------|
| خريطة تفاعلية (OpenStreetMap) | ✅ يعمل |
| تسجيل دخول بـ OTP (رسالة SMS) | ✅ جاهز — يحتاج Firebase |
| 3 لغات: عربي، فرنسي، إنجليزي | ✅ يعمل |
| الوضع الليلي | ✅ يعمل |
| دفع بالكاش / المحفظة / D17 | ✅ واجهة جاهزة |
| نظام عروض وإحالة | ✅ يعمل |
| لوحة إدارة | ✅ يعمل |
| PWA (تثبيت على الهاتف) | ✅ جاهز — يحتاج أيقونات |
| Android APK (Capacitor) | ✅ جاهز — يحتاج Keystore |
| تتبع السائق في الوقت الحقيقي | ⏳ يحتاج Firebase |

---

## 🚀 تشغيل المشروع

### 1. تثبيت الاعتمادات
```bash
npm install
```

### 2. إعداد Firebase
```bash
# انسخ ملف البيئة
cp .env.example .env

# افتح ملف .env وضع credentials Firebase الخاصة بك
```

### 3. تشغيل محلي
```bash
npm run dev
```

### 4. رفع على Vercel
```bash
npm run build
npm run deploy
```

---

## 📱 بناء APK للأندرويد

```bash
npm run build
npx cap sync android
npx cap open android
# ثم من Android Studio: Build → Generate Signed APK
```

---

## 🔧 متغيرات البيئة المطلوبة

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_SLUG=admin
```

---

## 🏗️ هيكل المشروع

```
src/
├── pages/          # الصفحات (Home, Rides, Profile...)
├── components/     # مكونات مشتركة (BottomNav, Toast...)
├── store/          # إدارة الحالة (Zustand)
├── services/       # Firebase Auth & Firestore
└── types/          # تعريفات TypeScript
```

---

## 📋 ما تبقى للإطلاق

- [ ] ربط Firebase (credentials)
- [ ] إنشاء أيقونات التطبيق
- [ ] بناء واجهة السائق
- [ ] إنشاء Keystore لتوقيع APK
- [ ] رفع على Play Store

---

صنعه بحب من القصرين 🇹🇳
