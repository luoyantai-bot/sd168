'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MerchantAccountRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/merchant/settings/account')
  }, [router])
  return null
}
