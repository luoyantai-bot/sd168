import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { id } = await params
  const merchant = await db.merchant.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, phone: true, nickname: true, status: true, createdAt: true } },
      products: { select: { id: true, title: true, status: true, coverImage: true, category: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
      orders: { select: { id: true, orderNo: true, totalAmount: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { products: true, orders: true } },
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
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, verifyNote, commissionRate, isWarehouseEnabled } = body

  const merchant = await db.merchant.findUnique({ where: { id } })
  if (!merchant) {
    return NextResponse.json({ error: '商家不存在' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}

  if (action === 'approve') {
    updateData.verifyStatus = 'approved'
    updateData.verifyNote = verifyNote || ''
  } else if (action === 'reject') {
    updateData.verifyStatus = 'rejected'
    updateData.verifyNote = verifyNote || '审核未通过'
  }

  if (commissionRate !== undefined) updateData.commissionRate = commissionRate
  if (isWarehouseEnabled !== undefined) updateData.isWarehouseEnabled = isWarehouseEnabled

  const updated = await db.merchant.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(updated)
}
