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
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const where: Record<string, unknown> = {}
  if (status) where.verifyStatus = status
  if (search) {
    where.OR = [
      { shopName: { contains: search } },
      { companyName: { contains: search } },
      { contactName: { contains: search } },
      { contactPhone: { contains: search } },
    ]
  }

  const [merchants, total] = await Promise.all([
    db.merchant.findMany({
      where,
      include: {
        user: { select: { id: true, phone: true, nickname: true, status: true } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.merchant.count({ where }),
  ])

  const data = merchants.map((m) => ({
    ...m,
    mainCategories: parseJSON<string[]>(m.mainCategories, []),
    factoryImages: parseJSON<string[]>(m.factoryImages, []),
  }))

  return NextResponse.json({ data, total, page, pageSize })
}
