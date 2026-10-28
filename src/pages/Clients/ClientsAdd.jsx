import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import AddPage from '../../components/AddPage';
import { useGet } from '../../hooks/useGet';
import { Loader2 } from 'lucide-react';

export default function ClientsAddPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = !!id;

  // جلب الأقسام لعرضها في قائمة الاختيار المتعدد (Multi-select)
  const { data: sectionsResponse, isLoading: isLoadingSections } = useGet('sections-dropdown', '/api/admin/sections');
  const sectionsList = sectionsResponse?.data?.sections ?? sectionsResponse?.sections ?? [];
  const sectionOptions = Array.isArray(sectionsList)
    ? sectionsList.map(s => ({ label: s.name || s.ar_name, value: s._id }))
    : [];

  // جلب بيانات العميل المحدد من /api/admin/clients/{id}
  const { data: clientResponse, isLoading: isLoadingClient } = useGet(
    ['client', id],
    id ? `/api/admin/clients/${id}` : null,
    {},
    { enabled: isEdit }
  );

  const rawClient = clientResponse?.data?.client || location.state?.client;
  
  const initialClientData = rawClient ? {
    ...rawClient,
    id: rawClient._id || rawClient.id,
    sections: Array.isArray(rawClient.sections) 
      ? rawClient.sections.map(sec => typeof sec === 'object' ? sec._id : sec) 
      : []
  } : null;

  if ((isEdit && isLoadingClient) || isLoadingSections) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-slate-500">Loading client data...</p>
      </div>
    );
  }

  const fields = [
    {
      name: 'company_name',
      label: 'Company Name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'text',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: !isEdit,
    },
    {
      name: 'subdomain',
      label: 'Subdomain',
      type: 'text',
      required: true,
    },
    {
      name: 'logoBase64',
      label: 'Company Logo',
      type: 'file',
      required: false,
    },
    {
      name: 'sales_man_name',
      label: 'Sales Agent Name',
      type: 'text',
      required: true,
    },
    {
      name: 'sales_man_phone',
      label: 'Sales Agent Phone',
      type: 'text',
      required: true,
    },
    {
      name: 'operation_status',
      label: 'Operation Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Sales', value: 'sales' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      name: 'payment_cycle',
      label: 'Payment Cycle',
      type: 'select',
      required: true,
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Yearly', value: 'yearly' },
      ],
    },
    {
      name: 'payment_amount',
      label: 'Payment Amount',
      type: 'number',
      required: true,
    },
    {
      name: 'sections',
      label: 'Assigned Sections',
      type: 'multi-select',
      required: false,
      options: sectionOptions,
    },
  ];

  // 💡 تنظيف الـ Payload واستبعاد الحقول القديمة التي لم تعد مدعومة
  const transformPayload = (data) => {
    const { category_id, subcategory_id, ...rest } = data;
    return rest;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <AddPage
        title="Client Account"
        apiUrl="/api/admin/clients"
        queryKey="clients"
        method={isEdit ? 'PATCH' : 'POST'}
        fields={fields}
        initialData={initialClientData}
        transformPayload={transformPayload}
        onSuccessAction={() => navigate('/clients')}
      />
    </div>
  );
}