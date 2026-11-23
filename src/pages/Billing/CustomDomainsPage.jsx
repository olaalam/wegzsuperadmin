import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Globe2, LockKeyhole, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useGet } from "../../hooks/useGet";
import api from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants";

const cardClass = "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm";
const inputClass = "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]";

const payloadOf = (value) => {
  let current = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!current || Array.isArray(current) || typeof current !== "object" || !current.data) break;
    current = current.data;
  }
  return current;
};

const domainList = (response) => {
  const payload = payloadOf(response);
  if (Array.isArray(payload)) return payload;
  for (const key of ["custom_domains", "customDomains", "domains", "items"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const hostnamePattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const subdomainPattern = /^(?!-)(?!.*-$)[a-z0-9-]{1,63}$/i;

function displayValue(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function domainId(domain) {
  return String(domain?._id ?? domain?.id ?? "");
}

export default function CustomDomainsPage() {
  const lang = useSelector((state) => state.ui.lang);
  const isRtl = lang === "ar";
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const {
    data: domainsData,
    loading: domainsLoading,
    error: domainsError,
    refetch: refetchDomains,
  } = useGet(["custom-domains"], API_ENDPOINTS.CUSTOM_DOMAINS.GET);
  const {
    data: serverInfoData,
    loading: serverInfoLoading,
    error: serverInfoError,
    refetch: refetchServerInfo,
  } = useGet(["custom-domains-server-info"], API_ENDPOINTS.CUSTOM_DOMAINS.SERVER_INFO);
  const domains = domainList(domainsData);
  const serverPayload = payloadOf(serverInfoData);
  const serverInfo = serverPayload?.server_info || serverPayload?.serverInfo || serverPayload;
  const serverEntries = serverInfo && typeof serverInfo === "object" && !Array.isArray(serverInfo)
    ? Object.entries(serverInfo).filter(([, value]) => value == null || ["string", "number", "boolean"].includes(typeof value))
    : [];

  const handleCreate = async (event) => {
    event.preventDefault();
    const cleanSubdomain = subdomain.trim().toLowerCase();
    const cleanDomain = customDomain.trim().toLowerCase();
    if (!subdomainPattern.test(cleanSubdomain)) {
      toast.error(isRtl ? "اكتبي اسم نطاق فرعي صالحًا من الحروف والأرقام والشرطة." : "Enter a valid subdomain using letters, numbers, and hyphens.");
      return;
    }
    if (!hostnamePattern.test(cleanDomain)) {
      toast.error(isRtl ? "اكتبي الدومين كاسم نطاق فقط، مثل example.com." : "Enter a hostname only, such as example.com.");
      return;
    }

    setBusyAction("create");
    try {
      await api.post(API_ENDPOINTS.CUSTOM_DOMAINS.CREATE, {
        subdomain: cleanSubdomain,
        custom_domain: cleanDomain,
      });
      toast.success(isRtl ? "تمت إضافة الدومين." : "Custom domain added.");
      setSubdomain("");
      setCustomDomain("");
      refetchDomains();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || (isRtl ? "فشل إضافة الدومين" : "Failed to add domain");
      toast.error(msg);
    } finally {
      setBusyAction("");
    }
  };

  const runDomainAction = async (domain, action) => {
    const id = domainId(domain);
    if (!id) {
      toast.error(isRtl ? "تعذر تنفيذ العملية: معرّف الدومين غير موجود." : "Cannot perform this action: domain ID is missing.");
      return;
    }
    const key = `${id}:${action}`;
    setBusyAction(key);
    try {
      const endpoint = action === "verify"
        ? API_ENDPOINTS.CUSTOM_DOMAINS.VERIFY_DNS(id)
        : action === "ssl"
          ? API_ENDPOINTS.CUSTOM_DOMAINS.SSL(id)
          : API_ENDPOINTS.CUSTOM_DOMAINS.DELETE(id);

      if (action === "delete") {
        await api.delete(endpoint);
      } else {
        await api.post(endpoint);
      }

      const labels = {
        verify: isRtl ? "تم بدء التحقق من DNS." : "DNS verification started.",
        ssl: isRtl ? "تم إرسال طلب تفعيل SSL." : "SSL activation requested.",
        delete: isRtl ? "تم حذف الدومين." : "Domain deleted.",
      };
      toast.success(labels[action]);
      refetchDomains();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || (isRtl ? "فشلت العملية" : "Action failed");
      toast.error(msg);
    } finally {
      setBusyAction("");
    }
  };

  const handleDelete = (domain) => {
    const confirmed = window.confirm(
      isRtl
        ? `هل تريدين حذف ${domain.custom_domain || domain.subdomain}؟`
        : `Delete ${domain.custom_domain || domain.subdomain}?`
    );
    if (confirmed) runDomainAction(domain, "delete");
  };

  const refreshAll = () => {
    refetchDomains();
    refetchServerInfo();
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{isRtl ? "الدومينات المخصصة" : "Custom domains"}</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{isRtl ? "إضافة الدومينات والتحقق من DNS وإدارة شهادة SSL." : "Add domains, verify DNS, and manage SSL certificates."}</p>
          </div>
          <button type="button" onClick={refreshAll} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
            <RefreshCw className="h-4 w-4" />
            {isRtl ? "تحديث" : "Refresh"}
          </button>
        </div>

        <section className={cardClass}>
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600"><Globe2 className="h-5 w-5" /></span>
            <div>
              <h2 className="font-bold text-[var(--foreground)]">{isRtl ? "معلومات إعداد الخادم" : "Server setup information"}</h2>
              <p className="text-xs text-[var(--muted-foreground)]">GET /api/admin/custom-domains/server-info</p>
            </div>
          </div>
          {serverInfoLoading ? (
            <p className="text-sm text-[var(--muted-foreground)]">{isRtl ? "جاري تحميل معلومات الخادم..." : "Loading server information..."}</p>
          ) : serverInfoError ? (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverInfoError}</p>
          ) : serverEntries.length ? (
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {serverEntries.map(([key, value]) => (
                <div key={key} className="min-w-0 rounded-xl bg-[var(--background)] p-3">
                  <dt className="text-[11px] text-[var(--muted-foreground)]">{key.replaceAll("_", " ")}</dt>
                  <dd className="mt-1 break-all text-sm font-semibold text-[var(--foreground)]">{displayValue(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">{isRtl ? "لا توجد معلومات خادم متاحة." : "No server information available."}</p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={handleCreate} className={`${cardClass} h-fit space-y-4`}>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600"><Plus className="h-5 w-5" /></span>
              <div>
                <h2 className="font-bold text-[var(--foreground)]">{isRtl ? "إضافة دومين" : "Add a domain"}</h2>
                <p className="text-xs text-[var(--muted-foreground)]">{isRtl ? "أدخلي النطاق الفرعي والدومين المخصص." : "Provide the subdomain and custom domain."}</p>
              </div>
            </div>
            <div>
              <label htmlFor="custom-subdomain" className="mb-1.5 block text-xs font-semibold text-[var(--foreground)]">{isRtl ? "النطاق الفرعي" : "Subdomain"}</label>
              <input id="custom-subdomain" required maxLength={63} autoComplete="off" value={subdomain} onChange={(event) => setSubdomain(event.target.value)} placeholder="store" className={inputClass} />
            </div>
            <div>
              <label htmlFor="custom-domain" className="mb-1.5 block text-xs font-semibold text-[var(--foreground)]">{isRtl ? "الدومين المخصص" : "Custom domain"}</label>
              <input id="custom-domain" required autoComplete="off" value={customDomain} onChange={(event) => setCustomDomain(event.target.value)} placeholder="store.example.com" className={inputClass} />
              <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">{isRtl ? "اكتبي اسم الدومين فقط بدون https:// أو مسار." : "Enter the hostname only; omit https:// and any path."}</p>
            </div>
            <button type="submit" disabled={busyAction !== ""} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-50">
              <Plus className="h-4 w-4" />
              {busyAction === "create" ? (isRtl ? "جاري الإضافة..." : "Adding...") : (isRtl ? "إضافة الدومين" : "Add domain")}
            </button>
          </form>

          <section className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-[var(--foreground)]">{isRtl ? "الدومينات المسجلة" : "Registered domains"}</h2>
                <p className="text-xs text-[var(--muted-foreground)]">{isRtl ? "تحققي من DNS واطلبي SSL لكل دومين." : "Verify DNS and request SSL for each domain."}</p>
              </div>
              <span className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs font-bold text-[var(--muted-foreground)]">{domains.length}</span>
            </div>
            {domainsError ? (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{domainsError}</p>
            ) : domainsLoading ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">{isRtl ? "جاري تحميل الدومينات..." : "Loading domains..."}</p>
            ) : domains.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">{isRtl ? "لم تتم إضافة دومينات بعد." : "No custom domains have been added yet."}</p>
            ) : (
              <div className="space-y-3">
                {domains.map((domain) => {
                  const id = domainId(domain);
                  const displayDomain = domain.custom_domain || domain.domain || domain.subdomain || "—";
                  const dnsStatus = domain.dns_status || domain.dnsStatus || (domain.dns_verified ? "verified" : "");
                  const sslStatus = domain.ssl_status || domain.sslStatus || "";
                  return (
                    <article key={id || displayDomain} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-all text-sm font-bold text-[var(--foreground)]">{displayDomain}</h3>
                          {domain.subdomain && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{isRtl ? "النطاق الفرعي:" : "Subdomain:"} {domain.subdomain}</p>}
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                            {domain.status && <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">{domain.status}</span>}
                            {dnsStatus && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">DNS: {dnsStatus}</span>}
                            {sslStatus && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">SSL: {sslStatus}</span>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={!id || busyAction !== ""} onClick={() => runDomainAction(domain, "verify")} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {isRtl ? "تحقق DNS" : "Verify DNS"}
                          </button>
                          <button type="button" disabled={!id || busyAction !== ""} onClick={() => runDomainAction(domain, "ssl")} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50">
                            <LockKeyhole className="h-3.5 w-3.5" />
                            {isRtl ? "تفعيل SSL" : "Request SSL"}
                          </button>
                          <button type="button" disabled={!id || busyAction !== ""} onClick={() => handleDelete(domain)} aria-label={isRtl ? `حذف ${displayDomain}` : `Delete ${displayDomain}`} className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
