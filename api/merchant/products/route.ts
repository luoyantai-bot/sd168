import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const merchant = await db.merchant.findUnique({ where: { userId: session.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const keyword = searchParams.get('keyword') || ''

    const where: Record<string, unknown> = { merchantId: merchant.id }
    if (status) where.status = status
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { subtitle: { contains: keyword } },
      ]
    }

    const products = await db.product.findMany({
      where,
      include: { skus: true },
      orderBy: { createdAt: 'desc' },
    })

    const enriched = products.map((p) => {
      const priceTiers = parseJSON<Array<{ minQty: number; maxQty?: number; price: number }>>(p.priceTiers, [])
      const images = parseJSON<string[]>(p.images, [])
      let minPrice: number | null = null
      let maxPrice: number | null = null
      if (priceTiers.length > 0) {
        const prices = priceTiers.map((t) => t.price)
        minPrice = Math.min(...prices)
        maxPrice = Math.max(...prices)
      }
      return { ...p, priceTiers, images, minPrice, maxPrice }
    })

    return NextResponse.json({ products: enriched })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json({ error: '获取商品列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const merchant = await db.merchant.findUnique({ where: { userId: session.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title, subtitle, category, subCategory, coverImage, images,
      description, moq, unit, priceTiers, weight, volumeL, volumeW, volumeH,
      isInWarehouse, warehouseStock, skus,
    } = body

    if (!title || !category) {
      return NextResponse.json({ error: '标题和分类为必填项' }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        merchantId: merchant.id,
        title,
        subtitle: subtitle || '',
        category,
        subCategory: subCategory || '',
        coverImage: coverImage || '',
        images: JSON.stringify(images || []),
        description: description || '',
        moq: moq || 1,
        unit: unit || '个',
        priceTiers: JSON.stringify(priceTiers || []),
        weight: weight || 0,
        volumeL: volumeL || 0,
        volumeW: volumeW || 0,
        volumeH: volumeH || 0,
        isInWarehouse: isInWarehouse || false,
        warehouseStock: warehouseStock || 0,
        status: 'draft',
      },
    })

    // Create SKUs if provided
    if (skus && skus.length > 0) {
      await db.productSku.createMany({
        data: skus.map((sku: { skuName: string; attributes: Array<{ key: string; value: string }>; price: number; stock: number; image?: string }) => ({
          productId: product.id,
          skuName: sku.skuName,
          attributes: JSON.stringify(sku.attributes || []),
          price: sku.price,
          stock: sku.stock || 0,
          image: sku.image || '',
        })),
      })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: '创建商品失败' }, { status: 500 })
  }
}
