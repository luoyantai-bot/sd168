'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp, Users, PackageCheck, RefreshCw } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'

interface GmvTrendItem {
  date: string
  amount: number
}

interface MerchantRanking {
  id: string
  shopName: string
  productCount: number
  orderCount: number
  totalAmount: number
}

interface ProductRanking {
  id: string
  title: string
  category: string
  shopName: string
  viewCount: number
  inquiryCount: number
  priceTiers: { minQty: number; price: number }[]
}

interface BuyerAnalysis {
  id: string
  nickname: string
  phone: string
  orderCount: number
  totalSpent: number
  inquiryCount: number
  createdAt: string
}

const chartConfig: ChartConfig = {
  amount: { label: 'GMV', color: '#10b981' },
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState('gmv')
  const [gmvTrend, setGmvTrend] = useState<GmvTrendItem[]>([])
  const [merchantRanking, setMerchantRanking] = useState<MerchantRanking[]>([])
  const [productRanking, setProductRanking] = useState<ProductRanking[]>([])
  const [buyerAnalysis, setBuyerAnalysis] = useState<BuyerAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [gmvRes, merchantRes, productRes, buyerRes] = await Promise.all([
          fetch('/api/admin/reports?type=gmv_trend'),
          fetch('/api/admin/reports?type=merchant_ranking'),
          fetch('/api/admin/reports?type=product_ranking'),
          fetch('/api/admin/reports?type=buyer_analysis'),
        ])
        if (gmvRes.ok) setGmvTrend(await gmvRes.json())
        if (merchantRes.ok) setMerchantRanking(await merchantRes.json())
        if (productRes.ok) setProductRanking(await productRes.json())
        if (buyerRes.ok) setBuyerAnalysis(await buyerRes.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const getMinPrice = (tiers: { minQty: number; price: number }[]) => {
    if (!tiers || tiers.length === 0) return '-'
    return formatPrice(Math.min(...tiers.map(t => t.price)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">数据报表</h1>
          <p className="text-sm text-gray-500 mt-1">平台运营数据分析</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-1" /> 刷新
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="gmv">GMV趋势</TabsTrigger>
          <TabsTrigger value="merchants">商家排行</TabsTrigger>
          <TabsTrigger value="products">商品排行</TabsTrigger>
          <TabsTrigger value="buyers">买家分析</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* GMV Trend */}
      {tab === 'gmv' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> 近30天GMV趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-400">加载中...</div>
            ) : gmvTrend.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无数据</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={gmvTrend} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v) => `¥${v}`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatPrice(Number(value))} />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Merchant Ranking */}
      {tab === 'merchants' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> 商家排行
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排名</TableHead>
                  <TableHead>店铺名称</TableHead>
                  <TableHead>商品数</TableHead>
                  <TableHead>订单数</TableHead>
                  <TableHead>总交易额</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
                ) : merchantRanking.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">暂无数据</TableCell></TableRow>
                ) : merchantRanking.map((m, i) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge variant={i < 3 ? 'default' : 'secondary'} className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        {i + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{m.shopName}</TableCell>
                    <TableCell>{m.productCount}</TableCell>
                    <TableCell>{m.orderCount}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">{formatPrice(m.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Product Ranking */}
      {tab === 'products' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PackageCheck className="w-4 h-4" /> 商品排行
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排名</TableHead>
                  <TableHead>商品名称</TableHead>
                  <TableHead>品类</TableHead>
                  <TableHead>商家</TableHead>
                  <TableHead>最低价</TableHead>
                  <TableHead>浏览量</TableHead>
                  <TableHead>询盘数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
                ) : productRanking.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">暂无数据</TableCell></TableRow>
                ) : productRanking.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Badge variant={i < 3 ? 'default' : 'secondary'} className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        {i + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{p.category}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-600">{p.shopName}</TableCell>
                    <TableCell className="text-sm">{getMinPrice(p.priceTiers)}</TableCell>
                    <TableCell>{p.viewCount}</TableCell>
                    <TableCell>{p.inquiryCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Buyer Analysis */}
      {tab === 'buyers' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> 买家分析
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排名</TableHead>
                  <TableHead>昵称</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>订单数</TableHead>
                  <TableHead>消费总额</TableHead>
                  <TableHead>询盘数</TableHead>
                  <TableHead>注册时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
                ) : buyerAnalysis.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">暂无数据</TableCell></TableRow>
                ) : buyerAnalysis.map((b, i) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Badge variant={i < 3 ? 'default' : 'secondary'} className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        {i + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{b.nickname || '-'}</TableCell>
                    <TableCell className="text-sm">{b.phone}</TableCell>
                    <TableCell>{b.orderCount}</TableCell>
                    <TableCell className="font-semibold text-emerald-600">{formatPrice(b.totalSpent)}</TableCell>
                    <TableCell>{b.inquiryCount}</TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDate(b.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
