import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON, generateOrderNo } from '@/lib/utils'

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

    const inquiry = await db.inquiry.findFirst({
      where: { id, merchantId: merchant.id },
      include: {
        buyer: { select: { id: true, nickname: true, phone: true, avatarUrl: true } },
        product: { select: { id: true, title: true, coverImage: true, category: true, priceTiers: true, moq: true, unit: true, description: true, images: true } },
      },
    })

    if (!inquiry) {
      return NextResponse.json({ error: '询盘不存在' }, { status: 404 })
    }

    const enriched = {
      ...inquiry,
      product: {
        ...inquiry.product,
        priceTiers: parseJSON<Array<{ minQty: number; maxQty?: number; price: number }>>(inquiry.product.priceTiers, []),
        images: parseJSON<string[]>(inquiry.product.images, []),
      },
    }

    return NextResponse.json({ inquiry: enriched })
  } catch (error) {
    console.error('Get inquiry error:', error)
    return NextResponse.json({ error: '获取询盘详情失败' }, { status: 500 })
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

    const existing = await db.inquiry.findFirst({
      where: { id, merchantId: merchant.id },
    })
    if (!existing) {
      return NextResponse.json({ error: '询盘不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { action, replyMessage, quotedPrice } = body

    if (action === 'reply') {
      if (!replyMessage) {
        return NextResponse.json({ error: '回复内容不能为空' }, { status: 400 })
      }
      const inquiry = await db.inquiry.update({
        where: { id },
        data: {
          replyMessage,
          quotedPrice: quotedPrice || null,
          status: 'replied',
          repliedAt: new Date(),
        },
      })
      return NextResponse.json({ inquiry })
    }

    if (action === 'convert') {
      // Convert inquiry to order
      const product = await db.product.findUnique({ where: { id: existing.productId } })
      if (!product) {
        return NextResponse.json({ error: '商品不存在' }, { status: 400 })
      }

      const price = quotedPrice || existing.quotedPrice || 0
      const quantity = existing.quantity
      const subtotal = price * quantity
      const commissionRate = merchant.commissionRate
      const commissionAmount = subtotal * commissionRate

      const order = await db.order.create({
        data: {
          orderNo: generateOrderNo(),
          buyerId: existing.buyerId,
          merchantId: merchant.id,
          inquiryId: existing.id,
          items: JSON.stringify([
            {
              productId: product.id,
              title: product.title,
              quantity,
              price,
              unit: product.unit,
            },
          ]),
          subtotal,
          logisticsFee: 0,
          labelFee: 0,
          totalAmount: subtotal,
          commissionAmount,
          status: 'pending_payment',
        },
      })

      await db.inquiry.update({
        where: { id },
        data: { status: 'converted' },
      })

      return NextResponse.json({ order, inquiry: { ...existing, status: 'converted' } })
    }

    if (action === 'close') {
      const inquiry = await db.inquiry.update({
        where: { id },
        data: { status: 'closed' },
      })
      return NextResponse.json({ inquiry })
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 })
  } catch (error) {
    console.error('Update inquiry error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
