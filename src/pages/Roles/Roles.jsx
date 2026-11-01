import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import GenericDataTable from '@/components/GenericDataTable';
import { Shield, Users } from 'lucide-react';

export default function RolesPage() {
  const navigate = useNavigate();
  const { data: responseData, isLoading } = useGet('roles', '/api/admin/roles');

  const roles = responseData?.data?.roles ?? responseData?.roles ?? [];

  const columns = [
    {
      accessorKey: 'name',
      header: 'Role Name',
      cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
    },
    {
      accessorKey: 'label',
      header: 'Label (EN)',
      cell: ({ row }) => <span>{row.original.label}</span>,
    },
    {
      accessorKey: 'label_ar',
      header: 'Label (AR)',
      cell: ({ row }) => <span>{row.original.label_ar}</span>,
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => {
        const perms = row.original.permissions || [];
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
            {perms.length} permissions
          </span>
        );
      },
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Roles Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage system roles and assign permissions dynamically.
        </p>
      </header>

      <GenericDataTable
        title="Roles"
        columns={columns}
        data={roles}
        isLoading={isLoading}
        queryKey="roles"
        editApiUrl="/api/admin/roles"
        deleteApiUrl="/api/admin/roles"
        onAdd={() => navigate('/roles/add')}
        onEdit={(role) => navigate(`/roles/edit/${role.id || role._id}`, { state: { role } })}
      />
    </main>
  );
}