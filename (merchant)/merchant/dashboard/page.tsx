'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Eye, FileText, DollarSign, Package, ShoppingCart, Plus, ArrowUpRight, Wallet } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Stats {
  publishedCount: number
  draftCount: number
  offlineCount: number
  todayViews: number
  todayInquiries: number
  pendingInquiries: number
  todayGMV: number
  monthGMV: number
  activeOrderCount: number
  balance: number
  topProducts: Array<{
    id: string
    title: string
    coverImage: string
    inquiryCount: number
    viewCount: number
    status: string
    priceTiers: Array<{ minQty: number; price: number }>
  }>
  last7Days: Array<{ date: string; inquiries: number; gmv: number }>
}

export default function MerchantDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/merchant/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
          <p className="text-sm text-gray-500 mt-1">欢迎回来，查看您的店铺数据概览</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 animate-pulse bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const s = stats || {
    publishedCount: 0, draftCount: 0, offlineCount: 0,
    todayViews: 0, todayInquiries: 0, pendingInquiries: 0,
    todayGMV: 0, monthGMV: 0, activeOrderCount: 0, balance: 0,
    topProducts: [], last7Days: [],
  }

  const maxInquiries = Math.max(...s.last7Days.map((d) => d.inquiries), 1)
  const maxGMV = Math.max(...s.last7Days.map((d) => d.gmv), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
        <p className="text-sm text-gray-500 mt-1">欢迎回来，查看您的店铺数据概览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日浏览量</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{s.todayViews}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日询盘数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{s.todayInquiries}</p>
                {s.pendingInquiries > 0 && (
                  <p className="text-xs text-amber-600 mt-0.5">{s.pendingInquiries}条待回复</p>
                )}
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日成交额</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(s.todayGMV)}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月GMV</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(s.monthGMV)}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart & Balance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Last 7 Days Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">近7日询盘趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {s.last7Days.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{day.inquiries}</span>
                  <div
                    className="w-full bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-sm transition-all duration-300 min-h-[4px]"
                    style={{ height: `${Math.max((day.inquiries / maxInquiries) * 100, 4)}%` }}
                  />
                  <span className="text-[10px] text-gray-400">{day.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-teal-600" />
              账户余额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 mb-4">{formatPrice(s.balance)}</p>
            <div className="space-y-2 text-sm text-gray-500 mb-4">
              <div className="flex justify-between">
                <span>在售商品</span>
                <span className="font-medium text-gray-900">{s.publishedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>进行中订单</span>
                <span className="font-medium text-gray-900">{s.activeOrderCount}</span>
              </div>
              <div className="flex justify-between">
                <span>待处理询盘</span>
                <span className="font-medium text-amber-600">{s.pendingInquiries}</span>
              </div>
            </div>
            <Link href="/merchant/settings/account">
              <Button className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600">
                申请提现
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">热门商品 TOP5</CardTitle>
              <Link href="/merchant/products" className="text-sm text-teal-600 hover:underline">
                查看全部
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {s.topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">暂无商品数据</p>
            ) : (
              <div className="space-y-3">
                {s.topProducts.map((product, idx) => {
                  const minPrice = product.priceTiers.length > 0
                    ? Math.min(...product.priceTiers.map((t) => t.price))
                    : 0
                  return (
                    <div key={product.id} className="flex items-center gap-3">
                      <span className="w-5 text-center font-bold text-sm text-gray-400">
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 overflow-hidden">
                        {product.coverImage ? (
                          <img src={product.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                        <p className="text-xs text-gray-400">
                          {minPrice > 0 ? formatPrice(minPrice) + '起' : '暂无报价'} · {product.inquiryCount}次询盘
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {product.viewCount} 浏览
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/merchant/products/create" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-11 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200">
                <Plus className="w-4 h-4" />
                发布商品
              </Button>
            </Link>
            <Link href="/merchant/inquiries" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-11 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200">
                <FileText className="w-4 h-4" />
                查看询盘
                {s.pendingInquiries > 0 && (
                  <Badge className="ml-auto bg-amber-100 text-amber-700 text-[10px] px-1.5">{s.pendingInquiries}</Badge>
                )}
              </Button>
            </Link>
            <Link href="/merchant/orders" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-11 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
                <ShoppingCart className="w-4 h-4" />
                查看订单
              </Button>
            </Link>
            <Link href="/merchant/settings/shop" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-11 hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-200">
                <ArrowUpRight className="w-4 h-4" />
                店铺设置
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
