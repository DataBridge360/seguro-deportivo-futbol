'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CargaMasivaPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/productor/jugadores')
  }, [router])

  return null
}
