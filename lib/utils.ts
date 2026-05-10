import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function generateOrderNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `SD${year}${month}${day}${rand}`
}

export function parseJSON<T>(str: string, fallback: T): T {
  if (!str) return fallback
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending_payment: '待付款',
    paid: '已付款',
    in_warehouse: '已入仓',
    labeling: '贴单中',
    dispatched: '已发货',
    in_transit: '运输中',
    delivered: '已签收',
    cancelled: '已取消',
    refunding: '退款中',
    refunded: '已退款',
    pending: '待处理',
    replied: '已回复',
    converted: '已转化',
    closed: '已关闭',
    draft: '草稿',
    published: '已发布',
    offline: '已下架',
    rejected: '已拒绝',
    approved: '已通过',
    active: '正常',
    disabled: '已禁用',
  }
  return map[status] || status
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    in_warehouse: 'bg-indigo-100 text-indigo-800',
    labeling: 'bg-purple-100 text-purple-800',
    dispatched: 'bg-cyan-100 text-cyan-800',
    in_transit: 'bg-teal-100 text-teal-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunding: 'bg-orange-100 text-orange-800',
    refunded: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    replied: 'bg-blue-100 text-blue-800',
    converted: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    offline: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800',
    approved: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    disabled: 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

export const CATEGORIES = [
  { name: '打火机', slug: 'lighters', icon: '🔥' },
  { name: '五金工具', slug: 'hardware', icon: '🔧' },
  { name: '箱包皮具', slug: 'bags', icon: '👜' },
  { name: '服装服饰', slug: 'clothing', icon: '👕' },
  { name: '家居用品', slug: 'home', icon: '🏠' },
  { name: '电子产品', slug: 'electronics', icon: '📱' },
  { name: '文具玩具', slug: 'stationery', icon: '✏️' },
  { name: '日用百货', slug: 'daily', icon: '🛒' },
]

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    super_admin: '超级管理员',
    merchant: '商家',
    buyer: '买家',
    warehouse_staff: '仓储员',
    logistics_staff: '物流员',
  }
  return map[role] || role
}
