import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "../../api/axios";
import GenericDataTable from "../../components/GenericDataTable";
import StatusBadge from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useGet } from "../../hooks/useGet";
import { getApiList, getPageCount, getRecordId, getSubscriptionErrorMessage } from "../subscription-utils";

const emptyForm = { name: "", description: "", status: "active", icon: null };

export default function PaymentMethodsPage() {
  const [filters, setFilters] = useState({ status: "all", search: "" });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const params = useMemo(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
  }), [filters, pagination.pageIndex, pagination.pageSize]);
  const { data, isLoading, isError, error, refetch } = useGet(["payment-methods", params], "/api/admin/payment-methods", params);

  useEffect(() => {
    if (isError) toast.error(getSubscriptionErrorMessage(error, "Failed to load payment methods"));
  }, [isError, error]);

  const methods = getApiList(data, "payment_methods").map((item) => ({ ...item, id: getRecordId(item) }));
  const openForm = (item) => {
    setEditing(item ?? null);
    setForm(item
      ? { name: item.name ?? "", description: item.description ?? "", status: item.status ?? "active", icon: null }
      : emptyForm);
    setDialogOpen(true);
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("description", form.description);
    payload.append("status", form.status);
    if (form.icon) payload.append("icon", form.icon);
    try {
      const id = getRecordId(editing);
      if (id) await api.patch(`/api/admin/payment-methods/${id}`, payload);
      else await api.post("/api/admin/payment-methods", payload);
      toast.success(id ? "Payment method updated" : "Payment method created");
      setDialogOpen(false);
      await refetch();
    } catch (requestError) {
      toast.error(getSubscriptionErrorMessage(requestError, "Failed to save payment method"));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Payment method",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.icon && <img src={row.original.icon} alt="" className="h-9 w-9 rounded-lg border object-contain" />}
          <span className="font-semibold">{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: "description", header: "Description", cell: ({ row }) => <span className="line-clamp-2 max-w-md text-sm">{row.original.description || "—"}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Payment Methods</h1>
        <p className="text-sm text-muted-foreground">Manage the payment options and instructions available to clients.</p>
      </header>
      <div className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-900">
        <Input
          value={filters.search}
          placeholder="Search payment methods..."
          onChange={(event) => {
            setFilters((current) => ({ ...current, search: event.target.value }));
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
          className="h-10 w-60"
        />
        <Select value={filters.status} onValueChange={(status) => {
          setFilters((current) => ({ ...current, status }));
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}>
          <SelectTrigger className="h-10 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <GenericDataTable
        title="Payment Methods"
        columns={columns}
        data={methods}
        isLoading={isLoading}
        queryKey="payment-methods"
        deleteApiUrl="/api/admin/payment-methods"
        getDeleteLabel={(item) => `Payment method: ${item.name}`}
        onAdd={() => openForm()}
        onEdit={openForm}
        pagination={pagination}
        setPagination={setPagination}
        pageCount={getPageCount(data)}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit payment method" : "Add payment method"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <label className="block space-y-1 text-sm font-medium">Name
              <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="block space-y-1 text-sm font-medium">Description / transfer instructions
              <Textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm font-medium">Status
                <Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </label>
              <label className="block space-y-1 text-sm font-medium">Icon
                <Input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" onChange={(event) => setForm({ ...form, icon: event.target.files?.[0] ?? null })} />
              </label>
            </div>
            {editing?.icon && !form.icon && <p className="text-xs text-muted-foreground">Current icon will be kept unless you choose a new file.</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save method"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
