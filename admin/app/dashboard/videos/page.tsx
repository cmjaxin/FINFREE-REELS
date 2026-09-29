'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

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

interface RenderJob {
  id: string
  bot_status: 'pending' | 'processing' | 'done' | 'failed'
  output_url: string | null
  error_message: string | null
  created_at: string
}

function SendToEditorButton({ video }: { video: Video }) {
  const [job, setJob] = useState<RenderJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const subRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Load existing job on mount
  useEffect(() => {
    fetch(`/api/render-jobs?video_id=${video.id}`)
      .then(r => r.json())
      .then(data => { setJob(data ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [video.id])

  // Subscribe to Realtime updates when a job exists and isn't done/failed
  useEffect(() => {
    if (!job || job.bot_status === 'done' || job.bot_status === 'failed') return
    if (!supabase) return

    const channel = supabase
      .channel(`render_job_${job.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'render_jobs',
        filter: `id=eq.${job.id}`,
      }, payload => {
        setJob(prev => prev ? { ...prev, ...(payload.new as Partial<RenderJob>) } : prev)
      })
      .subscribe()

    subRef.current = channel
    return () => { supabase?.removeChannel(channel) }
  }, [job?.id, job?.bot_status])

  async function sendToEditor() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/render-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: video.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setJob(data)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  // Job done — show finished video link
  if (job?.bot_status === 'done' && job.output_url) {
    return (
      <a
        href={job.output_url}
        download
        className="block mt-3 w-full px-3 py-2 bg-green-600 text-white rounded font-medium text-sm text-center hover:bg-green-500 transition"
      >
        ⬇ Download Edited Video
      </a>
    )
  }

  // Job failed
  if (job?.bot_status === 'failed') {
    return (
      <div className="mt-3">
        <p className="text-xs text-red-400 mb-2">{job.error_message || 'Edit failed'}</p>
        <button
          onClick={sendToEditor}
          disabled={submitting}
          className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded font-medium text-sm hover:bg-gray-600 transition disabled:opacity-50"
        >
          Retry
        </button>
      </div>
    )
  }

  // Job in progress
  if (job?.bot_status === 'pending' || job?.bot_status === 'processing') {
    return (
      <div className="mt-3 w-full px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 font-mono text-xs text-center">
        <span className="inline-block animate-pulse mr-1">●</span>
        {job.bot_status === 'pending' ? 'Waiting for Video Editor…' : 'Editing in progress…'}
      </div>
    )
  }

  // No job yet — show button
  return (
    <button
      onClick={sendToEditor}
      disabled={submitting}
      className="block mt-3 w-full px-3 py-2 bg-primary text-black rounded font-bold text-sm text-center hover:bg-primary-dark transition disabled:opacity-50"
    >
      {submitting ? 'Sending…' : '✂ Send to Video Editor'}
    </button>
  )
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
      if (filter !== 'all') url.searchParams.set('status', filter)
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
      case 'ready': return 'bg-green-500/20 text-green-400'
      case 'rendering': return 'bg-yellow-500/20 text-yellow-400'
      case 'error': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
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

                <SendToEditorButton video={video} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
