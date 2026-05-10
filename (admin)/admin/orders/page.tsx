'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search, RefreshCw } from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils'

interface Order {
  id: string
  orderNo: string
  totalAmount: number
  status: string
  paymentMethod: string
  createdAt: string
  buyer: { id: string; nickname: string; phone: string }
  merchant: { id: string; shopName: string }
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/admin/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.data || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, status, startDate, endDate, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const totalPages = Math.ceil(total / pageSize)

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'pending_payment', label: '待付款' },
    { value: 'paid', label: '已付款' },
    { value: 'in_warehouse', label: '已入仓' },
    { value: 'labeling', label: '贴单中' },
    { value: 'dispatched', label: '已发货' },
    { value: 'in_transit', label: '运输中' },
    { value: 'delivered', label: '已签收' },
    { value: 'cancelled', label: '已取消' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">订单管理</h1>
          <p className="text-sm text-gray-500 mt-1">查看和管理平台所有订单</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4 mr-1" /> 刷新
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="搜索订单号..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v === '__all__' ? '' : v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="全部状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部状态</SelectItem>
                {statusOptions.filter(s => s.value).map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} placeholder="开始日期" />
            <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} placeholder="结束日期" />
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatus(''); setStartDate(''); setEndDate(''); setPage(1) }}>
              重置筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>买家</TableHead>
                <TableHead>商家</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>付款方式</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">暂无订单数据</TableCell></TableRow>
              ) : orders.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => router.push(`/admin/orders/${o.id}`)}>
                  <TableCell className="font-medium">{o.orderNo}</TableCell>
                  <TableCell className="text-sm">{o.buyer?.nickname || o.buyer?.phone}</TableCell>
                  <TableCell className="text-sm">{o.merchant?.shopName}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(o.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{o.paymentMethod || '-'}</TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDateTime(o.createdAt)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/admin/orders/${o.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">查看详情</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">共 {total} 条</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        </div>
      )}
    </div>
  )
}
