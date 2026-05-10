'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CATEGORIES, formatPrice } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Search, TrendingUp, Package, ChevronRight, Warehouse, Zap } from 'lucide-react'

interface ProductItem {
  id: string
  title: string
  subtitle: string
  category: string
  coverImage: string
  moq: number
  unit: string
  viewCount: number
  inquiryCount: number
  isInWarehouse: boolean
  merchant: {
    id: string
    shopName: string
    shopLogo: string
  }
  priceTiers: Array<{ minQty: number; maxQty?: number; price: number }>
  parsedMinPrice: number | null
  parsedMaxPrice: number | null
}

export default function BuyerHomePage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?status=published&sort=latest&limit=12')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/buyer/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const getCategoryIcon = (slug: string) => {
    return CATEGORIES.find((c) => c.slug === slug)?.icon || '📦'
  }

  const getCategoryName = (slug: string) => {
    return CATEGORIES.find((c) => c.slug === slug)?.name || slug
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl">
        <Carousel className="w-full">
          <CarouselContent>
            <CarouselItem>
              <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 rounded-2xl p-6 sm:p-8 min-h-[160px] sm:min-h-[200px] flex flex-col justify-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  发现邵东优质好货
                </h1>
                <p className="text-sm sm:text-base text-orange-100 mb-4">
                  本地厂家直供 · 跨境选品一站式服务
                </p>
                <form onSubmit={handleSearch} className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索商品、品类、商家..."
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-orange-200 focus:bg-white/30 h-10"
                  />
                </form>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 rounded-2xl p-6 sm:p-8 min-h-[160px] sm:min-h-[200px] flex flex-col justify-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  仓库现货 · 极速发货
                </h1>
                <p className="text-sm sm:text-base text-pink-100 mb-4">
                  平台仓储服务，支持贴单、代发
                </p>
                <Link href="/buyer/search?hasStock=true">
                  <Button className="bg-white text-pink-600 hover:bg-white/90">
                    查看现货商品
                  </Button>
                </Link>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 rounded-2xl p-6 sm:p-8 min-h-[160px] sm:min-h-[200px] flex flex-col justify-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  平台物流 · 安全可靠
                </h1>
                <p className="text-sm sm:text-base text-emerald-100 mb-4">
                  多渠道物流方案，直达俄罗斯及全球
                </p>
                <Link href="/buyer/search">
                  <Button className="bg-white text-emerald-600 hover:bg-white/90">
                    开始选品
                  </Button>
                </Link>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex left-2 bg-white/30 border-white/50 text-white hover:bg-white/50" />
          <CarouselNext className="hidden sm:flex right-2 bg-white/30 border-white/50 text-white hover:bg-white/50" />
        </Carousel>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">商品分类</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/buyer/search?category=${cat.slug}`}
              className="flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl bg-white hover:bg-orange-50 transition-colors group border border-gray-100"
            >
              <span className="text-2xl sm:text-3xl">{cat.icon}</span>
              <span className="text-xs text-gray-600 group-hover:text-orange-600 font-medium truncate">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/buyer/search?sort=popular">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-xs font-medium text-gray-700">热门推荐</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/buyer/search?sort=latest">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs font-medium text-gray-700">新品上架</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/buyer/search?hasStock=true">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-xs font-medium text-gray-700">仓库现货</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recommended Products */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">推荐商品</h2>
          <Link href="/buyer/search">
            <Button variant="ghost" size="sm" className="text-orange-600">
              查看更多
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-gray-100 animate-pulse" />
                <CardContent className="p-3 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无商品</p>
              <p className="text-sm text-gray-400 mt-1">请稍后再来查看</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product) => (
              <Link key={product.id} href={`/buyer/products/${product.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow h-full group">
                  <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                    {product.coverImage ? (
                      <img
                        src={product.coverImage}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-3xl">{getCategoryIcon(product.category)}</span>
                        <span className="text-xs text-gray-400">{getCategoryName(product.category)}</span>
                      </div>
                    )}
                    {product.isInWarehouse && (
                      <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        现货
                      </span>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </h3>
                    {product.subtitle && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {product.subtitle}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-orange-600 font-bold text-base">
                        {product.parsedMinPrice !== null ? formatPrice(product.parsedMinPrice) : '面议'}
                      </span>
                      {product.parsedMaxPrice !== null && product.parsedMaxPrice !== product.parsedMinPrice && (
                        <span className="text-xs text-gray-400">
                          -{formatPrice(product.parsedMaxPrice)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {product.moq}{product.unit}起批
                      </span>
                      <span className="text-xs text-gray-400 truncate ml-2">
                        {product.merchant.shopName}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
