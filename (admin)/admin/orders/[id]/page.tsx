'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft, ShoppingCart, User, Store, MapPin, PackageCheck,
  Truck, Warehouse, DollarSign,
} from 'lucide-react'
import { formatPrice, formatDateTime, getStatusLabel, getStatusColor, parseJSON } from '@/lib/utils'

interface OrderDetail {
  id: string
  orderNo: string
  items: { productId: string; title: string; quantity: number; price: number; unit: string }[]
  subtotal: number
  logisticsFee: number
  labelFee: number
  totalAmount: number
  commissionAmount: number
  usePlatformLogistics: boolean
  logisticsOption: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  receiverCountry: string
  needWarehouse: boolean
  needLabel: boolean
  labelContent: string
  status: string
  paymentMethod: string
  paymentTime: string | null
  createdAt: string
  buyer: { id: string; phone: string; nickname: string }
  merchant: { id: string; shopName: string; contactName: string; contactPhone: string }
  warehouseRecords: { id: string; operation: string; quantity: number; note: string; createdAt: string }[]
  logisticsOrders: { id: string; trackingNo: string; logisticsChannel: string; status: string; statusTimeline: { status: string; time: string; note: string }[]; freight: number }[]
  settlement: { id: string; productAmount: number; commissionRate: number; commissionAmount: number; merchantAmount: number; labelFee: number; logisticsFee: number; status: string } | null
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/admin/orders/${params.id}`)
        if (res.ok) setOrder(await res.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [params.id])

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return
    const confirmed = confirm(`确认将订单状态更新为"${getStatusLabel(newStatus)}"？`)
    if (!confirmed) return
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setOrder({ ...order, status: newStatus })
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">加载中...</div>
  if (!order) return <div className="text-center py-12 text-gray-400">订单不存在</div>

  const nextStatusMap: Record<string, string> = {
    pending_payment: 'paid',
    paid: 'in_warehouse',
    in_warehouse: 'labeling',
    labeling: 'dispatched',
    dispatched: 'in_transit',
    in_transit: 'delivered',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">订单详情</h1>
          <p className="text-sm text-gray-500">{order.orderNo}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="outline" className={`${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </Badge>
          {nextStatusMap[order.status] && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleStatusUpdate(nextStatusMap[order.status])}>
              更新为{getStatusLabel(nextStatusMap[order.status])}
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> 商品明细
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>单价</TableHead>
                    <TableHead>小计</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.quantity} {item.unit}</TableCell>
                      <TableCell>{formatPrice(item.price)}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(item.quantity * item.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Receiver Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" /> 收货信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">收件人</p>
                  <p className="text-sm font-medium">{order.receiverName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">联系电话</p>
                  <p className="text-sm font-medium">{order.receiverPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">国家</p>
                  <p className="text-sm font-medium">{order.receiverCountry}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">详细地址</p>
                  <p className="text-sm font-medium">{order.receiverAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Records */}
          {order.warehouseRecords?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Warehouse className="w-4 h-4" /> 仓储记录
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>操作</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.warehouseRecords.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {r.operation === 'inbound' ? '入库' : r.operation === 'label' ? '贴单' : '出库'}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.quantity}</TableCell>
                        <TableCell className="text-gray-500">{r.note || '-'}</TableCell>
                        <TableCell className="text-xs text-gray-500">{formatDateTime(r.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Logistics */}
          {order.logisticsOrders?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-4 h-4" /> 物流信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.logisticsOrders.map((lo) => (
                  <div key={lo.id} className="p-4 rounded-lg bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{lo.logisticsChannel}</span>
                        <Badge variant="outline" className={`text-[10px] ${getStatusColor(lo.status)}`}>
                          {getStatusLabel(lo.status)}
                        </Badge>
                      </div>
                      <Link href={`/admin/logistics/orders/${lo.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">查看详情</Button>
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500">运单号: {lo.trackingNo || '暂无'}</p>
                    {lo.statusTimeline?.length > 0 && (
                      <div className="space-y-2">
                        {lo.statusTimeline.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-gray-400">{formatDateTime(s.time)}</span>
                            <span className="text-gray-600">{s.note}</span>
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> 费用明细
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">商品小计</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">物流费</span>
                <span>{formatPrice(order.logisticsFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">贴单费</span>
                <span>{formatPrice(order.labelFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>总金额</span>
                <span className="text-emerald-600">{formatPrice(order.totalAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">佣金</span>
                <span>{formatPrice(order.commissionAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">状态管理</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">当前状态</span>
                <Badge variant="outline" className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
              </div>
              <Select onValueChange={(v) => handleStatusUpdate(v)}>
                <SelectTrigger><SelectValue placeholder="手动更改状态..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_payment">待付款</SelectItem>
                  <SelectItem value="paid">已付款</SelectItem>
                  <SelectItem value="in_warehouse">已入仓</SelectItem>
                  <SelectItem value="labeling">贴单中</SelectItem>
                  <SelectItem value="dispatched">已发货</SelectItem>
                  <SelectItem value="in_transit">运输中</SelectItem>
                  <SelectItem value="delivered">已签收</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Party Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">交易双方</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><User className="w-3 h-3" /> 买家</p>
                <p className="text-sm font-medium">{order.buyer?.nickname || order.buyer?.phone}</p>
                <p className="text-xs text-gray-400">{order.buyer?.phone}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Store className="w-3 h-3" /> 商家</p>
                <Link href={`/admin/merchants/${order.merchant?.id}`} className="text-sm font-medium text-emerald-600 hover:underline">
                  {order.merchant?.shopName}
                </Link>
                <p className="text-xs text-gray-400">{order.merchant?.contactName} {order.merchant?.contactPhone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Other Info */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500">付款方式</p>
                <p className="text-sm">{order.paymentMethod || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">付款时间</p>
                <p className="text-sm">{order.paymentTime ? formatDateTime(order.paymentTime) : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">创建时间</p>
                <p className="text-sm">{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">物流方式</p>
                <p className="text-sm">{order.usePlatformLogistics ? `平台物流 - ${order.logisticsOption}` : '自发货'}</p>
              </div>
              <div className="flex gap-3">
                <div>
                  <p className="text-xs text-gray-500">需要仓储</p>
                  <Badge variant={order.needWarehouse ? 'default' : 'secondary'} className="text-[10px]">
                    {order.needWarehouse ? '是' : '否'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">需要贴单</p>
                  <Badge variant={order.needLabel ? 'default' : 'secondary'} className="text-[10px]">
                    {order.needLabel ? '是' : '否'}
                  </Badge>
                </div>
              </div>
              {order.labelContent && (
                <div>
                  <p className="text-xs text-gray-500">贴单内容</p>
                  <p className="text-sm">{order.labelContent}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settlement */}
          {order.settlement && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> 结算信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">商品金额</span><span>{formatPrice(order.settlement.productAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">佣金率</span><span>{(order.settlement.commissionRate * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">佣金金额</span><span>{formatPrice(order.settlement.commissionAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">商家应得</span><span className="font-semibold">{formatPrice(order.settlement.merchantAmount)}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-gray-500">结算状态</span>
                  <Badge variant="outline" className={getStatusColor(order.settlement.status)}>{getStatusLabel(order.settlement.status)}</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
