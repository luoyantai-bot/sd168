'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDate, getStatusLabel, getStatusColor, parseJSON, CATEGORIES } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Store,
  Package,
  ShoppingCart,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Send,
  Phone,
} from 'lucide-react'

interface InquiryDetail {
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
  product: {
    id: string
    title: string
    subtitle: string
    coverImage: string
    category: string
    unit: string
    weight: number
    moq: number
    priceTiers: string
  }
  merchant: {
    id: string
    shopName: string
    shopLogo: string
    contactName: string
    contactPhone: string
  }
  buyer: {
    id: string
    nickname: string
    phone: string
    avatarUrl: string
  }
}

export default function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyMessage, setReplyMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchInquiry()
  }, [id])

  const fetchInquiry = async () => {
    try {
      const res = await fetch(`/api/inquiries/${id}`)
      const data = await res.json()
      setInquiry(data.inquiry)
    } catch (err) {
      console.error('Failed to fetch inquiry:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyMessage.trim()) return
    setSubmitting(true)
    try {
      await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'buyer_reply', replyMessage }),
      })
      setReplyMessage('')
      fetchInquiry()
    } catch (err) {
      console.error('Failed to reply:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async () => {
    if (!confirm('确定要关闭此询盘吗？')) return
    try {
      await fetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      })
      fetchInquiry()
    } catch (err) {
      console.error('Failed to close inquiry:', err)
    }
  }

  const handleConvertToOrder = () => {
    router.push(`/buyer/checkout/${id}`)
  }

  const getCategoryIcon = (slug: string) => {
    return CATEGORIES.find((c) => c.slug === slug)?.icon || '📦'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-32" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!inquiry) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">询盘不存在</p>
          <Button className="mt-4" onClick={() => router.push('/buyer/inquiries')}>
            返回列表
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isActive = inquiry.status !== 'closed' && inquiry.status !== 'converted'

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.push('/buyer/inquiries')} className="text-gray-600">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回询盘列表
      </Button>

      {/* Status Header */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900">询盘详情</h1>
              <Badge className={getStatusColor(inquiry.status)}>
                {getStatusLabel(inquiry.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(inquiry.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Info */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
              {inquiry.product.coverImage ? (
                <img src={inquiry.product.coverImage} alt={inquiry.product.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">{getCategoryIcon(inquiry.product.category)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/buyer/products/${inquiry.product.id}`}>
                <h3 className="font-medium text-gray-900 hover:text-orange-600 transition-colors">
                  {inquiry.product.title}
                </h3>
              </Link>
              {inquiry.product.subtitle && (
                <p className="text-sm text-gray-500 truncate">{inquiry.product.subtitle}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="text-gray-600">数量：<span className="font-medium">{inquiry.quantity}{inquiry.product.unit}</span></span>
                {inquiry.needSample && (
                  <Badge variant="secondary" className="text-xs">需要样品</Badge>
                )}
                {inquiry.expectedDate && (
                  <span className="text-gray-500 text-xs">期望交期：{inquiry.expectedDate}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Merchant Info */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">商家信息</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
              <Store className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{inquiry.merchant.shopName}</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {inquiry.merchant.contactPhone}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Message */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">我的留言</h3>
          <p className="text-sm text-gray-700">{inquiry.message || '无留言'}</p>
        </CardContent>
      </Card>

      {/* Merchant Reply */}
      {inquiry.status === 'replied' && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-sm font-medium text-orange-700 mb-2">商家回复</h3>
            {inquiry.quotedPrice !== null && inquiry.quotedPrice !== undefined && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">报价：</span>
                <span className="text-lg font-bold text-orange-600">{formatPrice(inquiry.quotedPrice)}</span>
                <span className="text-sm text-gray-500">/{inquiry.product.unit}</span>
              </div>
            )}
            <p className="text-sm text-gray-700">{inquiry.replyMessage || '商家未留言'}</p>
            {inquiry.repliedAt && (
              <p className="text-xs text-gray-400 mt-2">
                回复时间：{formatDate(inquiry.repliedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Area */}
      {isActive && (
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Reply Input */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">继续沟通</h3>
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="输入您的回复..."
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={submitting || !replyMessage.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Send className="w-4 h-4 mr-1" />
                  发送
                </Button>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {inquiry.status === 'replied' && inquiry.quotedPrice !== null && (
                <Button
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={handleConvertToOrder}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  接受报价并下单
                </Button>
              )}
              <Button variant="outline" onClick={handleClose} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <XCircle className="w-4 h-4 mr-1" />
                关闭询盘
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
