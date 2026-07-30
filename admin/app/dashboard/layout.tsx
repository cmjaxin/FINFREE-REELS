'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSession, signOut, getUser } from '@/lib/supabase/auth'
import clsx from 'clsx'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: sessionData } = await getSession()
      if (!sessionData?.session) {
        router.push('/login')
        return
      }
      const { data: userData } = await getUser()
      setUser(userData?.user)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Users', href: '/dashboard/users', icon: '👥' },
    { label: 'Scripts', href: '/dashboard/scripts', icon: '📝' },
    { label: 'Videos', href: '/dashboard/videos', icon: '🎬' },
    { label: 'Branding', href: '/dashboard/branding', icon: '🎨' },
  ]

  return (
    <div className="flex h-screen bg-neo-page-bg">
      {/* Sidebar */}
      <aside className="w-sidebar bg-gray-900 border-r border-gray-800 sticky top-0 overflow-y-auto">
        <div className="p-6">
          {/* Company Block */}
          <div className="mb-8">
            <img src="/logo.svg" alt="Splice" className="w-12 h-12 mb-3"/>
            <h2 className="font-bold text-text-light text-lg">Splice</h2>
            <p className="text-xs text-primary mt-1">PROFESSIONAL VIDEOS</p>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                    isActive
                      ? 'bg-gradient-to-r from-primary to-accent text-white font-semibold'
                      : 'text-gray-400 hover:text-text-light hover:bg-gray-800'
                  )}
                >
                  <span className="w-2 h-2 rounded-full" style={{
                    backgroundColor: isActive ? '#2DAEFF' : '#666',
                  }} />
                  {item.label}
                </a>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
              CJ
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-light truncate">Colin Jenson</p>
              <p className="text-xs text-gray-400 truncate">Admin</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-danger transition"
              title="Sign out"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-950">
        {/* Top Chrome */}
        <header className="h-chrome bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800 sticky top-0 z-40 flex items-center px-8">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Splice" className="w-8 h-8"/>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Splice</span>
          </div>
          <div className="ml-auto text-sm text-gray-400">
            ADMIN
          </div>
        </header>

        {/* Content */}
        <div className="p-8 text-text-light">
          {children}
        </div>
      </main>
    </div>
  )
}
