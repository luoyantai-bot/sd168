'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  formatPrice,
  parseJSON,
} from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Package,
  Truck,
  Warehouse,
  Tag,
  MapPin,
  User,
  Phone,
  CheckCircle,
  CreditCard,
  ChevronRight,
} from 'lucide-react'

interface InquiryInfo {
  id: string
  quantity: number
  quotedPrice: number | null
  product: {
    id: string
    title: string
    subtitle: string
    coverImage: string
    category: string
    unit: string
    weight: number
    volumeL: number
    volumeW: number
    volumeH: number
    moq: number
    priceTiers: string
  }
  merchant: {
    id: string
    shopName: string
  }
}

interface LogisticsChannel {
  id: string
  name: string
  carrier: string
  deliveryDays: string
  billingMethod: string
  firstWeightPrice: number
  additionalPrice: number
  minWeight: number
  destinationCountries: string[]
}

interface Address {
  id: string
  name: string
  phone: string
  country: string
  address: string
  isDefault: boolean
}

export default function CheckoutPage({ params }: { params: Promise<{ inquiryId: string }> }) {
  const { inquiryId } = use(params)
  const router = useRouter()
  const [inquiry, setInquiry] = useState<InquiryInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  // Step 2 options
  const [usePlatformLogistics, setUsePlatformLogistics] = useState(true)
  const [selectedLogistics, setSelectedLogistics] = useState('')
  const [logisticsChannels, setLogisticsChannels] = useState<LogisticsChannel[]>([])
  const [needWarehouse, setNeedWarehouse] = useState(false)
  const [needLabel, setNeedLabel] = useState(false)
  const [labelContent, setLabelContent] = useState('')

  // Receiver info
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverCountry, setReceiverCountry] = useState('俄罗斯')
  const [receiverAddress, setReceiverAddress] = useState('')

  // Addresses from profile
  const [addresses, setAddresses] = useState<Address[]>([])

  // Computed fees
  const unitPrice = inquiry?.quotedPrice || 0
  const subtotal = unitPrice * (inquiry?.quantity || 0)
  const labelFee = needLabel ? 2 * (inquiry?.quantity || 0) : 0

  const calculateLogisticsFee = () => {
    if (!inquiry || !selectedLogistics) return 0
    const channel = logisticsChannels.find((c) => c.id === selectedLogistics)
    if (!channel) return 0
    const totalWeightKg = (inquiry.quantity * inquiry.product.weight) / 1000
    const volumeWeight = (inquiry.product.volumeL * inquiry.product.volumeW * inquiry.product.volumeH * inquiry.quantity) / 6000
    const chargeWeight = Math.max(totalWeightKg, volumeWeight, channel.minWeight)
    return Math.max(channel.firstWeightPrice + (chargeWeight - channel.minWeight) * channel.additionalPrice, channel.firstWeightPrice)
  }

  const logisticsFee = usePlatformLogistics ? calculateLogisticsFee() : 0
  const totalAmount = subtotal + logisticsFee + labelFee

  useEffect(() => {
    fetchInquiry()
    fetchLogisticsChannels()
    loadAddresses()
  }, [inquiryId])

  const fetchInquiry = async () => {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`)
      const data = await res.json()
      setInquiry(data.inquiry)
    } catch (err) {
      console.error('Failed to fetch inquiry:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogisticsChannels = async () => {
    try {
      const res = await fetch('/api/logistics/channels')
      const data = await res.json()
      setLogisticsChannels(data.channels || [])
    } catch {
      // ignore
    }
  }

  const loadAddresses = () => {
    try {
      const stored = localStorage.getItem('buyer_addresses')
      if (stored) {
        const addrs = JSON.parse(stored) as Address[]
        setAddresses(addrs)
        const defaultAddr = addrs.find((a) => a.isDefault)
        if (defaultAddr) {
          setReceiverName(defaultAddr.name)
          setReceiverPhone(defaultAddr.phone)
          setReceiverCountry(defaultAddr.country || '俄罗斯')
          setReceiverAddress(defaultAddr.address)
        }
      }
    } catch {
      // ignore
    }
  }

  const selectAddress = (addr: Address) => {
    setReceiverName(addr.name)
    setReceiverPhone(addr.phone)
    setReceiverCountry(addr.country || '俄罗斯')
    setReceiverAddress(addr.address)
  }

  const handleNext = () => {
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleSubmitOrder = async () => {
    if (!inquiry) return
    setSubmitting(true)
    try {
      const items = [{
        productId: inquiry.product.id,
        title: inquiry.product.title,
        quantity: inquiry.quantity,
        price: unitPrice,
        unit: inquiry.product.unit,
        coverImage: inquiry.product.coverImage,
      }]

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          merchantId: inquiry.merchant.id,
          items,
          subtotal,
          logisticsFee,
          labelFee,
          totalAmount,
          commissionAmount: subtotal * 0.05,
          usePlatformLogistics,
          logisticsOption: selectedLogistics
            ? logisticsChannels.find((c) => c.id === selectedLogistics)?.name || ''
            : '',
          receiverName,
          receiverPhone,
          receiverAddress,
          receiverCountry,
          needWarehouse,
          needLabel,
          labelContent,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/buyer/orders/${data.order.id}`)
      }
    } catch (err) {
      console.error('Failed to create order:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-32" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!inquiry) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">询盘不存在</p>
          <Button className="mt-4" onClick={() => router.push('/buyer/inquiries')}>
            返回询盘列表
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-600">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回
      </Button>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? '确认商品' : s === 2 ? '选择服务' : '确认下单'}
            </span>
            {s < 3 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Confirm Items */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">确认商品信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                {inquiry.product.coverImage ? (
                  <img src={inquiry.product.coverImage} alt={inquiry.product.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">{inquiry.product.title}</h3>
                {inquiry.product.subtitle && (
                  <p className="text-sm text-gray-500 truncate">{inquiry.product.subtitle}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-gray-600">数量：<span className="font-medium">{inquiry.quantity}{inquiry.product.unit}</span></span>
                  <span className="text-orange-600 font-medium">{formatPrice(unitPrice)}/{inquiry.product.unit}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">商品金额</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>

            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleNext}>
              下一步：选择服务
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Services & Receiver */}
      {step === 2 && (
        <>
          {/* Logistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" />
                物流服务
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">使用平台物流</p>
                  <p className="text-xs text-gray-500">推荐使用平台物流，安全可靠</p>
                </div>
                <Switch checked={usePlatformLogistics} onCheckedChange={setUsePlatformLogistics} />
              </div>

              {usePlatformLogistics && (
                <div>
                  <Label className="text-sm">选择物流渠道</Label>
                  <Select value={selectedLogistics} onValueChange={setSelectedLogistics}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="请选择物流渠道" />
                    </SelectTrigger>
                    <SelectContent>
                      {logisticsChannels.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>
                          {ch.name} ({ch.carrier}) - {ch.deliveryDays}天
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLogistics && (
                    <p className="text-sm text-orange-600 mt-1">
                      预估运费：{formatPrice(calculateLogisticsFee())}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warehouse & Label */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">附加服务</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">仓储服务</p>
                    <p className="text-xs text-gray-500">使用平台仓库暂存商品</p>
                  </div>
                </div>
                <Switch checked={needWarehouse} onCheckedChange={setNeedWarehouse} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">贴单服务</p>
                    <p className="text-xs text-gray-500">¥2/件，平台代贴面单</p>
                  </div>
                </div>
                <Switch checked={needLabel} onCheckedChange={setNeedLabel} />
              </div>

              {needLabel && (
                <div>
                  <Label className="text-sm">贴单内容</Label>
                  <Input
                    value={labelContent}
                    onChange={(e) => setLabelContent(e.target.value)}
                    placeholder="请输入贴单内容（如SKU、条码等）"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    贴单费用：{formatPrice(labelFee)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receiver Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                收货信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Saved addresses */}
              {addresses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">选择已保存地址</p>
                  <div className="space-y-1.5">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-2 rounded-lg border cursor-pointer text-sm ${
                          receiverName === addr.name && receiverPhone === addr.phone
                            ? 'border-orange-300 bg-orange-50'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                        onClick={() => selectAddress(addr)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{addr.name}</span>
                          <span className="text-gray-500">{addr.phone}</span>
                          {addr.isDefault && (
                            <Badge className="bg-orange-500 text-[10px] h-4">默认</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{addr.country} {addr.address}</p>
                      </div>
                    ))}
                  </div>
                  <Separator />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">收货人</Label>
                  <Input
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="h-9 text-sm mt-1"
                    placeholder="姓名"
                  />
                </div>
                <div>
                  <Label className="text-xs">电话</Label>
                  <Input
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="h-9 text-sm mt-1"
                    placeholder="手机号"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">国家</Label>
                <Input
                  value={receiverCountry}
                  onChange={(e) => setReceiverCountry(e.target.value)}
                  className="h-9 text-sm mt-1"
                  placeholder="如：俄罗斯"
                />
              </div>
              <div>
                <Label className="text-xs">详细地址</Label>
                <Input
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="h-9 text-sm mt-1"
                  placeholder="省/州/城市/街道/门牌号"
                />
              </div>

              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={handleNext}
                disabled={!receiverName || !receiverPhone || !receiverAddress}
              >
                下一步：确认下单
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step 3: Confirm & Pay */}
      {step === 3 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">订单确认</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {inquiry.product.coverImage ? (
                    <img src={inquiry.product.coverImage} alt={inquiry.product.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inquiry.product.title}</p>
                  <p className="text-xs text-gray-500">{inquiry.quantity}{inquiry.product.unit} × {formatPrice(unitPrice)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">收货人</span>
                  <span>{receiverName} {receiverPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">收货地址</span>
                  <span className="text-right max-w-[200px] truncate">{receiverCountry} {receiverAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">物流方式</span>
                  <span>{usePlatformLogistics ? (logisticsChannels.find((c) => c.id === selectedLogistics)?.name || '平台物流') : '自备物流'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">仓储服务</span>
                  <span>{needWarehouse ? '是' : '否'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">贴单服务</span>
                  <span>{needLabel ? '是' : '否'}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">商品金额</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">物流费用</span>
                  <span>{formatPrice(logisticsFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">贴单费用</span>
                  <span>{formatPrice(labelFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>合计</span>
                  <span className="text-orange-600 text-xl">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">支付方式</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer border-orange-300 bg-orange-50">
                  <input type="radio" name="payment" defaultChecked className="text-orange-500" />
                  <CreditCard className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">微信支付</p>
                    <p className="text-xs text-gray-500">推荐使用</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
                  <input type="radio" name="payment" className="text-orange-500" />
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">银行转账</p>
                    <p className="text-xs text-gray-500">对公转账</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base"
            onClick={handleSubmitOrder}
            disabled={submitting}
          >
            {submitting ? '提交中...' : `确认支付 ${formatPrice(totalAmount)}`}
          </Button>
        </>
      )}
    </div>
  )
}
