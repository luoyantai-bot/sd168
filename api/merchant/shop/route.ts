import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const merchant = await db.merchant.findUnique({ where: { userId: session.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    return NextResponse.json({ shop: merchant })
  } catch (error) {
    console.error('Shop API error:', error)
    return NextResponse.json({ error: '获取店铺信息失败' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const merchant = await db.merchant.findUnique({ where: { userId: session.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { shopName, shopLogo, contactName, contactPhone, description, mainCategories } = body

    const updateData: Record<string, unknown> = {}
    if (shopName !== undefined) updateData.shopName = shopName
    if (shopLogo !== undefined) updateData.shopLogo = shopLogo
    if (contactName !== undefined) updateData.contactName = contactName
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone
    if (description !== undefined) updateData.description = description
    if (mainCategories !== undefined) updateData.mainCategories = JSON.stringify(mainCategories)

    const updated = await db.merchant.update({
      where: { id: merchant.id },
      data: updateData,
    })

    return NextResponse.json({ shop: updated })
  } catch (error) {
    console.error('Update shop error:', error)
    return NextResponse.json({ error: '更新店铺信息失败' }, { status: 500 })
  }
}
