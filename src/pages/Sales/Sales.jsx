import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, Clock, CheckCircle2, Filter, RefreshCw, Plus } from 'lucide-react'
import GenericDataTable from '../../components/GenericDataTable'
import { useGet } from '../../hooks/useGet'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

export default function SalesPage() {
  const navigate = useNavigate()
  
  const [clientIdFilter, setClientIdFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cycleFilter, setCycleFilter] = useState('all')
  const [salesAgentNameFilter, setSalesAgentNameFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortParam, setSortParam] = useState('all')

  // Fetch clients using correct _id and company_name fields
  const { data: clientsResponse } = useGet('clients-filter', '/api/admin/clients')
  const clientsList = clientsResponse?.data?.clients ?? clientsResponse?.clients ?? clientsResponse ?? []
  const clientOptions = Array.isArray(clientsList) 
    ? clientsList.map(c => ({ label: c.company_name || c.email || c._id, value: c._id })) 
    : []

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (clientIdFilter && clientIdFilter !== 'all') params.append('client_id', clientIdFilter)
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
    if (cycleFilter && cycleFilter !== 'all') params.append('cycle', cycleFilter)
    if (salesAgentNameFilter.trim()) params.append('sales_agent_name', salesAgentNameFilter.trim())
    if (fromDate) params.append('from', fromDate)
    if (toDate) params.append('to', toDate)
    if (sortParam && sortParam !== 'all') params.append('sort', sortParam)
    return params.toString() ? `?${params.toString()}` : ''
  }, [clientIdFilter, statusFilter, cycleFilter, salesAgentNameFilter, fromDate, toDate, sortParam])

  const { data: responseData, isLoading } = useGet(['sales', queryParams], `/api/admin/sales${queryParams}`)
  const { data: statsResponse, isLoading: isLoadingStats } = useGet(['sales-stats'], '/api/admin/sales/stats')

  // Map _id to id so GenericDataTable works seamlessly with MongoDB documents
  const rawSales = responseData?.data?.sales ?? responseData?.sales ?? responseData ?? []
  const sales = Array.isArray(rawSales) ? rawSales.map(s => ({ ...s, id: s._id })) : []
  const stats = statsResponse?.data ?? statsResponse ?? {}

  const summary = [
    { label: 'Total Revenue', value: stats.totalAmount ? `${stats.totalAmount} EGP` : sales.length, icon: DollarSign, tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'Pending Sales', value: stats.pendingCount ?? sales.filter(s => s.status === 'pending').length, icon: Clock, tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { label: 'Active / Completed', value: stats.activeCount ?? sales.filter(s => s.status === 'active' || s.status === 'completed').length, icon: CheckCircle2, tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  ]

  const columns = [

    {
      accessorKey: 'client_id',
      header: 'Client',
      cell: ({ row }) => {
        const client = row.original.client_id
        return (
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">{client?.company_name || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">{client?.email}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'sales_agent_name',
      header: 'Sales Agent',
      cell: ({ row }) => {
        const { sales_agent_name, sales_agent_phone } = row.original
        return (
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">{sales_agent_name || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">{sales_agent_phone}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'total',
      header: 'Amount & Total',
      cell: ({ row }) => {
        const amount = row.original.amount ?? 0
        const discount = row.original.discount ?? 0
        const total = row.original.total ?? (amount - discount)
        const currency = row.original.currency || 'EGP'
        return (
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-emerald-600">{total} {currency}</span>
            {discount > 0 && <span className="text-xs text-muted-foreground">Orig: {amount} | Disc: -{discount}</span>}
          </div>
        )
      },
    },
    {
      accessorKey: 'cycle',
      header: 'Cycle',
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize">
          {row.original.cycle}
        </span>
      ),
    },
    {
      accessorKey: 'sale_date',
      header: 'Sale Date',
      cell: ({ row }) => {
        const date = row.original.sale_date ? new Date(row.original.sale_date).toLocaleDateString() : '-'
        return <span className="text-xs text-muted-foreground">{date}</span>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const isPending = status === 'pending'
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
            isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {status}
          </span>
        )
      },
    },
  ]

  const resetFilters = () => {
    setClientIdFilter('all')
    setStatusFilter('all')
    setCycleFilter('all')
    setSalesAgentNameFilter('')
    setFromDate('')
    setToDate('')
    setSortParam('all')
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sales Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage sales transactions, monitor performance metrics, and filter records.
          </p>
        </div>
        <Button onClick={() => navigate('/sales/add')} className="gap-2 rounded-xl">
          <Plus size={16} /> Add Sale
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Sales summary">
        {summary.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
            <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{isLoadingStats ? '–' : value}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3 p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mr-2">
          <Filter size={16} /> Filters:
        </div>

        <Select value={clientIdFilter} onValueChange={setClientIdFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl text-xs font-semibold">
            <SelectValue placeholder="Filter Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clientOptions.map((client) => (
              <SelectItem key={client.value} value={client.value}>{client.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-10 rounded-xl text-xs font-semibold">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={cycleFilter} onValueChange={setCycleFilter}>
          <SelectTrigger className="w-[150px] h-10 rounded-xl text-xs font-semibold">
            <SelectValue placeholder="Cycle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cycles</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <Input 
          placeholder="Sales Agent Name" 
          value={salesAgentNameFilter} 
          onChange={(e) => setSalesAgentNameFilter(e.target.value)} 
          className="w-[160px] h-10 text-xs rounded-xl"
        />

        <Input 
          type="date" 
          placeholder="From Date" 
          value={fromDate} 
          onChange={(e) => setFromDate(e.target.value)} 
          className="w-[150px] h-10 text-xs rounded-xl"
        />

        <Input 
          type="date" 
          placeholder="To Date" 
          value={toDate} 
          onChange={(e) => setToDate(e.target.value)} 
          className="w-[150px] h-10 text-xs rounded-xl"
        />

        <Select value={sortParam} onValueChange={setSortParam}>
          <SelectTrigger className="w-[140px] h-10 rounded-xl text-xs font-semibold">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Default Sort</SelectItem>
            <SelectItem value="amount">Amount (Asc)</SelectItem>
            <SelectItem value="-amount">Amount (Desc)</SelectItem>
            <SelectItem value="sale_date">Date (Asc)</SelectItem>
            <SelectItem value="-sale_date">Date (Desc)</SelectItem>
          </SelectContent>
        </Select>

        {(clientIdFilter !== 'all' || statusFilter !== 'all' || cycleFilter !== 'all' || salesAgentNameFilter || fromDate || toDate || sortParam !== 'all') && (
          <Button variant="ghost" onClick={resetFilters} className="text-xs h-10 text-rose-500 gap-1.5">
            <RefreshCw size={14} /> Reset
          </Button>
        )}
      </div>

      <div>
        <GenericDataTable
          title="Sales Transactions"
          columns={columns}
          data={sales}
          isLoading={isLoading}
          queryKey="sales"
          editApiUrl="/api/admin/sales"
          deleteApiUrl="/api/admin/sales"
          getDeleteLabel={(row) => `Sale: ${row.sale_no || row._id}`}
          onAdd={() => navigate('/sales/add')}
          onEdit={(row) => navigate(`/sales/edit/${row._id}`, { state: { sale: row } })}
        />
      </div>
    </main>
  )
}