'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Package, User, Calendar, FileText, CheckCircle, Clock, MessageSquare, ShoppingCart } from 'lucide-react'
import { formatPrice, formatDateTime, formatDate, getStatusLabel, getStatusColor, parseJSON } from '@/lib/utils'

interface Inquiry {
  id: string
  quantity: number
  message: string
  needSample: boolean
  expectedDate: string | null
  status: string
  replyMessage: string
  quotedPrice: number | null
  createdAt: string
  repliedAt: string | null
  buyer: {
    id: string
    nickname: string
    phone: string
    avatarUrl: string
  }
  product: {
    id: string
    title: string
    coverImage: string
    category: string
    priceTiers: Array<{ minQty: number; maxQty?: number; price: number }>
    moq: number
    unit: string
    description: string
    images: string[]
  }
}

export default function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [quotedPrice, setQuotedPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/merchant/inquiries/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.inquiry) {
          setInquiry(data.inquiry)
          if (data.inquiry.status === 'replied') {
            setReplyMessage(data.inquiry.replyMessage || '')
            setQuotedPrice(data.inquiry.quotedPrice?.toString() || '')
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleReply = async () => {
    if (!replyMessage) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/merchant/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          replyMessage,
          quotedPrice: quotedPrice ? parseFloat(quotedPrice) : null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setInquiry(data.inquiry ? { ...inquiry!, status: 'replied', replyMessage, quotedPrice: quotedPrice ? parseFloat(quotedPrice) : null, repliedAt: new Date().toISOString() } : inquiry)
      }
    } catch {
      alert('回复失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConvert = async () => {
    if (!inquiry) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/merchant/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert',
          quotedPrice: inquiry.quotedPrice || (quotedPrice ? parseFloat(quotedPrice) : 0),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.order) {
          router.push(`/merchant/orders/${data.order.id}`)
        }
      }
    } catch {
      alert('转化失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/merchant/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      })
      if (res.ok) {
        setInquiry(inquiry ? { ...inquiry, status: 'closed' } : inquiry)
      }
    } catch {
      alert('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    )
  }

  if (!inquiry) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">询盘不存在或无权访问</p>
      </div>
    )
  }

  const priceTiers = inquiry.product.priceTiers || []
  const minPrice = priceTiers.length > 0 ? Math.min(...priceTiers.map((t) => t.price)) : 0

  const statusSteps = [
    { key: 'pending', label: '买家发起', icon: Clock, time: inquiry.createdAt },
    { key: 'replied', label: '商家回复', icon: MessageSquare, time: inquiry.repliedAt },
    { key: 'converted', label: '转为订单', icon: ShoppingCart, time: null },
    { key: 'closed', label: '已关闭', icon: CheckCircle, time: null },
  ]

  const currentStepIdx = statusSteps.findIndex((s) => s.key === inquiry.status)
  if (inquiry.status === 'closed') {
    // closed can happen at any point
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/merchant/inquiries')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">询盘详情</h1>
        <Badge className={`${getStatusColor(inquiry.status)}`}>
          {getStatusLabel(inquiry.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Product & Buyer Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">商品信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 overflow-hidden">
                  {inquiry.product.coverImage ? (
                    <img src={inquiry.product.coverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{inquiry.product.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    分类: {inquiry.product.category} · 起订量: {inquiry.product.moq}{inquiry.product.unit}
                  </p>
                  {priceTiers.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {priceTiers.map((tier, idx) => (
                        <p key={idx} className="text-xs text-gray-500">
                          {tier.minQty}+ {inquiry.product.unit}: <span className="text-teal-600 font-medium">{formatPrice(tier.price)}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                买家信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-teal-100 text-teal-700">
                    {inquiry.buyer.nickname?.slice(0, 2) || '买'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{inquiry.buyer.nickname || '买家'}</p>
                  <p className="text-sm text-gray-500">{inquiry.buyer.phone}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">询价数量</span>
                  <p className="font-medium">{inquiry.quantity} {inquiry.product.unit}</p>
                </div>
                {inquiry.expectedDate && (
                  <div>
                    <span className="text-gray-400">期望交期</span>
                    <p className="font-medium">{formatDate(inquiry.expectedDate)}</p>
                  </div>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-400">买家留言</span>
                <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                  {inquiry.message || '无留言'}
                </p>
              </div>
              {inquiry.needSample && (
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  需要样品
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">处理进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                {statusSteps.map((s, idx) => {
                  const Icon = s.icon
                  const isCompleted = idx < currentStepIdx || (inquiry.status === 'closed' && s.key === 'closed')
                  const isCurrent = idx === currentStepIdx
                  return (
                    <div key={s.key} className="flex items-center gap-1 flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? 'bg-teal-500 text-white'
                              : isCurrent
                              ? 'bg-teal-100 text-teal-700 border-2 border-teal-500'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] mt-1 ${isCurrent ? 'text-teal-700 font-medium' : 'text-gray-400'}`}>
                          {s.label}
                        </span>
                      </div>
                      {idx < statusSteps.length - 1 && (
                        <div className={`h-0.5 flex-1 -mt-4 ${isCompleted ? 'bg-teal-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Reply Form */}
        <div className="space-y-4">
          {/* Reply Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {inquiry.status === 'pending' ? '回复询盘' : inquiry.status === 'replied' ? '修改回复' : '询盘回复'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inquiry.replyMessage && inquiry.status !== 'pending' && (
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                  <p className="text-xs text-teal-600 font-medium mb-1">已回复</p>
                  <p className="text-sm text-gray-700">{inquiry.replyMessage}</p>
                  {inquiry.quotedPrice && (
                    <p className="text-sm text-teal-600 font-medium mt-1">
                      报价: {formatPrice(inquiry.quotedPrice)}/{inquiry.product.unit}
                    </p>
                  )}
                  {inquiry.repliedAt && (
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(inquiry.repliedAt)}</p>
                  )}
                </div>
              )}

              {(inquiry.status === 'pending' || inquiry.status === 'replied') && (
                <>
                  <div>
                    <Label htmlFor="quotedPrice">报价（元/{inquiry.product.unit}）</Label>
                    <Input
                      id="quotedPrice"
                      type="number"
                      step="0.01"
                      value={quotedPrice}
                      onChange={(e) => setQuotedPrice(e.target.value)}
                      placeholder="输入单价"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="replyMessage">回复内容</Label>
                    <Textarea
                      id="replyMessage"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="输入回复内容..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleReply}
                    disabled={submitting || !replyMessage}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                  >
                    {submitting ? '提交中...' : '回复询盘'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-2">
              {inquiry.status === 'replied' && (
                <Button
                  onClick={handleConvert}
                  disabled={submitting}
                  className="w-full"
                  variant="outline"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  转为订单
                </Button>
              )}
              {(inquiry.status === 'pending' || inquiry.status === 'replied') && (
                <Button
                  onClick={handleClose}
                  disabled={submitting}
                  variant="ghost"
                  className="w-full text-gray-500"
                >
                  关闭询盘
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
