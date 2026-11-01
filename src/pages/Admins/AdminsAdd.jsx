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

  // Fetch admin data only when editing and ID exists
  const { data: adminResponse, isLoading: isLoadingAdmin } = useGet(
    isEdit ? ['admin', id] : null,
    isEdit ? `/api/admin/admins/${id}` : null
  );

  // Fetch roles from the roles API
  const { data: rolesResponse, isLoading: isLoadingRoles } = useGet('roles', '/api/admin/roles');
  
  const roles = rolesResponse?.data?.roles ?? rolesResponse?.roles ?? [];

  const roleOptions = roles.map((role) => ({
    label: role.name,
    value: role.id || role._id,
  }));

  const initialAdminData = location.state?.admin || adminResponse?.data?.admin || adminResponse?.data || adminResponse;

  if (isEdit && isLoadingAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Loading data...</p>
      </div>
    );
  }

  const fields = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: !isEdit, // Password is optional when editing if left blank
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      name: 'role_id',
      label: 'Role',
      type: 'select',
      required: true,
      options: roleOptions,
      disabled: isLoadingRoles,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <AddPage
        title="Admin"
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