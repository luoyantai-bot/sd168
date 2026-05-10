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

    const order = await db.order.findFirst({
      where: { id, merchantId: merchant.id },
      include: {
        buyer: { select: { id: true, nickname: true, phone: true, avatarUrl: true } },
        logisticsOrders: true,
        settlement: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    const enriched = {
      ...order,
      items: parseJSON<Array<{ productId: string; title: string; quantity: number; price: number; unit: string }>>(order.items, []),
      logisticsOrders: order.logisticsOrders.map((lo) => ({
        ...lo,
        statusTimeline: parseJSON<Array<{ status: string; time: string; desc: string }>>(lo.statusTimeline, []),
      })),
    }

    return NextResponse.json({ order: enriched })
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json({ error: '获取订单详情失败' }, { status: 500 })
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

    const existing = await db.order.findFirst({
      where: { id, merchantId: merchant.id },
    })
    if (!existing) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'confirm') {
      if (existing.status !== 'paid') {
        return NextResponse.json({ error: '只能确认已付款订单' }, { status: 400 })
      }
      const order = await db.order.update({
        where: { id },
        data: { status: 'in_warehouse' },
      })
      return NextResponse.json({ order })
    }

    if (action === 'dispatch') {
      if (!['in_warehouse', 'labeling'].includes(existing.status)) {
        return NextResponse.json({ error: '当前状态不能标记发货' }, { status: 400 })
      }
      const order = await db.order.update({
        where: { id },
        data: { status: 'dispatched' },
      })
      return NextResponse.json({ order })
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
