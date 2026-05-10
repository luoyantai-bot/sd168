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
  const order = await db.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, phone: true, nickname: true } },
      merchant: { select: { id: true, shopName: true, contactName: true, contactPhone: true } },
      warehouseRecords: true,
      logisticsOrders: true,
      settlement: true,
    },
  })

  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  return NextResponse.json({
    ...order,
    items: parseJSON(order.items, []),
    logisticsOrders: order.logisticsOrders.map((lo) => ({
      ...lo,
      statusTimeline: parseJSON(lo.statusTimeline, []),
    })),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { status } = body

  const order = await db.order.findUnique({ where: { id } })
  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  const updated = await db.order.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(updated)
}
