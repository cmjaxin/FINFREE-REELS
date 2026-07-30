'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function BrandingPage() {
  const [template, setTemplate] = useState('split')

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono text-neo-muted mb-2">STAMPED ON EVERY RENDER</p>
          <h2 className="text-page-title text-text-light mb-2">Branding & end card</h2>
        </div>
        <button className="px-4 py-2 bg-neo-navy hover:bg-neo-navy-hover text-white rounded-lg transition font-medium">
          Save & re-render queue
        </button>
      </div>

      <div className="grid grid-cols-[392px_1fr] gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="bg-gray-900 rounded-lg border border-gray-800-dashed border-dashed p-6 text-center">
            <p className="font-mono text-sm text-gray-100-muted mb-2">DROP NEO LOGO</p>
            <p className="font-mono text-xs text-neo-faint">SVG OR PNG · TRANSPARENT · MIN 600PX WIDE</p>
          </div>

          {/* Palette */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-sm font-semibold text-text-light mb-4">Palette</h3>
            <div className="space-y-3">
              {[
                { name: 'Primary NEO navy', color: '#0C2033' },
                { name: 'Accent NEO cyan', color: '#4BC8F2' },
                { name: 'End card text', color: '#F2F7FA' },
                { name: 'Disclaimer text', color: '#61798A' },
              ].map((swatch) => (
                <div key={swatch.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded border border-gray-800" style={{ backgroundColor: swatch.color }} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-100">{swatch.name}</p>
                    <p className="font-mono text-xs text-neo-faint">{swatch.color}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* End Card Fields */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-sm font-semibold text-text-light mb-4">End card fields</h3>
            <div className="space-y-3">
              {['Officer name', 'Title + NMLS #', 'Direct phone', 'Email', 'Headshot'].map((field) => (
                <label key={field} className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-gray-100">{field}</span>
                </label>
              ))}
            </div>
          </div>

          {/* End Card Hold */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-100">End card hold</p>
              <span className="font-mono text-sm font-bold text-neo-navy">3.0s</span>
            </div>
            <input type="range" min="1" max="5" defaultValue="3" step="0.1" className="w-full" />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-sm font-semibold text-text-light mb-4">Template</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'split', label: 'Split', desc: 'Headshot right' },
                { id: 'centered', label: 'Centered', desc: 'Portrait on top' },
                { id: 'lower', label: 'Lower band', desc: 'Full-width strip' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`p-3 rounded-lg border transition ${
                    template === t.id
                      ? 'border-neo-navy bg-neo-navy/5'
                      : 'border-gray-800 hover:border-neo-navy'
                  }`}
                >
                  <div className="w-full aspect-video bg-gradient-to-b from-neo-navy to-neo-navy-raised rounded mb-2" />
                  <p className="text-xs font-medium text-gray-100">{t.label}</p>
                  <p className="font-mono text-xs text-neo-faint">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Officer Selection */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-sm font-semibold text-text-light mb-3">Preview as</h3>
            <div className="flex gap-2 flex-wrap">
              {['Dana Whitfield', 'Marcus Oyelaran', 'Alex Chen'].map((officer) => (
                <button
                  key={officer}
                  className="px-3 py-1 bg-neo-surface-subtle border border-gray-800 text-gray-100 text-xs rounded hover:bg-neo-navy hover:text-white hover:border-neo-navy transition"
                >
                  {officer}
                </button>
              ))}
            </div>
          </div>

          {/* End Card Preview */}
          <div className="bg-neo-navy rounded-lg overflow-hidden aspect-video flex items-center justify-center text-neo-cyan text-sm">
            <div className="text-center">
              <p className="font-mono text-xs text-neo-dark-text-muted mb-2">PREVIEW</p>
              <p className="text-neo-dark-text">16:9 end card</p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-neo-cyan-tint-bg text-neo-cyan-tint-fg rounded-lg">
              <p className="font-mono font-bold mb-1">APPLIES TO</p>
              <p>All future renders</p>
            </div>
            <div className="p-3 bg-neo-neutral pill bg-neo-surface-subtle text-gray-100-muted rounded-lg">
              <p className="font-mono font-bold mb-1">PER-OFFICER</p>
              <p>Headshots stamp per user record</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
