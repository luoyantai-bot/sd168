import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { productId } = await params

    await db.favorite.deleteMany({
      where: { userId: user.id, productId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Favorites DELETE error:', error)
    return NextResponse.json({ error: '取消收藏失败' }, { status: 500 })
  }
}
