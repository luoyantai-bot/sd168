import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const merchant = await db.merchant.findUnique({ where: { userId: session.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = { merchantId: merchant.id }
    if (status) where.status = status

    const orders = await db.order.findMany({
      where,
      include: {
        buyer: { select: { id: true, nickname: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enriched = orders.map((o) => ({
      ...o,
      items: parseJSON<Array<{ productId: string; title: string; quantity: number; price: number; unit: string }>>(o.items, []),
    }))

    return NextResponse.json({ orders: enriched })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json({ error: '获取订单列表失败' }, { status: 500 })
  }
}
