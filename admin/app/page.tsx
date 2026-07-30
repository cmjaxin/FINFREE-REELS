'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/supabase/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await getSession()
      if (data?.session) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
    checkSession()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-neo-body-muted">Loading...</p>
    </div>
  )
}
