'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, CheckCircle, XCircle, Store, User, Phone,
  MapPin, Building2, Settings, PackageCheck, ShoppingCart,
  Image as ImageIcon,
} from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, parseJSON } from '@/lib/utils'

interface MerchantDetail {
  id: string
  shopName: string
  shopLogo: string
  contactName: string
  contactPhone: string
  companyName: string
  businessLicense: string
  address: string
  mainCategories: string[]
  description: string
  factoryImages: string[]
  verifyStatus: string
  verifyNote: string
  isWarehouseEnabled: boolean
  commissionRate: number
  balance: number
  createdAt: string
  user: { id: string; phone: string; nickname: string; status: string; createdAt: string }
  products: { id: string; title: string; status: string; coverImage: string; category: string; createdAt: string }[]
  orders: { id: string; orderNo: string; totalAmount: number; status: string; createdAt: string }[]
  _count: { products: number; orders: number }
}

export default function MerchantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [commissionRate, setCommissionRate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadMerchant() {
      try {
        const res = await fetch(`/api/admin/merchants/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setMerchant(data)
          setCommissionRate(String(data.commissionRate * 100))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadMerchant()
  }, [params.id])

  const handleAction = async (action: string) => {
    if (!merchant) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = { action }
      if (action === 'reject') {
        body.verifyNote = rejectReason || '审核未通过'
      }

      const res = await fetch(`/api/admin/merchants/${merchant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const updated = await res.json()
        setMerchant({ ...merchant, ...updated })
        setShowRejectInput(false)
        setRejectReason('')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleWarehouse = async () => {
    if (!merchant) return
    const res = await fetch(`/api/admin/merchants/${merchant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isWarehouseEnabled: !merchant.isWarehouseEnabled }),
    })
    if (res.ok) {
      setMerchant({ ...merchant, isWarehouseEnabled: !merchant.isWarehouseEnabled })
    }
  }

  const handleUpdateCommission = async () => {
    if (!merchant) return
    const rate = parseFloat(commissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) return
    const res = await fetch(`/api/admin/merchants/${merchant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionRate: rate / 100 }),
    })
    if (res.ok) {
      const updated = await res.json()
      setMerchant({ ...merchant, ...updated })
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">加载中...</div>
  if (!merchant) return <div className="text-center py-12 text-gray-400">商家不存在</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{merchant.shopName}</h1>
          <p className="text-sm text-gray-500">商家详情</p>
        </div>
        <div className="ml-auto">
          <Badge variant="outline" className={`${getStatusColor(merchant.verifyStatus)}`}>
            {getStatusLabel(merchant.verifyStatus)}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="w-4 h-4" /> 基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">店铺名称</p>
                  <p className="text-sm font-medium">{merchant.shopName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">公司名称</p>
                  <p className="text-sm font-medium">{merchant.companyName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> 联系人</p>
                  <p className="text-sm font-medium">{merchant.contactName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> 联系电话</p>
                  <p className="text-sm font-medium">{merchant.contactPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> 账号手机</p>
                  <p className="text-sm font-medium">{merchant.user?.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> 地址</p>
                  <p className="text-sm font-medium">{merchant.address || '-'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Building2 className="w-3 h-3" /> 主营品类</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {merchant.mainCategories?.map((c) => (
                    <Badge key={c} variant="secondary">{c}</Badge>
                  ))}
                </div>
              </div>
              {merchant.description && (
                <div>
                  <p className="text-xs text-gray-500">商家描述</p>
                  <p className="text-sm text-gray-700 mt-1">{merchant.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business License */}
          {merchant.businessLicense && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> 营业执照
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={merchant.businessLicense}
                  alt="营业执照"
                  className="max-w-md rounded-lg border"
                />
              </CardContent>
            </Card>
          )}

          {/* Factory Images */}
          {merchant.factoryImages?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> 工厂图片
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {merchant.factoryImages.map((img, i) => (
                    <img key={i} src={img} alt={`工厂图片${i + 1}`} className="rounded-lg border w-full aspect-video object-cover" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PackageCheck className="w-4 h-4" /> 商品列表 ({merchant._count.products})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品名称</TableHead>
                    <TableHead>品类</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchant.products.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-400">暂无商品</TableCell></TableRow>
                  ) : merchant.products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/products/${p.id}`} className="hover:text-emerald-600">{p.title}</Link>
                      </TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{formatDateTime(p.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> 最近订单 ({merchant._count.orders})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchant.orders.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-400">暂无订单</TableCell></TableRow>
                  ) : merchant.orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/orders/${o.id}`} className="hover:text-emerald-600">{o.orderNo}</Link>
                      </TableCell>
                      <TableCell>{formatPrice(o.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{formatDateTime(o.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Verify Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" /> 审核操作
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {merchant.verifyNote && (
                <div className="p-3 rounded-lg bg-gray-50 text-sm">
                  <p className="text-xs text-gray-500 mb-1">审核备注</p>
                  <p className="text-gray-700">{merchant.verifyNote}</p>
                </div>
              )}

              {merchant.verifyStatus === 'pending' && (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={saving}
                    onClick={() => handleAction('approve')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> 通过审核
                  </Button>
                  {!showRejectInput ? (
                    <Button variant="destructive" className="w-full" onClick={() => setShowRejectInput(true)}>
                      <XCircle className="w-4 h-4 mr-2" /> 拒绝审核
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="请输入拒绝原因..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button variant="destructive" size="sm" disabled={saving} onClick={() => handleAction('reject')}>
                          确认拒绝
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setShowRejectInput(false); setRejectReason('') }}>
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Commission Rate */}
              <div>
                <Label className="text-sm">佣金率 (%)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">%</span>
                  <Button size="sm" onClick={handleUpdateCommission}>保存</Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">当前: {(merchant.commissionRate * 100).toFixed(1)}%</p>
              </div>

              {/* Warehouse Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">仓储功能</Label>
                  <p className="text-xs text-gray-400">允许该商家使用仓储服务</p>
                </div>
                <Switch checked={merchant.isWarehouseEnabled} onCheckedChange={handleToggleWarehouse} />
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">账号信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">昵称</p>
                <p className="text-sm">{merchant.user?.nickname || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">手机号</p>
                <p className="text-sm">{merchant.user?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">账户余额</p>
                <p className="text-sm font-semibold">{formatPrice(merchant.balance)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">注册时间</p>
                <p className="text-sm">{formatDateTime(merchant.user?.createdAt || merchant.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
