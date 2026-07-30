'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getSession, signOut, getUser } from '@/lib/supabase/auth'
import DarkModeToggle from '@/components/DarkModeToggle'
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
      <aside className="w-sidebar bg-neo-sidebar-bg dark:bg-gray-900 border-r border-neo-border dark:border-gray-800 sticky top-0 overflow-y-auto">
        <div className="p-6">
          {/* Company Block */}
          <div className="mb-8 p-4 bg-neo-navy rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-neo-cyan" />
            </div>
            <h2 className="font-bold text-white text-sm">Splice</h2>
            <p className="text-xs text-neo-cyan">PROFESSIONAL VIDEOS</p>
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
                      ? 'bg-white text-neo-navy font-semibold'
                      : 'text-neo-body-muted hover:bg-neo-surface'
                  )}
                >
                  <span className="w-2 h-2 rounded-full" style={{
                    backgroundColor: isActive ? '#4BC8F2' : '#9FAAB2',
                  }} />
                  {item.label}
                </a>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neo-border bg-neo-sidebar-bg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neo-cyan flex items-center justify-center text-neo-navy font-bold text-xs">
              CJ
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neo-ink truncate">Colin Jenson</p>
              <p className="text-xs text-neo-body-muted truncate">Company admin</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-neo-body-muted hover:text-neo-red-action transition"
              title="Sign out"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-neo-page-bg dark:bg-gray-950">
        {/* Top Chrome */}
        <header className="h-chrome bg-neo-navy dark:bg-gray-900 text-white sticky top-0 z-40 flex items-center px-8 border-b border-neo-navy-hairline dark:border-gray-800">
          <h1 className="font-bold">Splice</h1>
          <div className="ml-auto flex items-center gap-4">
            <DarkModeToggle />
            <div className="text-sm text-neo-cyan">
              ADMIN · COLIN JENSON
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
