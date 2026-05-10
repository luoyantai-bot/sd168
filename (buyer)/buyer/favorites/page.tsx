'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatPrice, CATEGORIES } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Heart,
  Trash2,
  Package,
  MessageSquare,
  Store,
} from 'lucide-react'

interface FavoriteItem {
  id: string
  note: string
  createdAt: string
  product: {
    id: string
    title: string
    subtitle: string
    coverImage: string
    category: string
    moq: number
    unit: string
    isInWarehouse: boolean
    merchant: {
      id: string
      shopName: string
    }
    priceTiers: Array<{ minQty: number; maxQty?: number; price: number }>
    parsedMinPrice: number | null
    parsedMaxPrice: number | null
  }
}

export default function BuyerFavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingNote, setEditingNote] = useState<string | null>(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites')
      const data = await res.json()
      setFavorites(data.favorites || [])
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (productId: string) => {
    try {
      await fetch(`/api/favorites/${productId}`, { method: 'DELETE' })
      setFavorites((prev) => prev.filter((f) => f.product.id !== productId))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    } catch (err) {
      console.error('Failed to remove favorite:', err)
    }
  }

  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === favorites.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(favorites.map((f) => f.product.id)))
    }
  }

  const handleBatchInquiry = () => {
    // Navigate to the first selected product's inquiry
    if (selectedIds.size > 0) {
      const firstId = Array.from(selectedIds)[0]
      router.push(`/buyer/products/${firstId}`)
    }
  }

  const getCategoryIcon = (slug: string) => {
    return CATEGORIES.find((c) => c.slug === slug)?.icon || '📦'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">收藏夹</h1>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">收藏夹</h1>
        {favorites.length > 0 && (
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
                onClick={handleBatchInquiry}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                批量询盘 ({selectedIds.size})
              </Button>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedIds.size === favorites.length && favorites.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-gray-600">全选</span>
            </div>
          </div>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无收藏</p>
            <p className="text-sm text-gray-400 mt-1">收藏感兴趣的商品，方便下次查看</p>
            <Link href="/buyer/home">
              <Button className="mt-4 bg-orange-500 hover:bg-orange-600">去逛逛</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {favorites.map((fav) => {
            const product = fav.product
            return (
              <Card key={fav.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedIds.has(product.id)}
                        onCheckedChange={() => toggleSelect(product.id)}
                      />
                    </div>
                    <Link href={`/buyer/products/${product.id}`} className="shrink-0">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                        {product.coverImage ? (
                          <img src={product.coverImage} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">{getCategoryIcon(product.category)}</span>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/buyer/products/${product.id}`}>
                        <h3 className="font-medium text-gray-900 truncate hover:text-orange-600 transition-colors">
                          {product.title}
                        </h3>
                      </Link>
                      {product.subtitle && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{product.subtitle}</p>
                      )}
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-orange-600 font-bold">
                          {product.parsedMinPrice !== null ? formatPrice(product.parsedMinPrice) : '面议'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{product.moq}{product.unit}起批</span>
                        {product.isInWarehouse && (
                          <Badge variant="secondary" className="text-[10px] h-4 bg-emerald-50 text-emerald-600">
                            现货
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Store className="w-3 h-3" />
                        {product.merchant.shopName}
                      </div>

                      {/* Note */}
                      {editingNote === fav.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            defaultValue={fav.note}
                            placeholder="添加备注..."
                            className="h-7 text-xs"
                            onBlur={(e) => setEditingNote(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingNote(null)
                            }}
                          />
                        </div>
                      ) : (
                        <button
                          className="text-xs text-gray-400 hover:text-orange-500 mt-1"
                          onClick={() => setEditingNote(fav.id)}
                        >
                          {fav.note || '+ 添加备注'}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col items-end justify-between shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-500 h-8 w-8 p-0"
                        onClick={() => removeFavorite(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Link href={`/buyer/products/${product.id}`}>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-xs h-7">
                          询盘
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
