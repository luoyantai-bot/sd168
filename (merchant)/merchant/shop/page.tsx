'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MerchantShopRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/merchant/settings/shop')
  }, [router])
  return null
}
