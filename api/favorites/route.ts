import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON } from '@/lib/utils'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            merchant: {
              select: {
                id: true,
                shopName: true,
                shopLogo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enriched = favorites.map((f) => {
      const priceTiers = parseJSON<Array<{ minQty: number; maxQty?: number; price: number }>>(
        f.product.priceTiers,
        []
      )
      const images = parseJSON<string[]>(f.product.images, [])
      let minPrice: number | null = null
      let maxPrice: number | null = null

      if (priceTiers.length > 0) {
        const prices = priceTiers.map((t) => t.price)
        minPrice = Math.min(...prices)
        maxPrice = Math.max(...prices)
      }

      return {
        ...f,
        product: {
          ...f.product,
          images,
          priceTiers,
          parsedMinPrice: minPrice,
          parsedMaxPrice: maxPrice,
        },
      }
    })

    return NextResponse.json({ favorites: enriched })
  } catch (error) {
    console.error('Favorites GET error:', error)
    return NextResponse.json({ error: '获取收藏列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, note } = body

    if (!productId) {
      return NextResponse.json({ error: '商品ID不能为空' }, { status: 400 })
    }

    const existing = await db.favorite.findUnique({
      where: {
        userId_productId: { userId: user.id, productId },
      },
    })

    if (existing) {
      return NextResponse.json({ error: '已收藏该商品' }, { status: 400 })
    }

    const favorite = await db.favorite.create({
      data: {
        userId: user.id,
        productId,
        note: note || '',
      },
    })

    return NextResponse.json({ favorite })
  } catch (error) {
    console.error('Favorites POST error:', error)
    return NextResponse.json({ error: '收藏失败' }, { status: 500 })
  }
}
