import { AuthLayout } from '@/components/shared/auth-layout'

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthLayout>{children}</AuthLayout>
}
