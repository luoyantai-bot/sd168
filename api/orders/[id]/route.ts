import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON } from '@/lib/utils'

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

    const order = await db.order.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            shopName: true,
            shopLogo: true,
            contactName: true,
            contactPhone: true,
          },
        },
        warehouseRecords: true,
        logisticsOrders: true,
        settlement: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    const items = parseJSON(order.items, [])

    return NextResponse.json({ order: { ...order, parsedItems: items } })
  } catch (error) {
    console.error('Order detail error:', error)
    return NextResponse.json({ error: '获取订单详情失败' }, { status: 500 })
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
    const { action } = body

    const order = await db.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    if (action === 'pay') {
      updateData = {
        status: 'paid',
        paymentMethod: body.paymentMethod || 'wechat_pay',
        paymentTime: new Date(),
      }
    } else if (action === 'cancel') {
      updateData = { status: 'cancelled' }
    } else if (action === 'confirm_receive') {
      updateData = { status: 'delivered' }
    }

    const updated = await db.order.update({
      where: { id },
      data: updateData,
    })

    // Create message
    if (action === 'pay') {
      const merchant = await db.merchant.findUnique({ where: { id: order.merchantId } })
      if (merchant) {
        await db.message.create({
          data: {
            userId: merchant.userId,
            title: '订单已付款',
            content: `订单 ${order.orderNo} 已付款，金额：¥${order.totalAmount}`,
            type: 'order',
            linkUrl: `/merchant/orders`,
          },
        })
      }
    }

    return NextResponse.json({ order: updated })
  } catch (error) {
    console.error('Order PUT error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
