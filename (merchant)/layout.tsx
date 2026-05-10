import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { MerchantLayout } from '@/components/shared/merchant-layout'

export default async function MerchantGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'merchant') {
    switch (user.role) {
      case 'buyer':
        redirect('/buyer/home')
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

  return <MerchantLayout currentUser={user}>{children}</MerchantLayout>
}
