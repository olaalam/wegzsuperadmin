import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { CreditCard, FileText, RefreshCw, Upload } from "lucide-react";
import { useGet } from "../../hooks/useGet";
import api from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants";

const payloadOf = (value) => {
  let current = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!current || Array.isArray(current) || typeof current !== "object" || !current.data) break;
    current = current.data;
  }
  return current;
};

const listFrom = (response, keys) => {
  const payload = payloadOf(response);
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const itemId = (item) => String(item?.id ?? item?._id ?? "");
const inputClass = "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]";
const cardClass = "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm";

function formatPrice(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString() : "—";
}

function orderStatusLabel(status, isRtl) {
  const value = String(status || "").toLowerCase();
  const labels = {
    pending: isRtl ? "قيد المراجعة" : "Pending",
    approve: isRtl ? "مقبول" : "Approved",
    approved: isRtl ? "مقبول" : "Approved",
    reject: isRtl ? "مرفوض" : "Rejected",
    rejected: isRtl ? "مرفوض" : "Rejected",
  };
  return labels[value] || status || "—";
}

function objectEntries(value) {
  const payload = payloadOf(value);
  const record = payload?.subscription || payload?.current_subscription || payload?.currentSubscription || payload;
  if (!record || Array.isArray(record) || typeof record !== "object") return [];
  return Object.entries(record).filter(([, item]) =>
    item == null || ["string", "number", "boolean"].includes(typeof item)
  );
}

export default function SubscriptionPage() {
  const lang = useSelector((state) => state.ui.lang);
  const isRtl = lang === "ar";
  const [packageId, setPackageId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: checkData,
    loading: checkLoading,
    error: checkError,
    refetch: refetchCheck,
  } = useGet(API_ENDPOINTS.SUBSCRIPTION.CHECK);
  const {
    data: subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useGet(API_ENDPOINTS.SUBSCRIPTION.GET);
  const {
    data: listsData,
    loading: listsLoading,
    error: listsError,
    refetch: refetchLists,
  } = useGet(API_ENDPOINTS.SUBSCRIPTION.ORDER_LISTS);
  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useGet(
    API_ENDPOINTS.SUBSCRIPTION.HISTORY_ORDERS,
    { page, limit: 10, ...(statusFilter ? { status: statusFilter } : {}) }
  );

  const packages = listFrom(listsData, ["packages"]);
  const paymentMethods = listFrom(listsData, ["payment_methods", "paymentMethods"]);
  const orders = listFrom(historyData, ["orders", "history_orders", "items"]);
  const historyPayload = payloadOf(historyData);
  const totalPages = Math.max(1, Number(historyPayload?.totalPages ?? historyPayload?.total_pages ?? 1) || 1);
  const summaryEntries = objectEntries(subscriptionData).filter(([key]) =>
    /name|plan|package|status|start|end|expire|price|amount|month|renew/i.test(key)
  );
  const checkPayload = payloadOf(checkData);
  const rawSubscriptionStatus = checkPayload?.subscription_status ?? checkPayload?.subscriptionStatus ?? checkPayload?.status;
  const statusValue = String(rawSubscriptionStatus || "").toLowerCase();
  const subscriptionActive = typeof checkPayload === "boolean"
    ? checkPayload
    : checkPayload?.has_subscription ?? checkPayload?.hasSubscription ?? checkPayload?.is_subscribed ?? checkPayload?.isSubscribed ?? checkPayload?.is_active ?? checkPayload?.active
      ?? (["active", "approve", "approved", "subscribed"].includes(statusValue)
        ? true
        : ["inactive", "expired", "none", "not_subscribed"].includes(statusValue)
          ? false
          : undefined);

  const refreshAll = () => {
    refetchCheck();
    refetchSubscription();
    refetchLists();
    refetchHistory();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const selectedPackageId = packageId || itemId(packages[0]);
    const selectedPaymentMethodId = paymentMethodId || itemId(paymentMethods[0]);
    if (!selectedPackageId || !selectedPaymentMethodId || !receipt) {
      toast.error(isRtl ? "اختاري الباقة وطريقة الدفع وأرفقي الإيصال." : "Choose a package and payment method, then attach the receipt.");
      return;
    }

    const extension = receipt.name.split(".").pop()?.toLowerCase();
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "application/pdf"];
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif", "svg", "pdf"];
    if (!allowedTypes.includes(receipt.type) && !allowedExtensions.includes(extension)) {
      toast.error(isRtl ? "نوع الملف غير مدعوم. ارفعي صورة أو ملف PDF." : "Unsupported file type. Upload an image or PDF.");
      return;
    }
    if (receipt.size > 10 * 1024 * 1024) {
      toast.error(isRtl ? "الحد الأقصى لحجم الإيصال 10 ميجابايت." : "The receipt must be 10 MB or smaller.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("package_id", selectedPackageId);
      formData.append("payment_method_id", selectedPaymentMethodId);
      formData.append("receipt", receipt);
      await api.post(API_ENDPOINTS.SUBSCRIPTION.MAKE_ORDER, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(isRtl ? "تم إرسال طلب الاشتراك للمراجعة." : "Subscription request submitted for review.");
      setReceipt(null);
      event.target.reset();
      refetchHistory();
      refetchCheck();
      refetchSubscription();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || (isRtl ? "فشل إرسال طلب الاشتراك" : "Failed to submit subscription request");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{isRtl ? "الاشتراك والباقات" : "Subscription & Plans"}</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {isRtl ? "تابعي اشتراكك وقدمي طلب اشتراك أو تجديد." : "Review your subscription and request a new plan or renewal."}
            </p>
          </div>
          <button type="button" onClick={refreshAll} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
            <RefreshCw className="h-4 w-4" />
            {isRtl ? "تحديث" : "Refresh"}
          </button>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-[var(--primary)]/10 p-2.5 text-[var(--primary)]"><CreditCard className="h-5 w-5" /></span>
              <div>
                <h2 className="font-bold text-[var(--foreground)]">{isRtl ? "حالة الاشتراك" : "Subscription status"}</h2>
                <p className="text-xs text-[var(--muted-foreground)]">{isRtl ? "من /subscription/check" : "From /subscription/check"}</p>
              </div>
            </div>
            {checkLoading ? (
              <p className="mt-5 text-sm text-[var(--muted-foreground)]">{isRtl ? "جاري التحميل..." : "Loading..."}</p>
            ) : checkError ? (
              <p role="alert" className="mt-5 text-sm text-red-600">{checkError}</p>
            ) : (
              <p className={`mt-5 inline-flex rounded-full px-3 py-1 text-sm font-bold ${subscriptionActive === true ? "bg-emerald-100 text-emerald-700" : subscriptionActive === false ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                {subscriptionActive === true
                  ? (isRtl ? "اشتراك نشط" : "Active")
                  : subscriptionActive === false
                    ? (isRtl ? "لا يوجد اشتراك نشط" : "No active subscription")
                    : (checkPayload?.message || rawSubscriptionStatus || (isRtl ? "تم تحميل الحالة" : "Status loaded"))}
              </p>
            )}
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600"><FileText className="h-5 w-5" /></span>
              <div>
                <h2 className="font-bold text-[var(--foreground)]">{isRtl ? "تفاصيل الاشتراك" : "Subscription details"}</h2>
                <p className="text-xs text-[var(--muted-foreground)]">{isRtl ? "من /subscription" : "From /subscription"}</p>
              </div>
            </div>
            {subscriptionLoading ? (
              <p className="mt-5 text-sm text-[var(--muted-foreground)]">{isRtl ? "جاري التحميل..." : "Loading..."}</p>
            ) : subscriptionError ? (
              <p role="alert" className="mt-5 text-sm text-red-600">{subscriptionError}</p>
            ) : summaryEntries.length ? (
              <dl className="mt-4 grid grid-cols-2 gap-3">
                {summaryEntries.map(([key, value]) => (
                  <div key={key} className="min-w-0 rounded-xl bg-[var(--background)] p-3">
                    <dt className="truncate text-[11px] text-[var(--muted-foreground)]">{key.replaceAll("_", " ")}</dt>
                    <dd className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">{String(value ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-5 text-sm text-[var(--muted-foreground)]">
                {payloadOf(subscriptionData)?.message || (isRtl ? "لا توجد تفاصيل اشتراك متاحة." : "No subscription details available.")}
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={handleSubmit} className={`${cardClass} space-y-4`}>
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">{isRtl ? "طلب اشتراك أو تجديد" : "Request a plan or renewal"}</h2>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{isRtl ? "ارفقي إيصال الدفع لإرسال الطلب للمراجعة." : "Attach your payment receipt to submit the order for review."}</p>
            </div>

            {listsError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{listsError}</p>}
            <div>
              <label htmlFor="subscription-package" className="mb-1.5 block text-xs font-semibold text-[var(--foreground)]">{isRtl ? "الباقة" : "Package"}</label>
              <select id="subscription-package" required disabled={listsLoading || !packages.length} value={packageId || itemId(packages[0])} onChange={(event) => setPackageId(event.target.value)} className={inputClass}>
                <option value="">{listsLoading ? (isRtl ? "جاري تحميل الباقات..." : "Loading packages...") : (isRtl ? "اختاري باقة" : "Select a package")}</option>
                {packages.map((item) => {
                  const price = Number(item.price || 0);
                  const finalPrice = item.final_price ?? price - Number(item.discount || 0);
                  return <option key={itemId(item)} value={itemId(item)}>{item.name} · {formatPrice(finalPrice)} · {item.months} {isRtl ? "شهر" : "months"}</option>;
                })}
              </select>
            </div>

            <div>
              <label htmlFor="payment-method" className="mb-1.5 block text-xs font-semibold text-[var(--foreground)]">{isRtl ? "طريقة الدفع" : "Payment method"}</label>
              <select id="payment-method" required disabled={listsLoading || !paymentMethods.length} value={paymentMethodId || itemId(paymentMethods[0])} onChange={(event) => setPaymentMethodId(event.target.value)} className={inputClass}>
                <option value="">{listsLoading ? (isRtl ? "جاري تحميل طرق الدفع..." : "Loading payment methods...") : (isRtl ? "اختاري طريقة دفع" : "Select a payment method")}</option>
                {paymentMethods.map((method) => (
                  <option key={itemId(method)} value={itemId(method)}>{method.name}</option>
                ))}
              </select>
              {paymentMethods.find((item) => itemId(item) === (paymentMethodId || itemId(paymentMethods[0])))?.description && (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{paymentMethods.find((item) => itemId(item) === (paymentMethodId || itemId(paymentMethods[0])))?.description}</p>
              )}
            </div>

            <div>
              <label htmlFor="receipt" className="mb-1.5 block text-xs font-semibold text-[var(--foreground)]">{isRtl ? "إيصال الدفع (صورة أو PDF، حتى 10 MB)" : "Payment receipt (image or PDF, up to 10 MB)"}</label>
              <label htmlFor="receipt" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)]">
                <Upload className="h-5 w-5 shrink-0" />
                <span className="truncate">{receipt?.name || (isRtl ? "اختاري ملف الإيصال" : "Choose a receipt file")}</span>
              </label>
              <input id="receipt" type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.pdf,image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf" className="sr-only" onChange={(event) => setReceipt(event.target.files?.[0] || null)} />
            </div>

            <button type="submit" disabled={submitting || listsLoading || !packages.length || !paymentMethods.length} className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? (isRtl ? "جاري الإرسال..." : "Submitting...") : (isRtl ? "إرسال طلب الاشتراك" : "Submit subscription request")}
            </button>
          </form>

          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">{isRtl ? "سجل الطلبات" : "Order history"}</h2>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{isRtl ? "طلبات الاشتراك والتجديد السابقة." : "Previous subscription and renewal requests."}</p>
              </div>
              <select aria-label={isRtl ? "فلترة الحالة" : "Filter status"} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className={`${inputClass} w-auto`}>
                <option value="">{isRtl ? "كل الحالات" : "All statuses"}</option>
                <option value="pending">{isRtl ? "قيد المراجعة" : "Pending"}</option>
                <option value="approve">{isRtl ? "مقبول" : "Approved"}</option>
                <option value="reject">{isRtl ? "مرفوض" : "Rejected"}</option>
              </select>
            </div>

            {historyError ? (
              <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{historyError}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-start text-xs">
                  <thead className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                    <tr>
                      <th className="px-2 py-3 font-semibold">{isRtl ? "الباقة" : "Package"}</th>
                      <th className="px-2 py-3 font-semibold">{isRtl ? "الإجمالي" : "Total"}</th>
                      <th className="px-2 py-3 font-semibold">{isRtl ? "الحالة" : "Status"}</th>
                      <th className="px-2 py-3 font-semibold">{isRtl ? "الإيصال" : "Receipt"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {historyLoading ? (
                      <tr><td colSpan="4" className="px-2 py-8 text-center text-[var(--muted-foreground)]">{isRtl ? "جاري التحميل..." : "Loading orders..."}</td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan="4" className="px-2 py-8 text-center text-[var(--muted-foreground)]">{isRtl ? "لا توجد طلبات حتى الآن." : "No orders yet."}</td></tr>
                    ) : orders.map((order) => {
                      const status = String(order.status || "").toLowerCase();
                      const packageName = order.package_id?.name || order.package?.name || order.package_name || "—";
                      const total = order.final_price ?? (Number(order.price || 0) - Number(order.discount || 0));
                      return (
                        <tr key={itemId(order)} className="text-[var(--foreground)]">
                          <td className="px-2 py-3">{packageName}</td>
                          <td className="px-2 py-3">{formatPrice(total)}</td>
                          <td className="px-2 py-3"><span className={`rounded-full px-2 py-1 font-semibold ${status === "reject" || status === "rejected" ? "bg-red-100 text-red-700" : status === "approve" || status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{orderStatusLabel(status, isRtl)}</span>{order.reject_reason && <p className="mt-1 max-w-40 text-[10px] text-red-600">{order.reject_reason}</p>}</td>
                          <td className="px-2 py-3">{order.receipt ? <a href={order.receipt} target="_blank" rel="noreferrer" className="font-semibold text-[var(--primary)] underline">{isRtl ? "عرض" : "View"}</a> : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs">
              <span className="text-[var(--muted-foreground)]">{isRtl ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1 || historyLoading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-40">{isRtl ? "السابق" : "Previous"}</button>
                <button type="button" disabled={page >= totalPages || historyLoading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-40">{isRtl ? "التالي" : "Next"}</button>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
