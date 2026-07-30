'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/supabase/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data?.session) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neo-page-bg">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neo-navy mb-2">NEO Reels</h1>
          <p className="text-neo-body-muted">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neo-body mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-neo-border-input rounded-lg focus:outline-none focus:border-neo-cyan"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neo-body mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-neo-border-input rounded-lg focus:outline-none focus:border-neo-cyan"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-neo-red-bg text-neo-red-fg rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neo-navy hover:bg-neo-navy-hover text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neo-body-muted">
          Demo: Use your NEO Reels account credentials
        </div>
      </div>
    </div>
  )
}
