import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-6xl font-black text-primary">404</p>
        <h1 className="mt-4 text-2xl font-extrabold">الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-muted-foreground">تأكدي من الرابط وحاولي مرة أخرى.</p>
        <Button asChild className="mt-6"><Link to="/dashboard">العودة للوحة التحكم</Link></Button>
      </div>
    </div>
  )
}
