'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Layers, Image as ImageIcon, Megaphone, Plus, Pencil, Trash2, RefreshCw, Save } from 'lucide-react'

interface ConfigMap {
  [key: string]: string
}

interface Banner {
  id: string
  imageUrl: string
  linkUrl: string
  sort: number
  isEnabled: boolean
  createdAt: string
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string
  parentId: string | null
  sort: number
  children?: Category[]
}

export default function AdminConfigPage() {
  const [tab, setTab] = useState('basic')
  const [config, setConfig] = useState<ConfigMap>({})
  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form states
  const [commissionRate, setCommissionRate] = useState('5')
  const [labelUnitPrice, setLabelUnitPrice] = useState('0.5')
  const [announcement, setAnnouncement] = useState('')

  // Banner dialog
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [bannerForm, setBannerForm] = useState({ imageUrl: '', linkUrl: '', sort: '0', isEnabled: true })

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', icon: '', sort: '0' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [configRes, bannersRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/config'),
        fetch('/api/admin/banners'),
        fetch('/api/admin/categories'),
      ])
      if (configRes.ok) {
        const configData = await configRes.json()
        setConfig(configData)
        setCommissionRate(configData.default_commission_rate || '5')
        setLabelUnitPrice(configData.label_unit_price || '0.5')
        setAnnouncement(configData.announcement || '')
      }
      if (bannersRes.ok) setBanners(await bannersRes.json())
      if (categoriesRes.ok) setCategories(await categoriesRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_commission_rate: commissionRate,
          label_unit_price: labelUnitPrice,
          announcement,
        }),
      })
      alert('配置已保存')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // Banner operations
  const openBannerCreate = () => {
    setEditingBanner(null)
    setBannerForm({ imageUrl: '', linkUrl: '', sort: '0', isEnabled: true })
    setBannerDialogOpen(true)
  }

  const openBannerEdit = (b: Banner) => {
    setEditingBanner(b)
    setBannerForm({ imageUrl: b.imageUrl, linkUrl: b.linkUrl, sort: String(b.sort), isEnabled: b.isEnabled })
    setBannerDialogOpen(true)
  }

  const handleBannerSave = async () => {
    if (!bannerForm.imageUrl) { alert('图片地址不能为空'); return }
    setSaving(true)
    try {
      if (editingBanner) {
        await fetch(`/api/admin/banners/${editingBanner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bannerForm),
        })
      } else {
        await fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bannerForm),
        })
      }
      setBannerDialogOpen(false)
      loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleBannerDelete = async (id: string) => {
    if (!confirm('确认删除该Banner？')) return
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    loadData()
  }

  const handleBannerToggle = async (b: Banner) => {
    await fetch(`/api/admin/banners/${b.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled: !b.isEnabled }),
    })
    loadData()
  }

  // Category operations
  const openCategoryCreate = () => {
    setEditingCategory(null)
    setCategoryForm({ name: '', slug: '', icon: '', sort: '0' })
    setCategoryDialogOpen(true)
  }

  const openCategoryEdit = (c: Category) => {
    setEditingCategory(c)
    setCategoryForm({ name: c.name, slug: c.slug, icon: c.icon, sort: String(c.sort) })
    setCategoryDialogOpen(true)
  }

  const handleCategorySave = async () => {
    if (!categoryForm.name || !categoryForm.slug) { alert('名称和标识不能为空'); return }
    setSaving(true)
    try {
      if (editingCategory) {
        await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryForm),
        })
      } else {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryForm),
        })
      }
      setCategoryDialogOpen(false)
      loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('确认删除该分类？')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || '删除失败')
    }
    loadData()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">平台配置</h1>
          <p className="text-sm text-gray-500 mt-1">管理平台基本设置和参数</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1" /> 刷新
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="basic">基本设置</TabsTrigger>
          <TabsTrigger value="categories">品类管理</TabsTrigger>
          <TabsTrigger value="banners">Banner管理</TabsTrigger>
          <TabsTrigger value="announcement">公告管理</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Basic Settings */}
      {tab === 'basic' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" /> 基本设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>默认佣金率 (%)</Label>
              <Input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="max-w-xs mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">新商家默认的佣金比例</p>
            </div>
            <Separator />
            <div>
              <Label>贴单单价 (元/张)</Label>
              <Input
                type="number"
                value={labelUnitPrice}
                onChange={(e) => setLabelUnitPrice(e.target.value)}
                min="0"
                step="0.1"
                className="max-w-xs mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">每张贴单的默认价格</p>
            </div>
            <Separator />
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={saving} onClick={handleSaveConfig}>
              <Save className="w-4 h-4 mr-2" /> {saving ? '保存中...' : '保存配置'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={openCategoryCreate}>
              <Plus className="w-4 h-4 mr-1" /> 新增分类
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>图标</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>标识</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead>子分类</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">暂无分类数据</TableCell></TableRow>
                  ) : categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-lg">{c.icon || '-'}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm text-gray-500">{c.slug}</TableCell>
                      <TableCell className="text-sm">{c.sort}</TableCell>
                      <TableCell>
                        {c.children && c.children.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.children.map(ch => (
                              <Badge key={ch.id} variant="secondary" className="text-[10px]">{ch.name}</Badge>
                            ))}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openCategoryEdit(c)}>
                            <Pencil className="w-3 h-3 mr-1" /> 编辑
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => handleCategoryDelete(c.id)}>
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
        </div>
      )}

      {/* Banners */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={openBannerCreate}>
              <Plus className="w-4 h-4 mr-1" /> 新增Banner
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>图片</TableHead>
                    <TableHead>链接</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">加载中...</TableCell></TableRow>
                  ) : banners.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">暂无Banner</TableCell></TableRow>
                  ) : banners.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt="banner" className="w-24 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-24 h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">无图</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">{b.linkUrl || '-'}</TableCell>
                      <TableCell className="text-sm">{b.sort}</TableCell>
                      <TableCell>
                        <Switch checked={b.isEnabled} onCheckedChange={() => handleBannerToggle(b)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openBannerEdit(b)}>
                            <Pencil className="w-3 h-3 mr-1" /> 编辑
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => handleBannerDelete(b.id)}>
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
        </div>
      )}

      {/* Announcement */}
      {tab === 'announcement' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> 公告管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>系统公告</Label>
              <Textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="输入系统公告内容..."
                className="mt-1 min-h-[120px]"
              />
              <p className="text-xs text-gray-400 mt-1">将显示在买家端首页</p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={saving} onClick={handleSaveConfig}>
              <Save className="w-4 h-4 mr-2" /> {saving ? '保存中...' : '保存公告'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Banner Dialog */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBanner ? '编辑Banner' : '新增Banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>图片地址 *</Label>
              <Input value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>链接地址</Label>
              <Input value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>排序</Label>
              <Input type="number" value={bannerForm.sort} onChange={(e) => setBannerForm({ ...bannerForm, sort: e.target.value })} className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={bannerForm.isEnabled} onCheckedChange={(v) => setBannerForm({ ...bannerForm, isEnabled: v })} />
              <Label>启用</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBannerDialogOpen(false)}>取消</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={saving} onClick={handleBannerSave}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '新增分类'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>分类名称 *</Label>
                <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>标识 (slug) *</Label>
                <Input value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>图标 (emoji)</Label>
                <Input value={categoryForm.icon} onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>排序</Label>
                <Input type="number" value={categoryForm.sort} onChange={(e) => setCategoryForm({ ...categoryForm, sort: e.target.value })} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>取消</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={saving} onClick={handleCategorySave}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
