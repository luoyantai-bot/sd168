import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const tab = searchParams.get('tab') || 'stats'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  if (tab === 'stats') {
    const [pendingInbound, pendingLabel, pendingOutbound] = await Promise.all([
      db.order.count({ where: { status: 'paid', needWarehouse: true } }),
      db.order.count({ where: { status: 'in_warehouse', needLabel: true } }),
      db.order.count({ where: { status: 'labeling' } }),
    ])

    return NextResponse.json({ pendingInbound, pendingLabel, pendingOutbound })
  }

  const where: Record<string, unknown> = {}
  if (tab === 'pending_inbound') {
    where.status = 'paid'
    where.needWarehouse = true
  } else if (tab === 'pending_label') {
    where.status = 'in_warehouse'
    where.needLabel = true
  } else if (tab === 'pending_outbound') {
    where.status = 'labeling'
  } else if (tab === 'stock') {
    where.isInWarehouse = true
    where.warehouseStock = { gt: 0 }
  }

  if (tab === 'stock') {
    const [products, total] = await Promise.all([
      db.product.findMany({
        where: where as Parameters<typeof db.product.findMany>[0]['where'],
        include: {
          merchant: { select: { id: true, shopName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.product.count({ where: where as Parameters<typeof db.product.count>[0]['where'] }),
    ])
    return NextResponse.json({ data: products, total, page, pageSize })
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: where as Parameters<typeof db.order.findMany>[0]['where'],
      include: {
        buyer: { select: { id: true, nickname: true, phone: true } },
        merchant: { select: { id: true, shopName: true } },
        warehouseRecords: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where: where as Parameters<typeof db.order.count>[0]['where'] }),
  ])

  return NextResponse.json({ data: orders, total, page, pageSize })
}
