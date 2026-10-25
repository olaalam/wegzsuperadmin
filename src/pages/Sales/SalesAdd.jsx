import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import AddPage from '../../components/AddPage';
import { useGet } from '../../hooks/useGet';
import { Loader2 } from 'lucide-react';

export default function SalesAddPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = !!id;

  // Fetch client list from /api/admin/clients for the combobox options
  const { data: clientsResponse, isLoading: isLoadingClients } = useGet('clients-dropdown', '/api/admin/clients');
  const clientsList = clientsResponse?.data?.clients ?? clientsResponse?.clients ?? clientsResponse ?? [];
  const clientOptions = Array.isArray(clientsList)
    ? clientsList.map(c => ({ label: `${c.company_name} (${c.email})`, value: c._id }))
    : [];

  // Fetch individual sale data matching { data: { sale: { ... } } }
  const { data: salesResponse, isLoading: isLoadingSales } = useGet(
    ['sales', id], 
    `/api/admin/sales/${id}`, 
    { enabled: isEdit && !location.state?.sale }
  );

  const rawSale = location.state?.sale || salesResponse?.data?.sale || salesResponse?.data;
  
  // Normalize client_id so it extracts the string ID if it's returned as a populated object
  const initialSalesData = rawSale ? {
    ...rawSale,
    client_id: typeof rawSale.client_id === 'object' ? rawSale.client_id?._id : rawSale.client_id
  } : null;

  if ((isEdit && isLoadingSales) || isLoadingClients) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading form data...</p>
      </div>
    );
  }

  const fields = [
    {
      name: 'client_id',
      label: 'Client',
      type: 'combobox',
      required: true,
      options: clientOptions,
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'number',
      required: true,
    },
    {
      name: 'discount',
      label: 'Discount',
      type: 'number',
      required: false,
    },
    {
      name: 'currency',
      label: 'Currency',
      type: 'select',
      required: true,
      options: [
        { label: 'EGP', value: 'EGP' },
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' },
      ],
    },
    {
      name: 'cycle',
      label: 'Billing Cycle',
      type: 'select',
      required: true,
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Yearly', value: 'yearly' },
      ],
    },
    {
      name: 'sale_date',
      label: 'Sale Date',
      type: 'date',
      required: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      name: 'sales_agent_name',
      label: 'Sales Agent Name',
      type: 'text',
      required: true,
    },
    {
      name: 'sales_agent_phone',
      label: 'Sales Agent Phone',
      type: 'text',
      required: true,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'text',
      required: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <AddPage
        title="Sale Record"
        apiUrl="/api/admin/sales"
        queryKey="sales"
        method={isEdit ? 'PATCH' : 'POST'}
        fields={fields}
        initialData={initialSalesData}
        onSuccessAction={() => navigate('/sales')}
      />
    </div>
  );
}