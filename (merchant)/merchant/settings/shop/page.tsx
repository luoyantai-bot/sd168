'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Store, Save, CheckCircle } from 'lucide-react'
import { CATEGORIES } from '@/lib/utils'

interface ShopInfo {
  id: string
  shopName: string
  shopLogo: string
  contactName: string
  contactPhone: string
  companyName: string
  businessLicense: string
  address: string
  mainCategories: string
  description: string
  verifyStatus: string
  verifyNote: string
}

export default function MerchantShopSettingsPage() {
  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form fields
  const [shopName, setShopName] = useState('')
  const [shopLogo, setShopLogo] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/merchant/shop')
      .then((res) => res.json())
      .then((data) => {
        if (data.shop) {
          const s = data.shop
          setShop(s)
          setShopName(s.shopName || '')
          setShopLogo(s.shopLogo || '')
          setContactName(s.contactName || '')
          setContactPhone(s.contactPhone || '')
          setDescription(s.description || '')
          try {
            setSelectedCategories(JSON.parse(s.mainCategories || '[]'))
          } catch {
            setSelectedCategories([])
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/merchant/shop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          shopLogo,
          contactName,
          contactPhone,
          description,
          mainCategories: selectedCategories,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    )
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
      <h1 className="text-xl font-semibold text-gray-900">店铺设置</h1>

      {/* Verify Status */}
      {shop && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {shop.verifyStatus === 'approved' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                    <span className="text-sm font-medium text-teal-600">店铺已认证</span>
                  </>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-200">
                    {shop.verifyStatus === 'pending' ? '认证审核中' : shop.verifyStatus === 'rejected' ? '认证未通过' : '未认证'}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-400">公司: {shop.companyName}</span>
            </div>
            {shop.verifyNote && (
              <p className="text-xs text-gray-500 mt-2">备注: {shop.verifyNote}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shop Info Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-4 h-4" />
            店铺信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shopName">店铺名称 *</Label>
            <Input
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="输入店铺名称"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="shopLogo">店铺Logo URL</Label>
            <Input
              id="shopLogo"
              value={shopLogo}
              onChange={(e) => setShopLogo(e.target.value)}
              placeholder="输入Logo图片URL"
              className="mt-1"
            />
            {shopLogo && (
              <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border">
                <img src={shopLogo} alt="Logo预览" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactName">联系人</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="联系人姓名"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">联系电话</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="联系电话"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>主营类目</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat.slug}
                  variant={selectedCategories.includes(cat.slug) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${
                    selectedCategories.includes(cat.slug)
                      ? 'bg-teal-500 text-white hover:bg-teal-600'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleCategory(cat.slug)}
                >
                  {cat.icon} {cat.name}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">店铺简介</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入店铺简介..."
              rows={4}
              className="mt-1"
            />
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? '保存中...' : '保存设置'}
            </Button>
            {saved && (
              <span className="text-sm text-teal-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                保存成功
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
