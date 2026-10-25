import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Shield, ShieldCheck, Eye, X, Users, UserCheck, Loader2 } from 'lucide-react'
import api from '@/api/axios'
import GenericDataTable from '../../components/GenericDataTable'
import { useGet } from '../../hooks/useGet'
import { Button } from '../../components/ui/button'
import DeleteDialog from '@/components/DeleteDialog'

/* ───────────────────────── Status switch ───────────────────────── */

// Self-contained switch (no dependency on the shadcn Switch tokens, so it is always visible).
// Works in LTR and RTL: the thumb sits at the start edge and moves toward the end edge.
function StatusSwitch({ admin }) {
  const queryClient = useQueryClient()
  const [checked, setChecked] = useState(admin.status === 'active')

  useEffect(() => {
    setChecked(admin.status === 'active')
  }, [admin.status])

  const mutation = useMutation({
    mutationFn: (status) => api.patch(`/api/admin/admins/${admin.id}`, { status }),
    onSuccess: (_res, status) => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      toast.success(status === 'active' ? 'Admin activated' : 'Admin deactivated')
    },
    onError: () => {
      setChecked((prev) => !prev) // roll back the optimistic change
      toast.error('Couldn’t update the status. Try again.')
    },
  })

  const toggle = () => {
    if (mutation.isPending) return
    const next = !checked
    setChecked(next) // optimistic
    mutation.mutate(next ? 'active' : 'inactive')
  }

  return (
    <div className="flex items-center justify-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? 'Deactivate admin' : 'Activate admin'}
        onClick={toggle}
        disabled={mutation.isPending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait ${
          checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`grid h-5 w-5 place-items-center rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
          }`}
        >
          {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin text-slate-500" />}
        </span>
      </button>
      <span
        className={`w-14 text-start text-xs font-medium ${
          checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
        }`}
      >
        {checked ? 'Active' : 'Inactive'}
      </span>
    </div>
  )
}

/* ───────────────────────── Permissions dialog ───────────────────────── */

const ACTION_STYLES = {
  read: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
  create: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  update: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  delete: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  approve: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
}
const DEFAULT_ACTION_STYLE = 'bg-muted text-muted-foreground border-border'

// "clients:read" → { clients: ["read"] }
function groupPermissions(permissions) {
  return permissions.reduce((acc, perm) => {
    const [resource, action = 'access'] = String(perm).split(':')
    ;(acc[resource] ||= []).push(action)
    return acc
  }, {})
}

function PermissionsDialog({ dialog, onClose }) {
  const grouped = useMemo(() => groupPermissions(dialog.permissions), [dialog.permissions])
  const resources = Object.keys(grouped)

  useEffect(() => {
    if (!dialog.isOpen) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog.isOpen, onClose])

  if (!dialog.isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Permissions for ${dialog.adminName}`}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border bg-card bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Shield size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold leading-tight">{dialog.adminName}</h3>
              <p className="text-sm text-muted-foreground">
                {dialog.permissions.length} permissions across {resources.length} areas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {resources.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              This admin has no permissions yet. Edit the admin to assign some.
            </p>
          ) : (
            <ul className="divide-y">
              {resources.map((resource) => (
                <li key={resource} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="pt-1 text-sm font-medium capitalize">{resource.replace(/_/g, ' ')}</span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {grouped[resource].map((action) => (
                      <span
                        key={action}
                        className={`rounded-md border px-2 py-0.5 text-xs font-medium ${ACTION_STYLES[action] || DEFAULT_ACTION_STYLE}`}
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t px-6 py-4">
          <Button onClick={onClose} className="w-full rounded-xl sm:w-28">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Page ───────────────────────── */

export default function AdminsPage() {
  const navigate = useNavigate()
  const { data: responseData, isLoading } = useGet('admins', '/api/admin/admins')

  const admins = responseData?.data?.admins ?? responseData?.admins ?? []

  const [permissionsDialog, setPermissionsDialog] = useState({
    isOpen: false,
    adminName: '',
    permissions: [],
  })
  const closeDialog = () => setPermissionsDialog({ isOpen: false, adminName: '', permissions: [] })

  const summary = [
    { label: 'Total admins', value: admins.length, icon: Users, tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { label: 'Active', value: admins.filter((a) => a.status === 'active').length, icon: UserCheck, tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'Root admins', value: admins.filter((a) => a.is_root).length, icon: ShieldCheck, tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  ]

  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const { name, email } = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
              {(name || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex min-w-0 flex-col items-start">
              <span className="truncate text-sm font-semibold">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'is_root',
      header: 'Type',
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.is_root ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
              <ShieldCheck size={13} /> Root admin
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
              <Shield size={13} /> Sub admin
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => {
        const permissions = row.original.permissions || []
        return (
          <div className="flex items-center justify-center gap-2.5">
            <span className="min-w-[5.5rem] text-center text-xs text-muted-foreground">
              {permissions.length} {permissions.length === 1 ? 'permission' : 'permissions'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPermissionsDialog({ isOpen: true, adminName: row.original.name, permissions })
              }
              className="h-8 gap-1.5 rounded-lg px-3 text-xs transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Eye size={14} /> View
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusSwitch admin={row.original} />,
    },
  ]

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admins</h1>
        <p className="text-sm text-muted-foreground">
          Manage who can sign in to the admin panel and what each person is allowed to do.
        </p>
      </header>

      <section
        className="grid gap-4 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
        aria-label="Admins summary"
      >
        {summary.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
            <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{isLoading ? '–' : value}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <GenericDataTable
          title="Admins"
          columns={columns}
          data={admins}
          isLoading={isLoading}
          queryKey="admins"
          editApiUrl="/api/admin/admins"
          deleteApiUrl="/api/admin/admins"
          canDelete={(admin) => !admin.is_root}
          getDeleteLabel={(admin) => `${admin.name} · ${admin.email}`}
          cannotDeleteHint="The root admin can’t be deleted"
          onAdd={() => navigate('/admins/add')}
          onEdit={(admin) => navigate(`/admins/edit/${admin.id}`, { state: { admin } })}
        />
      </div>


      <PermissionsDialog dialog={permissionsDialog} onClose={closeDialog} />
    </main>
  )
}