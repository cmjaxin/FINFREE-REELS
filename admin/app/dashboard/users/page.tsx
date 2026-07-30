'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail || !newUserName) return

    setCreatingUser(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail, fullName: newUserName }),
      })
      if (res.ok) {
        setNewUserEmail('')
        setNewUserName('')
        fetchUsers()
      }
    } catch (error) {
      console.error('Error creating user:', error)
    } finally {
      setCreatingUser(false)
    }
  }

  const initials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-gray-400 mb-2">{users.length} ACCOUNTS</p>
        <h2 className="text-page-title text-text-light mb-4">Users</h2>

        {/* Create User Form */}
        <form onSubmit={handleCreateUser} className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary"
            disabled={creatingUser}
          />
          <input
            type="text"
            placeholder="Full name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary"
            disabled={creatingUser}
          />
          <button
            type="submit"
            disabled={creatingUser || !newUserEmail || !newUserName}
            className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-light text-white rounded-lg transition font-medium disabled:opacity-50"
          >
            {creatingUser ? 'Adding...' : 'Add user'}
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-4 bg-gray-800 border-b border-gray-800">
          <p className="font-mono text-sm text-gray-400">
            {loading ? 'Loading...' : `SHOWING ${users.length}`}
          </p>
        </div>
        <div className="divide-y divide-gray-800">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No users yet. Add one above!</div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="p-4 grid grid-cols-[2.3fr_1fr_0.8fr_1fr_0.9fr] gap-4 items-center hover:bg-gray-800 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                    {initials(user.full_name)}
                  </div>
                  <div>
                    <p className="font-medium text-text-light">{user.full_name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 capitalize">{user.role}</p>
                <p className="font-mono text-xs text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-mono font-bold rounded w-fit">
                  {user.status.toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
