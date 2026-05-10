'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DollarSign, TrendingUp, Receipt, CreditCard, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, parseJSON } from '@/lib/utils'

interface FinanceStats {
  totalGMV: number
  commissionIncome: number
  labelFeeIncome: number
  logisticsIncome: number
  totalIncome: number
  settlementCount: number
}

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

export default function AdminFinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [tab, setTab] = useState('overview')
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/finance/stats')
        if (res.ok) setStats(await res.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  useEffect(() => {
    if (tab === 'settlements') {
      fetch('/api/admin/finance/settlements?pageSize=20').then(r => r.json()).then(d => setSettlements(d.data || []))
    } else if (tab === 'withdrawals') {
      fetch('/api/admin/finance/withdrawals?pageSize=20').then(r => r.json()).then(d => setWithdrawals(d.data || []))
    }
  }, [tab])

  const handleWithdrawal = async (id: string, action: string) => {
    const note = action === 'reject' ? prompt('请输入拒绝原因：') : '已通过'
    if (note === null) return

    const res = await fetch('/api/admin/finance/withdrawals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, adminNote: note }),
    })
    if (res.ok) {
      // Refresh
      const d = await (await fetch('/api/admin/finance/withdrawals?pageSize=20')).json()
      setWithdrawals(d.data || [])
    }
  }

  const statCards = [
    { label: '本月GMV', value: stats?.totalGMV ?? 0, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', isPrice: true },
    { label: '佣金收入', value: stats?.commissionIncome ?? 0, icon: TrendingUp, color: 'bg-sky-50 text-sky-600', isPrice: true },
    { label: '贴单费收入', value: stats?.labelFeeIncome ?? 0, icon: Receipt, color: 'bg-purple-50 text-purple-600', isPrice: true },
    { label: '运费收入', value: stats?.logisticsIncome ?? 0, icon: CreditCard, color: 'bg-amber-50 text-amber-600', isPrice: true },
    { label: '总收入', value: stats?.totalIncome ?? 0, icon: DollarSign, color: 'bg-rose-50 text-rose-600', isPrice: true },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">财务管理</h1>
          <p className="text-sm text-gray-500 mt-1">平台收入和结算管理</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-1" /> 刷新
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {loading ? '...' : card.isPrice ? formatPrice(card.value) : card.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="settlements">结算记录</TabsTrigger>
          <TabsTrigger value="withdrawals">提现申请</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/finance/settlements">
                <Button variant="outline" className="w-full justify-start">查看全部结算记录</Button>
              </Link>
              <Link href="/admin/finance/withdrawals">
                <Button variant="outline" className="w-full justify-start">查看全部提现申请</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">本月结算统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">结算笔数</span><span>{stats?.settlementCount ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">佣金收入</span><span className="font-medium">{formatPrice(stats?.commissionIncome ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">贴单费收入</span><span className="font-medium">{formatPrice(stats?.labelFeeIncome ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">运费收入</span><span className="font-medium">{formatPrice(stats?.logisticsIncome ?? 0)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'settlements' && (
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
                  <TableHead>商家应得</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">暂无结算记录</TableCell></TableRow>
                ) : settlements.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-sm">{s.order?.orderNo}</TableCell>
                    <TableCell className="text-sm">{s.merchant?.shopName}</TableCell>
                    <TableCell className="text-sm">{formatPrice(s.productAmount)}</TableCell>
                    <TableCell className="text-sm">{(s.commissionRate * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-sm">{formatPrice(s.commissionAmount)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatPrice(s.merchantAmount)}</TableCell>
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
      )}

      {tab === 'withdrawals' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商家</TableHead>
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
                {withdrawals.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">暂无提现申请</TableCell></TableRow>
                ) : withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-sm font-medium">{w.merchant?.shopName}</TableCell>
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
                            onClick={() => handleWithdrawal(w.id, 'approve')}>
                            <CheckCircle className="w-3 h-3 mr-1" /> 通过
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => handleWithdrawal(w.id, 'reject')}>
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
      )}
    </div>
  )
}
