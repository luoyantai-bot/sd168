import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseJSON } from '@/lib/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Increment view count
    await db.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    const product = await db.product.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            shopName: true,
            shopLogo: true,
            mainCategories: true,
            description: true,
            verifyStatus: true,
            address: true,
          },
        },
        skus: true,
        favorites: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    const priceTiers = parseJSON<Array<{ minQty: number; maxQty?: number; price: number }>>(
      product.priceTiers,
      []
    )
    const images = parseJSON<string[]>(product.images, [])

    return NextResponse.json({
      ...product,
      images,
      priceTiers,
    })
  } catch (error) {
    console.error('Product detail API error:', error)
    return NextResponse.json({ error: '获取商品详情失败' }, { status: 500 })
  }
}
