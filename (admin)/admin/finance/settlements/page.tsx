'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { RefreshCw, Download } from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils'

interface Settlement {
  id: string
  productAmount: number
  commissionRate: number
  commissionAmount: number
  merchantAmount: number
  labelFee: number
  logisticsFee: number
  status: string
  createdAt: string
  order: { orderNo: string }
  merchant: { id: string; shopName: string }
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchSettlements = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/admin/finance/settlements?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSettlements(data.data || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => { fetchSettlements() }, [fetchSettlements])

  const handleExport = () => {
    const headers = ['订单号', '商家', '商品金额', '佣金率', '佣金金额', '商家应得', '贴单费', '运费', '状态', '创建时间']
    const rows = settlements.map(s => [
      s.order?.orderNo, s.merchant?.shopName, s.productAmount,
      (s.commissionRate * 100).toFixed(1) + '%', s.commissionAmount,
      s.merchantAmount, s.labelFee, s.logisticsFee,
      getStatusLabel(s.status), formatDateTime(s.createdAt),
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `settlements_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">结算记录</h1>
          <p className="text-sm text-gray-500 mt-1">查看所有订单结算明细</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> 导出CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSettlements}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={(v) => { setStatus(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="全部状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部状态</SelectItem>
            <SelectItem value="pending">待结算</SelectItem>
            <SelectItem value="completed">已结算</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>商家</TableHead>
                <TableHead>商品金额</TableHead>
                <TableHead>佣金率</TableHead>
                <TableHead>佣金金额</TableHead>
                <TableHead>贴单费</TableHead>
                <TableHead>运费</TableHead>
                <TableHead>商家应得</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
              ) : settlements.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-400">暂无结算记录</TableCell></TableRow>
              ) : settlements.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-sm">{s.order?.orderNo}</TableCell>
                  <TableCell className="text-sm">{s.merchant?.shopName}</TableCell>
                  <TableCell className="text-sm">{formatPrice(s.productAmount)}</TableCell>
                  <TableCell className="text-sm">{(s.commissionRate * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-sm">{formatPrice(s.commissionAmount)}</TableCell>
                  <TableCell className="text-sm">{formatPrice(s.labelFee)}</TableCell>
                  <TableCell className="text-sm">{formatPrice(s.logisticsFee)}</TableCell>
                  <TableCell className="text-sm font-semibold">{formatPrice(s.merchantAmount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${getStatusColor(s.status)}`}>{getStatusLabel(s.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDateTime(s.createdAt)}</TableCell>
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
