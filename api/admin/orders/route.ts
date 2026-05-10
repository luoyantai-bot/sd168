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
  const search = searchParams.get('search') || ''
  const merchantId = searchParams.get('merchantId') || ''
  const buyerId = searchParams.get('buyerId') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (merchantId) where.merchantId = merchantId
  if (buyerId) where.buyerId = buyerId
  if (search) where.orderNo = { contains: search }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59')
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        buyer: { select: { id: true, phone: true, nickname: true } },
        merchant: { select: { id: true, shopName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where }),
  ])

  const data = orders.map((o) => ({
    ...o,
    items: parseJSON(o.items, []),
  }))

  return NextResponse.json({ data, total, page, pageSize })
}
