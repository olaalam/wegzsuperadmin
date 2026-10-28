import React, { useState } from "react";
import { useGet } from "@/hooks/useGet";
import GenericDataTable from "@/components/GenericDataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  Layers,
  Calendar,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FinancialReportsDashboard() {
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [activeTab, setActiveTab] = useState("summary");

  const queryParams = {
    ...(dateRange.from && { from: dateRange.from }),
    ...(dateRange.to && { to: dateRange.to }),
  };

  // Fetching endpoints
  const { data: summaryRes, isLoading: summaryLoading } = useGet(
    ["financial-summary", queryParams],
    "/api/admin/financial-reports/summary",
    queryParams
  );
  const summaryData = summaryRes?.data;

  const { data: monthlyRes, isLoading: monthlyLoading } = useGet(
    ["financial-monthly", queryParams],
    "/api/admin/financial-reports/monthly",
    queryParams
  );
  const monthlyData = monthlyRes?.data;

  const { data: agentsRes, isLoading: agentsLoading } = useGet(
    ["financial-sales-agent", queryParams],
    "/api/admin/financial-reports/by-sales-agent",
    queryParams
  );
  const agentsData = agentsRes?.data;

  const { data: pendingRes, isLoading: pendingLoading } = useGet(
    ["financial-pending", queryParams],
    "/api/admin/financial-reports/pending",
    queryParams
  );
  const pendingData = pendingRes?.data;

  const { data: sectionRes, isLoading: sectionLoading } = useGet(
    ["financial-section", queryParams],
    "/api/admin/financial-reports/by-section",
    queryParams
  );
  const sectionData = sectionRes?.data;

  // Table columns definition
  const monthlyColumns = [
    { accessorKey: "month", header: "Month / Year" },
    { accessorKey: "totalRevenue", header: "Total Revenue" },
    { accessorKey: "totalOrders", header: "Total Orders" },
    { accessorKey: "netProfit", header: "Net Profit" },
  ];

  const agentColumns = [
    { accessorKey: "agentName", header: "Sales Agent Name" },
    { accessorKey: "totalSales", header: "Total Sales" },
    { accessorKey: "completedOrders", header: "Completed Orders" },
    { accessorKey: "commission", header: "Commission Due" },
  ];

  const pendingColumns = [
    { accessorKey: "id", header: "Transaction ID" },
    { accessorKey: "clientName", header: "Client Name" },
    { accessorKey: "amount", header: "Amount" },
    { accessorKey: "createdAt", header: "Created At" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/50">
          {row.original.status || "Pending"}
        </span>
      )
    },
  ];

  const sectionColumns = [
    { accessorKey: "sectionName", header: "Section Name" },
    { accessorKey: "revenue", header: "Revenue" },
    { accessorKey: "percentage", header: "Percentage" },
  ];

  const currency = summaryData?.currency || "EGP";

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Header & Date Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-100/50 dark:shadow-none transition-all">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
              <FileSpreadsheet size={24} />
            </div>
            Financial Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Monitor revenue, monthly performance, and sales commissions based on custom date ranges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
            <span className="text-xs font-bold text-slate-500 px-2">From:</span>
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="h-9 border-none bg-transparent text-xs font-semibold focus-visible:ring-0 shadow-none cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-500 px-2">To:</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="h-9 border-none bg-transparent text-xs font-semibold focus-visible:ring-0 shadow-none cursor-pointer"
            />
          </div>
          {(dateRange.from || dateRange.to) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange({ from: "", to: "" })}
              className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl h-11 px-4 border-rose-200 dark:border-rose-900 font-bold gap-2"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards mapped to JSON schema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-100/60 dark:shadow-none bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Invoiced</CardTitle>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl shadow-xs">
              <DollarSign size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {summaryData?.revenue?.total_invoiced ?? 0} <span className="text-xs font-bold text-slate-400">{currency}</span>
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <TrendingUp size={14} /> Approved: {summaryData?.revenue?.approved ?? 0} {currency}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-100/60 dark:shadow-none bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">MRR (30 Days)</CardTitle>
            <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-xs">
              <TrendingUp size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {summaryData?.mrr_last_30_days ?? 0} <span className="text-xs font-bold text-slate-400">{currency}</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-2">Collection Rate: {summaryData?.collection_rate ?? 0}%</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-100/60 dark:shadow-none bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Pending Payments</CardTitle>
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl shadow-xs">
              <Clock size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {summaryData?.pending_payments?.count ?? 0} <span className="text-xs font-bold text-slate-400">Items</span>
            </div>
            <p className="text-xs text-amber-600 font-bold mt-2">Total: {summaryData?.pending_payments?.total ?? 0} {currency}</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-100/60 dark:shadow-none bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Active Clients</CardTitle>
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl shadow-xs">
              <Users size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {summaryData?.active_clients ?? 0} <span className="text-xs font-bold text-slate-400">/ {summaryData?.total_clients ?? 0}</span>
            </div>
            <p className="text-xs text-blue-600 font-bold mt-2">Total registered clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800/80">
        {[
          { id: "summary", label: "Financial Summary", icon: FileSpreadsheet },
          { id: "monthly", label: "Monthly Reports", icon: Calendar },
          { id: "agents", label: "By Sales Agent", icon: Users },
          { id: "pending", label: "Pending Transactions", icon: Clock },
          { id: "section", label: "By Section", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "h-12 px-6 rounded-2xl font-bold text-xs gap-2.5 shrink-0 transition-all shadow-xs",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
              )}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="transition-all animate-in fade-in-50 duration-300">
        {activeTab === "summary" && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-100/50 dark:shadow-none space-y-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">General Financial Summary Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected Revenue:</span>
                <p className="text-sm font-bold text-rose-600 mt-2 flex items-center gap-2">
                  <XCircle size={16} />
                  {summaryData?.revenue?.rejected ?? 0} {currency}
                </p>
              </div>
              <div className="p-6 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Counts (Rejected):</span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  {summaryData?.payments?.rejected_count ?? 0} Rejected / {summaryData?.payments?.approved_count ?? 0} Approved
                </p>
              </div>
              <div className="p-6 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Payment:</span>
                <p className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-2">
                  <TrendingUp size={16} />
                  {summaryData?.payments?.average_payment ?? 0} {currency}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "monthly" && (
          <GenericDataTable
            columns={monthlyColumns}
            data={Array.isArray(monthlyData) ? monthlyData : (monthlyData?.reports || [])}
            title="Monthly Financial Reports"
            isLoading={monthlyLoading}
            actions={false}
          />
        )}

        {activeTab === "agents" && (
          <GenericDataTable
            columns={agentColumns}
            data={Array.isArray(agentsData) ? agentsData : (agentsData?.agents || [])}
            title="Sales Agents Performance Reports"
            isLoading={agentsLoading}
            actions={false}
          />
        )}

        {activeTab === "pending" && (
          <GenericDataTable
            columns={pendingColumns}
            data={Array.isArray(pendingData) ? pendingData : (pendingData?.pendingReports || [])}
            title="Pending Transactions & Reports"
            isLoading={pendingLoading}
            actions={false}
          />
        )}

        {activeTab === "section" && (
          <GenericDataTable
            columns={sectionColumns}
            data={Array.isArray(sectionData) ? sectionData : (sectionData?.sections || [])}
            title="Reports by Section / Department"
            isLoading={sectionLoading}
            actions={false}
          />
        )}
      </div>
    </div>
  );
}