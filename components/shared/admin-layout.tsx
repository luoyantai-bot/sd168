'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Store,
  LayoutDashboard,
  ShieldCheck,
  PackageCheck,
  ShoppingCart,
  Users,
  Warehouse,
  Truck,
  Wallet,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  ChevronDown,
  UserCog,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SessionUser } from '@/lib/auth'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
  currentUser: SessionUser
}

const sidebarItems = [
  { label: '数据看板', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: '商家审核', href: '/admin/merchants', icon: ShieldCheck },
  { label: '商品审核', href: '/admin/products', icon: PackageCheck },
  { label: '订单管理', href: '/admin/orders', icon: ShoppingCart },
  { label: '用户管理', href: '/admin/users', icon: Users },
  { label: '仓储管理', href: '/admin/warehouse', icon: Warehouse },
  { label: '物流管理', href: '/admin/logistics', icon: Truck },
  { label: '财务管理', href: '/admin/finance', icon: Wallet },
  { label: '平台配置', href: '/admin/config', icon: Settings },
  { label: '数据报表', href: '/admin/reports', icon: BarChart3 },
]

interface SidebarContentProps {
  pathname: string | null
  onNavigate: () => void
  onLogout: () => void
}

function AdminSidebarContent({ pathname, onNavigate, onLogout }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="p-6 border-b">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-md">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-base text-gray-900">邵东选品</h2>
            <p className="text-[11px] text-gray-400">平台管理中心</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-emerald-50 text-emerald-600 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>
    </div>
  )
}

export function AdminLayout({ children, currentUser }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const handleNavigate = () => {
    setMobileOpen(false)
  }

  const initials = currentUser.nickname?.slice(0, 2) || '管'

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r">
        <AdminSidebarContent pathname={pathname} onNavigate={handleNavigate} onLogout={handleLogout} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <AdminSidebarContent pathname={pathname} onNavigate={handleNavigate} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      {/* Main Area */}
      <div className="flex-1 lg:pl-60">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="font-semibold text-gray-900">平台管理</h2>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium max-w-[100px] truncate hidden sm:inline">
                  {currentUser.nickname || '管理员'}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/admin/config" className="cursor-pointer">
                  <UserCog className="w-4 h-4 mr-2" />
                  账户设置
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
