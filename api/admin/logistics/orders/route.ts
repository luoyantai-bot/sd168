import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const [orders, total] = await Promise.all([
    db.logisticsOrder.findMany({
      where,
      include: {
        order: {
          select: {
            id: true, orderNo: true,
            buyer: { select: { id: true, nickname: true, phone: true } },
            merchant: { select: { id: true, shopName: true } },
            receiverName: true, receiverCountry: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.logisticsOrder.count({ where }),
  ])

  const data = orders.map((lo) => ({
    ...lo,
    statusTimeline: parseJSON(lo.statusTimeline, []),
  }))

  // Dashboard stats
  const [pickedUp, inTransit, delivered] = await Promise.all([
    db.logisticsOrder.count({ where: { status: 'picked_up' } }),
    db.logisticsOrder.count({ where: { status: 'in_transit' } }),
    db.logisticsOrder.count({ where: { status: 'delivered' } }),
  ])

  return NextResponse.json({ data, total, page, pageSize, stats: { pickedUp, inTransit, delivered } })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const body = await req.json()
  const { orderId, logisticsChannel, destination, weight, volumeWeight, chargeWeight, freight, trackingNo } = body

  if (!orderId) {
    return NextResponse.json({ error: '订单ID不能为空' }, { status: 400 })
  }

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  const statusTimeline = JSON.stringify([
    { status: 'created', time: new Date().toISOString(), note: '物流订单创建' },
  ])

  const logisticsOrder = await db.logisticsOrder.create({
    data: {
      orderId,
      trackingNo: trackingNo || '',
      logisticsChannel: logisticsChannel || '',
      destination: destination || order.receiverCountry || '',
      weight: weight || 0,
      volumeWeight: volumeWeight || 0,
      chargeWeight: chargeWeight || 0,
      freight: freight || 0,
      status: 'created',
      statusTimeline,
    },
  })

  return NextResponse.json(logisticsOrder)
}
