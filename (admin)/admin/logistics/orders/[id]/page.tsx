'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Truck, MapPin, PackageCheck, Clock, Plus } from 'lucide-react'
import { formatPrice, formatDateTime, getStatusColor, parseJSON } from '@/lib/utils'

interface LogisticsDetail {
  id: string
  trackingNo: string
  logisticsChannel: string
  origin: string
  destination: string
  weight: number
  volumeWeight: number
  chargeWeight: number
  freight: number
  status: string
  statusTimeline: { status: string; time: string; note: string }[]
  createdAt: string
  order: {
    id: string
    orderNo: string
    buyer: { nickname: string; phone: string }
    merchant: { shopName: string }
    receiverName: string
    receiverPhone: string
    receiverAddress: string
    receiverCountry: string
    items: { title: string; quantity: number; unit: string }[]
    totalAmount: number
  }
}

const statusLabels: Record<string, string> = {
  created: '已创建',
  picked_up: '已揽收',
  customs_clearance: '清关中',
  in_transit: '运输中',
  arrived: '已到达',
  delivered: '已签收',
}

export default function LogisticsOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [logistics, setLogistics] = useState<LogisticsDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newTrackingNo, setNewTrackingNo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/admin/logistics/orders/${params.id}`)
        if (res.ok) setLogistics(await res.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id])

  const handleAddStatus = async () => {
    if (!newStatus) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/logistics/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: newNote, trackingNo: newTrackingNo || undefined }),
      })
      if (res.ok) {
        const updated = await res.json()
        // Reload
        const detailRes = await fetch(`/api/admin/logistics/orders/${params.id}`)
        if (detailRes.ok) setLogistics(await detailRes.json())
        setNewStatus('')
        setNewNote('')
        setNewTrackingNo('')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">加载中...</div>
  if (!logistics) return <div className="text-center py-12 text-gray-400">物流订单不存在</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">物流订单详情</h1>
          <p className="text-sm text-gray-500">运单号: {logistics.trackingNo || '暂无'}</p>
        </div>
        <Badge variant="outline" className={`ml-auto ${getStatusColor(logistics.status)}`}>
          {statusLabels[logistics.status] || logistics.status}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" /> 物流轨迹
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logistics.statusTimeline?.length > 0 ? (
                <div className="space-y-4">
                  {logistics.statusTimeline.map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${i === logistics.statusTimeline.length - 1 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        {i < logistics.statusTimeline.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{statusLabels[s.status] || s.status}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(s.time)}</p>
                        {s.note && <p className="text-xs text-gray-600 mt-0.5">{s.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">暂无物流轨迹</p>
              )}
            </CardContent>
          </Card>

          {/* Add Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4" /> 更新物流状态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>新状态</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="选择状态" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="picked_up">已揽收</SelectItem>
                      <SelectItem value="customs_clearance">清关中</SelectItem>
                      <SelectItem value="in_transit">运输中</SelectItem>
                      <SelectItem value="arrived">已到达</SelectItem>
                      <SelectItem value="delivered">已签收</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>运单号</Label>
                  <Input value={newTrackingNo} onChange={(e) => setNewTrackingNo(e.target.value)} placeholder="更新运单号（可选）" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>备注</Label>
                <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="状态说明（可选）" className="mt-1" />
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={!newStatus || saving} onClick={handleAddStatus}>
                {saving ? '保存中...' : '添加状态'}
              </Button>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PackageCheck className="w-4 h-4" /> 关联订单
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">订单号</p>
                  <Link href={`/admin/orders/${logistics.order?.id}`} className="text-sm text-emerald-600 hover:underline">
                    {logistics.order?.orderNo}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-gray-500">订单金额</p>
                  <p className="text-sm">{formatPrice(logistics.order?.totalAmount || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">买家</p>
                  <p className="text-sm">{logistics.order?.buyer?.nickname || logistics.order?.buyer?.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">商家</p>
                  <p className="text-sm">{logistics.order?.merchant?.shopName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4" /> 物流信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">物流渠道</p>
                <p className="text-sm font-medium">{logistics.logisticsChannel || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">运单号</p>
                <p className="text-sm font-medium">{logistics.trackingNo || '暂无'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> 始发地</p>
                <p className="text-sm">{logistics.origin}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> 目的地</p>
                <p className="text-sm">{logistics.destination}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-500">实际重量</p>
                <p className="text-sm">{logistics.weight} kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">体积重量</p>
                <p className="text-sm">{logistics.volumeWeight} kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">计费重量</p>
                <p className="text-sm font-semibold">{logistics.chargeWeight} kg</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-500">运费</p>
                <p className="text-lg font-bold text-emerald-600">{formatPrice(logistics.freight)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">创建时间</p>
                <p className="text-sm">{formatDateTime(logistics.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Receiver */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">收件人信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">姓名</p>
                <p className="text-sm">{logistics.order?.receiverName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">电话</p>
                <p className="text-sm">{logistics.order?.receiverPhone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">国家</p>
                <p className="text-sm">{logistics.order?.receiverCountry}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">地址</p>
                <p className="text-sm">{logistics.order?.receiverAddress}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
