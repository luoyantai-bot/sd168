import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export interface SessionUser {
  id: string
  phone: string
  role: string
  nickname: string
  avatarUrl: string
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value
  if (!userId) return null

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, role: true, nickname: true, avatarUrl: true }
  })

  if (!user || user.status === 'disabled') return null
  return user
}

export async function login(phone: string, password: string): Promise<SessionUser | null> {
  const user = await db.user.findUnique({
    where: { phone },
    select: { id: true, phone: true, role: true, nickname: true, avatarUrl: true, password: true, status: true }
  })

  if (!user || user.password !== password || user.status === 'disabled') return null
  return { id: user.id, phone: user.phone, role: user.role, nickname: user.nickname, avatarUrl: user.avatarUrl }
}

export async function register(phone: string, password: string, role: string, nickname: string): Promise<SessionUser> {
  const user = await db.user.create({
    data: { phone, password, role, nickname }
  })
  return { id: user.id, phone: user.phone, role: user.role, nickname: user.nickname, avatarUrl: user.avatarUrl }
}

export function canAccess(role: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(role)
}
