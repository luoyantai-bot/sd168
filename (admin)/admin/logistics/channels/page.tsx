'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { formatPrice, parseJSON } from '@/lib/utils'

interface Channel {
  id: string
  name: string
  carrier: string
  deliveryDays: string
  billingMethod: string
  firstWeightPrice: number
  additionalPrice: number
  minWeight: number
  destinationCountries: string[]
  isEnabled: boolean
}

export default function LogisticsChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Channel | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', carrier: '', deliveryDays: '', billingMethod: 'weight',
    firstWeightPrice: '0', additionalPrice: '0', minWeight: '0.5',
    destinationCountries: '', isEnabled: true,
  })

  const fetchChannels = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/logistics/channels')
      if (res.ok) setChannels(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchChannels() }, [fetchChannels])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', carrier: '', deliveryDays: '', billingMethod: 'weight', firstWeightPrice: '0', additionalPrice: '0', minWeight: '0.5', destinationCountries: '', isEnabled: true })
    setDialogOpen(true)
  }

  const openEdit = (ch: Channel) => {
    setEditing(ch)
    setForm({
      name: ch.name, carrier: ch.carrier, deliveryDays: ch.deliveryDays,
      billingMethod: ch.billingMethod, firstWeightPrice: String(ch.firstWeightPrice),
      additionalPrice: String(ch.additionalPrice), minWeight: String(ch.minWeight),
      destinationCountries: ch.destinationCountries?.join(', ') || '',
      isEnabled: ch.isEnabled,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name) { alert('渠道名称不能为空'); return }
    setSaving(true)
    try {
      const body = {
        ...form,
        firstWeightPrice: parseFloat(form.firstWeightPrice) || 0,
        additionalPrice: parseFloat(form.additionalPrice) || 0,
        minWeight: parseFloat(form.minWeight) || 0.5,
        destinationCountries: form.destinationCountries.split(',').map(s => s.trim()).filter(Boolean),
      }

      if (editing) {
        await fetch(`/api/admin/logistics/channels/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/admin/logistics/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      setDialogOpen(false)
      fetchChannels()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该渠道？')) return
    await fetch(`/api/admin/logistics/channels/${id}`, { method: 'DELETE' })
    fetchChannels()
  }

  const handleToggle = async (ch: Channel) => {
    await fetch(`/api/admin/logistics/channels/${ch.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled: !ch.isEnabled }),
    })
    fetchChannels()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">物流渠道管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理平台物流渠道配置</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> 新增渠道
          </Button>
          <Button variant="outline" size="sm" onClick={fetchChannels}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>渠道名称</TableHead>
                <TableHead>承运商</TableHead>
                <TableHead>时效</TableHead>
                <TableHead>计费方式</TableHead>
                <TableHead>首重价格</TableHead>
                <TableHead>续重价格</TableHead>
                <TableHead>最低重量</TableHead>
                <TableHead>目的地</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
              ) : channels.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-400">暂无渠道数据</TableCell></TableRow>
              ) : channels.map((ch) => (
                <TableRow key={ch.id}>
                  <TableCell className="font-medium">{ch.name}</TableCell>
                  <TableCell className="text-sm">{ch.carrier || '-'}</TableCell>
                  <TableCell className="text-sm">{ch.deliveryDays || '-'}</TableCell>
                  <TableCell className="text-sm">{ch.billingMethod === 'weight' ? '按重量' : '按体积'}</TableCell>
                  <TableCell className="text-sm">{formatPrice(ch.firstWeightPrice)}/kg</TableCell>
                  <TableCell className="text-sm">{formatPrice(ch.additionalPrice)}/kg</TableCell>
                  <TableCell className="text-sm">{ch.minWeight}kg</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">
                    {ch.destinationCountries?.join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    <Switch checked={ch.isEnabled} onCheckedChange={() => handleToggle(ch)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(ch)}>
                        <Pencil className="w-3 h-3 mr-1" /> 编辑
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(ch.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> 删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑渠道' : '新增渠道'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>渠道名称 *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>承运商</Label>
                <Input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>时效</Label>
                <Input value={form.deliveryDays} onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })} placeholder="如5-10天" className="mt-1" />
              </div>
              <div>
                <Label>计费方式</Label>
                <Select value={form.billingMethod} onValueChange={(v) => setForm({ ...form, billingMethod: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight">按重量</SelectItem>
                    <SelectItem value="volume">按体积</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>首重价格 (元/kg)</Label>
                <Input type="number" value={form.firstWeightPrice} onChange={(e) => setForm({ ...form, firstWeightPrice: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>续重价格 (元/kg)</Label>
                <Input type="number" value={form.additionalPrice} onChange={(e) => setForm({ ...form, additionalPrice: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>最低重量 (kg)</Label>
                <Input type="number" value={form.minWeight} onChange={(e) => setForm({ ...form, minWeight: e.target.value })} step="0.1" className="mt-1" />
              </div>
              <div>
                <Label>启用状态</Label>
                <div className="mt-2">
                  <Switch checked={form.isEnabled} onCheckedChange={(v) => setForm({ ...form, isEnabled: v })} />
                </div>
              </div>
            </div>
            <div>
              <Label>目的地国家 (逗号分隔)</Label>
              <Input value={form.destinationCountries} onChange={(e) => setForm({ ...form, destinationCountries: e.target.value })} placeholder="如: 美国, 英国, 德国" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={saving} onClick={handleSave}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
