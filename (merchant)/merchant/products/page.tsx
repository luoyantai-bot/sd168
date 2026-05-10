'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Package, Edit, Trash2, Eye, FileText, ArrowUpDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatPrice, getStatusLabel, getStatusColor } from '@/lib/utils'

interface Product {
  id: string
  title: string
  subtitle: string
  category: string
  coverImage: string
  status: string
  viewCount: number
  inquiryCount: number
  moq: number
  unit: string
  minPrice: number | null
  maxPrice: number | null
  isInWarehouse: boolean
  warehouseStock: number
  createdAt: string
  skus: Array<{ id: string; skuName: string; price: number; stock: number }>
}

const statusTabs = [
  { value: '', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'offline', label: '已下架' },
  { value: 'rejected', label: '已拒绝' },
]

export default function MerchantProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [keyword, setKeyword] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab) params.set('status', activeTab)
      if (keyword) params.set('keyword', keyword)
      const res = await fetch(`/api/merchant/products?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch {
      console.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [activeTab, keyword])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'published' ? 'offline' : 'published'
    try {
      const res = await fetch(`/api/merchant/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        fetchProducts()
      }
    } catch {
      console.error('Failed to toggle product status')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/merchant/products/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteId(null)
        fetchProducts()
      } else {
        const data = await res.json()
        alert(data.error || '删除失败')
      }
    } catch {
      alert('删除失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">商品管理</h1>
        <Link href="/merchant/products/create">
          <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600">
            <Plus className="w-4 h-4 mr-1" />
            新建商品
          </Button>
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
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
            placeholder="搜索商品..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Product Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
              <p className="text-sm text-gray-400 mt-2">加载中...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无商品</p>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab ? '当前筛选条件下没有商品' : '点击上方按钮发布您的第一个商品'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">商品信息</TableHead>
                    <TableHead>价格区间</TableHead>
                    <TableHead className="text-center">起订量</TableHead>
                    <TableHead className="text-center">浏览</TableHead>
                    <TableHead className="text-center">询盘</TableHead>
                    <TableHead className="text-center">状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 overflow-hidden">
                            {product.coverImage ? (
                              <img src={product.coverImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{product.title}</p>
                            {product.subtitle && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{product.subtitle}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.minPrice !== null ? (
                          <span className="text-sm font-medium text-teal-600">
                            {formatPrice(product.minPrice)}
                            {product.maxPrice !== null && product.maxPrice !== product.minPrice && (
                              <span className="text-gray-400"> - {formatPrice(product.maxPrice)}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">暂无报价</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">{product.moq}{product.unit}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{product.viewCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{product.inquiryCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-[11px] ${getStatusColor(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/merchant/products/${product.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          {product.status === 'published' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-amber-600 hover:text-amber-700"
                              onClick={() => handleToggleStatus(product)}
                            >
                              下架
                            </Button>
                          ) : product.status === 'offline' || product.status === 'draft' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-teal-600 hover:text-teal-700"
                              onClick={() => handleToggleStatus(product)}
                            >
                              上架
                            </Button>
                          ) : null}
                          {(product.status === 'draft' || product.status === 'offline') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-500 hover:text-red-600"
                              onClick={() => setDeleteId(product.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除此商品吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
