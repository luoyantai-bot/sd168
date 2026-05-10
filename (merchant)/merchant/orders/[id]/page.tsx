'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ShoppingCart, Package, User, MapPin, Truck, CheckCircle, Clock, DollarSign } from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils'

interface OrderItem {
  productId: string
  title: string
  quantity: number
  price: number
  unit: string
}

interface LogisticsOrder {
  id: string
  trackingNo: string
  logisticsChannel: string
  status: string
  statusTimeline: Array<{ status: string; time: string; desc: string }>
}

interface Order {
  id: string
  orderNo: string
  items: OrderItem[]
  subtotal: number
  logisticsFee: number
  labelFee: number
  totalAmount: number
  commissionAmount: number
  status: string
  paymentMethod: string
  paymentTime: string | null
  createdAt: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverCountry: string
  buyer: {
    id: string
    nickname: string
    phone: string
    avatarUrl: string
  }
  logisticsOrders: LogisticsOrder[]
}

const orderStatusSteps = [
  { key: 'pending_payment', label: '待付款', icon: Clock },
  { key: 'paid', label: '已付款', icon: DollarSign },
  { key: 'in_warehouse', label: '已入仓', icon: Package },
  { key: 'dispatched', label: '已发货', icon: Truck },
  { key: 'in_transit', label: '运输中', icon: Truck },
  { key: 'delivered', label: '已签收', icon: CheckCircle },
]

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/merchant/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.order) setOrder(data.order)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/merchant/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      })
      if (res.ok) {
        const data = await res.json()
        setOrder({ ...order!, status: 'in_warehouse' })
      } else {
        const data = await res.json()
        alert(data.error || '操作失败')
      }
    } catch {
      alert('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDispatch = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/merchant/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dispatch' }),
      })
      if (res.ok) {
        setOrder({ ...order!, status: 'dispatched' })
      } else {
        const data = await res.json()
        alert(data.error || '操作失败')
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

  if (!order) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">订单不存在或无权访问</p>
      </div>
    )
  }

  const currentStepIdx = orderStatusSteps.findIndex((s) => s.key === order.status)
  const isCancelled = order.status === 'cancelled'
  const isRefunding = order.status === 'refunding' || order.status === 'refunded'

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/merchant/orders')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">订单详情</h1>
        <Badge className={`${getStatusColor(order.status)}`}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      {/* Status Timeline */}
      {!isCancelled && !isRefunding && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              {orderStatusSteps.map((s, idx) => {
                const Icon = s.icon
                const isCompleted = idx < currentStepIdx
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
                    {idx < orderStatusSteps.length - 1 && (
                      <div className={`h-0.5 flex-1 -mt-4 ${isCompleted ? 'bg-teal-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Order Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">订单信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">订单号</span>
                <span className="font-mono font-medium">{order.orderNo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">下单时间</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              {order.paymentTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">支付时间</span>
                  <span>{formatDateTime(order.paymentTime)}</span>
                </div>
              )}
              {order.paymentMethod && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">支付方式</span>
                  <span>{order.paymentMethod === 'wechat_pay' ? '微信支付' : '银行转账'}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">商品明细</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.price)} × {item.quantity} {item.unit}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">商品小计</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">物流费</span>
                  <span>{formatPrice(order.logisticsFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">贴单费</span>
                  <span>{formatPrice(order.labelFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-base">
                  <span>订单总额</span>
                  <span className="text-teal-600">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>平台佣金</span>
                  <span>{formatPrice(order.commissionAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logistics */}
          {order.logisticsOrders.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  物流信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.logisticsOrders.map((lo) => (
                  <div key={lo.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">物流渠道</span>
                      <span>{lo.logisticsChannel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">跟踪号</span>
                      <span className="font-mono">{lo.trackingNo || '待更新'}</span>
                    </div>
                    {lo.statusTimeline.length > 0 && (
                      <div className="space-y-1">
                        {lo.statusTimeline.map((step, idx) => (
                          <div key={idx} className="flex gap-2 text-xs">
                            <span className="text-gray-400 whitespace-nowrap">{step.time}</span>
                            <span className="text-gray-600">{step.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Buyer & Actions */}
        <div className="space-y-4">
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
                    {order.buyer.nickname?.slice(0, 2) || '买'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{order.buyer.nickname || '买家'}</p>
                  <p className="text-sm text-gray-500">{order.buyer.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receiver Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                收货信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">收件人</span>
                <span>{order.receiverName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">联系电话</span>
                <span>{order.receiverPhone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">国家</span>
                <span>{order.receiverCountry || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">详细地址</span>
                <p className="text-gray-900 mt-0.5">{order.receiverAddress || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-2">
              {order.status === 'paid' && (
                <Button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  确认接单
                </Button>
              )}
              {(order.status === 'in_warehouse' || order.status === 'labeling') && (
                <Button
                  onClick={handleDispatch}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                >
                  <Truck className="w-4 h-4 mr-1" />
                  标记发货
                </Button>
              )}
              {order.status === 'pending_payment' && (
                <p className="text-sm text-gray-400 text-center py-2">等待买家付款</p>
              )}
              {order.status === 'dispatched' && (
                <p className="text-sm text-gray-400 text-center py-2">商品已发出</p>
              )}
              {order.status === 'delivered' && (
                <p className="text-sm text-teal-600 text-center py-2">买家已签收</p>
              )}
              {isCancelled && (
                <p className="text-sm text-red-500 text-center py-2">订单已取消</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
