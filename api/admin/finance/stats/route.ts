import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalGMV, commissionIncome, labelFeeIncome, logisticsIncome, settlementCount] = await Promise.all([
    db.order.aggregate({ _sum: { totalAmount: true }, where: { status: { notIn: ['cancelled', 'refunded'] }, createdAt: { gte: monthStart } } }),
    db.settlement.aggregate({ _sum: { commissionAmount: true }, where: { createdAt: { gte: monthStart } } }),
    db.settlement.aggregate({ _sum: { labelFee: true }, where: { createdAt: { gte: monthStart } } }),
    db.settlement.aggregate({ _sum: { logisticsFee: true }, where: { createdAt: { gte: monthStart } } }),
    db.settlement.count({ where: { createdAt: { gte: monthStart } } }),
  ])

  const commission = commissionIncome._sum.commissionAmount || 0
  const labelFee = labelFeeIncome._sum.labelFee || 0
  const logistics = logisticsIncome._sum.logisticsFee || 0
  const totalIncome = commission + labelFee + logistics

  return NextResponse.json({
    totalGMV: totalGMV._sum.totalAmount || 0,
    commissionIncome: commission,
    labelFeeIncome: labelFee,
    logisticsIncome: logistics,
    totalIncome,
    settlementCount,
  })
}
