import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import GenericDataTable from "@/components/GenericDataTable";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useGet } from "@/hooks/useGet";
import { usePatch } from "@/hooks/usePatch";
import { useTranslation } from "@/hooks/useTranslation";

export const OPERATIONS_URL = "/api/admin/reports/operations";
export const OPERATIONS_KEY = "operations";

export const STATUS_OPTIONS = [
    { value: "active", labelKey: "active", fallback: "نشط" },
    { value: "inactive", labelKey: "inactive", fallback: "غير نشط" },
];

export const toArray = (res) => {
    let list = [];
    if (Array.isArray(res)) {
        list = res;
    } else {
        const inner = res?.data?.reports ?? res?.reports ?? res?.data ?? res?.operations ?? res?.items ?? [];
        list = Array.isArray(inner) ? inner : [];
    }
    // توحيد _id إلى id لكي يعمل الجدول وحذف العناصر بشكل صحيح
    return list.map((item) => ({
        ...item,
        id: item.id ?? item._id,
    }));
};

export const StatusSelect = ({ operation, invalidateKey = OPERATIONS_KEY }) => {
    const { t } = useTranslation();
    const patch = usePatch(OPERATIONS_URL, invalidateKey);
    const current = operation.status ?? operation.operation_status ?? "";

    return (
        <Select
            value={String(current)}
            disabled={patch.isPending}
            onValueChange={(value) =>
                patch.mutate({
                    customUrl: `${OPERATIONS_URL}/${operation.id}/status`,
                    payload: { status: value, operation_status: value },
                })
            }
        >
            <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs font-bold">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                        {t(o.labelKey) || o.fallback}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default function OperationsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { data, isLoading } = useGet(OPERATIONS_KEY, OPERATIONS_URL);

    const columns = [
        { accessorKey: "company_name", header: t("companyName") || "اسم الشركة" },
        { accessorKey: "email", header: t("email") || "البريد الإلكتروني" },
        { accessorKey: "subdomain", header: t("subdomain") || "النطاق الفرعي" },
        { accessorKey: "sales_man_phone", header: t("salesManPhone") || "هاتف المندوب" },
        {
            id: "status",
            header: t("status") || "الحالة",
            cell: ({ row }) => <StatusSelect operation={row.original} />,
        },
        {
            id: "details",
            header: t("details") || "التفاصيل",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10"
                    title={t("details") || "التفاصيل"}
                    onClick={() => navigate(`/reports/details/${row.original.id}`)}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    return (
        <GenericDataTable
            title={t("operations") || "العمليات"}
            columns={columns}
            data={toArray(data)}
            isLoading={isLoading}
            queryKey={OPERATIONS_KEY}
            onAdd={() => navigate("/operations/add")}
            actions={false}
        />
    );
}