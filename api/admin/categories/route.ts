import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const categories = await db.category.findMany({
    orderBy: { sort: 'asc' },
    include: { children: true },
  })

  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const body = await req.json()
  const { name, slug, icon, parentId, sort } = body

  if (!name || !slug) {
    return NextResponse.json({ error: '名称和标识不能为空' }, { status: 400 })
  }

  const category = await db.category.create({
    data: {
      name,
      slug,
      icon: icon || '',
      parentId: parentId || null,
      sort: sort || 0,
    },
  })

  return NextResponse.json(category)
}
