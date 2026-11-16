export default function StatusBadge({ status }) {
  const active = status === "active" || status === "approve";
  const pending = status === "pending";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : pending
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
    }`}>
      {status || "—"}
    </span>
  );
}
