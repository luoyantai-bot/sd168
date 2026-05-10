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
  const { status } = body

  const user = await db.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  if (user.id === session.id) {
    return NextResponse.json({ error: '不能修改自己的状态' }, { status: 400 })
  }

  const updated = await db.user.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ id: updated.id, status: updated.status })
}
