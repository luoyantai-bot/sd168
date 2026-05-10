import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function HomePage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  switch (user.role) {
    case 'buyer':
      redirect('/buyer/home')
    case 'merchant':
      redirect('/merchant/dashboard')
    case 'super_admin':
      redirect('/admin/dashboard')
    case 'warehouse_staff':
      redirect('/admin/warehouse')
    case 'logistics_staff':
      redirect('/admin/logistics')
    default:
      redirect('/login')
  }
}
