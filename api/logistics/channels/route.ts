import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseJSON } from '@/lib/utils'

export async function GET() {
  try {
    const channels = await db.logisticsChannel.findMany({
      where: { isEnabled: true },
      orderBy: { name: 'asc' },
    })

    const enriched = channels.map((ch) => ({
      ...ch,
      destinationCountries: parseJSON<string[]>(ch.destinationCountries, []),
    }))

    return NextResponse.json({ channels: enriched })
  } catch (error) {
    console.error('Logistics channels error:', error)
    return NextResponse.json({ error: '获取物流渠道失败' }, { status: 500 })
  }
}
