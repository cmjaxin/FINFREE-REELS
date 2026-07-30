'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function VideosPage() {
  const [filter, setFilter] = useState('all')

  const filters = ['All', 'Ready', 'Rendering', 'Needs review', 'Awaiting scenes']

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-neo-muted mb-2">RAW SCENES IN · STITCHED FILE OUT</p>
        <h2 className="text-page-title text-text-light mb-4">Videos</h2>
        <p className="font-mono text-gray-100-muted">312 RENDERED ALL TIME</p>
      </div>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f.toLowerCase())}
            className={`px-3 py-1 rounded transition font-mono text-sm ${
              filter === f.toLowerCase() || (filter === 'all' && f === 'All')
                ? 'bg-neo-navy text-white'
                : 'bg-gray-900 text-gray-100 border border-gray-800 hover:border-neo-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-neo-ink transition">
            {/* Video Placeholder */}
            <div className="aspect-video bg-gradient-to-b from-neo-border to-neo-border-soft flex items-center justify-center text-neo-muted relative group">
              <button className="w-12 h-12 rounded-full bg-gray-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                ▶
              </button>
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 bg-neo-cyan text-neo-navy font-mono text-xs rounded font-bold">READY</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-2">
                <span className="px-2 py-1 bg-neo-navy/70 text-white font-mono text-xs rounded">REFI-BREAKEVEN-01</span>
                <span className="px-2 py-1 bg-black/60 text-white font-mono text-xs rounded ml-auto">0:45</span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-medium text-text-light mb-1">Refi breakeven analysis</h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neo-cyan to-neo-cyan-deep flex items-center justify-center text-white text-xs font-bold">
                  DA
                </div>
                <p className="font-mono text-xs text-gray-100-muted">JUL 30, 2:15 PM</p>
              </div>
              <div className="mb-3 pb-3 border-t border-gray-800 pt-3">
                <p className="font-mono text-xs text-gray-100-muted mb-2">SCENE 2 AUDIO 11 LUFS BELOW TARGET</p>
              </div>
              <button className="w-full px-3 py-2 bg-neo-cyan text-neo-navy rounded font-medium text-sm hover:bg-neo-cyan-deep hover:text-white transition">
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
