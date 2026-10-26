import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddPage from '../../components/AddPage';
import { useGet } from '../../hooks/useGet';
import { Loader2 } from 'lucide-react';

export default function PaymentsAddPage() {
  const navigate = useNavigate();

  // Fetch client list for combobox
  const { data: clientsResponse, isLoading: isLoadingClients } = useGet('clients-dropdown', '/api/admin/clients');
  const clientsList = clientsResponse?.data?.clients ?? clientsResponse?.clients ?? clientsResponse ?? [];
  const clientOptions = Array.isArray(clientsList)
    ? clientsList.map(c => ({ label: `${c.company_name} (${c.email})`, value: c._id }))
    : [];

  // Fetch sales list for sale_id combobox
  const { data: salesResponse, isLoading: isLoadingSales } = useGet('sales-dropdown', '/api/admin/sales');
  const salesList = salesResponse?.data?.sales ?? salesResponse?.sales ?? salesResponse ?? [];
  const salesOptions = Array.isArray(salesList)
    ? salesList.map(s => ({ label: `Sale #${s.sale_no || s._id.slice(-6)} - Total: ${s.total || s.amount} EGP`, value: s._id }))
    : [];

  if (isLoadingClients || isLoadingSales) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading form options...</p>
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
      name: 'sale_id',
      label: 'Related Sale',
      type: 'combobox',
      required: true,
      options: salesOptions,
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'number',
      required: true,
    },
    {
      name: 'date',
      label: 'Payment Date & Time',
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'method',
      label: 'Payment Method',
      type: 'select',
      required: true,
      options: [
        { label: 'Bank Transfer', value: 'bank_transfer' },
        { label: 'Cash', value: 'cash' },
        { label: 'Credit Card', value: 'credit_card' },
        { label: 'InstaPay', value: 'instapay' },
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
      name: 'reference',
      label: 'Reference (e.g. TRX-123)',
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
        title="Add Payment Record"
        apiUrl="/api/admin/payments"
        queryKey="payments"
        method="POST"
        fields={fields}
        onSuccessAction={() => navigate('/payments')}
      />
    </div>
  );
}