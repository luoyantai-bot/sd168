'use client'

import { useEffect, useState } from 'react'
import { ProductForm } from '../../product-form'
import { Package } from 'lucide-react'

interface ProductData {
  id: string
  title: string
  subtitle: string
  category: string
  subCategory: string
  coverImage: string
  images: string[]
  description: string
  moq: number
  unit: string
  priceTiers: Array<{ minQty: number; maxQty?: number; price: number }>
  weight: number
  volumeL: number
  volumeW: number
  volumeH: number
  isInWarehouse: boolean
  warehouseStock: number
  skus: Array<{
    skuName: string
    attributes: Array<{ key: string; value: string }>
    price: number
    stock: number
    image: string
  }>
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState('')

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/merchant/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          const p = data.product
          setProduct({
            id: p.id,
            title: p.title || '',
            subtitle: p.subtitle || '',
            category: p.category || '',
            subCategory: p.subCategory || '',
            coverImage: p.coverImage || '',
            images: p.images || [],
            description: p.description || '',
            moq: p.moq || 1,
            unit: p.unit || '个',
            priceTiers: p.priceTiers || [],
            weight: p.weight || 0,
            volumeL: p.volumeL || 0,
            volumeW: p.volumeW || 0,
            volumeH: p.volumeH || 0,
            isInWarehouse: p.isInWarehouse || false,
            warehouseStock: p.warehouseStock || 0,
            skus: p.skus || [],
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">商品不存在或无权访问</p>
      </div>
    )
  }

  return <ProductForm initialData={product} />
}
