import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        phone: true,
        nickname: true,
        avatarUrl: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: fullUser })
  } catch (error) {
    console.error('User GET error:', error)
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const { nickname, avatarUrl, password } = body

    const updateData: Record<string, unknown> = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
    if (password) updateData.password = password

    const updated = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        phone: true,
        nickname: true,
        avatarUrl: true,
        role: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('User PUT error:', error)
    return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 })
  }
}
