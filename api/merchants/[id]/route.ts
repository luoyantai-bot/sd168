import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseJSON } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const merchant = await db.merchant.findUnique({
      where: { id },
      select: {
        id: true,
        shopName: true,
        shopLogo: true,
        mainCategories: true,
        description: true,
        address: true,
        verifyStatus: true,
        factoryImages: true,
        createdAt: true,
        _count: {
          select: { products: true },
        },
      },
    })

    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    return NextResponse.json({
      ...merchant,
      mainCategories: parseJSON<string[]>(merchant.mainCategories, []),
      factoryImages: parseJSON<string[]>(merchant.factoryImages, []),
    })
  } catch (error) {
    console.error('Merchant API error:', error)
    return NextResponse.json({ error: '获取商家信息失败' }, { status: 500 })
  }
}
