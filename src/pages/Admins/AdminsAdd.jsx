import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import AddPage from '../../components/AddPage';
import { useGet } from '../../hooks/useGet';
import { Loader2 } from 'lucide-react';

export default function AdminAddPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = !!id;

  // جلب بيانات الأدمن في حالة التعديل إذا لم تكن موجودة في الـ state
  const { data: adminResponse, isLoading: isLoadingAdmin } = useGet(
    ['admin', id], 
    `/api/admin/admins/${id}`, 
    { enabled: isEdit && !location.state?.admin }
  );

  const initialAdminData = location.state?.admin || adminResponse?.data?.admin || adminResponse?.data || adminResponse;

  if (isEdit && isLoadingAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">جاري تحميل البيانات...</p>
      </div>
    );
  }

  // قائمة الصلاحيات المتاحة (Permissions Options) بناءً على النظام
  const permissionOptions = [
    { label: 'Clients Read (قراءة العملاء)', value: 'clients:read' },
    { label: 'Clients Create (إضافة عملاء)', value: 'clients:create' },
    { label: 'Clients Update (تعديل عملاء)', value: 'clients:update' },
    { label: 'Clients Delete (حذف عملاء)', value: 'clients:delete' },
    { label: 'Sales Read (قراءة المبيعات)', value: 'sales:read' },
    { label: 'Sales Create (إضافة مبيعات)', value: 'sales:create' },
    { label: 'Sales Update (تعديل مبيعات)', value: 'sales:update' },
    { label: 'Sales Delete (حذف مبيعات)', value: 'sales:delete' },
    { label: 'Packages Read (قراءة الباقات)', value: 'packages:read' },
    { label: 'Audit Read (قراءة السجلات)', value: 'audit:read' },
    { label: 'Admins Read (قراءة الأدمنز)', value: 'admins:read' },
    { label: 'Admins Create (إضافة أدمنز)', value: 'admins:create' },
  ];

  const fields = [
    {
      name: 'name',
      label: 'الاسم',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'البريد الإلكتروني',
      type: 'email',
      required: true,
    },
    {
      name: 'password',
      label: 'كلمة المرور',
      type: 'password',
      required: !isEdit, // كلمة المرور غير إجبارية عند التعديل إذا تركناها فارغة
    },
    {
      name: 'status',
      label: 'الحالة',
      type: 'select',
      required: true,
      options: [
        { label: 'نشط (Active)', value: 'active' },
        { label: 'غير نشط (Inactive)', value: 'inactive' },
      ],
    },
    {
      name: 'permissions',
      label: 'الصلاحيات (Permissions)',
      type: 'multi-select',
      required: false,
      options: permissionOptions,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <AddPage
        title="أدمن"
        apiUrl="/api/admin/admins"
        queryKey="admins"
        method={isEdit ? 'PATCH' : 'POST'}
        fields={fields}
        initialData={initialAdminData}
        onSuccessAction={() => navigate('/admins')}
      />
    </div>
  );
}