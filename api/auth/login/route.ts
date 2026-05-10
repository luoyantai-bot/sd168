import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { login } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password } = body

    if (!phone || !password) {
      return NextResponse.json(
        { error: '请输入手机号和密码' },
        { status: 400 }
      )
    }

    const user = await login(phone, password)

    if (!user) {
      return NextResponse.json(
        { error: '手机号或密码错误，或账号已被禁用' },
        { status: 401 }
      )
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}
