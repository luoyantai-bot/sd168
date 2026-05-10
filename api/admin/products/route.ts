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
  const category = searchParams.get('category') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (category) where.category = category
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { subtitle: { contains: search } },
    ]
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        merchant: { select: { id: true, shopName: true, verifyStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ])

  const data = products.map((p) => ({
    ...p,
    images: parseJSON<string[]>(p.images, []),
    priceTiers: parseJSON<{ minQty: number; price: number }[]>(p.priceTiers, []),
  }))

  return NextResponse.json({ data, total, page, pageSize })
}
