import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const channels = await db.logisticsChannel.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const data = channels.map((ch) => ({
    ...ch,
    destinationCountries: parseJSON<string[]>(ch.destinationCountries, []),
  }))

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const body = await req.json()
  const { name, carrier, deliveryDays, billingMethod, firstWeightPrice, additionalPrice, minWeight, destinationCountries, isEnabled } = body

  if (!name) {
    return NextResponse.json({ error: '渠道名称不能为空' }, { status: 400 })
  }

  const channel = await db.logisticsChannel.create({
    data: {
      name,
      carrier: carrier || '',
      deliveryDays: deliveryDays || '',
      billingMethod: billingMethod || 'weight',
      firstWeightPrice: firstWeightPrice || 0,
      additionalPrice: additionalPrice || 0,
      minWeight: minWeight || 0.5,
      destinationCountries: JSON.stringify(destinationCountries || []),
      isEnabled: isEnabled !== undefined ? isEnabled : true,
    },
  })

  return NextResponse.json(channel)
}
