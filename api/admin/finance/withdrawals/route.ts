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

  const [withdrawals, total] = await Promise.all([
    db.withdrawal.findMany({
      where,
      include: {
        merchant: { select: { id: true, shopName: true, contactName: true, balance: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.withdrawal.count({ where }),
  ])

  const data = withdrawals.map((w) => ({
    ...w,
    bankInfo: parseJSON(w.bankInfo, {}),
  }))

  return NextResponse.json({ data, total, page, pageSize })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const body = await req.json()
  const { id, action, adminNote } = body

  const withdrawal = await db.withdrawal.findUnique({ where: { id } })
  if (!withdrawal) {
    return NextResponse.json({ error: '提现记录不存在' }, { status: 404 })
  }

  if (action === 'approve') {
    await db.$transaction([
      db.withdrawal.update({
        where: { id },
        data: { status: 'completed', adminNote: adminNote || '已通过' },
      }),
      db.merchant.update({
        where: { id: withdrawal.merchantId },
        data: { balance: { decrement: withdrawal.amount } },
      }),
    ])
  } else if (action === 'reject') {
    await db.withdrawal.update({
      where: { id },
      data: { status: 'rejected', adminNote: adminNote || '已拒绝' },
    })
  }

  return NextResponse.json({ success: true })
}
