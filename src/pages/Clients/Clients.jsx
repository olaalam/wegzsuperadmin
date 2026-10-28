import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Building2, CheckCircle2, Filter, RefreshCw, Plus, ExternalLink } from 'lucide-react'
import GenericDataTable from '../../components/GenericDataTable'
import { useGet } from '../../hooks/useGet'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { cn } from '@/lib/utils'

export default function ClientsPage() {
  const navigate = useNavigate()
  
  const [statusFilter, setStatusFilter] = useState('all')
  const [sectionIdFilter, setSectionIdFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch sections to populate section filter dropdown
  const { data: sectionsResponse } = useGet('sections-dropdown', '/api/admin/sections')
  const sectionsList = sectionsResponse?.data?.sections ?? sectionsResponse?.sections ?? []
  const sectionOptions = Array.isArray(sectionsList)
    ? sectionsList.map(s => ({ label: s.name || s.ar_name, value: s._id }))
    : []

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
    if (sectionIdFilter && sectionIdFilter !== 'all') params.append('section_id', sectionIdFilter)
    if (searchQuery.trim()) params.append('search', searchQuery.trim())
    return params.toString() ? `?${params.toString()}` : ''
  }, [statusFilter, sectionIdFilter, searchQuery])

  const { data: responseData, isLoading } = useGet(['clients', queryParams], `/api/admin/clients${queryParams}`)

  // Map _id to id and extract clients from response data structure
  const rawClients = responseData?.data?.clients ?? responseData?.clients ?? []
  const clients = Array.isArray(rawClients) ? rawClients.map(c => ({ ...c, id: c._id })) : []

  const summary = [
    { label: 'Total Clients', value: clients.length, icon: Users, tone: 'bg-primary/10 text-primary' },
    { label: 'Active Clients', value: clients.filter(c => c.status === 'active').length, icon: CheckCircle2, tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'Available Sections', value: responseData?.data?.total_sections ?? 8, icon: Building2, tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  ]

  const columns = [
    {
      accessorKey: 'company_name',
      header: 'Company & Subdomain',
      cell: ({ row }) => {
        const { company_name, email, subdomain_url } = row.original
        return (
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{company_name || 'N/A'}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{email}</span>
              {subdomain_url && (
                <a href={subdomain_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-0.5 text-[10px] font-semibold">
                  Visit <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'operation_status',
      header: 'Operation Status',
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {row.original.operation_status || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'payment_amount',
      header: 'Payment & Cycle',
      cell: ({ row }) => {
        const amount = row.original.payment_amount ?? 0
        const cycle = row.original.payment_cycle || 'monthly'
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-emerald-600">{amount} EGP</span>
            <span className="text-xs uppercase text-muted-foreground font-medium">{cycle}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'sections_count',
      header: 'Sections Progress',
      cell: ({ row }) => {
        const count = row.original.sections_count ?? 0
        const total = row.original.total_sections ?? 8
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50">
            {count} / {total} Assigned
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
  ]

  const resetFilters = () => {
    setStatusFilter('all')
    setSectionIdFilter('all')
    setSearchQuery('')
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Clients Management</h1>
          <p className="text-sm text-muted-foreground font-medium">
            Monitor client accounts, subscription payments, and section allocations.
          </p>
        </div>
        <Button onClick={() => navigate('/clients/add')} className="gap-2 rounded-2xl shadow-md h-11 px-5">
          <Plus size={16} /> Add Client
        </Button>
      </header>

      <section className="grid gap-6 sm:grid-cols-3" aria-label="Clients summary">
        {summary.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-4 rounded-3xl border bg-white dark:bg-slate-900 p-6 shadow-xl shadow-slate-100/60 dark:shadow-none transition-all">
            <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tone} shadow-xs`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums leading-none">{value}</p>
              <p className="mt-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3 p-5 bg-white dark:bg-slate-900 rounded-3xl border shadow-xl shadow-slate-100/40 dark:shadow-none">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground mr-2">
          <Filter size={16} /> Filters:
        </div>

        <Input 
          placeholder="Search company, email..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-[220px] h-11 text-xs rounded-xl bg-slate-50/70 dark:bg-slate-800"
        />

        <Select value={sectionIdFilter} onValueChange={setSectionIdFilter}>
          <SelectTrigger className="w-[180px] h-11 rounded-xl text-xs font-semibold bg-slate-50/70 dark:bg-slate-800">
            <SelectValue placeholder="Filter Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sectionOptions.map((sec) => (
              <SelectItem key={sec.value} value={sec.value}>{sec.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-11 rounded-xl text-xs font-semibold bg-slate-50/70 dark:bg-slate-800">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== 'all' || sectionIdFilter !== 'all' || searchQuery) && (
          <Button variant="ghost" onClick={resetFilters} className="text-xs h-11 text-rose-500 gap-1.5 rounded-xl hover:bg-rose-50">
            <RefreshCw size={14} /> Reset
          </Button>
        )}
      </div>

      <div>
        <GenericDataTable
          title="Clients Directory"
          columns={columns}
          data={clients}
          isLoading={isLoading}
          queryKey="clients"
          editApiUrl="/api/admin/clients"
          deleteApiUrl="/api/admin/clients"
          getDeleteLabel={(row) => `Client: ${row.company_name}`}
          onAdd={() => navigate('/clients/add')}
          onEdit={(row) => navigate(`/clients/edit/${row._id}`, { state: { client: row } })}
        />
      </div>
    </main>
  )
}