# Malaab App — Scaffold

مشروع MVP لتطبيق "الملاعب" (Malaab) — شاشة الملاعب بالعربية، تسجيل عبر Supabase (رقم الهاتف)، وبيانات تجريبية.

ميزات مضمّنة في هذا السكافولد:
- Next.js (App Router) + TypeScript + Tailwind CSS
- ش��شة "الملاعب" بالعربية (RTL) مع شريط بحث وفلاتر وِبطاقات ملاعب
- إعداد للاتصال بـ Supabase (بيئة متغيّرة)
- ملفات SQL لمخطط DB وبيانات seed تجريبية

تشغيل محلي (بعد إنشاء مشروع Supabase وربط المفاتيح):

1) انسخ هذا المشروع محلياً أو استعمل GitHub.
2) أنشئ مشروع Supabase مجاني من https://supabase.com
3) في Dashboard > Authentication فعّل Phone (SMS OTP) وقم بإعداد مزوّد SMS أو استخدم وضع الاختبار.
4) أنشئ متغيّرات البيئة في ملف `.env.local`:

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

5) ثبت الحزم وشغّل المشروع:

npm install
npm run dev

6) افتح http://localhost:3000/venues لرؤية شاشة الملاعب.

نقاط لاحقة ومقترحات نشر:
- أنصح بالنشر على Vercel وربط مفاتيح Supabase في إعدادات البيئة.
- استكمل Auth (OTP) باستخدام Supabase وتهيئة SMS provider لإرسال الرموز فعلياً.

