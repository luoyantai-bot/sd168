'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils'

interface Merchant {
  id: string
  shopName: string
  companyName: string
  contactName: string
  contactPhone: string
  mainCategories: string[]
  verifyStatus: string
  verifyNote: string
  commissionRate: number
  isWarehouseEnabled: boolean
  createdAt: string
  user: { id: string; phone: string; nickname: string; status: string }
  _count: { products: number; orders: number }
}

export default function AdminMerchantsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState(searchParams.get('tab') || 'all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const statusMap: Record<string, string> = {
    all: '',
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
  }

  const fetchMerchants = useCallback(async () => {
    setLoading(true)
    try {
      const status = statusMap[tab] || ''
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/admin/merchants?${params}`)
      if (res.ok) {
        const data = await res.json()
        setMerchants(data.data || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [tab, search, page])

  useEffect(() => {
    fetchMerchants()
  }, [fetchMerchants])

  const handleAction = async (id: string, action: string) => {
    if (action === 'reject') {
      const reason = prompt('请输入拒绝原因：')
      if (reason === null) return
      await fetch(`/api/admin/merchants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, verifyNote: reason }),
      })
    } else {
      const confirmed = confirm('确认通过该商家审核？')
      if (!confirmed) return
      await fetch(`/api/admin/merchants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
    }
    fetchMerchants()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">商家审核</h1>
          <p className="text-sm text-gray-500 mt-1">管理商家入驻申请和审核</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMerchants}>
          <RefreshCw className="w-4 h-4 mr-1" /> 刷新
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1) }}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="pending">待审核</TabsTrigger>
          <TabsTrigger value="approved">已通过</TabsTrigger>
          <TabsTrigger value="rejected">已拒绝</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索店铺名/公司名/联系人..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>店铺名称</TableHead>
                <TableHead>公司名称</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>主营品类</TableHead>
                <TableHead>商品/订单</TableHead>
                <TableHead>审核状态</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-400">加载中...</TableCell>
                </TableRow>
              ) : merchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-400">暂无数据</TableCell>
                </TableRow>
              ) : (
                merchants.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => router.push(`/admin/merchants/${m.id}`)}>
                    <TableCell className="font-medium">{m.shopName}</TableCell>
                    <TableCell className="text-gray-600">{m.companyName}</TableCell>
                    <TableCell>{m.contactName}</TableCell>
                    <TableCell>{m.contactPhone}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.mainCategories?.slice(0, 2).map((c) => (
                          <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                        ))}
                        {m.mainCategories?.length > 2 && (
                          <Badge variant="secondary" className="text-[10px]">+{m.mainCategories.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-xs">{m._count.products}/{m._count.orders}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${getStatusColor(m.verifyStatus)}`}>
                        {getStatusLabel(m.verifyStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-xs">{formatDateTime(m.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/admin/merchants/${m.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <Eye className="w-3 h-3 mr-1" /> 详情
                          </Button>
                        </Link>
                        {m.verifyStatus === 'pending' && (
                          <>
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleAction(m.id, 'approve')}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> 通过
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleAction(m.id, 'reject')}
                            >
                              <XCircle className="w-3 h-3 mr-1" /> 拒绝
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
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
