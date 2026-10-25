import React, { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios'
import {
  Users,
  ShieldCheck,
  Layers,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Mail,
  Calendar,
  Receipt,
  Plus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

/* ───────────────────────── helpers ───────────────────────── */

const formatNumber = new Intl.NumberFormat('en-US')
const todayFormatted = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

const STATUS_STYLES = {
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  suspended: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400',
  failed_provisioning: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400',
}

const AVATAR_STYLES = [
  'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
]

// Counts a number up from 0 once, when the data arrives. Skips if the user prefers reduced motion.
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  const frame = useRef()

  useEffect(() => {
    const end = Number(target) || 0
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || end === 0) {
      setValue(end)
      return
    }
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(end * eased)
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])

  return Math.round(value)
}

function AnimatedNumber({ value, suffix = '' }) {
  const n = useCountUp(value)
  return (
    <>
      {formatNumber.format(n)}
      {suffix}
    </>
  )
}

// Entrance animation: one orchestrated sequence on page load, staggered by --i.
function Reveal({ i = 0, className = '', children }) {
  return (
    <div className={`dash-reveal ${className}`} style={{ '--i': i }}>
      {children}
    </div>
  )
}

const dashStyles = `
@keyframes dash-rise {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.dash-reveal {
  opacity: 0;
  animation: dash-rise 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--i, 0) * 70ms);
}
@media (prefers-reduced-motion: reduce) {
  .dash-reveal { opacity: 1; animation: none; }
}
`

/* ───────────────────────── states ───────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-28 rounded-2xl bg-muted" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
        <div className="h-80 rounded-2xl bg-muted" />
        <div className="h-80 rounded-2xl bg-muted" />
      </div>
    </div>
  )
}

function DashboardError({ onRetry }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Couldn’t load the dashboard</h3>
        <p className="text-sm text-muted-foreground">
          The server didn’t respond. Check your connection and try again.
        </p>
      </div>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  )
}

/* ───────────────────────── page ───────────────────────── */

export function DashboardPage() {
  const {
    data: dashboardRes,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/admin/dashboard')
      return res.data?.data || res.data
    },
    refetchOnWindowFocus: false,
  })

  const clients = dashboardRes?.clients || { total: 0, active: 0, suspended: 0, pending: 0, failed_provisioning: 0 }
  const admins = dashboardRes?.admins || { total: 0 }
  const sections = dashboardRes?.sections || { total: 0 }
  const finance = dashboardRes?.finance || { currency: 'EGP', revenue_last_30_days: 0, pending_payments: { count: 0, total: 0 } }
  const sales = dashboardRes?.sales_last_30_days || { count: 0, total: 0 }
  const recentClients = dashboardRes?.recent_clients || []
  const currency = finance.currency || 'EGP'
  const avgSale = sales.count ? Math.round(sales.total / sales.count) : 0

  const stats = [
    {
      label: 'Total clients',
      value: clients.total,
      subtext: `${clients.active} active · ${clients.suspended} suspended`,
      icon: Users,
      iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Administrators',
      value: admins.total,
      subtext: 'People with system access',
      icon: ShieldCheck,
      iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Sections',
      value: sections.total,
      subtext: 'Configured on the platform',
      icon: Layers,
      iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    },
    {
      label: 'Revenue, last 30 days',
      value: finance.revenue_last_30_days,
      suffix: ` ${currency}`,
      subtext: `${finance.pending_payments.count} pending (${formatNumber.format(finance.pending_payments.total)} ${currency})`,
      icon: DollarSign,
      iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <style>{dashStyles}</style>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <DashboardError onRetry={refetch} />
      ) : (
        <div className="space-y-8 lg:space-y-10">
          {/* Header */}
          <Reveal i={0}>
            <header className="flex flex-col gap-5 rounded-2xl border bg-card px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">{todayFormatted}</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin dashboard</h1>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Clients, revenue and sales across the platform, as of the last 30 days.
                </p>
              </div>

            </header>
          </Reveal>

          {/* KPI cards */}
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
            {stats.map(({ label, value, suffix, subtext, icon: Icon, iconClass }, idx) => (
              <Reveal key={label} i={idx + 1}>
                <Card className="h-full rounded-2xl shadow-sm">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{label}</p>
                      <div className={`grid h-10 w-10 place-items-center rounded-xl ${iconClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight">
                      <AnimatedNumber value={value} suffix={suffix} />
                    </p>
                    <p className="mt-auto pt-4 text-xs text-muted-foreground">{subtext}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </section>

          {/* Sales + recent clients */}
          <section className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
            <Reveal i={5} className="h-full">
              <Card className="h-full rounded-2xl shadow-sm">
                <CardHeader className="space-y-1 border-b px-6 py-5">
                  <CardTitle className="text-lg font-semibold">Sales overview</CardTitle>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </CardHeader>
                <CardContent className="p-0">
                  <dl className="divide-y">
                    <div className="flex items-center justify-between px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                        <dt className="text-sm text-muted-foreground">Orders</dt>
                      </div>
                      <dd className="text-xl font-semibold tabular-nums">
                        <AnimatedNumber value={sales.count} />
                      </dd>
                    </div>
                    <div className="flex items-center justify-between px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <dt className="text-sm text-muted-foreground">Total sales</dt>
                      </div>
                      <dd className="text-xl font-semibold tabular-nums">
                        <AnimatedNumber value={sales.total} suffix={` ${currency}`} />
                      </dd>
                    </div>
                    <div className="flex items-center justify-between px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                          <Receipt className="h-5 w-5" />
                        </div>
                        <dt className="text-sm text-muted-foreground">Average order</dt>
                      </div>
                      <dd className="text-xl font-semibold tabular-nums">
                        <AnimatedNumber value={avgSale} suffix={` ${currency}`} />
                      </dd>
                    </div>
                  </dl>
                  <p className="border-t px-6 py-4 text-xs text-muted-foreground">
                    Updated{' '}
                    {dashboardRes?.generated_at
                      ? new Date(dashboardRes.generated_at).toLocaleString()
                      : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </Reveal>

            <Reveal i={6} className="h-full">
              <Card className="flex h-full flex-col rounded-2xl shadow-sm">
                <CardHeader className="flex-row items-center justify-between space-y-0 border-b px-6 py-5">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">Recent clients</CardTitle>
                    <p className="text-sm text-muted-foreground">Newest companies on the platform</p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="font-medium">
                    <Link to="/clients">View all</Link>
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {recentClients.length === 0 ? (
                    <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                      No clients yet. New sign-ups will appear here.
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {recentClients.map((client, index) => (
                        <li
                          key={client._id || index}
                          className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div
                              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-semibold ${AVATAR_STYLES[index % AVATAR_STYLES.length]}`}
                            >
                              {client.company_name ? client.company_name.slice(0, 2).toUpperCase() : 'CL'}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate text-sm font-semibold">{client.company_name}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span className="flex min-w-0 items-center gap-1">
                                  <Mail className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{client.email}</span>
                                </span>
                                <span className="font-mono">{client.subdomain}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <Badge
                              variant="outline"
                              className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[client.status] || ''}`}
                            >
                              {String(client.status || '').replace('_', ' ')}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(client.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </Reveal>
          </section>
        </div>
      )}
    </div>
  )
}