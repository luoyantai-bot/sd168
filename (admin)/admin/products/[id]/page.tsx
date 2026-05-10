'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, CheckCircle, XCircle, PackageCheck, Store, Image as ImageIcon,
} from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, parseJSON, CATEGORIES } from '@/lib/utils'

interface ProductDetail {
  id: string
  title: string
  subtitle: string
  category: string
  subCategory: string
  coverImage: string
  images: string[]
  description: string
  moq: number
  unit: string
  priceTiers: { minQty: number; price: number }[]
  weight: number
  volumeL: number
  volumeW: number
  volumeH: number
  isInWarehouse: boolean
  warehouseStock: number
  status: string
  rejectReason: string
  viewCount: number
  inquiryCount: number
  createdAt: string
  merchant: { id: string; shopName: string; contactName: string; contactPhone: string; verifyStatus: string }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/admin/products/${params.id}`)
        if (res.ok) setProduct(await res.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [params.id])

  const handleAction = async (action: string) => {
    if (!product) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = { action }
      if (action === 'reject') body.rejectReason = rejectReason || '审核未通过'

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const updated = await res.json()
        setProduct({ ...product, ...updated })
        setShowRejectInput(false)
        setRejectReason('')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">加载中...</div>
  if (!product) return <div className="text-center py-12 text-gray-400">商品不存在</div>

  const categoryLabel = CATEGORIES.find(c => c.slug === product.category)?.name || product.category

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{product.title}</h1>
          {product.subtitle && <p className="text-sm text-gray-500">{product.subtitle}</p>}
        </div>
        <Badge variant="outline" className={`${getStatusColor(product.status)}`}>
          {getStatusLabel(product.status)}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> 商品图片
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {product.coverImage && (
                  <img src={product.coverImage} alt="封面" className="rounded-lg border aspect-square object-cover w-full" />
                )}
                {product.images?.filter(img => img && img !== product.coverImage).map((img, i) => (
                  <img key={i} src={img} alt={`图片${i + 1}`} className="rounded-lg border aspect-square object-cover w-full" />
                ))}
                {(!product.coverImage && (!product.images || product.images.length === 0)) && (
                  <div className="col-span-4 text-center text-gray-400 py-8">暂无图片</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PackageCheck className="w-4 h-4" /> 商品详情
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">品类</p>
                  <p className="text-sm font-medium">{categoryLabel} {product.subCategory ? `/ ${product.subCategory}` : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">起订量</p>
                  <p className="text-sm font-medium">{product.moq} {product.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">重量</p>
                  <p className="text-sm font-medium">{product.weight}g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">体积</p>
                  <p className="text-sm font-medium">{product.volumeL}×{product.volumeW}×{product.volumeH}cm</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">浏览量</p>
                  <p className="text-sm font-medium">{product.viewCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">询盘数</p>
                  <p className="text-sm font-medium">{product.inquiryCount}</p>
                </div>
              </div>

              <Separator />

              {/* Price Tiers */}
              <div>
                <p className="text-xs text-gray-500 mb-2">价格梯度</p>
                <div className="space-y-2">
                  {product.priceTiers?.map((tier, i) => (
                    <div key={i} className="flex items-center gap-4 p-2 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-600">≥{tier.minQty}{product.unit}</span>
                      <span className="text-sm font-semibold">{formatPrice(tier.price)}/{product.unit}</span>
                    </div>
                  ))}
                  {(!product.priceTiers || product.priceTiers.length === 0) && (
                    <p className="text-sm text-gray-400">暂无价格信息</p>
                  )}
                </div>
              </div>

              {product.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">商品描述</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.description}</p>
                  </div>
                </>
              )}

              {product.isInWarehouse && (
                <>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">已在仓</Badge>
                    <span className="text-sm text-gray-600">库存: {product.warehouseStock} {product.unit}</span>
                  </div>
                </>
              )}

              {product.rejectReason && (
                <>
                  <Separator />
                  <div className="p-3 rounded-lg bg-red-50">
                    <p className="text-xs text-red-500 mb-1">拒绝原因</p>
                    <p className="text-sm text-red-700">{product.rejectReason}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">审核操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.status === 'draft' && (
                <>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={saving}
                    onClick={() => handleAction('approve')}>
                    <CheckCircle className="w-4 h-4 mr-2" /> 通过审核
                  </Button>
                  {!showRejectInput ? (
                    <Button variant="destructive" className="w-full" onClick={() => setShowRejectInput(true)}>
                      <XCircle className="w-4 h-4 mr-2" /> 拒绝审核
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Textarea placeholder="请输入拒绝原因..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm" disabled={saving} onClick={() => handleAction('reject')}>确认拒绝</Button>
                        <Button variant="outline" size="sm" onClick={() => { setShowRejectInput(false); setRejectReason('') }}>取消</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {product.status === 'published' && (
                <Button variant="outline" className="w-full" onClick={() => handleAction('offline')}>
                  下架商品
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Merchant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="w-4 h-4" /> 所属商家
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">店铺名称</p>
                <Link href={`/admin/merchants/${product.merchant?.id}`} className="text-sm font-medium text-emerald-600 hover:underline">
                  {product.merchant?.shopName}
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-500">联系人</p>
                <p className="text-sm">{product.merchant?.contactName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">联系电话</p>
                <p className="text-sm">{product.merchant?.contactPhone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">商家状态</p>
                <Badge variant="outline" className={`text-[10px] ${getStatusColor(product.merchant?.verifyStatus || '')}`}>
                  {getStatusLabel(product.merchant?.verifyStatus || '')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">创建时间</p>
              <p className="text-sm">{formatDateTime(product.createdAt)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
