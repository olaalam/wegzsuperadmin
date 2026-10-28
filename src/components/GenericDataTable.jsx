import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Loader2
} from "lucide-react";
import DeleteDialog from "./DeleteDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { toast } from "sonner";

const getPaginationRange = (currentPage, totalPages) => {
  const current = currentPage + 1;

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (current >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", current - 1, current, current + 1, "...", totalPages];
};

const getSavedPageSize = () => {
  const savedSize = localStorage.getItem("tablePageSize");
  return savedSize ? Number(savedSize) : 15;
};

export default function GenericDataTable({
  columns,
  data = [],
  title,
  onAdd,
  onEdit,
  editApiUrl,
  deleteApiUrl,
  queryKey,
  isLoading,
  actions = true,
  highlightedId,
  pagination: controlledPagination,
  setPagination: setControlledPagination,
  requireInactiveReason = false,
  deleteWithoutId = false,
  pageCount: controlledPageCount,
  statusWithoutId = false,
  canDelete,          // optional: (row) => boolean — return false to lock the delete button for that row
  getDeleteLabel,     // optional: (row) => string — name shown in the delete confirmation
  cannotDeleteHint,   // optional: tooltip text for a locked delete button
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState("");

  const [inactiveDialog, setInactiveDialog] = useState({
    isOpen: false,
    rowId: null,
    keyName: null,
    newStatus: null,
  });
  const [inactiveReason, setInactiveReason] = useState("");

  const { t, isRTL } = useTranslation();
  const location = useLocation();
  const queryClient = useQueryClient();
  const activeHighlightedId = highlightedId ?? location.state?.highlightedId;

  const [internalPagination, setInternalPagination] = useState({
    pageIndex: location.state?.pageIndex ?? location.state?.fromPage ?? 0,
    pageSize: getSavedPageSize(),
  });
  const pagination = controlledPagination ?? internalPagination;
  const setPagination = setControlledPagination ?? setInternalPagination;

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, setPagination]);

  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [data]);

  useEffect(() => {
    if (activeHighlightedId && sortedData.length) {
      const index = sortedData.findIndex(
        (item) => String(item.id || item.menuItemId || item.pointId || item.expenseId) === String(activeHighlightedId)
      );
      if (index !== -1) {
        const targetPageIndex = Math.floor(index / pagination.pageSize);
        setPagination((prev) => ({ ...prev, pageIndex: targetPageIndex }));
      }
    } else if (location.state?.pageIndex !== undefined && sortedData.length) {
      setPagination((prev) => ({ ...prev, pageIndex: location.state.pageIndex }));
    }
  }, [activeHighlightedId, sortedData, pagination.pageSize, setPagination, location.state?.pageIndex]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus, keyName, reason }) => {
        const isBundle = editApiUrl?.includes("bundles");
        const isDiscount = editApiUrl?.includes("discounts");
        const isFreeDelivery = editApiUrl?.includes("free-delivery");

        const shouldIncludeId = !statusWithoutId && !(isFreeDelivery && deleteWithoutId);

        let url = editApiUrl;
        if (isBundle || isDiscount) {
            url = `${editApiUrl}/${id}/toggle-status`;
        } else if (shouldIncludeId && id) {
            url = `${editApiUrl}/${id}`;
        }

        const requestBody = {};
        requestBody[keyName] = newStatus;

        if (reason) {
            requestBody.inactiveReason = reason;
        }

          return await api.patch(url, requestBody);
    },
    onSuccess: () => {
      if (queryKey) {
        queryClient.invalidateQueries([queryKey]);
      }
      toast.success(t("updateStatusSuccessfully") || "تم تحديث الحالة بنجاح");
      closeInactiveDialog();
    },
    onError: (error) => {
      console.error("Failed to update status:", error);
      toast.error(t("updateStatusError") || "حدث خطأ أثناء تحديث الحالة");
    }
  });

  const closeInactiveDialog = () => {
    setInactiveDialog({ isOpen: false, rowId: null, keyName: null, newStatus: null });
    setInactiveReason("");
  };

  const submitInactiveReason = () => {
    updateStatusMutation.mutate({
      id: inactiveDialog.rowId,
      newStatus: inactiveDialog.newStatus,
      keyName: inactiveDialog.keyName,
      reason: inactiveReason
    });
  };

  const tableColumns = useMemo(() => {
    const baseColumns = [
      {
        id: "rowNumber",
        header: "#",
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          const indexInCurrentPage = table.getRowModel().rows.findIndex((r) => r.id === row.id);

          return (
            <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
              {pageIndex * pageSize + indexInCurrentPage + 1}
            </span>
          );
        },
        size: 60,
      },
    ];

    columns.forEach((col) => {
      if (col.cell) {
        baseColumns.push(col);
        return;
      }

      const isStatusField = col.accessorKey === "status" || col.accessorKey === "isActive";

      if (isStatusField && editApiUrl) {
        baseColumns.push({
          ...col,
          cell: ({ row }) => {
            const currentStatus = row.getValue(col.accessorKey);
            const isActive = currentStatus === "active" || currentStatus === true || currentStatus === 1;
            const isBlocked = currentStatus === "blocked";
            const rowId = row.original.id || row.original.menuItemId;

            return (
              <div className="flex items-center justify-center gap-3">
<Switch
  checked={isActive}
  disabled={updateStatusMutation.isPending}
  className={cn(
    "data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:bg-emerald-500 transition-colors"
  )}
  onCheckedChange={(checked) => {
    const newStatus = checked ? "active" : "inactive";
    if (!checked && requireInactiveReason) {
      setInactiveDialog({
        isOpen: true,
        rowId: rowId,
        keyName: col.accessorKey,
        newStatus: newStatus
      });
    } else {
      updateStatusMutation.mutate({ id: rowId, newStatus, keyName: col.accessorKey });
    }
  }}
/>
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                    : isBlocked
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700"
                )}>
                  {isActive ? (t("active") || "نشط") : isBlocked ? (t("blocked") || "محظور") : (t("inactive") || "غير نشط")}
                </span>
              </div>
            );
          }
        });
      } else {
        baseColumns.push(col);
      }
    });

    if (actions) {
      baseColumns.push({
        id: "actions",
        header: t("actionsCol") || "الإجراءات",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  try {
                    window.history.replaceState(
                      {
                        ...window.history.state,
                        usr: {
                          ...window.history.state?.usr,
                          highlightedId: row.original.id || row.original.menuItemId || row.original.pointId || row.original.expenseId,
                          pageIndex: pagination.pageIndex,
                        },
                      },
                      document.title
                    );
                  } catch (e) {
                    console.error("Error saving history state:", e);
                  }
                  onEdit(row.original);
                }}
                className="h-9 w-9 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-all shadow-2xs"
                title={t("edit") || "تعديل"}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {deleteApiUrl && (() => {
              const deletable = !canDelete || canDelete(row.original);
              return (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-disabled={!deletable}
                  onClick={() => {
                    if (!deletable) return;
                    setDeleteName(getDeleteLabel ? getDeleteLabel(row.original) : "");
                    setDeleteId(deleteWithoutId ? "single" : (row.original.id || row.original.menuItemId));
                  }}
                  className={cn(
                    "h-9 w-9 rounded-xl transition-all shadow-2xs",
                    deletable
                      ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      : "text-slate-300 dark:text-slate-600 cursor-not-allowed hover:bg-transparent hover:text-slate-300"
                  )}
                  title={deletable ? (t("delete") || "حذف") : (cannotDeleteHint || t("cannotDelete") || "لا يمكن حذف هذا العنصر")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              );
            })()}
          </div>
        ),
      });
    }

    return baseColumns;
  }, [columns, onEdit, deleteApiUrl, actions, editApiUrl, updateStatusMutation.isPending, t, requireInactiveReason, deleteWithoutId, pagination.pageIndex, canDelete, getDeleteLabel, cannotDeleteHint]);

  const table = useReactTable({
    data: sortedData,
    columns: tableColumns,
    state: {
      globalFilter,
      pagination,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: controlledPageCount ? undefined : getPaginationRowModel(),
    manualPagination: !!controlledPageCount,
    pageCount: controlledPageCount ?? undefined,
    initialState: {
      pagination: {
        pageSize: getSavedPageSize(),
      },
    },
  });

  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = controlledPageCount ?? table.getPageCount();
  const paginationRange = useMemo(() => getPaginationRange(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="relative w-full min-w-0 space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-all">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs font-black text-xl">
            {title?.[0] || "📋"}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t("manageAndMonitor") || "إدارة ومتابعة سجلات"} <span className="font-semibold text-primary">{title}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => {
              const newSize = Number(value);
              localStorage.setItem("tablePageSize", newSize);
              setPagination((prev) => ({
                ...prev,
                pageSize: newSize,
                pageIndex: 0,
              }));
            }}
          >
            <SelectTrigger className="w-[90px] h-11 text-xs font-bold rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs bg-white">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 </SelectItem>
              <SelectItem value="20">20 </SelectItem>
              <SelectItem value="50">50 </SelectItem>
              <SelectItem value="100">100 </SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-72">
            <Search className={cn(
              "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400",
              isRTL ? "right-4" : "left-4"
            )} />
            <Input
              placeholder={t("searchPlaceholder") || "بحث في السجلات..."}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className={cn(
                "h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 focus-visible:ring-primary text-sm shadow-2xs transition-all",
                isRTL ? "pr-11 pl-4" : "pl-11 pr-4"
              )}
            />
          </div>

          {onAdd && (
            <Button
              onClick={() => {
                try {
                  window.history.replaceState(
                    {
                      ...window.history.state,
                      usr: {
                        ...window.history.state?.usr,
                        pageIndex: pagination.pageIndex,
                      },
                    },
                    document.title
                  );
                } catch (e) {
                  console.error("Error saving history state:", e);
                }
                onAdd();
              }}
              className="h-11 px-5 rounded-xl font-bold shadow-md bg-primary text-primary-foreground gap-2 shrink-0 transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              <span>{t("addNew") || "إضافة جديد"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* TABLE BOX */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-14 align-middle text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 py-4 px-6 text-center"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="text-center h-56">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs font-semibold animate-pulse">جاري تحميل البيانات...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const rowId = row.original.id || row.original.menuItemId || row.original.pointId || row.original.expenseId;
                  const isHighlighted = String(rowId) === String(activeHighlightedId);
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "group border-b border-slate-100 dark:border-slate-800/60 transition-all duration-300",
                        isHighlighted
                          ? "bg-amber-50/90 dark:bg-amber-950/40 border-l-4 border-l-amber-500 font-semibold"
                          : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="py-4 px-6 align-middle text-sm text-slate-700 dark:text-slate-200 font-medium text-center"
                        >
                          <div className="flex items-center justify-center w-full">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="text-center h-56 text-sm text-slate-400 font-semibold">
                    {t("noDataFound") || "لا توجد بيانات متاحة حالياً"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-10 w-10 p-0 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:bg-slate-50"
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {paginationRange.map((page, index) => {
            if (page === "...") {
              return (
                <span key={`dots-${index}`} className="h-10 w-8 flex items-center justify-center text-slate-400 text-xs font-bold">
                  ...
                </span>
              );
            }

            const pageIndex = page - 1;
            const isSelected = currentPage === pageIndex;

            return (
              <Button
                key={page}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => table.setPageIndex(pageIndex)}
                className={cn(
                  "h-10 w-10 p-0 rounded-xl font-bold text-xs transition-all shadow-2xs",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm scale-105"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-10 w-10 p-0 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:bg-slate-50"
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* INACTIVE REASON DIALOG */}
      {inactiveDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <button
              onClick={closeInactiveDialog}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-5">
              <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-2xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {t("inactiveReasonTitle") || "سبب الإيقاف"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("inactiveReasonDesc") || "يرجى كتابة سبب تحويل الحالة إلى غير مفعل للمتابعة."}
                </p>
              </div>
            </div>

            <Input
              value={inactiveReason}
              onChange={(e) => setInactiveReason(e.target.value)}
              placeholder={t("reasonPlaceholder") || "أدخل السبب هنا..."}
              className="mb-6 h-12 rounded-xl bg-slate-50/70 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              autoFocus
            />

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={closeInactiveDialog} className="rounded-xl px-5 h-11 font-semibold">
                {t("cancel") || "إلغاء"}
              </Button>
              <Button
                onClick={submitInactiveReason}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-5 h-11 font-bold shadow-md"
              >
                {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("confirm") || "تأكيد الإيقاف"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      <DeleteDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        apiUrl={deleteApiUrl}
        onSuccessKey={queryKey}
        id={deleteWithoutId ? null : deleteId}
        itemName={deleteName}
      />
    </div>
  );
}