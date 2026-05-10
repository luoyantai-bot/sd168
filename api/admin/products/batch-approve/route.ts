import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { productIds } = await req.json()
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return NextResponse.json({ error: '请选择商品' }, { status: 400 })
  }

  const result = await db.product.updateMany({
    where: {
      id: { in: productIds },
      status: 'draft',
    },
    data: {
      status: 'published',
      rejectReason: '',
    },
  })

  return NextResponse.json({ success: true, count: result.count })
}
