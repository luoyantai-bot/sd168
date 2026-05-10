'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Truck, RefreshCw, Plus, Settings } from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils'

interface LogisticsStats {
  pickedUp: number
  inTransit: number
  delivered: number
}

interface LogisticsOrder {
  id: string
  trackingNo: string
  logisticsChannel: string
  destination: string
  weight: number
  freight: number
  status: string
  createdAt: string
  order: {
    id: string
    orderNo: string
    buyer: { nickname: string; phone: string }
    merchant: { shopName: string }
    receiverName: string
    receiverCountry: string
  }
}

export default function AdminLogisticsPage() {
  const [orders, setOrders] = useState<LogisticsOrder[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [stats, setStats] = useState<LogisticsStats>({ pickedUp: 0, inTransit: 0, delivered: 0 })
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/admin/logistics/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.data || [])
        setTotal(data.total || 0)
        if (data.stats) setStats(data.stats)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.ceil(total / pageSize)

  const logisticsStatusMap: Record<string, string> = {
    created: '已创建',
    picked_up: '已揽收',
    customs_clearance: '清关中',
    in_transit: '运输中',
    arrived: '已到达',
    delivered: '已签收',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">物流管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理物流订单和渠道</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/logistics/channels">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-1" /> 渠道管理
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '已揽收', value: stats.pickedUp, color: 'bg-amber-50 text-amber-600' },
          { label: '运输中', value: stats.inTransit, color: 'bg-sky-50 text-sky-600' },
          { label: '已签收', value: stats.delivered, color: 'bg-emerald-50 text-emerald-600' },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={(v) => { setStatus(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="全部状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部状态</SelectItem>
            <SelectItem value="created">已创建</SelectItem>
            <SelectItem value="picked_up">已揽收</SelectItem>
            <SelectItem value="customs_clearance">清关中</SelectItem>
            <SelectItem value="in_transit">运输中</SelectItem>
            <SelectItem value="arrived">已到达</SelectItem>
            <SelectItem value="delivered">已签收</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>物流渠道</TableHead>
                <TableHead>运单号</TableHead>
                <TableHead>关联订单</TableHead>
                <TableHead>商家</TableHead>
                <TableHead>目的地</TableHead>
                <TableHead>重量(kg)</TableHead>
                <TableHead>运费</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-400">暂无物流数据</TableCell></TableRow>
              ) : orders.map((lo) => (
                <TableRow key={lo.id}>
                  <TableCell className="text-sm">{lo.logisticsChannel}</TableCell>
                  <TableCell className="font-medium text-sm">{lo.trackingNo || '-'}</TableCell>
                  <TableCell>
                    <Link href={`/admin/orders/${lo.order?.id}`} className="text-sm text-emerald-600 hover:underline">
                      {lo.order?.orderNo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{lo.order?.merchant?.shopName}</TableCell>
                  <TableCell className="text-sm">{lo.destination}</TableCell>
                  <TableCell className="text-sm">{lo.weight}</TableCell>
                  <TableCell className="text-sm">{formatPrice(lo.freight)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${getStatusColor(lo.status)}`}>
                      {logisticsStatusMap[lo.status] || lo.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDateTime(lo.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/logistics/orders/${lo.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">详情</Button>
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
