import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { id } = await params

    const message = await db.message.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Message PUT error:', error)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
