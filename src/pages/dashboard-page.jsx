import { Activity, ArrowDownLeft, ArrowUpLeft, CreditCard, ShieldCheck, UserRound } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { monthlyAdminOverview } from '../data/admins'
import { getAdmins } from '../data/admin-storage'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

const formatNumber = new Intl.NumberFormat('ar-EG')
const today = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

export function DashboardPage() {
  const admins = getAdmins()
  const activeAdmins = admins.filter((admin) => admin.status === 'نشط').length
  const stats = [
    {
      label: 'إجمالي الأدمنز',
      value: formatNumber.format(admins.length),
      change: '+12.8%',
      icon: ShieldCheck,
      iconClass: 'bg-violet-50 text-violet-700',
      positive: true,
    },
    {
      label: 'الأدمنز النشطون',
      value: formatNumber.format(activeAdmins),
      change: '+8.2%',
      icon: UserRound,
      iconClass: 'bg-emerald-50 text-emerald-700',
      positive: true,
    },
    {
      label: 'إجمالي الطلبات',
      value: formatNumber.format(856),
      change: '+4.3%',
      icon: CreditCard,
      iconClass: 'bg-sky-50 text-sky-700',
      positive: true,
    },
    {
      label: 'معدل التحويل',
      value: '3.6%',
      change: '-1.2%',
      icon: Activity,
      iconClass: 'bg-amber-50 text-amber-700',
      positive: false,
    },
  ]

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm text-muted-foreground">{today}</p>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-[28px]">لوحة التحكم</h1>
          <p className="mt-2 text-sm text-muted-foreground">تابعي أداء المنصة ونشاط فريق الإدارة.</p>
        </div>
        <Button asChild>
          <Link to="/admins/new">إضافة أدمن</Link>
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="ملخص الإحصائيات">
        {stats.map(({ label, value, change, icon: Icon, iconClass, positive }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {positive ? <ArrowUpLeft className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                  {change}
                </span>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
              <p className="mt-2 text-xs text-muted-foreground">مقارنة بالشهر الماضي</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>نمو فريق الإدارة</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">الأدمنز الجدد خلال آخر ٦ أشهر</p>
            </div>
            <Badge variant="success">آخر ٦ أشهر</Badge>
          </CardHeader>
          <CardContent className="h-[280px] pr-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAdminOverview} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#edf0f5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f4f2ff' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #eceef3', direction: 'rtl' }}
                />
                <Bar dataKey="admins" name="أدمن جديد" fill="#6d5dfc" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>أحدث الأدمنز</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">أحدث حسابات فريق الإدارة</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admins">عرض الكل</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {admins.slice(0, 4).map((admin, index) => (
              <div className="flex items-center gap-3" key={admin.id}>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${['bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700'][index % 4]}`}>
                  {admin.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{admin.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                </div>
                <Badge variant={admin.status === 'نشط' ? 'success' : 'muted'}>{admin.status}</Badge>
              </div>
            ))}
            {admins.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">لا يوجد أدمنز حتى الآن.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
