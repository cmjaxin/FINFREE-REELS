'use client'

import { useState, useEffect } from 'react'

interface Video {
  id: string
  user_id: string
  script_id: string
  status: string
  total_duration_seconds: number
  file_url: string
  created_at: string
  completed_at: string
  render_job_id: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchVideos()
  }, [filter])

  const fetchVideos = async () => {
    try {
      const url = new URL('/api/videos', window.location.origin)
      if (filter !== 'all') {
        url.searchParams.set('status', filter)
      }
      const res = await fetch(url.toString())
      const data = await res.json()
      setVideos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500/20 text-green-400'
      case 'rendering':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'error':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-gray-400 mb-2">RENDERED OUTPUT</p>
        <h2 className="text-page-title text-text-light mb-4">Videos</h2>

        <div className="flex gap-2 flex-wrap">
          {['all', 'ready', 'rendering', 'awaiting_scenes', 'error'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded transition font-mono text-sm ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-900 text-gray-100 border border-gray-800 hover:border-primary'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-400">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-400">No videos yet</div>
        ) : (
          videos.map((video) => (
            <div key={video.id} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-primary transition">
              <div className="aspect-video bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center text-gray-600">
                {video.file_url ? (
                  <a href={video.file_url} target="_blank" rel="noopener noreferrer">
                    <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center opacity-75 hover:opacity-100 transition">
                      ▶
                    </button>
                  </a>
                ) : (
                  <div className="text-center">
                    <p className="text-sm">Rendering...</p>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-text-light">Video</p>
                  <span className={`px-2 py-1 text-xs font-mono font-bold rounded ${getStatusBadgeColor(video.status)}`}>
                    {video.status.toUpperCase()}
                  </span>
                </div>

                {video.total_duration_seconds && (
                  <p className="text-xs text-gray-400 mb-2">
                    Duration: {formatDuration(video.total_duration_seconds)}
                  </p>
                )}

                <p className="font-mono text-xs text-gray-500">
                  {new Date(video.created_at).toLocaleDateString()}
                </p>

                {video.status === 'ready' && video.file_url && (
                  <a
                    href={video.file_url}
                    download
                    className="block mt-3 w-full px-3 py-2 bg-primary text-black rounded font-medium text-sm text-center hover:bg-primary-dark transition"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
