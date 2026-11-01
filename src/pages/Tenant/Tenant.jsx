// Tenant.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import GenericDataTable from '@/components/GenericDataTable';
import { useGet } from '@/hooks/useGet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShieldCheck, CreditCard, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function Tenant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // جلب البيانات من الـ API
  const { data: tenants, isLoading: isLoadingTenants } = useGet('tenants', '/api/tenant/verify');
  const { data: payments, isLoading: isLoadingPayments } = useGet('tenant-payments', '/api/tenant/payments');

  // Mutation لتأكيد/توثيق حساب المستأجر
  const verifyTenantMutation = useMutation({
    mutationFn: async (tenantId) => {
      const response = await api.post('/api/tenant/verify', { id: tenantId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tenants']);
      toast.success(t('tenantVerifiedSuccess') || 'تم توثيق حساب المستأجر بنجاح');
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || t('tenantVerifyError') || 'حدث خطأ أثناء التوثيق';
      toast.error(msg);
    },
  });

  // أعمدة جدول المستأجرين
  const tenantColumns = [
    {
      accessorKey: 'name',
      header: t('tenantName') || 'اسم المستأجر',
    },
    {
      accessorKey: 'email',
      header: t('email') || 'البريد الإلكتروني',
    },
    {
      accessorKey: 'phone',
      header: t('phone') || 'رقم الهاتف',
    },
    {
      accessorKey: 'isVerified',
      header: t('verificationStatus') || 'حالة التوثيق',
      cell: ({ row }) => {
        const isVerified = row.original.isVerified;
        return (
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
              isVerified
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60'
            }`}
          >
            {isVerified ? (t('verified') || 'مؤكد') : (t('unverified') || 'غير مؤكد')}
          </span>
        );
      },
    },
    {
      id: 'verifyAction',
      header: t('verifyAction') || 'التوثيق',
      cell: ({ row }) => {
        const isVerified = row.original.isVerified;
        return (
          <Button
            size="sm"
            variant={isVerified ? 'outline' : 'default'}
            disabled={isVerified || verifyTenantMutation.isPending}
            onClick={() => verifyTenantMutation.mutate(row.original.id)}
            className="rounded-xl font-bold gap-1 text-xs"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            {isVerified ? (t('verifiedBtn') || 'تم التوثيق') : (t('verifyBtn') || 'توثيق الحساب')}
          </Button>
        );
      },
    },
  ];

  // أعمدة جدول المدفوعات (Payments Table)
  const paymentColumns = [
    {
      accessorKey: 'reference',
      header: t('reference') || 'رقم المرجع (Ref)',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
          {row.original.reference || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: t('amount') || 'المبلغ',
      cell: ({ row }) => (
        <span className="font-black text-emerald-600 dark:text-emerald-400">
          {row.original.amount} {t('currency') || 'ج.م'}
        </span>
      ),
    },
    {
      accessorKey: 'method',
      header: t('paymentMethod') || 'طريقة الدفع',
      cell: ({ row }) => {
        const methodMap = {
          bank_transfer: t('bankTransfer') || 'تحويل بنكي',
          cash: t('cash') || 'نقدي',
          card: t('card') || 'بطاقة ائتمان',
        };
        return methodMap[row.original.method] || row.original.method;
      },
    },
    {
      accessorKey: 'payment_cycle',
      header: t('paymentCycle') || 'دورة الدفع',
      cell: ({ row }) => {
        const cycleMap = {
          monthly: t('monthly') || 'شهري',
          quarterly: t('quarterly') || 'ربع سنوي',
          yearly: t('yearly') || 'سنوي',
        };
        return cycleMap[row.original.payment_cycle] || row.original.payment_cycle;
      },
    },
    {
      accessorKey: 'screenshot',
      header: t('receipt') || 'الإيصال',
      cell: ({ row }) =>
        row.original.screenshot ? (
          <a
            href={row.original.screenshot}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {t('viewReceipt') || 'عرض الإيصال'}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          '-'
        ),
    },
    {
      accessorKey: 'notes',
      header: t('notes') || 'ملاحظات',
    },
  ];

  return (
    <div className="space-y-10">
      {/* جدول سجل المدفوعات */}
      <GenericDataTable
        title={t('tenantPaymentsTitle') || 'مدفوعات المستأجرين'}
        columns={paymentColumns}
        data={Array.isArray(payments) ? payments : payments?.data || []}
        isLoading={isLoadingPayments}
        queryKey="tenant-payments"
        deleteApiUrl="/api/tenant/payments"
        onAdd={() => navigate('/tenant/add')}
      />

      {/* جدول إدارة وتوثيق حسابات المستأجرين */}
      <GenericDataTable
        title={t('tenantsVerificationTitle') || 'توثيق حسابات المستأجرين'}
        columns={tenantColumns}
        data={Array.isArray(tenants) ? tenants : tenants?.data || []}
        isLoading={isLoadingTenants}
        queryKey="tenants"
        actions={false}
      />
    </div>
  );
}