import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { generateOrderNo } from '@/lib/utils'

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

    const orders = await db.order.findMany({
      where,
      include: {
        merchant: {
          select: {
            id: true,
            shopName: true,
            shopLogo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: '获取订单列表失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const {
      inquiryId,
      merchantId,
      items,
      subtotal,
      logisticsFee,
      labelFee,
      totalAmount,
      commissionAmount,
      usePlatformLogistics,
      logisticsOption,
      receiverName,
      receiverPhone,
      receiverAddress,
      receiverCountry,
      needWarehouse,
      needLabel,
      labelContent,
    } = body

    if (!merchantId || !items || !totalAmount) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const order = await db.order.create({
      data: {
        orderNo: generateOrderNo(),
        buyerId: user.id,
        merchantId,
        inquiryId: inquiryId || null,
        items: JSON.stringify(items),
        subtotal: parseFloat(subtotal) || 0,
        logisticsFee: parseFloat(logisticsFee) || 0,
        labelFee: parseFloat(labelFee) || 0,
        totalAmount: parseFloat(totalAmount) || 0,
        commissionAmount: parseFloat(commissionAmount) || 0,
        usePlatformLogistics: usePlatformLogistics || false,
        logisticsOption: logisticsOption || '',
        receiverName: receiverName || '',
        receiverPhone: receiverPhone || '',
        receiverAddress: receiverAddress || '',
        receiverCountry: receiverCountry || '',
        needWarehouse: needWarehouse || false,
        needLabel: needLabel || false,
        labelContent: labelContent || '',
        status: 'pending_payment',
      },
    })

    // Update inquiry status if from inquiry
    if (inquiryId) {
      await db.inquiry.update({
        where: { id: inquiryId },
        data: { status: 'converted' },
      })
    }

    // Create message for merchant
    await db.message.create({
      data: {
        userId: (await db.merchant.findUnique({ where: { id: merchantId } }))!.userId,
        title: '收到新订单',
        content: `收到新订单 ${order.orderNo}，金额：¥${totalAmount}`,
        type: 'order',
        linkUrl: `/merchant/orders`,
      },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order POST error:', error)
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 })
  }
}
