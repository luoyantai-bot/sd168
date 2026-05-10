import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON } from '@/lib/utils'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { id } = await params
    const merchant = await db.merchant.findUnique({ where: { userId: session.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    const product = await db.product.findFirst({
      where: { id, merchantId: merchant.id },
      include: { skus: true },
    })

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    const priceTiers = parseJSON<Array<{ minQty: number; maxQty?: number; price: number }>>(product.priceTiers, [])
    const images = parseJSON<string[]>(product.images, [])
    const enriched = {
      ...product,
      priceTiers,
      images,
      skus: product.skus.map((sku) => ({
        ...sku,
        attributes: parseJSON<Array<{ key: string; value: string }>>(sku.attributes, []),
      })),
    }

    return NextResponse.json({ product: enriched })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ error: '获取商品详情失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { id } = await params
    const merchant = await db.merchant.findUnique({ where: { userId: session.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    const existing = await db.product.findFirst({ where: { id, merchantId: merchant.id } })
    if (!existing) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title, subtitle, category, subCategory, coverImage, images,
      description, moq, unit, priceTiers, weight, volumeL, volumeW, volumeH,
      isInWarehouse, warehouseStock, status, skus,
    } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (subtitle !== undefined) updateData.subtitle = subtitle
    if (category !== undefined) updateData.category = category
    if (subCategory !== undefined) updateData.subCategory = subCategory
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (images !== undefined) updateData.images = JSON.stringify(images)
    if (description !== undefined) updateData.description = description
    if (moq !== undefined) updateData.moq = moq
    if (unit !== undefined) updateData.unit = unit
    if (priceTiers !== undefined) updateData.priceTiers = JSON.stringify(priceTiers)
    if (weight !== undefined) updateData.weight = weight
    if (volumeL !== undefined) updateData.volumeL = volumeL
    if (volumeW !== undefined) updateData.volumeW = volumeW
    if (volumeH !== undefined) updateData.volumeH = volumeH
    if (isInWarehouse !== undefined) updateData.isInWarehouse = isInWarehouse
    if (warehouseStock !== undefined) updateData.warehouseStock = warehouseStock
    if (status !== undefined) {
      // Only allow certain status transitions
      if (['draft', 'published', 'offline'].includes(status)) {
        updateData.status = status
      }
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
    })

    // Update SKUs if provided
    if (skus !== undefined) {
      // Delete existing SKUs and recreate
      await db.productSku.deleteMany({ where: { productId: id } })
      if (skus.length > 0) {
        await db.productSku.createMany({
          data: skus.map((sku: { skuName: string; attributes: Array<{ key: string; value: string }>; price: number; stock: number; image?: string }) => ({
            productId: id,
            skuName: sku.skuName,
            attributes: JSON.stringify(sku.attributes || []),
            price: sku.price,
            stock: sku.stock || 0,
            image: sku.image || '',
          })),
        })
      }
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: '更新商品失败' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { id } = await params
    const merchant = await db.merchant.findUnique({ where: { userId: session.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    const product = await db.product.findFirst({
      where: { id, merchantId: merchant.id },
    })

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    if (!['draft', 'offline'].includes(product.status)) {
      return NextResponse.json({ error: '只能删除草稿或已下架的商品' }, { status: 400 })
    }

    await db.productSku.deleteMany({ where: { productId: id } })
    await db.product.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: '删除商品失败' }, { status: 500 })
  }
}
