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

  const banner = await db.banner.findUnique({ where: { id } })
  if (!banner) {
    return NextResponse.json({ error: 'Banner不存在' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
  if (body.linkUrl !== undefined) updateData.linkUrl = body.linkUrl
  if (body.sort !== undefined) updateData.sort = body.sort
  if (body.isEnabled !== undefined) updateData.isEnabled = body.isEnabled

  const updated = await db.banner.update({
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
  await db.banner.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
