import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, RefreshCw, Plus, Eye, Check, X } from 'lucide-react'
import GenericDataTable from '../../components/GenericDataTable'
import { useGet } from '../../hooks/useGet'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'
import api from '../../api/axios'
import { toast } from 'sonner'

export default function PaymentPage() {
  const navigate = useNavigate()
  
  const [clientIdFilter, setClientIdFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Reject dialog state
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedPaymentId, setSelectedPaymentId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingPayment, setViewingPayment] = useState(null)

  // Fetch clients for filter dropdown
  const { data: clientsResponse } = useGet('clients-filter', '/api/admin/clients')
  const clientsList = clientsResponse?.data?.clients ?? clientsResponse?.clients ?? clientsResponse ?? []
  const clientOptions = Array.isArray(clientsList) 
    ? clientsList.map(c => ({ label: c.company_name || c.email || c._id, value: c._id })) 
    : []

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (clientIdFilter && clientIdFilter !== 'all') params.append('client_id', clientIdFilter)
    if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
    if (methodFilter && methodFilter !== 'all') params.append('method', methodFilter)
    if (fromDate) params.append('from', fromDate)
    if (toDate) params.append('to', toDate)
    return params.toString() ? `?${params.toString()}` : ''
  }, [clientIdFilter, statusFilter, methodFilter, fromDate, toDate])

  const { data: responseData, isLoading, refetch } = useGet(['payments', queryParams], `/api/admin/payments${queryParams}`)
  
  const rawPayments = responseData?.data?.payments ?? responseData?.payments ?? responseData ?? []
  const payments = Array.isArray(rawPayments) ? rawPayments.map(p => ({ ...p, id: p._id })) : []

  const handleApprove = async (id) => {
    try {
      await api.post(`/api/admin/payments/${id}/approve`)
      toast.success('Payment approved successfully')
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error?.message || 'Failed to approve payment')
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }
    setIsSubmitting(true)
    try {
      await api.post(`/api/admin/payments/${selectedPaymentId}/reject`, { reason: rejectReason })
      toast.success('Payment rejected')
      setRejectModalOpen(false)
      setRejectReason('')
      setSelectedPaymentId(null)
      refetch()
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error?.message || 'Failed to reject payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleView = async (id) => {
    try {
      const res = await api.get(`/api/admin/payments/${id}`)
      setViewingPayment(res.data?.data?.payment || res.data?.payment || res.data)
      setViewModalOpen(true)
    } catch (error) {
      toast.error('Failed to fetch payment details')
    }
  }

  const columns = [
    {
      accessorKey: 'client_id',
      header: 'Client',
      cell: ({ row }) => {
        const client = row.original.client_id
        return (
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">{client?.company_name || client?.email || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">{client?.email}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = row.original.amount ?? 0
        const currency = row.original.currency || 'EGP'
        return <span className="text-sm font-bold text-emerald-600">{amount} {currency}</span>
      },
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md border bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize">
          {row.original.method?.replace('_', ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'payment_cycle',
      header: 'Cycle',
      cell: ({ row }) => (
        <span className="text-xs capitalize font-medium text-muted-foreground">
          {row.original.payment_cycle || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'reference',
      header: 'Reference',
      cell: ({ row }) => <span className="text-xs font-mono">{row.original.reference || '-'}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const date = row.original.date ? new Date(row.original.date).toLocaleDateString() : '-'
        return <span className="text-xs text-muted-foreground">{date}</span>
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status || 'pending'
        const isRejected = status === 'reject' || status === 'rejected'
        const isApproved = status === 'approved'
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
            isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            isRejected ? 'bg-rose-50 text-rose-700 border border-rose-200' :
            'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {status}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const payment = row.original
        const status = payment.status || 'pending'
        const isPending = status === 'pending'
        return (
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="View Details" onClick={() => handleView(payment._id)}>
              <Eye size={14} />
            </Button>
            {isPending && (
              <>
                <Button size="sm" variant="outline" className="h-8 px-2 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1" onClick={() => handleApprove(payment._id)}>
                  <Check size={14} /> Approve
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-2 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1" onClick={() => { setSelectedPaymentId(payment._id); setRejectModalOpen(true); }}>
                  <X size={14} /> Reject
                </Button>
              </>
            )}
          </div>
        )
      }
    }
  ]

  const resetFilters = () => {
    setClientIdFilter('all')
    setStatusFilter('all')
    setMethodFilter('all')
    setFromDate('')
    setToDate('')
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Payments Management</h1>
          <p className="text-sm text-muted-foreground">
            Review client payments, approve transactions, or reject receipts with reasons.
          </p>
        </div>
        <Button onClick={() => navigate('/payments/add')} className="gap-2 rounded-xl">
          <Plus size={16} /> Add Payment
        </Button>
      </header>

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
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="reject">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[160px] h-10 rounded-xl text-xs font-semibold">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="credit_card">Credit Card</SelectItem>
            <SelectItem value="instapay">InstaPay</SelectItem>
          </SelectContent>
        </Select>

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

        {(clientIdFilter !== 'all' || statusFilter !== 'all' || methodFilter !== 'all' || fromDate || toDate) && (
          <Button variant="ghost" onClick={resetFilters} className="text-xs h-10 text-rose-500 gap-1.5">
            <RefreshCw size={14} /> Reset
          </Button>
        )}
      </div>

      <div>
        <GenericDataTable
          title="Payment Transactions"
          columns={columns}
          data={payments}
          isLoading={isLoading}
          queryKey="payments"
          deleteApiUrl="/api/admin/payments"
          getDeleteLabel={(row) => `Payment: ${row.reference || row._id}`}
          hideEdit={true}
        />
      </div>

      {/* Reject Reason Modal - Send Button has bg-primary */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Please provide a reason for rejecting this payment receipt.</p>
            <Textarea
              placeholder="e.g. Receipt does not match the amount"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="rounded-xl min-h-[100px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} className="rounded-xl">Cancel</Button>
            <Button 
              onClick={handleRejectSubmit} 
              disabled={isSubmitting} 
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {viewingPayment ? (
            <div className="space-y-3 text-sm py-2">
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">Client:</span>
                <span className="font-semibold">{viewingPayment.client_id?.company_name || viewingPayment.client_id || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">Sale No / ID:</span>
                <span className="font-mono text-xs">
                  {viewingPayment.sale_id?.sale_no || viewingPayment.sale_id?._id || viewingPayment.sale_id || 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-emerald-600">{viewingPayment.amount} {viewingPayment.currency || 'EGP'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="capitalize">{viewingPayment.method?.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">Payment Cycle:</span>
                <span className="capitalize">{viewingPayment.payment_cycle || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono">{viewingPayment.reference || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">Date:</span>
                <span>{viewingPayment.date ? new Date(viewingPayment.date).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">Status:</span>
                <span className="uppercase font-bold">{viewingPayment.status || 'pending'}</span>
              </div>
              {viewingPayment.rejection_reason && (
                <div className="grid grid-cols-2 gap-2 border-b pb-2 text-rose-600">
                  <span className="text-muted-foreground">Rejection Reason:</span>
                  <span>{viewingPayment.rejection_reason}</span>
                </div>
              )}
              {viewingPayment.reviewed_by && (
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <span className="text-muted-foreground">Reviewed By:</span>
                  <span>{viewingPayment.reviewed_by?.name || viewingPayment.reviewed_by}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <span className="text-muted-foreground">Notes:</span>
                <span>{viewingPayment.notes || 'None'}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading details...</p>
          )}
          <DialogFooter>
            <Button onClick={() => setViewModalOpen(false)} className="rounded-xl w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}