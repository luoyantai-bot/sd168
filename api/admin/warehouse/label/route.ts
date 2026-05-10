import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const body = await req.json()
  const { orderId, labelCount, images, note, labelUnitPrice } = body

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  if (order.status !== 'in_warehouse') {
    return NextResponse.json({ error: '订单状态不允许贴单操作' }, { status: 400 })
  }

  const labelFee = (labelCount || 0) * (labelUnitPrice || 0.5)

  const record = await db.warehouseRecord.create({
    data: {
      orderId,
      productId: order.items ? JSON.parse(order.items)[0]?.productId || '' : '',
      merchantId: order.merchantId,
      operation: 'label',
      quantity: labelCount || 0,
      operatorId: session.id,
      labelFee,
      images: JSON.stringify(images || []),
      note: note || '',
    },
  })

  await db.order.update({
    where: { id: orderId },
    data: {
      status: 'labeling',
      labelFee,
    },
  })

  return NextResponse.json({ record, labelFee })
}
