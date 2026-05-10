'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice, formatDate, getStatusLabel, getStatusColor, CATEGORIES } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Store,
  ChevronRight,
  Package,
  Clock,
} from 'lucide-react'

interface InquiryItem {
  id: string
  quantity: number
  message: string
  status: string
  quotedPrice: number | null
  createdAt: string
  repliedAt: string | null
  product: {
    id: string
    title: string
    coverImage: string
    category: string
    unit: string
  }
  merchant: {
    id: string
    shopName: string
    shopLogo: string
  }
}

export default function BuyerInquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('all')

  useEffect(() => {
    fetchInquiries()
  }, [activeStatus])

  const fetchInquiries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeStatus !== 'all') params.set('status', activeStatus)

      const res = await fetch(`/api/inquiries?${params.toString()}`)
      const data = await res.json()
      setInquiries(data.inquiries || [])
    } catch (err) {
      console.error('Failed to fetch inquiries:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (slug: string) => {
    return CATEGORIES.find((c) => c.slug === slug)?.icon || '📦'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">我的询盘</h1>
        <Link href="/buyer/home">
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
            发起询盘
          </Button>
        </Link>
      </div>

      <Tabs value={activeStatus} onValueChange={setActiveStatus}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="pending">待处理</TabsTrigger>
          <TabsTrigger value="replied">已回复</TabsTrigger>
          <TabsTrigger value="converted">已转化</TabsTrigger>
          <TabsTrigger value="closed">已关闭</TabsTrigger>
        </TabsList>

        <TabsContent value={activeStatus} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无询盘记录</p>
                <p className="text-sm text-gray-400 mt-1">浏览商品并发起询盘</p>
                <Link href="/buyer/home">
                  <Button className="mt-4 bg-orange-500 hover:bg-orange-600">浏览商品</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inquiry) => (
                <Link key={inquiry.id} href={`/buyer/inquiries/${inquiry.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {inquiry.product.coverImage ? (
                            <img src={inquiry.product.coverImage} alt={inquiry.product.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{getCategoryIcon(inquiry.product.category)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                              {inquiry.product.title}
                            </h3>
                            <Badge className={`text-[10px] shrink-0 ${getStatusColor(inquiry.status)}`}>
                              {getStatusLabel(inquiry.status)}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            <span>数量：{inquiry.quantity}{inquiry.product.unit}</span>
                            {inquiry.quotedPrice !== null && inquiry.quotedPrice !== undefined && (
                              <span className="text-orange-600 font-medium">
                                报价：{formatPrice(inquiry.quotedPrice)}
                              </span>
                            )}
                          </div>

                          {inquiry.message && (
                            <p className="text-xs text-gray-400 truncate mt-1">
                              {inquiry.message}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Store className="w-3 h-3" />
                              {inquiry.merchant.shopName}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {formatDate(inquiry.createdAt)}
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-300 shrink-0 self-center" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
