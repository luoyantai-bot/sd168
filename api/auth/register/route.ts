import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { register } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password, role, nickname, shopName, contactName, contactPhone, companyName } = body

    if (!phone || !password || !role || !nickname) {
      return NextResponse.json(
        { error: '请填写所有必填项' },
        { status: 400 }
      )
    }

    if (!['merchant', 'buyer'].includes(role)) {
      return NextResponse.json(
        { error: '无效的用户角色' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingUser = await db.user.findUnique({ where: { phone } })
    if (existingUser) {
      return NextResponse.json(
        { error: '该手机号已注册' },
        { status: 409 }
      )
    }

    // Create user
    const user = await register(phone, password, role, nickname)

    // If merchant, create merchant record
    if (role === 'merchant') {
      if (!shopName || !contactName || !contactPhone || !companyName) {
        // Clean up the user if merchant fields are missing
        await db.user.delete({ where: { id: user.id } })
        return NextResponse.json(
          { error: '请填写商家信息' },
          { status: 400 }
        )
      }

      await db.merchant.create({
        data: {
          userId: user.id,
          shopName,
          contactName,
          contactPhone,
          companyName,
          verifyStatus: 'pending',
        },
      })
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
