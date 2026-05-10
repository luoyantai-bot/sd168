import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const configs = await db.platformConfig.findMany()
  const configMap: Record<string, string> = {}
  for (const c of configs) {
    configMap[c.key] = c.value
  }

  return NextResponse.json(configMap)
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const body = await req.json()

  const updates = Object.entries(body).map(([key, value]) =>
    db.platformConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  )

  await Promise.all(updates)
  return NextResponse.json({ success: true })
}
