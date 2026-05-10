'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils'

interface Withdrawal {
  id: string
  amount: number
  method: string
  bankInfo: Record<string, unknown>
  status: string
  adminNote: string
  createdAt: string
  merchant: { id: string; shopName: string; contactName: string; balance: number }
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/admin/finance/withdrawals?${params}`)
      if (res.ok) {
        const data = await res.json()
        setWithdrawals(data.data || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => { fetchWithdrawals() }, [fetchWithdrawals])

  const handleAction = async (id: string, action: string) => {
    const note = action === 'reject' ? prompt('请输入拒绝原因：') || '已拒绝' : '已通过'
    const res = await fetch('/api/admin/finance/withdrawals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, adminNote: note }),
    })
    if (res.ok) fetchWithdrawals()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">提现申请</h1>
          <p className="text-sm text-gray-500 mt-1">审核商家提现申请</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWithdrawals}>
          <RefreshCw className="w-4 h-4 mr-1" /> 刷新
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={(v) => { setStatus(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="全部状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部状态</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商家</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>提现金额</TableHead>
                <TableHead>方式</TableHead>
                <TableHead>账户余额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>备注</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
              ) : withdrawals.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">暂无提现申请</TableCell></TableRow>
              ) : withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium text-sm">{w.merchant?.shopName}</TableCell>
                  <TableCell className="text-sm">{w.merchant?.contactName}</TableCell>
                  <TableCell className="text-sm font-semibold">{formatPrice(w.amount)}</TableCell>
                  <TableCell className="text-sm">{w.method === 'bank' ? '银行卡' : '微信'}</TableCell>
                  <TableCell className="text-sm">{formatPrice(w.merchant?.balance || 0)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${getStatusColor(w.status)}`}>{getStatusLabel(w.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-[120px] truncate">{w.adminNote || '-'}</TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDateTime(w.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {w.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 hover:bg-green-50"
                          onClick={() => handleAction(w.id, 'approve')}>
                          <CheckCircle className="w-3 h-3 mr-1" /> 通过
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => handleAction(w.id, 'reject')}>
                          <XCircle className="w-3 h-3 mr-1" /> 拒绝
                        </Button>
                      </div>
                    )}
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
