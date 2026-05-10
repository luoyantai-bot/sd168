import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { id } = await params
  const logisticsOrder = await db.logisticsOrder.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true, orderNo: true,
          buyer: { select: { id: true, nickname: true, phone: true } },
          merchant: { select: { id: true, shopName: true } },
          receiverName: true, receiverPhone: true, receiverAddress: true, receiverCountry: true,
          items: true, totalAmount: true,
        },
      },
    },
  })

  if (!logisticsOrder) {
    return NextResponse.json({ error: '物流订单不存在' }, { status: 404 })
  }

  return NextResponse.json({
    ...logisticsOrder,
    statusTimeline: parseJSON(logisticsOrder.statusTimeline, []),
    order: {
      ...logisticsOrder.order,
      items: parseJSON(logisticsOrder.order.items, []),
    },
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { status, note, trackingNo } = body

  const logisticsOrder = await db.logisticsOrder.findUnique({ where: { id } })
  if (!logisticsOrder) {
    return NextResponse.json({ error: '物流订单不存在' }, { status: 404 })
  }

  const timeline = parseJSON<{ status: string; time: string; note: string }[]>(logisticsOrder.statusTimeline, [])
  if (status) {
    timeline.push({ status, time: new Date().toISOString(), note: note || '' })
  }

  const updateData: Record<string, unknown> = {
    statusTimeline: JSON.stringify(timeline),
  }
  if (status) updateData.status = status
  if (trackingNo !== undefined) updateData.trackingNo = trackingNo

  const updated = await db.logisticsOrder.update({
    where: { id },
    data: updateData,
  })

  // Also update the main order status if relevant
  if (status === 'delivered') {
    await db.order.update({
      where: { id: logisticsOrder.orderId },
      data: { status: 'delivered' },
    })
  } else if (status === 'in_transit') {
    const order = await db.order.findUnique({ where: { id: logisticsOrder.orderId } })
    if (order && order.status === 'dispatched') {
      await db.order.update({
        where: { id: logisticsOrder.orderId },
        data: { status: 'in_transit' },
      })
    }
  }

  return NextResponse.json(updated)
}
