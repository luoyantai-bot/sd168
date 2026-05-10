import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}

    if (user.role === 'buyer') {
      where.buyerId = user.id
    } else if (user.role === 'merchant') {
      const merchant = await db.merchant.findUnique({ where: { userId: user.id } })
      if (merchant) {
        where.merchantId = merchant.id
      }
    }

    if (status) {
      where.status = status
    }

    const inquiries = await db.inquiry.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            category: true,
            unit: true,
            weight: true,
            priceTiers: true,
          },
        },
        merchant: {
          select: {
            id: true,
            shopName: true,
            shopLogo: true,
          },
        },
        buyer: {
          select: {
            id: true,
            nickname: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error('Inquiries GET error:', error)
    return NextResponse.json({ error: '获取询盘列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, merchantId, skuId, quantity, message, needSample, expectedDate } = body

    if (!productId || !merchantId || !quantity) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const inquiry = await db.inquiry.create({
      data: {
        buyerId: user.id,
        merchantId,
        productId,
        skuId: skuId || null,
        quantity: parseInt(quantity),
        message: message || '',
        needSample: needSample || false,
        expectedDate: expectedDate || null,
      },
      include: {
        product: { select: { id: true, title: true } },
        merchant: { select: { id: true, shopName: true } },
      },
    })

    // Increment inquiry count
    await db.product.update({
      where: { id: productId },
      data: { inquiryCount: { increment: 1 } },
    })

    // Create message for merchant
    const merchant = await db.merchant.findUnique({ where: { id: merchantId } })
    if (merchant) {
      await db.message.create({
        data: {
          userId: merchant.userId,
          title: '收到新的询盘',
          content: `买家对您的商品"${inquiry.product.title}"发起了询盘，数量：${quantity}`,
          type: 'inquiry',
          linkUrl: `/merchant/inquiries`,
        },
      })
    }

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Inquiry POST error:', error)
    return NextResponse.json({ error: '创建询盘失败' }, { status: 500 })
  }
}
