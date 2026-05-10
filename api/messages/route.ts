import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const isRead = searchParams.get('isRead')

    const where: Record<string, unknown> = { userId: user.id }

    if (type) {
      where.type = type
    }

    if (isRead !== null && isRead !== '') {
      where.isRead = isRead === 'true'
    }

    const messages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const unreadCount = await db.message.count({
      where: { userId: user.id, isRead: false },
    })

    return NextResponse.json({ messages, unreadCount })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ error: '获取消息列表失败' }, { status: 500 })
  }
}
