import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AddPage from "@/components/AddPage";
import { useGet } from "@/hooks/useGet";
import { useTranslation } from "@/hooks/useTranslation";
import { OPERATIONS_KEY, OPERATIONS_URL } from "./ReportsPage";

export default function OperationFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const isEdit = !!id;

    const { data: detailRes, isLoading } = useGet(
        ["operation", id],
        isEdit ? `${OPERATIONS_URL}/${id}` : null
    );

    // الحقول المتوافقة مع هيكل بيانات العميل والشركة
    const fields = [
        { name: "company_name", label: t("companyName") || "اسم الشركة", required: true },
        { name: "email", label: t("email") || "البريد الإلكتروني", type: "email", required: true },
        { name: "subdomain", label: t("subdomain") || "النطاق الفرعي", required: true },
        { name: "sales_man_phone", label: t("salesManPhone") || "رقم هاتف المندوب" },
        { name: "operation_status", label: t("operationStatus") || "حالة العملية" },
        { name: "payment_cycle", label: t("paymentCycle") || "دورة الدفع" },
    ];

    if (isEdit && isLoading) {
        return (
            <div className="flex h-56 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // استخراج بيانات الـ client من داخل الاستجابة وتوحيد _id إلى id
    const rawData = detailRes?.data ?? detailRes;
    const clientData = rawData?.client ?? rawData;
    
    const initialData = isEdit && clientData
        ? { ...clientData, id: clientData.id ?? clientData._id }
        : undefined;

    return (
        <AddPage
            title={t("operation") || "عملية"}
            apiUrl={OPERATIONS_URL}
            queryKey={OPERATIONS_KEY}
            fields={fields}
            initialData={initialData}
            method={isEdit ? "PATCH" : undefined}
            onSuccessAction={() => navigate("/operations")}
        />
    );
}