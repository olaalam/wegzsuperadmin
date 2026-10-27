import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Loader2, Plus, Trash2, ExternalLink, DollarSign, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DeleteDialog from "@/components/DeleteDialog";
import { useGet } from "@/hooks/useGet";
import { usePost } from "@/hooks/usePost";
import { useTranslation } from "@/hooks/useTranslation";
import { OPERATIONS_URL, StatusSelect } from "./ReportsPage";

const DETAIL_KEY = "operation";

const noteText = (note) => (typeof note === "string" ? note : note?.text ?? "");

export default function OperationDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [text, setText] = useState("");
    const [noteToDelete, setNoteToDelete] = useState(null);

    const { data, isLoading } = useGet([DETAIL_KEY, id], `${OPERATIONS_URL}/${id}`);
    
    const responseData = data?.data ?? data;
    const client = responseData?.client ?? {};
    const payments = responseData?.payments ?? [];
    const sales = responseData?.sales ?? [];
    const totals = responseData?.totals ?? {};
    const notes = Array.isArray(client?.notes) ? client.notes : [];

    const operationForStatus = { ...client, id: client.id ?? client._id };

    const addNote = usePost(`${OPERATIONS_URL}/${id}/notes`, "post", DETAIL_KEY);

    const handleAddNote = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;
        addNote.mutate({ text: trimmed }, { onSuccess: () => setText("") });
    };

    if (isLoading) {
        return (
            <div className="flex h-56 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6">
            {/* بطاقة معلومات العميل والملخص */}
            <Card className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 p-6 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl"
                            onClick={() => navigate("/reports")}
                        >
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                        <CardTitle className="text-xl font-black">
                            {client?.company_name ?? `${t("operation") || "عملية"} #${id}`}
                        </CardTitle>
                    </div>
                    {client?._id && <StatusSelect operation={operationForStatus} invalidateKey={DETAIL_KEY} />}
                </CardHeader>
                <CardContent className="p-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {client?.email && (
                            <p>
                                <span className="font-bold">{t("email") || "البريد الإلكتروني"}: </span>
                                {client.email}
                            </p>
                        )}
                        {client?.subdomain && (
                            <p>
                                <span className="font-bold">{t("subdomain") || "النطاق الفرعي"}: </span>
                                {client.subdomain}
                            </p>
                        )}
                        {client?.subdomain_url && (
                            <p className="flex items-center gap-2">
                                <span className="font-bold">{t("subdomainUrl") || "رابط الموقع"}: </span>
                                <a href={client.subdomain_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                    {client.subdomain_url} <ExternalLink className="h-3 w-3" />
                                </a>
                            </p>
                        )}
                        {client?.sales_man_phone && (
                            <p>
                                <span className="font-bold">{t("salesManPhone") || "هاتف المندوب"}: </span>
                                {client.sales_man_phone}
                            </p>
                        )}
                    </div>

                    {/* بطاقات الإجماليات (Totals) */}
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                            <span className="block text-xs text-slate-400 font-semibold">{t("totalPaid") || "إجمالي المدفوع"}</span>
                            <span className="text-base font-bold text-emerald-600">{totals.total_paid ?? 0} EGP</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                            <span className="block text-xs text-slate-400 font-semibold">{t("pendingAmount") || "المبلغ المعلق"}</span>
                            <span className="text-base font-bold text-amber-600">{totals.pending_amount ?? 0} EGP</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-center">
                            <span className="block text-xs text-slate-400 font-semibold">{t("paymentsCount") || "عدد المدفوعات"}</span>
                            <span className="text-base font-bold text-blue-600">{totals.payments_count ?? 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* قسم المبيعات (Sales) */}
            {sales.length > 0 && (
                <Card className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800/80">
                        <CardTitle className="text-lg font-black flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            {t("sales") || "المبيعات"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {sales.map((sale) => (
                            <div key={sale._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">#{sale.sale_no}</span>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">{sale.status}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <div><span className="font-semibold">{t("amount") || "المبلغ"}:</span> {sale.amount} {sale.currency}</div>
                                    <div><span className="font-semibold">{t("discount") || "الخصم"}:</span> {sale.discount}</div>
                                    <div><span className="font-semibold">{t("total") || "الإجمالي"}:</span> {sale.total} {sale.currency}</div>
                                    <div><span className="font-semibold">{t("cycle") || "دورة الدفع"}:</span> {sale.cycle}</div>
                                </div>
                                {sale.sales_agent_name && (
                                    <div className="text-xs text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                                        {t("agent") || "المسؤول"}: {sale.sales_agent_name} ({sale.sales_agent_phone})
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* قسم المدفوعات (Payments) */}
            {payments.length > 0 && (
                <Card className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800/80">
                        <CardTitle className="text-lg font-black flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                            {t("payments") || "المدفوعات"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {payments.map((payment) => (
                            <div key={payment._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Ref: {payment.reference}</span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${payment.status === 'reject' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'}`}>
                                        {payment.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <div><span className="font-semibold">{t("amount") || "المبلغ"}:</span> {payment.amount} {payment.currency}</div>
                                    <div><span className="font-semibold">{t("method") || "الطريقة"}:</span> {payment.method}</div>
                                    <div><span className="font-semibold">{t("date") || "التاريخ"}:</span> {new Date(payment.date).toLocaleDateString()}</div>
                                </div>
                                {payment.rejection_reason && (
                                    <div className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl mt-1">
                                        <span className="font-semibold">{t("rejectionReason") || "سبب الرفض"}:</span> {payment.rejection_reason}
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* قسم الملاحظات (Notes) */}
            <Card className="rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
                <CardHeader className="border-b border-slate-100 p-6 dark:border-slate-800/80">
                    <CardTitle className="text-lg font-black">{t("notes") || "الملاحظات"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                    <form onSubmit={handleAddNote} className="space-y-3">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            rows={3}
                            placeholder={t("notePlaceholder") || "اكتب ملاحظة..."}
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-800/80"
                        />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={addNote.isPending || !text.trim()}
                                className="h-11 rounded-xl px-5 font-bold"
                            >
                                {addNote.isPending ? (
                                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="me-2 h-4 w-4" />
                                )}
                                {t("addNote") || "إضافة ملاحظة"}
                            </Button>
                        </div>
                    </form>

                    {notes.length === 0 ? (
                        <p className="py-6 text-center text-sm font-semibold text-slate-400">
                            {t("noNotes") || "لا توجد ملاحظات بعد"}
                        </p>
                    ) : (
                        <ul className="space-y-3">
                            {notes.map((note, index) => (
                                <li
                                    key={index}
                                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                                >
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{noteText(note)}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                                        title={t("delete") || "حذف"}
                                        onClick={() => setNoteToDelete(String(index))}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <DeleteDialog
                isOpen={noteToDelete !== null}
                onClose={() => setNoteToDelete(null)}
                apiUrl={`${OPERATIONS_URL}/${id}/notes`}
                onSuccessKey={DETAIL_KEY}
                id={noteToDelete}
                itemName={noteToDelete !== null ? noteText(notes[Number(noteToDelete)]) : ""}
            />
        </div>
    );
}