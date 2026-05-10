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
  const product = await db.product.findUnique({
    where: { id },
    include: {
      merchant: { select: { id: true, shopName: true, contactName: true, contactPhone: true, verifyStatus: true } },
    },
  })

  if (!product) {
    return NextResponse.json({ error: '商品不存在' }, { status: 404 })
  }

  return NextResponse.json({
    ...product,
    images: parseJSON<string[]>(product.images, []),
    priceTiers: parseJSON<{ minQty: number; price: number }[]>(product.priceTiers, []),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, rejectReason } = body

  const product = await db.product.findUnique({ where: { id } })
  if (!product) {
    return NextResponse.json({ error: '商品不存在' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (action === 'approve') {
    updateData.status = 'published'
    updateData.rejectReason = ''
  } else if (action === 'reject') {
    updateData.status = 'rejected'
    updateData.rejectReason = rejectReason || '审核未通过'
  } else if (action === 'offline') {
    updateData.status = 'offline'
  }

  const updated = await db.product.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(updated)
}
