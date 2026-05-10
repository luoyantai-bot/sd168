import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') || ''
  const merchantId = searchParams.get('merchantId') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (merchantId) where.merchantId = merchantId

  const [settlements, total] = await Promise.all([
    db.settlement.findMany({
      where,
      include: {
        order: { select: { orderNo: true } },
        merchant: { select: { id: true, shopName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.settlement.count({ where }),
  ])

  return NextResponse.json({ data: settlements, total, page, pageSize })
}
