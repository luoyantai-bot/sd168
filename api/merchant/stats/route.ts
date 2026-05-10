import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const merchant = await db.merchant.findUnique({
      where: { userId: session.id },
    })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Product counts
    const [publishedCount, draftCount, offlineCount] = await Promise.all([
      db.product.count({ where: { merchantId: merchant.id, status: 'published' } }),
      db.product.count({ where: { merchantId: merchant.id, status: 'draft' } }),
      db.product.count({ where: { merchantId: merchant.id, status: 'offline' } }),
    ])

    // Today's views
    const todayViewCount = await db.product.aggregate({
      where: { merchantId: merchant.id },
      _sum: { viewCount: true },
    })

    // Today's inquiries
    const todayInquiryCount = await db.inquiry.count({
      where: {
        merchantId: merchant.id,
        createdAt: { gte: today },
      },
    })

    // Total pending inquiries
    const pendingInquiryCount = await db.inquiry.count({
      where: { merchantId: merchant.id, status: 'pending' },
    })

    // Today's GMV (paid orders today)
    const todayOrders = await db.order.findMany({
      where: {
        merchantId: merchant.id,
        status: { in: ['paid', 'in_warehouse', 'labeling', 'dispatched', 'in_transit', 'delivered'] },
        createdAt: { gte: today },
      },
      select: { totalAmount: true },
    })
    const todayGMV = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    // Monthly GMV
    const monthOrders = await db.order.findMany({
      where: {
        merchantId: merchant.id,
        status: { in: ['paid', 'in_warehouse', 'labeling', 'dispatched', 'in_transit', 'delivered'] },
        createdAt: { gte: monthStart },
      },
      select: { totalAmount: true },
    })
    const monthGMV = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    // Active orders
    const activeOrderCount = await db.order.count({
      where: {
        merchantId: merchant.id,
        status: { in: ['paid', 'in_warehouse', 'labeling', 'dispatched', 'in_transit'] },
      },
    })

    // Top 5 products by inquiryCount
    const topProducts = await db.product.findMany({
      where: { merchantId: merchant.id },
      orderBy: { inquiryCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        coverImage: true,
        inquiryCount: true,
        viewCount: true,
        status: true,
        priceTiers: true,
      },
    })

    // Last 7 days stats
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const nextD = new Date(d)
      nextD.setDate(nextD.getDate() + 1)
      const dayInquiries = await db.inquiry.count({
        where: { merchantId: merchant.id, createdAt: { gte: d, lt: nextD } },
      })
      const dayOrders = await db.order.findMany({
        where: {
          merchantId: merchant.id,
          status: { in: ['paid', 'in_warehouse', 'labeling', 'dispatched', 'in_transit', 'delivered'] },
          createdAt: { gte: d, lt: nextD },
        },
        select: { totalAmount: true },
      })
      last7Days.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        inquiries: dayInquiries,
        gmv: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
      })
    }

    return NextResponse.json({
      publishedCount,
      draftCount,
      offlineCount,
      todayViews: todayViewCount._sum.viewCount || 0,
      todayInquiries: todayInquiryCount,
      pendingInquiries: pendingInquiryCount,
      todayGMV,
      monthGMV,
      activeOrderCount,
      balance: merchant.balance,
      topProducts: topProducts.map((p) => ({
        ...p,
        priceTiers: JSON.parse(p.priceTiers || '[]'),
      })),
      last7Days,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 })
  }
}
