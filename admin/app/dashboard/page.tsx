'use client'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const stats = [
    { label: 'ACTIVE OFFICERS', value: '18', total: '24', delta: '+3', period: 'vs last week' },
    { label: 'VIDEOS RENDERED', value: '37', unit: 'this week', delta: '+9', period: '' },
    { label: 'SCENES RETAKEN', value: '1.4', unit: 'avg/video', delta: '−0.3', period: '(scripts landing)' },
    { label: 'RECORD → READY', value: '11', unit: 'min median', delta: '−2', period: 'min' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-neo-muted mb-2">WEEK OF JUL 28–AUG 3</p>
          <h2 className="text-page-title text-neo-ink">This week at NEO</h2>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-800-input text-neo-body-muted hover:text-neo-body rounded-lg transition">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-neo-navy hover:bg-neo-navy-hover text-white rounded-lg transition font-medium">
            Generate a script
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-900 p-5 rounded-lg border border-gray-800 hover:border-primary/50 transition">
            <p className="font-mono text-gray-400 mb-3 text-xs">{stat.label}</p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-bold text-text-light">{stat.value}</span>
              {stat.unit && <span className="font-mono text-gray-400">{stat.unit}</span>}
              {stat.total && <span className="font-mono text-gray-400">/ {stat.total}</span>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-400">{stat.delta}</span>
              <span className="font-mono text-xs text-gray-500">{stat.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-[1.35fr_1fr] gap-6">
        {/* Adoption Gaps */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-card-title text-neo-ink">Adoption gaps</h3>
              <span className="px-2 py-1 bg-neo-amber-bg text-neo-amber-fg text-xs font-mono font-bold rounded">
                6 OFFICERS
              </span>
            </div>
            <p className="font-mono text-neo-body-muted">NO UPLOAD IN 14+ DAYS</p>
          </div>
          <div className="divide-y divide-neo-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4 hover:bg-neo-surface-subtle transition">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neo-cyan to-neo-cyan-deep flex items-center justify-center text-white text-sm font-bold">
                  DA
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neo-ink">Dana Whitfield</p>
                  <p className="font-mono text-xs text-neo-body-muted">LAST UPLOAD 22 DAYS AGO · 3 SCRIPTS WAITING</p>
                </div>
                <button className="px-3 py-1 text-sm bg-neo-cyan text-neo-navy rounded hover:bg-neo-cyan-deep hover:text-white transition">
                  Nudge
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-800">
            <a href="#" className="text-neo-cyan-deep hover:text-neo-cyan-deep-hover font-medium text-sm">
              View all 24 officers →
            </a>
          </div>
        </div>

        {/* Render Queue */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-neo-record-red animate-cd-pulse" />
              <h3 className="text-card-title text-neo-ink">Render queue</h3>
            </div>
            <p className="font-mono text-neo-body-muted">LIVE</p>
          </div>
          <div className="divide-y divide-neo-border">
            {[1, 2].map((i) => (
              <div key={i} className="p-4">
                <p className="font-medium text-neo-ink mb-1">Refi breakeven — Dana</p>
                <p className="font-mono text-sm text-neo-body-muted mb-2">75% — STITCHING</p>
                <div className="w-full h-1 bg-neo-border rounded overflow-hidden">
                  <div className="h-full bg-neo-cyan" style={{ width: '75%' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-800">
            <p className="font-mono text-xs text-neo-body-muted text-center">
              MEDIAN RENDER 4M 12S / TRIM → STITCH → NORMALIZE → END CARD
            </p>
          </div>
        </div>
      </div>

      {/* Published This Week */}
      <div>
        <h3 className="text-card-title text-neo-ink mb-4">Published this week</h3>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-neo-ink transition">
              {/* Video Placeholder */}
              <div className="aspect-video bg-gradient-to-b from-neo-border to-neo-border-soft flex items-center justify-center text-neo-muted relative group">
                <button className="w-12 h-12 rounded-full bg-gray-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  ▶
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-2">
                  <span className="px-2 py-1 bg-neo-navy text-white font-mono text-xs rounded">READY</span>
                  <span className="px-2 py-1 bg-black/60 text-white font-mono text-xs rounded ml-auto">0:45</span>
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium text-neo-ink text-sm mb-1">Refi breakeven story</p>
                <p className="font-mono text-xs text-neo-body-muted">DANA WHITFIELD · JUL 30</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
