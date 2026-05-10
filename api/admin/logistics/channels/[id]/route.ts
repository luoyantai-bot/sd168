import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const channel = await db.logisticsChannel.findUnique({ where: { id } })
  if (!channel) {
    return NextResponse.json({ error: '渠道不存在' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.carrier !== undefined) updateData.carrier = body.carrier
  if (body.deliveryDays !== undefined) updateData.deliveryDays = body.deliveryDays
  if (body.billingMethod !== undefined) updateData.billingMethod = body.billingMethod
  if (body.firstWeightPrice !== undefined) updateData.firstWeightPrice = body.firstWeightPrice
  if (body.additionalPrice !== undefined) updateData.additionalPrice = body.additionalPrice
  if (body.minWeight !== undefined) updateData.minWeight = body.minWeight
  if (body.destinationCountries !== undefined) updateData.destinationCountries = JSON.stringify(body.destinationCountries)
  if (body.isEnabled !== undefined) updateData.isEnabled = body.isEnabled

  const updated = await db.logisticsChannel.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { id } = await params
  await db.logisticsChannel.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
