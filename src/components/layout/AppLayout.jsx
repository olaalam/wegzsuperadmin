import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, LayoutDashboard, ShieldCheck } from "lucide-react";
import Navbar from "./Navbar";

const navigation = [
  { to: "/dashboard", label: { en: "Design Studio", ar: "استوديو التصميم" }, icon: LayoutDashboard },
  { to: "/admins", label: { en: "Admins", ar: "الأدمنز" }, icon: ShieldCheck },
  { to: "/sales", label: { en: "Sales", ar: "المبيعات" }, icon: LayoutDashboard },
  { to: "/payments", label: { en: "Payments", ar: "المدفوعات" }, icon: LayoutDashboard },
];

export default function AppLayout({ children }) {
  const lang = useSelector((state) => state.ui.lang);
  const location = useLocation();

  // ✅ Define missing state and variables here
  const [isExpanded, setIsExpanded] = useState(true);
  const isRTL = lang === "ar";

  const ToggleIcon = isExpanded
    ? (isRTL ? ChevronRight : ChevronLeft)
    : (isRTL ? ChevronLeft : ChevronRight);
  const toggleLabel = isExpanded
    ? (isRTL ? "إغلاق القائمة الجانبية" : "Collapse sidebar")
    : (isRTL ? "فتح القائمة الجانبية" : "Expand sidebar");

  return (
    <div className="flex min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      {isExpanded && (
        <button
          type="button"
          aria-label={isRTL ? "إغلاق القائمة الجانبية" : "Close sidebar"}
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}
      <aside className={`sticky top-0 z-50 flex h-screen shrink-0 flex-col border-e border-[var(--border)] bg-[var(--card)] py-4 transition-[width] duration-200 ${isExpanded ? "w-56 px-3 max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:shadow-xl" : "w-14 px-2"}`}>
        <div className={`mb-6 flex items-center gap-2 ${isExpanded ? "justify-between" : "flex-col"}`}>
          <div className="flex h-9 min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-black text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/10">
              W
            </span>
            {isExpanded && (
              <div className="flex flex-col leading-tight">
                <span className="truncate text-sm font-black tracking-tight text-[var(--foreground)]">
                  Wegz<span className="text-blue-600 font-extrabold"></span>
                </span>
                <span className="text-[9px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Admin Studio
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-label={toggleLabel}
            title={toggleLabel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <ToggleIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={isRTL ? "التنقل الرئيسي" : "Main navigation"} className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
          {navigation.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
            return (
              <NavLink
                key={to}
                to={to}
                title={label[lang] ?? label.en}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsExpanded(false);
                }}
                className={`flex min-h-10 items-center gap-3 rounded-lg text-sm transition-colors ${isExpanded ? "justify-start px-3" : "justify-center px-2"} ${active
                  ? "bg-[var(--accent)] font-semibold text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {isExpanded && <span className="truncate">{label[lang] ?? label.en}</span>}
              </NavLink>
            );
          })}

        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Navbar />
        {children}
      </div>
    </div>
  );
}