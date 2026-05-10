'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck, PackageCheck, ShoppingCart, Users, DollarSign,
  TrendingUp, Clock, ArrowRight, AlertTriangle,
} from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils'

interface DashboardStats {
  merchantCount: number
  buyerCount: number
  productCount: number
  orderCount: number
  pendingMerchantCount: number
  monthGMV: number
  monthOrderCount: number
}

interface RecentOrder {
  id: string
  orderNo: string
  totalAmount: number
  status: string
  createdAt: string
  buyer: { nickname: string; phone: string }
  merchant: { shopName: string }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [pendingMerchants, setPendingMerchants] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, ordersRes, merchantsRes] = await Promise.all([
          fetch('/api/admin/reports?type=overview'),
          fetch('/api/admin/orders?pageSize=5'),
          fetch('/api/admin/merchants?status=pending&pageSize=1'),
        ])

        if (statsRes.ok) setStats(await statsRes.json())
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setRecentOrders(ordersData.data || [])
        }
        if (merchantsRes.ok) {
          const mData = await merchantsRes.json()
          setPendingMerchants(mData.total || 0)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const statCards = [
    { label: '总商家数', value: stats?.merchantCount ?? 0, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600', href: '/admin/merchants' },
    { label: '总买家数', value: stats?.buyerCount ?? 0, icon: Users, color: 'bg-sky-50 text-sky-600', href: '/admin/users' },
    { label: '总商品数', value: stats?.productCount ?? 0, icon: PackageCheck, color: 'bg-amber-50 text-amber-600', href: '/admin/products' },
    { label: '本月GMV', value: stats?.monthGMV ?? 0, icon: DollarSign, color: 'bg-rose-50 text-rose-600', href: '/admin/finance', isPrice: true },
    { label: '本月订单数', value: stats?.monthOrderCount ?? 0, icon: ShoppingCart, color: 'bg-violet-50 text-violet-600', href: '/admin/orders' },
    { label: '待审核商家', value: stats?.pendingMerchantCount ?? 0, icon: AlertTriangle, color: 'bg-orange-50 text-orange-600', href: '/admin/merchants' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
        <p className="text-sm text-gray-500 mt-1">平台运营数据概览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">{card.label}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {loading ? '...' : card.isPrice ? formatPrice(card.value) : card.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      {pendingMerchants > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-orange-800">
                当前有 <strong>{pendingMerchants}</strong> 位商家等待审核
              </span>
            </div>
            <Link href="/admin/merchants?tab=pending">
              <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                去审核 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                最近订单
              </CardTitle>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="text-xs">
                  查看全部 <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">暂无订单数据</p>
            ) : (
              recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`}>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{order.orderNo}</p>
                      <p className="text-xs text-gray-500">
                        {order.buyer?.nickname || order.buyer?.phone} → {order.merchant?.shopName}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-semibold text-gray-900">{formatPrice(order.totalAmount)}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              快捷入口
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '商家审核', href: '/admin/merchants', icon: ShieldCheck, desc: '审核商家入驻申请' },
                { label: '商品审核', href: '/admin/products', icon: PackageCheck, desc: '审核商品上架申请' },
                { label: '订单管理', href: '/admin/orders', icon: ShoppingCart, desc: '查看和管理订单' },
                { label: '仓储管理', href: '/admin/warehouse', icon: PackageCheck, desc: '入库贴单出库操作' },
                { label: '财务管理', href: '/admin/finance', icon: DollarSign, desc: '结算和提现管理' },
                { label: '数据报表', href: '/admin/reports', icon: TrendingUp, desc: '运营数据分析' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.label} href={item.href}>
                    <div className="p-3 rounded-lg border hover:bg-gray-50 hover:border-emerald-200 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
