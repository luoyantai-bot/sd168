'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search, Eye, CheckCircle, XCircle, RefreshCw, CheckSquare } from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, parseJSON } from '@/lib/utils'

interface Product {
  id: string
  title: string
  subtitle: string
  category: string
  coverImage: string
  images: string[]
  priceTiers: { minQty: number; price: number }[]
  status: string
  rejectReason: string
  createdAt: string
  merchant: { id: string; shopName: string; verifyStatus: string }
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('draft')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const pageSize = 20

  const statusMap: Record<string, string> = {
    draft: 'draft',
    approved: 'published',
    rejected: 'rejected',
    all: '',
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const status = statusMap[tab] || ''
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/admin/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.data || [])
        setTotal(data.total || 0)
        setSelected([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [tab, search, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleAction = async (id: string, action: string) => {
    if (action === 'reject') {
      const reason = prompt('请输入拒绝原因：')
      if (reason === null) return
      await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectReason: reason }),
      })
    } else {
      await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
    }
    fetchProducts()
  }

  const handleBatchApprove = async () => {
    if (selected.length === 0) return
    const confirmed = confirm(`确认批量通过 ${selected.length} 个商品？`)
    if (!confirmed) return
    const res = await fetch('/api/admin/products/batch-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: selected }),
    })
    if (res.ok) {
      const data = await res.json()
      alert(`成功通过 ${data.count} 个商品`)
      fetchProducts()
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (selected.length === products.length) {
      setSelected([])
    } else {
      setSelected(products.map(p => p.id))
    }
  }

  const totalPages = Math.ceil(total / pageSize)
  const getMinPrice = (tiers: { minQty: number; price: number }[]) => {
    if (!tiers || tiers.length === 0) return '-'
    return formatPrice(Math.min(...tiers.map(t => t.price)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">商品审核</h1>
          <p className="text-sm text-gray-500 mt-1">审核商家提交的商品</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleBatchApprove}>
              <CheckSquare className="w-4 h-4 mr-1" /> 批量通过 ({selected.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchProducts}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1) }}>
        <TabsList>
          <TabsTrigger value="draft">待审核</TabsTrigger>
          <TabsTrigger value="approved">已通过</TabsTrigger>
          <TabsTrigger value="rejected">已拒绝</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索商品名称..."
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
                {tab === 'draft' && (
                  <TableHead className="w-10">
                    <Checkbox checked={selected.length === products.length && products.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                )}
                <TableHead>商品图片</TableHead>
                <TableHead>商品名称</TableHead>
                <TableHead>品类</TableHead>
                <TableHead>商家</TableHead>
                <TableHead>最低价</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">暂无数据</TableCell></TableRow>
              ) : products.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => router.push(`/admin/products/${p.id}`)}>
                  {tab === 'draft' && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {p.coverImage ? (
                        <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-300 text-xs">无图</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px]">
                    <p className="truncate">{p.title}</p>
                    {p.subtitle && <p className="text-xs text-gray-400 truncate">{p.subtitle}</p>}
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{p.category}</Badge></TableCell>
                  <TableCell className="text-sm text-gray-600">{p.merchant?.shopName}</TableCell>
                  <TableCell className="text-sm font-medium">{getMinPrice(p.priceTiers)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDateTime(p.createdAt)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <Eye className="w-3 h-3 mr-1" /> 详情
                        </Button>
                      </Link>
                      {p.status === 'draft' && (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 hover:bg-green-50"
                            onClick={() => handleAction(p.id, 'approve')}>
                            <CheckCircle className="w-3 h-3 mr-1" /> 通过
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => handleAction(p.id, 'reject')}>
                            <XCircle className="w-3 h-3 mr-1" /> 拒绝
                          </Button>
                        </>
                      )}
                    </div>
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
