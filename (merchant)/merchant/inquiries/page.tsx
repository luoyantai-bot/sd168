'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FileText, Package, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils'

interface Inquiry {
  id: string
  quantity: number
  message: string
  needSample: boolean
  expectedDate: string | null
  status: string
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
    priceTiers: string
    moq: number
    unit: string
  }
}

const statusTabs = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待回复' },
  { value: 'replied', label: '已回复' },
  { value: 'converted', label: '已转化' },
  { value: 'closed', label: '已关闭' },
]

export default function MerchantInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [keyword, setKeyword] = useState('')

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab) params.set('status', activeTab)
      const res = await fetch(`/api/merchant/inquiries?${params}`)
      const data = await res.json()
      setInquiries(data.inquiries || [])
    } catch {
      console.error('Failed to fetch inquiries')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-900">询盘管理</h1>

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
            placeholder="搜索询盘..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Inquiry List */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
        </div>
      ) : inquiries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无询盘</p>
            <p className="text-sm text-gray-400 mt-1">买家发起询盘后将显示在这里</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries
            .filter((inq) => {
              if (!keyword) return true
              const k = keyword.toLowerCase()
              return (
                inq.product.title.toLowerCase().includes(k) ||
                inq.buyer.nickname.toLowerCase().includes(k) ||
                inq.message.toLowerCase().includes(k)
              )
            })
            .map((inquiry) => (
              <Link key={inquiry.id} href={`/merchant/inquiries/${inquiry.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 overflow-hidden">
                        {inquiry.product.coverImage ? (
                          <img src={inquiry.product.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {inquiry.product.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {inquiry.quantity} {inquiry.product.unit}起 · MOQ: {inquiry.product.moq}
                            </p>
                          </div>
                          <Badge className={`text-[11px] flex-shrink-0 ${getStatusColor(inquiry.status)}`}>
                            {getStatusLabel(inquiry.status)}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                          {inquiry.message || '无留言'}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-[9px] bg-teal-100 text-teal-700">
                                {inquiry.buyer.nickname?.slice(0, 1) || '买'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-500">{inquiry.buyer.nickname || '买家'}</span>
                            {inquiry.quotedPrice && (
                              <span className="text-xs text-teal-600 font-medium">
                                报价: {formatPrice(inquiry.quotedPrice)}
                              </span>
                            )}
                            {inquiry.needSample && (
                              <Badge variant="outline" className="text-[10px] h-5">
                                需样品
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatDate(inquiry.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}
