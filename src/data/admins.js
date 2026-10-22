export const initialAdmins = [
  {
    id: 'a-1001',
    name: 'أحمد محمد',
    email: 'ahmed.mohamed@example.com',
    phone: '+20 100 123 4567',
    role: 'مدير النظام',
    status: 'نشط',
    joinedAt: '2026-10-18',
  },
  {
    id: 'a-1002',
    name: 'سارة علي',
    email: 'sara.ali@example.com',
    phone: '+20 101 234 5678',
    role: 'مدير',
    status: 'نشط',
    joinedAt: '2026-10-16',
  },
  {
    id: 'a-1003',
    name: 'محمود حسن',
    email: 'mahmoud.hassan@example.com',
    phone: '+20 102 345 6789',
    role: 'مشرف',
    status: 'معلق',
    joinedAt: '2026-10-12',
  },
  {
    id: 'a-1004',
    name: 'نور إبراهيم',
    email: 'nour.ibrahim@example.com',
    phone: '+20 103 456 7890',
    role: 'مدير',
    status: 'نشط',
    joinedAt: '2026-10-08',
  },
]

export const monthlyAdminOverview = [
  { month: 'مايو', admins: 2 },
  { month: 'يونيو', admins: 3 },
  { month: 'يوليو', admins: 2 },
  { month: 'أغسطس', admins: 4 },
  { month: 'سبتمبر', admins: 3 },
  { month: 'أكتوبر', admins: 5 },
]

export function getCurrentIsoDate() {
  return new Date().toISOString().slice(0, 10)
}
