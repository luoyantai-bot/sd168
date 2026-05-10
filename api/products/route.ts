import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseJSON } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || 'published'
    const sort = searchParams.get('sort') || 'latest'
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = parseInt(searchParams.get('offset') || '0')
    const merchantId = searchParams.get('merchantId') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const moqMax = searchParams.get('moqMax')
    const hasStock = searchParams.get('hasStock') === 'true'

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { subtitle: { contains: q } },
        { description: { contains: q } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (merchantId) {
      where.merchantId = merchantId
    }

    if (hasStock) {
      where.isInWarehouse = true
      where.warehouseStock = { gt: 0 }
    }

    if (moqMax) {
      where.moq = { lte: parseInt(moqMax) }
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (sort === 'latest') orderBy = { createdAt: 'desc' }
    else if (sort === 'price_asc' || sort === 'price_low') orderBy = { createdAt: 'desc' }
    else if (sort === 'price_desc' || sort === 'price_high') orderBy = { createdAt: 'desc' }
    else if (sort === 'popular') orderBy = { viewCount: 'desc' }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              shopName: true,
              shopLogo: true,
              mainCategories: true,
              verifyStatus: true,
            },
          },
          skus: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.product.count({ where }),
    ])

    const enrichedProducts = products.map((p) => {
      const priceTiers = parseJSON<Array<{ minQty: number; maxQty?: number; price: number }>>(
        p.priceTiers,
        []
      )
      const images = parseJSON<string[]>(p.images, [])
      let minPriceVal: number | null = null
      let maxPriceVal: number | null = null

      if (priceTiers.length > 0) {
        const prices = priceTiers.map((t) => t.price)
        minPriceVal = Math.min(...prices)
        maxPriceVal = Math.max(...prices)
      }

      return {
        ...p,
        images,
        priceTiers,
        parsedMinPrice: minPriceVal,
        parsedMaxPrice: maxPriceVal,
      }
    })

    // Price filtering on parsed data
    let filtered = enrichedProducts
    if (minPrice || maxPrice) {
      filtered = filtered.filter((p) => {
        if (p.parsedMinPrice === null) return false
        if (minPrice && p.parsedMinPrice < parseFloat(minPrice)) return false
        if (maxPrice && p.parsedMinPrice > parseFloat(maxPrice)) return false
        return true
      })
    }

    // Sort by price on parsed data
    if (sort === 'price_asc' || sort === 'price_low') {
      filtered.sort((a, b) => (a.parsedMinPrice || 0) - (b.parsedMinPrice || 0))
    } else if (sort === 'price_desc' || sort === 'price_high') {
      filtered.sort((a, b) => (b.parsedMinPrice || 0) - (a.parsedMinPrice || 0))
    }

    return NextResponse.json({
      products: filtered,
      total: filtered.length !== enrichedProducts.length ? filtered.length : total,
    })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json({ error: '获取商品列表失败' }, { status: 500 })
  }
}
