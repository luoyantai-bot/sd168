import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, adminNote } = body

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
