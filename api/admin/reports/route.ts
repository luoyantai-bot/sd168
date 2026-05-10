import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { parseJSON } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') || 'overview'

  if (type === 'gmv_trend') {
    // GMV trend for last 30 days
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const orders = await db.order.findMany({
      where: {
        status: { notIn: ['cancelled', 'refunded'] },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { totalAmount: true, createdAt: true },
    })

    // Group by date
    const trend: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      trend[key] = 0
    }

    for (const order of orders) {
      const d = new Date(order.createdAt)
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      if (key in trend) {
        trend[key] += order.totalAmount
      }
    }

    return NextResponse.json(
      Object.entries(trend).map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
    )
  }

  if (type === 'merchant_ranking') {
    const merchants = await db.merchant.findMany({
      include: {
        _count: { select: { products: true, orders: true } },
        orders: {
          where: { status: { notIn: ['cancelled', 'refunded'] } },
          select: { totalAmount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const ranking = merchants.map((m) => ({
      id: m.id,
      shopName: m.shopName,
      productCount: m._count.products,
      orderCount: m._count.orders,
      totalAmount: m.orders.reduce((sum, o) => sum + o.totalAmount, 0),
    })).sort((a, b) => b.totalAmount - a.totalAmount)

    return NextResponse.json(ranking)
  }

  if (type === 'product_ranking') {
    const products = await db.product.findMany({
      where: { status: 'published' },
      include: {
        merchant: { select: { shopName: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: 20,
    })

    const ranking = products.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      shopName: p.merchant.shopName,
      viewCount: p.viewCount,
      inquiryCount: p.inquiryCount,
      priceTiers: parseJSON<{ minQty: number; price: number }[]>(p.priceTiers, []),
    }))

    return NextResponse.json(ranking)
  }

  if (type === 'buyer_analysis') {
    const buyers = await db.user.findMany({
      where: { role: 'buyer' },
      include: {
        buyerOrders: {
          where: { status: { notIn: ['cancelled', 'refunded'] } },
          select: { totalAmount: true },
        },
        buyerInquiries: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const analysis = buyers.map((b) => ({
      id: b.id,
      nickname: b.nickname,
      phone: b.phone,
      orderCount: b.buyerOrders.length,
      totalSpent: b.buyerOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      inquiryCount: b.buyerInquiries.length,
      createdAt: b.createdAt,
    })).sort((a, b) => b.totalSpent - a.totalSpent)

    return NextResponse.json(analysis)
  }

  // Overview
  const [merchantCount, buyerCount, productCount, orderCount, pendingMerchantCount] = await Promise.all([
    db.merchant.count(),
    db.user.count({ where: { role: 'buyer' } }),
    db.product.count({ where: { status: 'published' } }),
    db.order.count(),
    db.merchant.count({ where: { verifyStatus: 'pending' } }),
  ])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const [monthGMV, monthOrderCount] = await Promise.all([
    db.order.aggregate({ _sum: { totalAmount: true }, where: { status: { notIn: ['cancelled', 'refunded'] }, createdAt: { gte: monthStart } } }),
    db.order.count({ where: { createdAt: { gte: monthStart } } }),
  ])

  return NextResponse.json({
    merchantCount,
    buyerCount,
    productCount,
    orderCount,
    pendingMerchantCount,
    monthGMV: monthGMV._sum.totalAmount || 0,
    monthOrderCount,
  })
}
