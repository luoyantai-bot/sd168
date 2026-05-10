import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const banners = await db.banner.findMany({
    orderBy: { sort: 'asc' },
  })

  return NextResponse.json(banners)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const body = await req.json()
  const { imageUrl, linkUrl, sort, isEnabled } = body

  if (!imageUrl) {
    return NextResponse.json({ error: '图片地址不能为空' }, { status: 400 })
  }

  const banner = await db.banner.create({
    data: {
      imageUrl,
      linkUrl: linkUrl || '',
      sort: sort || 0,
      isEnabled: isEnabled !== undefined ? isEnabled : true,
    },
  })

  return NextResponse.json(banner)
}
