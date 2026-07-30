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
  title_on_end_card?: string
  direct_phone?: string
  work_email?: string
  nmls_number?: string
  headshot_url?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    directPhone: '',
    titleOnEndCard: '',
    nmslNumber: '',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.fullName) return

    setCreatingUser(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          direct_phone: formData.directPhone,
          title_on_end_card: formData.titleOnEndCard,
          nmls_number: formData.nmslNumber,
        }),
      })
      if (res.ok) {
        setFormData({
          fullName: '',
          email: '',
          directPhone: '',
          titleOnEndCard: '',
          nmslNumber: '',
        })
        setShowForm(false)
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
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono text-gray-400 mb-2">{users.length} ACCOUNTS</p>
          <h2 className="text-page-title text-text-light mb-4">Users</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-light text-white rounded-lg transition font-medium"
        >
          {showForm ? 'Cancel' : 'Add officer'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8">
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full name *</label>
                <input
                  type="text"
                  placeholder="e.g., Matt Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email *</label>
                <input
                  type="email"
                  placeholder="e.g., matt@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Phone</label>
                <input
                  type="tel"
                  placeholder="e.g., (555) 123-4567"
                  value={formData.directPhone}
                  onChange={(e) => setFormData({ ...formData, directPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">NMLS Number</label>
                <input
                  type="text"
                  placeholder="e.g., 123456"
                  value={formData.nmslNumber}
                  onChange={(e) => setFormData({ ...formData, nmslNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Title</label>
              <input
                type="text"
                placeholder="e.g., Senior Loan Officer"
                value={formData.titleOnEndCard}
                onChange={(e) => setFormData({ ...formData, titleOnEndCard: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            <p className="text-xs text-gray-500">
              * Required. Officer will receive an invite email to set their password. All fields shown on end card.
            </p>

            <button
              type="submit"
              disabled={creatingUser}
              className="w-full px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-light text-white rounded-lg transition font-medium disabled:opacity-50"
            >
              {creatingUser ? 'Creating...' : 'Create officer'}
            </button>
          </form>
        </div>
      )}

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
              <div key={user.id} className="p-4 hover:bg-gray-800 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                      {initials(user.full_name)}
                    </div>
                    <div>
                      <p className="font-medium text-text-light">{user.full_name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-mono font-bold rounded w-fit">
                    {user.status.toUpperCase()}
                  </span>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-4 gap-4 text-sm ml-13 pl-3 border-l border-gray-700">
                  {user.direct_phone && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Phone</p>
                      <p className="text-gray-300">{user.direct_phone}</p>
                    </div>
                  )}
                  {user.nmls_number && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">NMLS</p>
                      <p className="text-gray-300">{user.nmls_number}</p>
                    </div>
                  )}
                  {user.title_on_end_card && (
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Title</p>
                      <p className="text-gray-300">{user.title_on_end_card}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Created</p>
                    <p className="text-gray-300 font-mono text-xs">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
