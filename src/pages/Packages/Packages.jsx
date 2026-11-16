import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "../../api/axios";
import GenericDataTable from "../../components/GenericDataTable";
import StatusBadge from "../../components/StatusBadge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useGet } from "../../hooks/useGet";
import { formatMoney, getApiList, getPageCount, getRecordId, getSubscriptionErrorMessage } from "../subscription-utils";

const initialForm = { name: "", price: "", months: "1", status: "active", discount: "0" };

export default function PackagesPage() {
  const [filters, setFilters] = useState({ status: "all", search: "" });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const params = useMemo(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
  }), [filters, pagination.pageIndex, pagination.pageSize]);
  const { data, isLoading, isError, error, refetch } = useGet(["packages", params], "/api/admin/packages", params);

  useEffect(() => {
    if (isError) toast.error(getSubscriptionErrorMessage(error, "Failed to load packages"));
  }, [isError, error]);

  const packages = getApiList(data, "packages").map((item) => ({ ...item, id: getRecordId(item) }));
  const openForm = (item) => {
    setEditing(item ?? null);
    setForm(item ? {
      name: item.name ?? "",
      price: String(item.price ?? ""),
      months: String(item.months ?? 1),
      status: item.status ?? "active",
      discount: String(item.discount ?? 0),
    } : initialForm);
    setDialogOpen(true);
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      months: Number(form.months),
      status: form.status,
      discount: Number(form.discount || 0),
    };
    try {
      const id = getRecordId(editing);
      if (id) await api.patch(`/api/admin/packages/${id}`, payload);
      else await api.post("/api/admin/packages", payload);
      toast.success(id ? "Package updated" : "Package created");
      setDialogOpen(false);
      await refetch();
    } catch (requestError) {
      toast.error(getSubscriptionErrorMessage(requestError, "Failed to save package"));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { accessorKey: "name", header: "Package" },
    { accessorKey: "price", header: "Price", cell: ({ row }) => formatMoney(row.original.price) },
    { accessorKey: "months", header: "Duration", cell: ({ row }) => `${row.original.months} months` },
    { accessorKey: "discount", header: "Discount", cell: ({ row }) => formatMoney(row.original.discount) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Packages</h1>
        <p className="text-sm text-muted-foreground">Manage subscription packages, pricing, and discounts.</p>
      </header>
      <div className="flex flex-wrap gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-900">
        <Input
          value={filters.search}
          placeholder="Search packages..."
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
        title="Subscription Packages"
        columns={columns}
        data={packages}
        isLoading={isLoading}
        queryKey="packages"
        deleteApiUrl="/api/admin/packages"
        getDeleteLabel={(item) => `Package: ${item.name}`}
        onAdd={() => openForm()}
        onEdit={openForm}
        pagination={pagination}
        setPagination={setPagination}
        pageCount={getPageCount(data)}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit package" : "Add package"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <label className="block space-y-1 text-sm font-medium">Name
              <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm font-medium">Price (EGP)
                <Input required min="0" type="number" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
              </label>
              <label className="block space-y-1 text-sm font-medium">Duration (months)
                <Input required min="1" step="1" type="number" value={form.months} onChange={(event) => setForm({ ...form, months: event.target.value })} />
              </label>
              <label className="block space-y-1 text-sm font-medium">Discount (EGP)
                <Input min="0" type="number" step="0.01" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} />
              </label>
              <label className="block space-y-1 text-sm font-medium">Status
                <Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save package"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
