// TenantAdd.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddPage from '@/components/AddPage';
import { useTranslation } from '@/hooks/useTranslation';

export default function TenantAdd() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // تعريف الحقول المطابقة لهيكل الـ JSON المطلوبة للـ API
  const fields = [
    {
      name: 'amount',
      label: t('amount') || 'المبلغ',
      type: 'number',
      required: true,
    },
    {
      name: 'method',
      label: t('paymentMethod') || 'طريقة الدفع',
      type: 'select',
      required: true,
      options: [
        { value: 'bank_transfer', label: t('bankTransfer') || 'تحويل بنكي (Bank Transfer)' },
        { value: 'cash', label: t('cash') || 'نقدي (Cash)' },
        { value: 'card', label: t('creditCard') || 'بطاقة ائتمان (Credit Card)' },
      ],
    },
    {
      name: 'payment_cycle',
      label: t('paymentCycle') || 'دورة الدفع',
      type: 'select',
      required: true,
      options: [
        { value: 'monthly', label: t('monthly') || 'شهري (Monthly)' },
        { value: 'quarterly', label: t('quarterly') || 'ربع سنوي (Quarterly)' },
        { value: 'yearly', label: t('yearly') || 'سنوي (Yearly)' },
      ],
    },
    {
      name: 'reference',
      label: t('referenceNumber') || 'رقم المرجع / الملاحظة المالية',
      type: 'text',
      required: true,
    },
    {
      name: 'screenshot',
      label: t('receiptScreenshot') || 'صورة الإيصال / السكرين شوت',
      type: 'file',
      required: false,
    },
    {
      name: 'notes',
      label: t('notes') || 'ملاحظات إضافية',
      type: 'text',
      required: false,
    },
  ];

  return (
    <div className="py-6">
      <AddPage
        title={t('paymentRecord') || 'سجل دفعة جديدة'}
        apiUrl="/api/tenant/payments"
        queryKey="tenant-payments"
        method="POST"
        fields={fields}
        onSuccessAction={() => {
          navigate('/tenant');
        }}
      />
    </div>
  );
}