import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const merchant = await db.merchant.findUnique({ where: { userId: session.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    const withdrawals = await db.withdrawal.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      balance: merchant.balance,
      withdrawals,
    })
  } catch (error) {
    console.error('Account API error:', error)
    return NextResponse.json({ error: '获取账户信息失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'merchant') {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const merchant = await db.merchant.findUnique({ where: { userId: session.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家不存在' }, { status: 404 })
    }

    const body = await request.json()
    const { amount, method, bankInfo } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '提现金额必须大于0' }, { status: 400 })
    }

    if (amount > merchant.balance) {
      return NextResponse.json({ error: '提现金额不能超过余额' }, { status: 400 })
    }

    if (!method || !['bank', 'wechat'].includes(method)) {
      return NextResponse.json({ error: '请选择提现方式' }, { status: 400 })
    }

    // Create withdrawal and deduct balance
    const [withdrawal] = await db.$transaction([
      db.withdrawal.create({
        data: {
          merchantId: merchant.id,
          amount,
          method,
          bankInfo: JSON.stringify(bankInfo || {}),
        },
      }),
      db.merchant.update({
        where: { id: merchant.id },
        data: { balance: { decrement: amount } },
      }),
    ])

    return NextResponse.json({ withdrawal })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: '申请提现失败' }, { status: 500 })
  }
}
