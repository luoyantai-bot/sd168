'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ShoppingCart, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatPrice, formatDate, getStatusLabel, getStatusColor, parseJSON } from '@/lib/utils'

interface Order {
  id: string
  orderNo: string
  items: Array<{ productId: string; title: string; quantity: number; price: number; unit: string }>
  totalAmount: number
  status: string
  createdAt: string
  buyer: {
    id: string
    nickname: string
    phone: string
  }
}

const statusTabs = [
  { value: '', label: '全部' },
  { value: 'pending_payment', label: '待付款' },
  { value: 'paid', label: '已付款' },
  { value: 'in_warehouse', label: '已入仓' },
  { value: 'dispatched', label: '已发货' },
  { value: 'in_transit', label: '运输中' },
  { value: 'delivered', label: '已签收' },
  { value: 'cancelled', label: '已取消' },
]

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [keyword, setKeyword] = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab) params.set('status', activeTab)
      const res = await fetch(`/api/merchant/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {
      console.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    if (!keyword) return true
    const k = keyword.toLowerCase()
    return (
      order.orderNo.toLowerCase().includes(k) ||
      order.items.some((item) => item.title.toLowerCase().includes(k)) ||
      order.buyer.nickname.toLowerCase().includes(k)
    )
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-900">订单管理</h1>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索订单号/商品/买家..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Order List */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无订单</p>
            <p className="text-sm text-gray-400 mt-1">订单将显示在这里</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>商品信息</TableHead>
                    <TableHead>买家</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                    <TableHead className="text-center">状态</TableHead>
                    <TableHead>日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer">
                      <TableCell>
                        <Link href={`/merchant/orders/${order.id}`} className="text-sm font-medium text-teal-600 hover:underline">
                          {order.orderNo}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          {order.items.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-sm text-gray-900 truncate max-w-[200px]">
                              {item.title} × {item.quantity}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-gray-400">+{order.items.length - 2}件商品</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{order.buyer.nickname || '买家'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium text-gray-900">{formatPrice(order.totalAmount)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-[11px] ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{formatDate(order.createdAt)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
