'use client'

import { useEffect, useState } from 'react'

interface Scene {
  id?: string
  kind: 'hook' | 'body' | 'cta'
  text: string
  duration_seconds: number
}

interface Script {
  id: string
  title: string
  slug: string
  status: 'draft' | 'live' | 'archived'
  scenes: Scene[]
  created_at: string
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    scenes: [
      { kind: 'hook' as const, text: '', duration_seconds: 30 },
      { kind: 'body' as const, text: '', duration_seconds: 60 },
      { kind: 'cta' as const, text: '', duration_seconds: 15 },
    ],
  })

  useEffect(() => {
    fetchScripts()
  }, [])

  const fetchScripts = async () => {
    try {
      const res = await fetch('/api/scripts')
      const data = await res.json()
      setScripts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching scripts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateScript = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.slug) return

    try {
      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          scenes: formData.scenes,
        }),
      })

      if (res.ok) {
        setFormData({
          title: '',
          slug: '',
          scenes: [
            { kind: 'hook', text: '', duration_seconds: 30 },
            { kind: 'body', text: '', duration_seconds: 60 },
            { kind: 'cta', text: '', duration_seconds: 15 },
          ],
        })
        setShowForm(false)
        fetchScripts()
      } else {
        throw new Error('Failed to create script')
      }
    } catch (error) {
      console.error('Error creating script:', error)
    }
  }

  const updateScene = (idx: number, field: string, value: any) => {
    const newScenes = [...formData.scenes]
    newScenes[idx] = { ...newScenes[idx], [field]: value }
    setFormData({ ...formData, scenes: newScenes })
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono text-gray-400 mb-2">ASSIGNABLE CONTENT</p>
          <h2 className="text-page-title text-text-light mb-2">Scripts</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-light text-white rounded-lg transition font-medium"
        >
          {showForm ? 'Cancel' : 'New script'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8">
          <form onSubmit={handleCreateScript} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Script title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="URL slug (e.g., refi-breakeven)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-300">Scenes</p>
              {formData.scenes.map((scene, idx) => (
                <div key={idx} className="bg-gray-800 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-xs text-gray-400 uppercase">{scene.kind}</p>
                    <input
                      type="number"
                      placeholder="Duration (sec)"
                      value={scene.duration_seconds}
                      onChange={(e) => updateScene(idx, 'duration_seconds', parseInt(e.target.value))}
                      className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 text-text-light rounded text-sm"
                    />
                  </div>
                  <textarea
                    placeholder="Scene text/instructions"
                    value={scene.text}
                    onChange={(e) => updateScene(idx, 'text', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-text-light rounded-lg focus:outline-none focus:border-primary text-sm"
                    rows={3}
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-light text-white rounded-lg transition font-medium"
            >
              Create script
            </button>
          </form>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-4 bg-gray-800 border-b border-gray-800">
          <p className="font-mono text-sm text-gray-400">
            {loading ? 'Loading...' : `${scripts.length} SCRIPTS`}
          </p>
        </div>
        <div className="divide-y divide-gray-800">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading scripts...</div>
          ) : scripts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No scripts yet. Create one above!</div>
          ) : (
            scripts.map((script) => (
              <div key={script.id} className="p-4 hover:bg-gray-800 transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-text-light">{script.title}</p>
                    <p className="font-mono text-xs text-gray-400">{script.slug}</p>
                  </div>
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-mono font-bold rounded">
                    {script.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-400">3 scenes</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
