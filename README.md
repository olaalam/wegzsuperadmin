# Wegz Super Admin

واجهة إدارة مبنية باستخدام React وVite وJavaScript، مع دعم RTL باللغة العربية.

## التشغيل

```bash
npm install
npm run dev
```

## الأدوات الأساسية

- **Tailwind CSS v4** مع إعداد **shadcn/ui** ومكوّنات واجهة قابلة لإعادة الاستخدام داخل `src/components/ui`.
- **React Router** للتنقل بين لوحة التحكم وقائمة الأدمنز ونموذج إضافة أدمن.
- **TanStack Table** للبحث والترقيم في الجداول.
- **React Hook Form + Zod** للتحقق من بيانات النماذج.
- **Sonner** لإشعارات العمليات، و**Recharts** لرسوم لوحة التحكم.

## هيكل الميزات

- `src/hooks/use-crud-resource.js`: hook عام لعمليات الإضافة والتعديل والحذف.
- `src/hooks/api/`: hooks موحّدة لطلبات `useGet` و`usePost` و`usePut` و`usePatch` و`useDelete` باستخدام React Query وAxios.
- `src/pages/Admins/Admins.jsx` و`src/pages/Admins/AdminsAdd.jsx`: قائمة الأدمنز ونموذج إضافة أدمن.
- مسارات الإدارة: `/dashboard` و`/admins` و`/admins/new`.
- بيانات الأدمنز تجريبية ومحفوظة محليًا في المتصفح؛ اربطي التخزين بواجهة API عند تجهيز backend.
- انسخي `.env.example` إلى `.env` وضعي عنوان الـAPI في `VITE_API_BASE_URL` عند ربط الـbackend.

الأوامر المتاحة: `npm run dev` للتطوير، `npm run build` للبناء، و`npm run lint` للفحص.
