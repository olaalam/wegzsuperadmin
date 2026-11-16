import { useEffect, useMemo, useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import GenericDataTable from "../../components/GenericDataTable";
import StatusBadge from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useGet } from "../../hooks/useGet";
import { formatMoney, getApiList, getPageCount, getRecordId, getSubscriptionErrorMessage } from "../subscription-utils";

const initialForm = {
  package_id: "",
  client_id: "",
  payment_method_id: "",
  price: "",
  discount: "",
  final_price: "",
  status: "pending",
  reject_reason: "",
  receipt: null,
};

const getReferenceId = (value) => typeof value === "object" ? getRecordId(value) : value ?? "";
const getRelationName = (value, labelKey) =>
  typeof value === "object" ? value?.[labelKey] ?? value?.name ?? "—" : value ?? "—";

export default function OrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const upgradeClient = location.state?.upgradeClient;
  const [filters, setFilters] = useState({
    status: "all",
    client_id: "all",
    package_id: "all",
    payment_method_id: "all",
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [dialogOpen, setDialogOpen] = useState(Boolean(upgradeClient));
  const [editing, setEditing] = useState(null);
  const [preselectedClient, setPreselectedClient] = useState(upgradeClient ?? null);
  const [form, setForm] = useState(() => upgradeClient
    ? { ...initialForm, client_id: String(getRecordId(upgradeClient)) }
    : initialForm);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewing, setViewing] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const params = useMemo(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.client_id !== "all" ? { client_id: filters.client_id } : {}),
    ...(filters.package_id !== "all" ? { package_id: filters.package_id } : {}),
    ...(filters.payment_method_id !== "all" ? { payment_method_id: filters.payment_method_id } : {}),
  }), [filters, pagination.pageIndex, pagination.pageSize]);

  const { data, isLoading, isError, error, refetch } = useGet(["orders", params], "/api/admin/orders", params);
  const { data: listsResponse, isError: listsError, error: listsRequestError } = useGet(
    "order-form-lists",
    "/api/admin/orders/lists",
  );
  const lists = listsResponse?.data ?? listsResponse ?? {};
  const packages = getApiList(lists, "packages");
  const clients = getApiList(lists, "clients");
  const methods = getApiList(lists, "payment_methods");
  const formClients = preselectedClient && !clients.some((client) => String(getRecordId(client)) === String(getRecordId(preselectedClient)))
    ? [preselectedClient, ...clients]
    : clients;

  useEffect(() => {
    if (isError) toast.error(getSubscriptionErrorMessage(error, "Failed to load orders"));
  }, [isError, error]);
  useEffect(() => {
    if (listsError) toast.error(getSubscriptionErrorMessage(listsRequestError, "Failed to load order form options"));
  }, [listsError, listsRequestError]);

  const orders = getApiList(data, "orders").map((item) => ({ ...item, id: getRecordId(item) }));

  useEffect(() => {
    if (!location.state?.upgradeClient) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const resetFilters = () => {
    setFilters({ status: "all", client_id: "all", package_id: "all", payment_method_id: "all" });
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };
  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  };

  const openForm = (order) => {
    setEditing(order ?? null);
    setPreselectedClient(order && typeof order.client_id === "object" ? order.client_id : null);
    setForm(order ? {
      package_id: getReferenceId(order.package_id),
      client_id: getReferenceId(order.client_id),
      payment_method_id: getReferenceId(order.payment_method_id),
      price: order.price == null ? "" : String(order.price),
      discount: order.discount == null ? "" : String(order.discount),
      final_price: order.final_price == null ? "" : String(order.final_price),
      status: order.status ?? "pending",
      reject_reason: order.reject_reason ?? "",
      receipt: null,
    } : initialForm);
    setDialogOpen(true);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = new FormData();
    payload.append("package_id", form.package_id);
    payload.append("client_id", form.client_id);
    payload.append("payment_method_id", form.payment_method_id);
    ["price", "discount", "final_price"].forEach((key) => {
      if (form[key] !== "") payload.append(key, String(Number(form[key])));
    });
    if (editing) payload.append("status", form.status);
    if (form.reject_reason.trim()) payload.append("reject_reason", form.reject_reason.trim());
    if (form.receipt) payload.append("receipt", form.receipt);
    try {
      const id = getRecordId(editing);
      if (id) {
        await api.patch(`/api/admin/orders/${id}`, payload);
        toast.success("Order updated");
      } else {
        const response = await api.post("/api/admin/orders", payload);
        const createdOrder = response.data?.data?.order ?? response.data?.order ?? response.data?.data ?? response.data;
        const createdId = getRecordId(createdOrder) ?? response.data?.data?.order_id ?? response.data?.order_id;
        setDialogOpen(false);
        if (!createdId) {
          toast.error("Order was created, but the API did not return its ID for automatic approval.");
          await refetch();
          return;
        }
        try {
          await api.post(`/api/admin/orders/${createdId}/approve`);
          toast.success("Order created and approved; the client subscription is active.");
          await queryClient.invalidateQueries({ queryKey: ["clients"] });
        } catch (approvalError) {
          toast.error(`Order was created, but automatic approval failed: ${getSubscriptionErrorMessage(approvalError, "Approval failed")}`);
        }
      }
      setDialogOpen(false);
      await refetch();
      if (id) await queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (requestError) {
      toast.error(getSubscriptionErrorMessage(requestError, "Failed to save order"));
    } finally {
      setSaving(false);
    }
  };

  const approveOrder = async (order) => {
    const id = getRecordId(order);
    setActingId(id);
    try {
      await api.post(`/api/admin/orders/${id}/approve`);
      toast.success("Order approved");
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (requestError) {
      toast.error(getSubscriptionErrorMessage(requestError, "Failed to approve order"));
    } finally {
      setActingId(null);
    }
  };

  const rejectOrder = async (event) => {
    event.preventDefault();
    const id = getRecordId(rejecting);
    setActingId(id);
    try {
      await api.post(`/api/admin/orders/${id}/reject`, { reject_reason: rejectReason.trim() });
      toast.success("Order rejected");
      setRejecting(null);
      setRejectReason("");
      await refetch();
    } catch (requestError) {
      toast.error(getSubscriptionErrorMessage(requestError, "Failed to reject order"));
    } finally {
      setActingId(null);
    }
  };

  const viewOrder = async (order) => {
    setViewLoading(true);
    setViewing({});
    try {
      const response = await api.get(`/api/admin/orders/${getRecordId(order)}`);
      setViewing(response.data?.data?.order ?? response.data?.order ?? response.data?.data ?? response.data);
    } catch (requestError) {
      setViewing(null);
      toast.error(getSubscriptionErrorMessage(requestError, "Failed to load order details"));
    } finally {
      setViewLoading(false);
    }
  };

  const columns = [
    { accessorKey: "client_id", header: "Client", cell: ({ row }) => <span className="font-semibold">{getRelationName(row.original.client_id, "company_name")}</span> },
    { accessorKey: "package_id", header: "Package", cell: ({ row }) => getRelationName(row.original.package_id, "name") },
    { accessorKey: "payment_method_id", header: "Payment method", cell: ({ row }) => getRelationName(row.original.payment_method_id, "name") },
    { accessorKey: "final_price", header: "Final price", cell: ({ row }) => formatMoney(row.original.final_price) },
    { accessorKey: "createdAt", header: "Date", cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Subscription Orders</h1>
        <p className="text-sm text-muted-foreground">Review subscription orders, receipts, and client activation.</p>
      </header>
      <div className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-900">
        <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
          <SelectTrigger className="h-10 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approve">Approved</SelectItem><SelectItem value="reject">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.client_id} onValueChange={(value) => updateFilter("client_id", value)}>
          <SelectTrigger className="h-10 w-48"><SelectValue placeholder="All clients" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All clients</SelectItem>
            {clients.map((client) => <SelectItem key={getRecordId(client)} value={String(getRecordId(client))}>{client.company_name || client.subdomain || client.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.package_id} onValueChange={(value) => updateFilter("package_id", value)}>
          <SelectTrigger className="h-10 w-48"><SelectValue placeholder="All packages" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All packages</SelectItem>
            {packages.map((item) => <SelectItem key={getRecordId(item)} value={String(getRecordId(item))}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.payment_method_id} onValueChange={(value) => updateFilter("payment_method_id", value)}>
          <SelectTrigger className="h-10 w-48"><SelectValue placeholder="All methods" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All methods</SelectItem>
            {methods.map((item) => <SelectItem key={getRecordId(item)} value={String(getRecordId(item))}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {Object.values(filters).some((value) => value !== "all") && <Button variant="outline" onClick={resetFilters}>Reset filters</Button>}
      </div>
      <GenericDataTable
        title="Subscription Orders"
        columns={columns}
        data={orders}
        isLoading={isLoading}
        queryKey="orders"
        deleteApiUrl="/api/admin/orders"
        getDeleteLabel={(item) => `Order: ${getRecordId(item)}`}
        onAdd={() => openForm()}
        onEdit={openForm}
        pagination={pagination}
        setPagination={setPagination}
        pageCount={getPageCount(data)}
        renderRowActions={(order) => (
          <>
            <Button size="icon" variant="ghost" title="View order" aria-label="View order" onClick={() => viewOrder(order)}>
              <Eye className="h-4 w-4" />
            </Button>
            {order.status === "pending" && (
              <>
                <Button size="icon" variant="ghost" title="Approve order" aria-label="Approve order" disabled={actingId === getRecordId(order)} onClick={() => approveOrder(order)}>
                  <Check className="h-4 w-4 text-emerald-600" />
                </Button>
                <Button size="icon" variant="ghost" title="Reject order" aria-label="Reject order" onClick={() => { setRejecting(order); setRejectReason(""); }}>
                  <X className="h-4 w-4 text-rose-600" />
                </Button>
              </>
            )}
          </>
        )}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit order" : "Add subscription order"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm font-medium">Client
                <Select required value={form.client_id} onValueChange={(value) => setForm({ ...form, client_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{formClients.map((client) => <SelectItem key={getRecordId(client)} value={String(getRecordId(client))}>{client.company_name || client.subdomain || client.name}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Package
                <Select required value={form.package_id} onValueChange={(value) => setForm({ ...form, package_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                  <SelectContent>{packages.map((item) => <SelectItem key={getRecordId(item)} value={String(getRecordId(item))}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Payment method
                <Select required value={form.payment_method_id} onValueChange={(value) => setForm({ ...form, payment_method_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                  <SelectContent>{methods.map((item) => <SelectItem key={getRecordId(item)} value={String(getRecordId(item))}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              {editing && (
                <label className="block space-y-1 text-sm font-medium">Status
                  <Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="approve">Approved</SelectItem><SelectItem value="reject">Rejected</SelectItem></SelectContent>
                  </Select>
                </label>
              )}
              {["price", "discount", "final_price"].map((key) => (
                <label key={key} className="block space-y-1 text-sm font-medium capitalize">{key.replace("_", " ")} (EGP)
                  <Input min="0" step="0.01" type="number" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
                </label>
              ))}
              <label className="block space-y-1 text-sm font-medium">Receipt (image or PDF)
                <Input type="file" accept="image/*,application/pdf" onChange={(event) => setForm({ ...form, receipt: event.target.files?.[0] ?? null })} />
              </label>
            </div>
            {editing && form.status === "reject" && (
              <label className="block space-y-1 text-sm font-medium">Rejection reason
                <Textarea required rows={3} value={form.reject_reason} onChange={(event) => setForm({ ...form, reject_reason: event.target.value })} />
              </label>
            )}
            {editing?.receipt && <a className="text-sm text-primary underline" href={editing.receipt} target="_blank" rel="noreferrer">View current receipt</a>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save order" : "Create and approve"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => { if (!open) setRejecting(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Reject order</DialogTitle></DialogHeader>
          <form onSubmit={rejectOrder} className="space-y-4">
            <label className="block space-y-1 text-sm font-medium">Reason
              <Textarea required rows={4} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
              <Button type="submit" disabled={actingId === getRecordId(rejecting)}>Reject order</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewing !== null} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Order details</DialogTitle></DialogHeader>
          {viewLoading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading order details...</p> : viewing && (
            <div className="space-y-3 text-sm">
              <Detail label="Client" value={getRelationName(viewing.client_id, "company_name")} />
              <Detail label="Package" value={getRelationName(viewing.package_id, "name")} />
              <Detail label="Payment method" value={getRelationName(viewing.payment_method_id, "name")} />
              <Detail label="Price" value={formatMoney(viewing.price)} />
              <Detail label="Discount" value={formatMoney(viewing.discount)} />
              <Detail label="Final price" value={formatMoney(viewing.final_price)} />
              <Detail label="Status" value={viewing.status} />
              {viewing.reject_reason && <Detail label="Rejection reason" value={viewing.reject_reason} />}
              {viewing.receipt && <a href={viewing.receipt} target="_blank" rel="noreferrer" className="inline-block text-primary underline">Open receipt</a>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewing(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Detail({ label, value }) {
  return <div className="flex justify-between gap-4 border-b pb-2"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value || "—"}</span></div>;
}
