import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateOrderNo } from '@/lib/utils'

export async function GET() {
  try {
    const results: string[] = []

    // Get existing buyer
    const buyer = await db.user.findUnique({ where: { phone: '13800000002' } })
    if (!buyer) {
      return NextResponse.json({ error: '买家用户不存在，请先运行基础种子数据' }, { status: 400 })
    }

    // Get existing merchant
    const merchantUser = await db.user.findUnique({ where: { phone: '13800000001' } })
    if (!merchantUser) {
      return NextResponse.json({ error: '商家用户不存在，请先运行基础种子数据' }, { status: 400 })
    }
    const merchant = await db.merchant.findFirst({ where: { userId: merchantUser.id } })
    if (!merchant) {
      return NextResponse.json({ error: '商家记录不存在' }, { status: 400 })
    }

    // Add more products
    const existingMore = await db.product.count({ where: { title: { contains: '文具' } } })
    if (existingMore === 0) {
      await db.product.createMany({
        data: [
          {
            merchantId: merchant.id,
            title: '精品文具套装',
            subtitle: '学生办公必备 高颜值',
            category: 'stationery',
            coverImage: '',
            images: '[]',
            description: '高颜值文具套装，包含笔、本、尺等，适合学生和办公使用',
            moq: 100,
            unit: '套',
            priceTiers: '[{"minQty":100,"price":8.0},{"minQty":500,"price":6.5},{"minQty":2000,"price":5.0}]',
            weight: 180,
            volumeL: 25,
            volumeW: 15,
            volumeH: 5,
            status: 'published',
            viewCount: 145,
            inquiryCount: 9,
          },
          {
            merchantId: merchant.id,
            title: '便携充电数据线',
            subtitle: '三合一快充 编织线身',
            category: 'electronics',
            coverImage: '',
            images: '[]',
            description: '三合一快充数据线，编织线身耐用不易断，支持Type-C/Lightning/Micro USB',
            moq: 200,
            unit: '条',
            priceTiers: '[{"minQty":200,"price":4.5},{"minQty":1000,"price":3.5},{"minQty":5000,"price":2.8}]',
            weight: 35,
            volumeL: 12,
            volumeW: 8,
            volumeH: 2,
            status: 'published',
            viewCount: 210,
            inquiryCount: 15,
          },
          {
            merchantId: merchant.id,
            title: '时尚双肩背包',
            subtitle: '大容量 防水面料',
            category: 'bags',
            coverImage: '',
            images: '[]',
            description: '时尚双肩背包，大容量设计，防水面料，多隔层收纳',
            moq: 50,
            unit: '个',
            priceTiers: '[{"minQty":50,"price":28.0},{"minQty":200,"price":24.0},{"minQty":500,"price":20.0}]',
            weight: 380,
            volumeL: 35,
            volumeW: 25,
            volumeH: 12,
            status: 'published',
            viewCount: 176,
            inquiryCount: 11,
          },
          {
            merchantId: merchant.id,
            title: '创意LED台灯',
            subtitle: '三档调光 护眼阅读',
            category: 'home',
            coverImage: '',
            images: '[]',
            description: '创意LED台灯，三档调光，护眼阅读，USB充电，折叠便携',
            moq: 100,
            unit: '台',
            priceTiers: '[{"minQty":100,"price":18.0},{"minQty":500,"price":15.0},{"minQty":1000,"price":12.0}]',
            weight: 280,
            volumeL: 20,
            volumeW: 12,
            volumeH: 8,
            status: 'published',
            viewCount: 163,
            inquiryCount: 7,
          },
          {
            merchantId: merchant.id,
            title: '厨房多功能刀具套装',
            subtitle: '不锈钢 五件套',
            category: 'hardware',
            coverImage: '',
            images: '[]',
            description: '厨房多功能刀具五件套，不锈钢材质，锋利耐用',
            moq: 50,
            unit: '套',
            priceTiers: '[{"minQty":50,"price":45.0},{"minQty":200,"price":38.0},{"minQty":500,"price":32.0}]',
            weight: 850,
            volumeL: 40,
            volumeW: 20,
            volumeH: 8,
            status: 'published',
            viewCount: 98,
            inquiryCount: 4,
            isInWarehouse: true,
            warehouseStock: 200,
          },
          {
            merchantId: merchant.id,
            title: '日用品收纳箱',
            subtitle: '折叠设计 防潮防尘',
            category: 'daily',
            coverImage: '',
            images: '[]',
            description: '日用品收纳箱，折叠设计，防潮防尘，多场景适用',
            moq: 200,
            unit: '个',
            priceTiers: '[{"minQty":200,"price":6.0},{"minQty":1000,"price":4.5},{"minQty":5000,"price":3.5}]',
            weight: 200,
            volumeL: 30,
            volumeW: 22,
            volumeH: 15,
            status: 'published',
            viewCount: 87,
            inquiryCount: 3,
            isInWarehouse: true,
            warehouseStock: 500,
          },
          {
            merchantId: merchant.id,
            title: '男女同款棒球帽',
            subtitle: '刺绣字母 遮阳防晒',
            category: 'clothing',
            coverImage: '',
            images: '[]',
            description: '男女同款棒球帽，刺绣字母设计，遮阳防晒，多色可选',
            moq: 100,
            unit: '顶',
            priceTiers: '[{"minQty":100,"price":7.5},{"minQty":500,"price":6.0},{"minQty":2000,"price":4.5}]',
            weight: 65,
            volumeL: 28,
            volumeW: 22,
            volumeH: 12,
            status: 'published',
            viewCount: 132,
            inquiryCount: 6,
          },
          {
            merchantId: merchant.id,
            title: '电子打火机套装',
            subtitle: 'USB充电 弧形双弧',
            category: 'lighters',
            coverImage: '',
            images: '[]',
            description: '电子打火机，USB充电，弧形双弧点火，时尚便携',
            moq: 100,
            unit: '个',
            priceTiers: '[{"minQty":100,"price":12.0},{"minQty":500,"price":9.0},{"minQty":2000,"price":7.0}]',
            weight: 55,
            volumeL: 10,
            volumeW: 4,
            volumeH: 3,
            status: 'published',
            viewCount: 198,
            inquiryCount: 14,
            isInWarehouse: true,
            warehouseStock: 300,
          },
        ],
      })
      results.push('Added 8 more products')
    } else {
      results.push('Additional products already exist')
    }

    // Add sample inquiries for buyer
    const existingInquiries = await db.inquiry.count({ where: { buyerId: buyer.id } })
    if (existingInquiries === 0) {
      const products = await db.product.findMany({
        where: { merchantId: merchant.id, status: 'published' },
        take: 4,
      })

      if (products.length >= 3) {
        await db.inquiry.createMany({
          data: [
            {
              buyerId: buyer.id,
              merchantId: merchant.id,
              productId: products[0].id,
              quantity: 500,
              message: '请问500个起的价格是多少？是否可以提供样品？',
              needSample: true,
              expectedDate: '2026-06-15',
              status: 'replied',
              replyMessage: '您好！500个起的价格是3.0元/个，样品可以免费提供，运费到付。',
              quotedPrice: 3.0,
              repliedAt: new Date('2026-05-09'),
            },
            {
              buyerId: buyer.id,
              merchantId: merchant.id,
              productId: products[1].id,
              quantity: 200,
              message: '请问这款工具钳200把的批发价？交期多久？',
              status: 'pending',
            },
            {
              buyerId: buyer.id,
              merchantId: merchant.id,
              productId: products[2].id,
              quantity: 1000,
              message: '请问1000个收纳盒的价格，是否支持定制logo？',
              status: 'replied',
              replyMessage: '1000个起4.0元/个，支持定制logo，需要加收0.5元/个的印刷费。',
              quotedPrice: 4.5,
              repliedAt: new Date('2026-05-08'),
            },
          ],
        })
        results.push('Created 3 sample inquiries')
      }
    } else {
      results.push('Inquiries already exist')
    }

    // Add sample messages for buyer
    const existingMessages = await db.message.count({ where: { userId: buyer.id } })
    if (existingMessages === 0) {
      await db.message.createMany({
        data: [
          {
            userId: buyer.id,
            title: '欢迎注册邵东选品平台',
            content: '尊敬的用户，欢迎您注册邵东选品平台！您可以浏览商品、发起询盘、在线下单。',
            type: 'system',
            isRead: true,
          },
          {
            userId: buyer.id,
            title: '询盘已回复',
            content: '商家"邵东优品商行"已回复您的询盘"防风直冲打火机"，报价：¥3.00/个',
            type: 'inquiry',
            isRead: false,
            linkUrl: '/buyer/inquiries',
          },
          {
            userId: buyer.id,
            title: '询盘已回复',
            content: '商家"邵东优品商行"已回复您的询盘"创意家居收纳盒"，报价：¥4.50/个',
            type: 'inquiry',
            isRead: false,
            linkUrl: '/buyer/inquiries',
          },
          {
            userId: buyer.id,
            title: '平台物流渠道更新',
            content: '平台新增"云途专线"物流渠道，5-10天送达，覆盖美英德法等国家。',
            type: 'system',
            isRead: true,
          },
        ],
      })
      results.push('Created 4 sample messages')
    } else {
      results.push('Messages already exist')
    }

    // Add sample order for buyer
    const existingOrders = await db.order.count({ where: { buyerId: buyer.id } })
    if (existingOrders === 0) {
      const products = await db.product.findMany({
        where: { merchantId: merchant.id, status: 'published' },
        take: 1,
      })
      if (products.length > 0) {
        await db.order.create({
          data: {
            orderNo: generateOrderNo(),
            buyerId: buyer.id,
            merchantId: merchant.id,
            items: JSON.stringify([
              {
                productId: products[0].id,
                title: products[0].title,
                quantity: 500,
                price: 3.0,
                unit: products[0].unit,
              },
            ]),
            subtotal: 1500,
            logisticsFee: 85,
            labelFee: 0,
            totalAmount: 1585,
            commissionAmount: 75,
            usePlatformLogistics: true,
            logisticsOption: '中邮小包',
            receiverName: 'Ivan Petrov',
            receiverPhone: '+7-916-1234567',
            receiverAddress: 'Moscow, Tverskaya St, 15',
            receiverCountry: '俄罗斯',
            needWarehouse: false,
            needLabel: false,
            status: 'pending_payment',
          },
        })
        results.push('Created 1 sample order')
      }
    } else {
      results.push('Orders already exist')
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Extended seed error:', error)
    return NextResponse.json(
      { error: '扩展种子数据创建失败', details: String(error) },
      { status: 500 }
    )
  }
}
