'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Wallet, ArrowDownToLine, Clock, CheckCircle, XCircle, Banknote, Smartphone } from 'lucide-react'
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils'

interface Withdrawal {
  id: string
  amount: number
  method: string
  bankInfo: string
  status: string
  adminNote: string
  createdAt: string
}

export default function MerchantAccountPage() {
  const [balance, setBalance] = useState(0)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Withdrawal form
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankHolder, setBankHolder] = useState('')
  const [wechatAccount, setWechatAccount] = useState('')

  const fetchData = async () => {
    try {
      const res = await fetch('/api/merchant/account')
      const data = await res.json()
      setBalance(data.balance || 0)
      setWithdrawals(data.withdrawals || [])
    } catch {
      console.error('Failed to fetch account data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount)
    if (!withdrawAmount || withdrawAmount <= 0) {
      alert('请输入有效金额')
      return
    }
    if (withdrawAmount > balance) {
      alert('提现金额不能超过余额')
      return
    }

    setSubmitting(true)
    try {
      const bankInfo = method === 'bank'
        ? { bankName, bankAccount, bankHolder }
        : { wechatAccount }

      const res = await fetch('/api/merchant/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdrawAmount, method, bankInfo }),
      })

      if (res.ok) {
        setDialogOpen(false)
        setAmount('')
        setBankName('')
        setBankAccount('')
        setBankHolder('')
        setWechatAccount('')
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || '提现申请失败')
      }
    } catch {
      alert('提现申请失败')
    } finally {
      setSubmitting(false)
    }
  }

  const getWithdrawalIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />
      case 'approved': return <CheckCircle className="w-4 h-4 text-teal-500" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-teal-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getWithdrawalStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '审核中',
      approved: '已通过',
      rejected: '已拒绝',
      completed: '已完成',
    }
    return map[status] || status
  }

  const getWithdrawalStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-teal-100 text-teal-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900">账户管理</h1>

      {/* Balance Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-gray-500">账户余额</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatPrice(balance)}</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                  <ArrowDownToLine className="w-4 h-4 mr-1" />
                  申请提现
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>申请提现</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>当前可用余额</Label>
                    <p className="text-lg font-bold text-teal-600">{formatPrice(balance)}</p>
                  </div>
                  <div>
                    <Label htmlFor="amount">提现金额 *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="输入提现金额"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>提现方式</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4" />
                            银行卡
                          </div>
                        </SelectItem>
                        <SelectItem value="wechat">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            微信
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {method === 'bank' ? (
                    <>
                      <div>
                        <Label htmlFor="bankName">开户银行</Label>
                        <Input
                          id="bankName"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="如：中国工商银行"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bankAccount">银行账号</Label>
                        <Input
                          id="bankAccount"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          placeholder="输入银行账号"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bankHolder">持卡人姓名</Label>
                        <Input
                          id="bankHolder"
                          value={bankHolder}
                          onChange={(e) => setBankHolder(e.target.value)}
                          placeholder="输入持卡人姓名"
                          className="mt-1"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label htmlFor="wechatAccount">微信号</Label>
                      <Input
                        id="wechatAccount"
                        value={wechatAccount}
                        onChange={(e) => setWechatAccount(e.target.value)}
                        placeholder="输入微信号"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">取消</Button>
                  </DialogClose>
                  <Button
                    onClick={handleWithdraw}
                    disabled={submitting || !amount}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                  >
                    {submitting ? '提交中...' : '确认提现'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">提现记录</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">暂无提现记录</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {getWithdrawalIcon(w.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        -{formatPrice(w.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {w.method === 'bank' ? '银行卡提现' : '微信提现'} · {formatDate(w.createdAt)}
                      </p>
                      {w.adminNote && (
                        <p className="text-xs text-gray-500 mt-0.5">备注: {w.adminNote}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-[11px] ${getWithdrawalStatusColor(w.status)}`}>
                    {getWithdrawalStatusLabel(w.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
