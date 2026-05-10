import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const results: string[] = []

    // 1. Create super_admin user
    const existingAdmin = await db.user.findUnique({ where: { phone: '13800000000' } })
    if (!existingAdmin) {
      await db.user.create({
        data: {
          phone: '13800000000',
          password: 'admin123',
          nickname: '超级管理员',
          role: 'super_admin',
          status: 'active',
        },
      })
      results.push('Created super_admin user')
    } else {
      results.push('super_admin user already exists')
    }

    // 2. Create sample merchant user
    const existingMerchant = await db.user.findUnique({ where: { phone: '13800000001' } })
    if (!existingMerchant) {
      const merchantUser = await db.user.create({
        data: {
          phone: '13800000001',
          password: 'merchant123',
          nickname: '示例商家',
          role: 'merchant',
          status: 'active',
        },
      })

      await db.merchant.create({
        data: {
          userId: merchantUser.id,
          shopName: '邵东优品商行',
          contactName: '张经理',
          contactPhone: '13800000001',
          companyName: '邵东优品贸易有限公司',
          verifyStatus: 'approved',
          mainCategories: '["lighters", "hardware", "daily"]',
          description: '邵东本地优质商品供应商，专注打火机、五金工具及日用百货',
        },
      })
      results.push('Created merchant user with merchant record')

      // 3. Create sample products for the merchant
      const merchant = await db.merchant.findFirst({ where: { userId: merchantUser.id } })
      if (merchant) {
        const existingProducts = await db.product.count({ where: { merchantId: merchant.id } })
        if (existingProducts === 0) {
          await db.product.createMany({
            data: [
              {
                merchantId: merchant.id,
                title: '防风直冲打火机',
                subtitle: '高温防风 户外必备',
                category: 'lighters',
                coverImage: '',
                images: '[]',
                description: '高品质防风直冲打火机，适用于户外环境，火焰稳定强劲',
                moq: 100,
                unit: '个',
                priceTiers: '[{"minQty":100,"price":3.5},{"minQty":500,"price":3.0},{"minQty":1000,"price":2.5}]',
                weight: 45,
                volumeL: 8,
                volumeW: 3,
                volumeH: 2,
                status: 'published',
                viewCount: 256,
                inquiryCount: 18,
              },
              {
                merchantId: merchant.id,
                title: '多功能工具钳',
                subtitle: '12合1 多功能折叠',
                category: 'hardware',
                coverImage: '',
                images: '[]',
                description: '12合1多功能折叠工具钳，不锈钢材质，携带方便',
                moq: 50,
                unit: '把',
                priceTiers: '[{"minQty":50,"price":15.0},{"minQty":200,"price":12.0},{"minQty":500,"price":10.0}]',
                weight: 220,
                volumeL: 15,
                volumeW: 8,
                volumeH: 3,
                status: 'published',
                viewCount: 189,
                inquiryCount: 12,
              },
              {
                merchantId: merchant.id,
                title: '创意家居收纳盒',
                subtitle: '简约设计 大容量',
                category: 'home',
                coverImage: '',
                images: '[]',
                description: '简约现代风格家居收纳盒，大容量设计，多场景适用',
                moq: 200,
                unit: '个',
                priceTiers: '[{"minQty":200,"price":5.0},{"minQty":1000,"price":4.0},{"minQty":5000,"price":3.0}]',
                weight: 120,
                volumeL: 25,
                volumeW: 18,
                volumeH: 12,
                status: 'published',
                viewCount: 134,
                inquiryCount: 8,
              },
              {
                merchantId: merchant.id,
                title: '迷你便携充电宝',
                subtitle: '5000mAh 超薄设计',
                category: 'electronics',
                coverImage: '',
                images: '[]',
                description: '5000mAh迷你便携充电宝，超薄设计，随身携带',
                moq: 100,
                unit: '个',
                priceTiers: '[{"minQty":100,"price":22.0},{"minQty":500,"price":18.0},{"minQty":2000,"price":15.0}]',
                weight: 95,
                volumeL: 10,
                volumeW: 6,
                volumeH: 2.5,
                status: 'draft',
                viewCount: 0,
                inquiryCount: 0,
              },
              {
                merchantId: merchant.id,
                title: 'PU皮商务手提包',
                subtitle: '大容量 商务休闲两用',
                category: 'bags',
                coverImage: '',
                images: '[]',
                description: '高品质PU皮商务手提包，大容量设计，商务休闲两用',
                moq: 50,
                unit: '个',
                priceTiers: '[{"minQty":50,"price":35.0},{"minQty":200,"price":30.0},{"minQty":500,"price":25.0}]',
                weight: 450,
                volumeL: 38,
                volumeW: 28,
                volumeH: 10,
                status: 'published',
                viewCount: 97,
                inquiryCount: 5,
              },
            ],
          })
          results.push('Created 5 sample products')
        } else {
          results.push('Products already exist')
        }
      }
    } else {
      results.push('Merchant user already exists')
    }

    // 4. Create sample buyer user
    const existingBuyer = await db.user.findUnique({ where: { phone: '13800000002' } })
    if (!existingBuyer) {
      await db.user.create({
        data: {
          phone: '13800000002',
          password: 'buyer123',
          nickname: '示例买家',
          role: 'buyer',
          status: 'active',
        },
      })
      results.push('Created buyer user')
    } else {
      results.push('Buyer user already exists')
    }

    // 5. Create categories
    const existingCategories = await db.category.count()
    if (existingCategories === 0) {
      await db.category.createMany({
        data: [
          { name: '打火机', slug: 'lighters', icon: '🔥', sort: 1 },
          { name: '五金工具', slug: 'hardware', icon: '🔧', sort: 2 },
          { name: '箱包皮具', slug: 'bags', icon: '👜', sort: 3 },
          { name: '服装服饰', slug: 'clothing', icon: '👕', sort: 4 },
          { name: '家居用品', slug: 'home', icon: '🏠', sort: 5 },
          { name: '电子产品', slug: 'electronics', icon: '📱', sort: 6 },
          { name: '文具玩具', slug: 'stationery', icon: '✏️', sort: 7 },
          { name: '日用百货', slug: 'daily', icon: '🛒', sort: 8 },
        ],
      })
      results.push('Created 8 categories')
    } else {
      results.push('Categories already exist')
    }

    // 6. Create platform config
    const existingConfig = await db.platformConfig.count()
    if (existingConfig === 0) {
      await db.platformConfig.createMany({
        data: [
          { key: 'commission_rate', value: '0.05' },
          { key: 'label_fee', value: '2' },
        ],
      })
      results.push('Created platform config')
    } else {
      results.push('Platform config already exists')
    }

    // 7. Create logistics channels
    const existingChannels = await db.logisticsChannel.count()
    if (existingChannels === 0) {
      await db.logisticsChannel.createMany({
        data: [
          {
            name: '中邮小包',
            carrier: '中国邮政',
            deliveryDays: '15-30',
            billingMethod: 'weight',
            firstWeightPrice: 55,
            additionalPrice: 25,
            minWeight: 0.5,
            destinationCountries: '["US","UK","DE","FR","AU","CA"]',
            isEnabled: true,
          },
          {
            name: 'E邮宝',
            carrier: '中国邮政',
            deliveryDays: '7-15',
            billingMethod: 'weight',
            firstWeightPrice: 70,
            additionalPrice: 30,
            minWeight: 0.5,
            destinationCountries: '["US","UK","DE","FR","AU","CA","JP"]',
            isEnabled: true,
          },
          {
            name: '云途专线',
            carrier: '云途物流',
            deliveryDays: '5-10',
            billingMethod: 'weight',
            firstWeightPrice: 90,
            additionalPrice: 40,
            minWeight: 0.5,
            destinationCountries: '["US","UK","DE","FR"]',
            isEnabled: true,
          },
        ],
      })
      results.push('Created logistics channels')
    } else {
      results.push('Logistics channels already exist')
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: '种子数据创建失败', details: String(error) },
      { status: 500 }
    )
  }
}
