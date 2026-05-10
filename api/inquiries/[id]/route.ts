import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { id } = await params

    const inquiry = await db.inquiry.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            subtitle: true,
            coverImage: true,
            category: true,
            unit: true,
            weight: true,
            volumeL: true,
            volumeW: true,
            volumeH: true,
            priceTiers: true,
            moq: true,
          },
        },
        merchant: {
          select: {
            id: true,
            shopName: true,
            shopLogo: true,
            contactName: true,
            contactPhone: true,
          },
        },
        buyer: {
          select: {
            id: true,
            nickname: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!inquiry) {
      return NextResponse.json({ error: '询盘不存在' }, { status: 404 })
    }

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Inquiry detail error:', error)
    return NextResponse.json({ error: '获取询盘详情失败' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, replyMessage, quotedPrice } = body

    const inquiry = await db.inquiry.findUnique({ where: { id } })
    if (!inquiry) {
      return NextResponse.json({ error: '询盘不存在' }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    if (action === 'reply') {
      updateData = {
        replyMessage: replyMessage || '',
        quotedPrice: quotedPrice ? parseFloat(quotedPrice) : null,
        status: 'replied',
        repliedAt: new Date(),
      }
    } else if (action === 'close') {
      updateData = { status: 'closed' }
    } else if (action === 'convert') {
      updateData = { status: 'converted' }
    } else if (action === 'buyer_reply') {
      updateData = {
        replyMessage: replyMessage || inquiry.replyMessage,
        status: 'pending',
      }
    }

    const updated = await db.inquiry.update({
      where: { id },
      data: updateData,
    })

    // Create message for the other party
    if (action === 'reply') {
      const buyer = await db.user.findUnique({ where: { id: inquiry.buyerId } })
      if (buyer) {
        await db.message.create({
          data: {
            userId: buyer.id,
            title: '询盘已回复',
            content: `商家已回复您的询盘，报价：¥${quotedPrice || '未报价'}`,
            type: 'inquiry',
            linkUrl: `/buyer/inquiries/${id}`,
          },
        })
      }
    } else if (action === 'buyer_reply') {
      const merchant = await db.merchant.findUnique({ where: { id: inquiry.merchantId } })
      if (merchant) {
        await db.message.create({
          data: {
            userId: merchant.userId,
            title: '买家继续沟通',
            content: `买家对询盘有新的回复`,
            type: 'inquiry',
            linkUrl: `/merchant/inquiries`,
          },
        })
      }
    }

    return NextResponse.json({ inquiry: updated })
  } catch (error) {
    console.error('Inquiry PUT error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
