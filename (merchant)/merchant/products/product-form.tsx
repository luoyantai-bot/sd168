'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Package } from 'lucide-react'
import { CATEGORIES } from '@/lib/utils'

interface PriceTier {
  minQty: number
  maxQty?: number
  price: number
}

interface SkuItem {
  skuName: string
  attributes: Array<{ key: string; value: string }>
  price: number
  stock: number
  image: string
}

const STEPS = [
  { key: 'basic', label: '基础信息' },
  { key: 'specs', label: '规格与价格' },
  { key: 'detail', label: '详情描述' },
  { key: 'warehouse', label: '仓储设置' },
]

interface ProductFormProps {
  initialData?: {
    id: string
    title: string
    subtitle: string
    category: string
    subCategory: string
    coverImage: string
    images: string[]
    description: string
    moq: number
    unit: string
    priceTiers: PriceTier[]
    weight: number
    volumeL: number
    volumeW: number
    volumeH: number
    isInWarehouse: boolean
    warehouseStock: number
    skus: SkuItem[]
  }
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: Basic Info
  const [title, setTitle] = useState(initialData?.title || '')
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || '')
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '')
  const [images, setImages] = useState<string[]>(initialData?.images || [])

  // Step 2: Specs & Price
  const [moq, setMoq] = useState(initialData?.moq || 1)
  const [unit, setUnit] = useState(initialData?.unit || '个')
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>(
    initialData?.priceTiers?.length ? initialData.priceTiers : [{ minQty: 1, price: 0 }]
  )
  const [weight, setWeight] = useState(initialData?.weight || 0)
  const [volumeL, setVolumeL] = useState(initialData?.volumeL || 0)
  const [volumeW, setVolumeW] = useState(initialData?.volumeW || 0)
  const [volumeH, setVolumeH] = useState(initialData?.volumeH || 0)
  const [enableSku, setEnableSku] = useState(initialData?.skus?.length > 0)
  const [skus, setSkus] = useState<SkuItem[]>(
    initialData?.skus?.length ? initialData.skus : [{ skuName: '', attributes: [], price: 0, stock: 0, image: '' }]
  )

  // Step 3: Description
  const [description, setDescription] = useState(initialData?.description || '')

  // Step 4: Warehouse
  const [isInWarehouse, setIsInWarehouse] = useState(initialData?.isInWarehouse || false)
  const [warehouseStock, setWarehouseStock] = useState(initialData?.warehouseStock || 0)

  const addPriceTier = () => {
    const lastTier = priceTiers[priceTiers.length - 1]
    setPriceTiers([...priceTiers, { minQty: lastTier ? lastTier.minQty + 100 : 1, price: 0 }])
  }

  const removePriceTier = (idx: number) => {
    if (priceTiers.length <= 1) return
    setPriceTiers(priceTiers.filter((_, i) => i !== idx))
  }

  const updatePriceTier = (idx: number, field: keyof PriceTier, value: number | undefined) => {
    const updated = [...priceTiers]
    updated[idx] = { ...updated[idx], [field]: value }
    setPriceTiers(updated)
  }

  const addImage = () => {
    if (images.length < 9) setImages([...images, ''])
  }

  const updateImage = (idx: number, value: string) => {
    const updated = [...images]
    updated[idx] = value
    setImages(updated)
  }

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx))
  }

  const addSku = () => {
    setSkus([...skus, { skuName: '', attributes: [], price: 0, stock: 0, image: '' }])
  }

  const removeSku = (idx: number) => {
    setSkus(skus.filter((_, i) => i !== idx))
  }

  const updateSku = (idx: number, field: keyof SkuItem, value: string | number) => {
    const updated = [...skus]
    updated[idx] = { ...updated[idx], [field]: value }
    setSkus(updated)
  }

  const handleSubmit = async () => {
    if (!title || !category) {
      alert('请填写商品标题和分类')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title,
        subtitle,
        category,
        subCategory,
        coverImage,
        images,
        description,
        moq,
        unit,
        priceTiers: priceTiers.filter((t) => t.price > 0),
        weight,
        volumeL,
        volumeW,
        volumeH,
        isInWarehouse,
        warehouseStock,
        skus: enableSku ? skus.filter((s) => s.skuName) : [],
        status: 'draft' as const,
      }

      const url = isEdit ? `/api/merchant/products/${initialData.id}` : '/api/merchant/products'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push('/merchant/products')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '操作失败')
      }
    } catch {
      alert('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const canNextStep = () => {
    if (step === 0) return !!title && !!category
    if (step === 1) return priceTiers.some((t) => t.price > 0)
    return true
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/merchant/products')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">
          {isEdit ? '编辑商品' : '新建商品'}
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => idx < step && setStep(idx)}
              className={`flex items-center gap-2 w-full`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  idx < step
                    ? 'bg-teal-500 text-white'
                    : idx === step
                    ? 'bg-teal-100 text-teal-700 border-2 border-teal-500'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {idx < step ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  idx === step ? 'text-teal-700 font-medium' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 ${idx < step ? 'bg-teal-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基础信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">商品标题 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入商品标题"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subtitle">副标题</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="请输入副标题"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>商品分类 *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subCategory">子分类</Label>
                <Input
                  id="subCategory"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="输入子分类"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="coverImage">封面图片URL</Label>
              <Input
                id="coverImage"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="输入图片URL"
                className="mt-1"
              />
              {coverImage && (
                <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={coverImage} alt="封面预览" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>商品图片（最多9张）</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImage}
                  disabled={images.length >= 9}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  添加
                </Button>
              </div>
              <div className="space-y-2">
                {images.map((img, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={img}
                      onChange={(e) => updateImage(idx, e.target.value)}
                      placeholder={`图片${idx + 1} URL`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(idx)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Specs & Price */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">规格与价格</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="moq">起订量 (MOQ)</Label>
                <Input
                  id="moq"
                  type="number"
                  value={moq}
                  onChange={(e) => setMoq(parseInt(e.target.value) || 1)}
                  min={1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="unit">计量单位</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="个">个</SelectItem>
                    <SelectItem value="件">件</SelectItem>
                    <SelectItem value="套">套</SelectItem>
                    <SelectItem value="条">条</SelectItem>
                    <SelectItem value="顶">顶</SelectItem>
                    <SelectItem value="台">台</SelectItem>
                    <SelectItem value="箱">箱</SelectItem>
                    <SelectItem value="打">打</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Tiers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>阶梯价格</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPriceTier}>
                  <Plus className="w-3 h-3 mr-1" />
                  添加阶梯
                </Button>
              </div>
              <div className="space-y-2">
                {priceTiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      <Label className="text-xs text-gray-400 whitespace-nowrap">起订</Label>
                      <Input
                        type="number"
                        value={tier.minQty}
                        onChange={(e) => updatePriceTier(idx, 'minQty', parseInt(e.target.value) || 0)}
                        className="h-9"
                        min={1}
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <Label className="text-xs text-gray-400 whitespace-nowrap">止</Label>
                      <Input
                        type="number"
                        value={tier.maxQty || ''}
                        onChange={(e) => updatePriceTier(idx, 'maxQty', parseInt(e.target.value) || undefined)}
                        placeholder="不限"
                        className="h-9"
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <Label className="text-xs text-gray-400 whitespace-nowrap">单价¥</Label>
                      <Input
                        type="number"
                        value={tier.price}
                        onChange={(e) => updatePriceTier(idx, 'price', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePriceTier(idx)}
                      disabled={priceTiers.length <= 1}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Weight & Volume */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">重量（克）</Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>体积（长×宽×高 cm）</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    type="number"
                    value={volumeL}
                    onChange={(e) => setVolumeL(parseFloat(e.target.value) || 0)}
                    placeholder="长"
                  />
                  <span className="text-gray-400">×</span>
                  <Input
                    type="number"
                    value={volumeW}
                    onChange={(e) => setVolumeW(parseFloat(e.target.value) || 0)}
                    placeholder="宽"
                  />
                  <span className="text-gray-400">×</span>
                  <Input
                    type="number"
                    value={volumeH}
                    onChange={(e) => setVolumeH(parseFloat(e.target.value) || 0)}
                    placeholder="高"
                  />
                </div>
              </div>
            </div>

            {/* SKU Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>启用SKU规格</Label>
                <p className="text-xs text-gray-400">为商品添加不同规格选项</p>
              </div>
              <Switch checked={enableSku} onCheckedChange={setEnableSku} />
            </div>

            {enableSku && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>SKU列表</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSku}>
                    <Plus className="w-3 h-3 mr-1" />
                    添加SKU
                  </Button>
                </div>
                <div className="space-y-2">
                  {skus.map((sku, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Input
                        value={sku.skuName}
                        onChange={(e) => updateSku(idx, 'skuName', e.target.value)}
                        placeholder="SKU名称"
                        className="h-8"
                      />
                      <Input
                        type="number"
                        value={sku.price}
                        onChange={(e) => updateSku(idx, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="单价"
                        step="0.01"
                        className="h-8"
                      />
                      <Input
                        type="number"
                        value={sku.stock}
                        onChange={(e) => updateSku(idx, 'stock', parseInt(e.target.value) || 0)}
                        placeholder="库存"
                        className="h-8"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSku(idx)}
                        className="text-red-500 h-8"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Description */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">详情描述</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">商品描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入商品详细描述，支持换行..."
                rows={12}
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">
                支持多行文本，建议包含产品特点、材质、尺寸、用途等信息
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Warehouse */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">仓储设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>入仓发货</Label>
                <p className="text-xs text-gray-400">开启后商品可使用平台仓库发货</p>
              </div>
              <Switch checked={isInWarehouse} onCheckedChange={setIsInWarehouse} />
            </div>
            {isInWarehouse && (
              <div>
                <Label htmlFor="warehouseStock">仓库库存数量</Label>
                <Input
                  id="warehouseStock"
                  type="number"
                  value={warehouseStock}
                  onChange={(e) => setWarehouseStock(parseInt(e.target.value) || 0)}
                  min={0}
                  className="mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          上一步
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNextStep()}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
          >
            下一步
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
          >
            {submitting ? '提交中...' : isEdit ? '保存修改' : '提交商品'}
          </Button>
        )}
      </div>
    </div>
  )
}
