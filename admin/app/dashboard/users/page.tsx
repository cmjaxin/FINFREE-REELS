'use client'

export const dynamic = 'force-dynamic'

export default function UsersPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-neo-muted mb-2">24 ACCOUNTS · 3 PENDING INVITES</p>
        <h2 className="text-page-title text-neo-ink mb-4">Users</h2>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-neo-navy hover:bg-neo-navy-hover text-white rounded-lg transition font-medium">
            Invite loan officer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neo-border overflow-hidden">
        <div className="p-4 bg-neo-surface-subtle border-b border-neo-border">
          <p className="font-mono text-sm text-neo-faint">SHOWING 7 OF 24</p>
        </div>
        <div className="divide-y divide-neo-border">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="p-4 grid grid-cols-[2.3fr_1fr_0.8fr_0.7fr_1fr_0.9fr] gap-4 items-center hover:bg-neo-surface-subtle transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neo-cyan to-neo-cyan-deep flex items-center justify-center text-white text-xs font-bold">
                  DA
                </div>
                <div>
                  <p className="font-medium text-neo-ink">Dana Whitfield</p>
                  <p className="text-xs text-neo-body-muted">dana@example.com</p>
                </div>
              </div>
              <p className="text-sm text-neo-body">Loan Officer</p>
              <p className="font-mono text-sm text-neo-muted">14</p>
              <p className="font-mono text-sm text-neo-muted">8</p>
              <p className="font-mono text-xs text-neo-body-muted">JUL 29, 3:20 PM</p>
              <span className="px-2 py-1 bg-neo-cyan-tint-bg text-neo-cyan-tint-fg text-xs font-mono font-bold rounded w-fit">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
