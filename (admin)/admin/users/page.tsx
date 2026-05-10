'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search, RefreshCw, UserCheck, UserX } from 'lucide-react'
import { formatDateTime, getStatusLabel, getStatusColor, getRoleLabel } from '@/lib/utils'

interface UserItem {
  id: string
  phone: string
  nickname: string
  role: string
  status: string
  avatarUrl: string
  createdAt: string
  merchant: { id: string; shopName: string; verifyStatus: string } | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (role) params.set('role', role)
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, role, status, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active'
    const action = newStatus === 'disabled' ? '禁用' : '启用'
    const confirmed = confirm(`确认${action}该用户？`)
    if (!confirmed) return

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      fetchUsers()
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  const roleOptions = [
    { value: '__all__', label: '全部角色' },
    { value: 'buyer', label: '买家' },
    { value: 'merchant', label: '商家' },
    { value: 'super_admin', label: '超级管理员' },
    { value: 'warehouse_staff', label: '仓储员' },
    { value: 'logistics_staff', label: '物流员' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">用户管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理平台所有用户</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          <RefreshCw className="w-4 h-4 mr-1" /> 刷新
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="搜索手机号/昵称..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <Select value={role} onValueChange={(v) => { setRole(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="全部角色" /></SelectTrigger>
          <SelectContent>
            {roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="全部状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部状态</SelectItem>
            <SelectItem value="active">正常</SelectItem>
            <SelectItem value="disabled">已禁用</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>手机号</TableHead>
                <TableHead>昵称</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>关联商家</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">暂无用户数据</TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.phone}</TableCell>
                  <TableCell>{u.nickname || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{getRoleLabel(u.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.merchant ? (
                      <span className="text-sm">{u.merchant.shopName}</span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${getStatusColor(u.status)}`}>{getStatusLabel(u.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDateTime(u.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {u.status === 'active' ? (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => handleToggleStatus(u.id, u.status)}>
                        <UserX className="w-3 h-3 mr-1" /> 禁用
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 hover:bg-green-50"
                        onClick={() => handleToggleStatus(u.id, u.status)}>
                        <UserCheck className="w-3 h-3 mr-1" /> 启用
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">共 {total} 条</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        </div>
      )}
    </div>
  )
}
