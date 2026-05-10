import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const banners = await db.banner.findMany({
      where: { isEnabled: true },
      orderBy: { sort: 'asc' },
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Banners API error:', error)
    return NextResponse.json({ error: '获取轮播图失败' }, { status: 500 })
  }
}
