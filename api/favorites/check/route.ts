import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ isFavorited: false })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ isFavorited: false })
    }

    const favorite = await db.favorite.findUnique({
      where: {
        userId_productId: { userId: user.id, productId },
      },
    })

    return NextResponse.json({ isFavorited: !!favorite, favoriteId: favorite?.id })
  } catch (error) {
    console.error('Favorites check error:', error)
    return NextResponse.json({ isFavorited: false })
  }
}
