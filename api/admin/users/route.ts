import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const role = searchParams.get('role') || ''
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (status) where.status = status
  if (search) {
    where.OR = [
      { phone: { contains: search } },
      { nickname: { contains: search } },
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true, phone: true, nickname: true, role: true, status: true,
        avatarUrl: true, createdAt: true,
        merchant: { select: { id: true, shopName: true, verifyStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
  ])

  return NextResponse.json({ data: users, total, page, pageSize })
}
