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

  const category = await db.category.findUnique({ where: { id } })
  if (!category) {
    return NextResponse.json({ error: '分类不存在' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.slug !== undefined) updateData.slug = body.slug
  if (body.icon !== undefined) updateData.icon = body.icon
  if (body.parentId !== undefined) updateData.parentId = body.parentId || null
  if (body.sort !== undefined) updateData.sort = body.sort

  const updated = await db.category.update({
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

  const children = await db.category.count({ where: { parentId: id } })
  if (children > 0) {
    return NextResponse.json({ error: '该分类下有子分类，不能删除' }, { status: 400 })
  }

  await db.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
