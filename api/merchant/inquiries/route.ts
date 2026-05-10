import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

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

    const inquiries = await db.inquiry.findMany({
      where,
      include: {
        buyer: { select: { id: true, nickname: true, phone: true, avatarUrl: true } },
        product: { select: { id: true, title: true, coverImage: true, category: true, priceTiers: true, moq: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error('Inquiries API error:', error)
    return NextResponse.json({ error: '获取询盘列表失败' }, { status: 500 })
  }
}
