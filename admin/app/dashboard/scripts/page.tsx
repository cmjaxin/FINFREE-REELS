'use client'

export const dynamic = 'force-dynamic'

export default function ScriptsPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-neo-muted mb-2">SCENE-BASED · ASSIGNABLE</p>
        <h2 className="text-page-title text-text-light mb-4">Scripts</h2>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-gray-100-muted hover:text-gray-100 transition">
            Generate with AI
          </button>
          <button className="px-4 py-2 bg-neo-navy hover:bg-neo-navy-hover text-white rounded-lg transition font-medium">
            New script
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-900 rounded-lg border border-gray-800 p-4 hover:border-neo-ink transition cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-card-title text-text-light font-semibold">Refi breakeven analysis</h3>
              <span className="px-2 py-1 bg-neo-cyan-tint-bg text-neo-cyan-tint-fg text-xs font-mono font-bold rounded">
                LIVE
              </span>
            </div>

            {/* Beat Strip */}
            <div className="flex gap-1 h-12 mb-4 bg-neo-border rounded overflow-hidden">
              <div className="flex-1 bg-neo-cyan-tint-bg flex items-center justify-center">
                <span className="font-mono text-xs text-neo-cyan-tint-fg font-bold">HOOK<br/>8s</span>
              </div>
              <div className="flex-1 bg-neo-surface-subtle flex items-center justify-center">
                <span className="font-mono text-xs text-gray-100-muted font-bold">BODY<br/>16s</span>
              </div>
              <div className="flex-1 bg-neo-surface-subtle flex items-center justify-center">
                <span className="font-mono text-xs text-gray-100-muted font-bold">CTA<br/>8s</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-gray-100-muted">6 OFFICERS · 14 VIDEOS</span>
              <a href="#" className="text-neo-cyan-deep hover:text-neo-cyan-deep-hover">Edit scenes →</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
