import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GenericDataTable from '../../components/GenericDataTable'
import { useGet } from '../../hooks/useGet'
import { Shield, ShieldAlert, Eye, X } from 'lucide-react'
import { Button } from '../../components/ui/button'

export default function AdminsPage() {
  const navigate = useNavigate()
  const { data: responseData, isLoading } = useGet('admins', '/api/admin/admins')
  
  const admins = responseData?.data?.admins ?? responseData?.admins ?? []

  // حالة تحكم للـ Dialog الخاص بعرض الصلاحيات
  const [permissionsDialog, setPermissionsDialog] = useState({
    isOpen: false,
    adminName: "",
    permissions: [],
  });

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex flex-col items-start">
          <span className="font-bold text-slate-800 dark:text-slate-200">{row.original.name}</span>
          <span className="text-xs text-slate-400">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'is_root',
      header: 'Type',
      cell: ({ row }) => {
        const isRoot = row.original.is_root;
        return (
          <div className="flex items-center gap-1.5 justify-center">
            {isRoot ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Shield size={12} /> Root Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShieldAlert size={12} /> Sub Admin
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => {
        const permissions = row.original.permissions || [];
        return (
          <div className="flex items-center gap-2 justify-center">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg">
              {permissions.length} permissions
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPermissionsDialog({
                isOpen: true,
                adminName: row.original.name,
                permissions: permissions,
              })}
              className="h-8 px-3 text-xs rounded-lg gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Eye size={14} /> View
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      // تم إزالة الـ cell المخصص القديم هنا، لكي يتولى GenericDataTable تحويله إلى Switch تفاعلي تلقائياً
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Admins Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Monitor and manage administrator accounts and system permissions.</p>
        </div>
      </header>

      <GenericDataTable
        title="Admins"
        columns={columns}
        data={admins}
        isLoading={isLoading}
        queryKey="admins"
        editApiUrl="/api/admin/admins" // <-- هذا هو الرابط المسؤول عن تحديث الحالة تلقائياً عند تحريك الـ Switch[cite: 2]
        deleteApiUrl="/api/admin/admins"
        onAdd={() => navigate('/admins/add')}
        onEdit={(admin) => navigate(`/admins/edit/${admin.id}`, { state: { admin } })}
      />

      {/* PERMISSIONS VIEW DIALOG */}
      {permissionsDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-[90%] max-w-lg p-6 relative animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setPermissionsDialog({ isOpen: false, adminName: "", permissions: [] })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Permissions: <span className="text-primary">{permissionsDialog.adminName}</span>
                </h3>
                <p className="text-xs text-slate-400">Total assigned permissions: {permissionsDialog.permissions.length}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 mb-6">
              {permissionsDialog.permissions.length > 0 ? (
                permissionsDialog.permissions.map((perm, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    {perm}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400 w-full text-center py-6">No permissions assigned to this admin.</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setPermissionsDialog({ isOpen: false, adminName: "", permissions: [] })}
                className="w-full sm:w-28 rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}