'use client'

import { useState, useEffect } from 'react'

interface BrandingSettings {
  id?: string
  logo_url?: string
  disclaimer_text: string
  equal_housing_text: string
  end_card_hold_seconds: number
}

export default function BrandingPage() {
  const [branding, setBranding] = useState<BrandingSettings>({
    disclaimer_text: 'This is not an offer to enter into an agreement. Not all customers will be approved.',
    equal_housing_text: 'Equal Housing Lender',
    end_card_hold_seconds: 3,
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBranding()
  }, [])

  const fetchBranding = async () => {
    try {
      const res = await fetch('/api/branding')
      const data = await res.json()
      if (data && data.id) {
        setBranding(data)
      }
    } catch (error) {
      console.error('Error fetching branding:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const res = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      })

      if (res.ok) {
        alert('Branding saved!')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error: any) {
      alert('Error saving branding: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono text-gray-400 mb-2">STAMPED ON EVERY RENDER</p>
          <h2 className="text-page-title text-text-light mb-2">End card branding</h2>
          <p className="text-sm text-gray-400">Clean white vertical card with officer info</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-light text-white rounded-lg transition font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>

      <div className="grid grid-cols-[1fr_400px] gap-8">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-sm font-semibold text-text-light mb-4">Logo</h3>
            <div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-8 text-center mb-3">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="w-24 h-24 mx-auto object-contain" />
              ) : (
                <p className="text-gray-500 text-sm">Paste logo URL here</p>
              )}
            </div>
            <input
              type="text"
              placeholder="Logo URL (optional)"
              value={branding.logo_url || ''}
              onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary text-sm"
            />
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-sm font-semibold text-text-light mb-4">Disclaimer text</h3>
            <textarea
              value={branding.disclaimer_text}
              onChange={(e) => setBranding({ ...branding, disclaimer_text: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary text-sm"
              rows={3}
              placeholder="Disclaimer text shown at bottom of end card"
            />
            <p className="text-xs text-gray-500 mt-2">Shown in small gray text at bottom</p>
          </div>

          {/* Equal Housing */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-sm font-semibold text-text-light mb-4">Equal Housing text</h3>
            <input
              type="text"
              value={branding.equal_housing_text}
              onChange={(e) => setBranding({ ...branding, equal_housing_text: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-text-light rounded-lg focus:outline-none focus:border-primary text-sm"
              placeholder="Equal Housing Lender"
            />
          </div>

          {/* Hold time */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-100">End card duration</p>
              <span className="font-mono text-sm font-bold text-primary">{branding.end_card_hold_seconds}s</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={branding.end_card_hold_seconds}
              onChange={(e) =>
                setBranding({ ...branding, end_card_hold_seconds: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>
        </div>

        {/* Right Column - Preview */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-lg sticky top-20">
            {/* Preview */}
            <div className="aspect-[9/16] bg-white flex flex-col items-center justify-between p-6">
              {/* Logo area */}
              <div className="w-full h-24 flex items-center justify-center bg-gray-50 rounded mb-4">
                {branding.logo_url ? (
                  <img src={branding.logo_url} alt="Logo" className="max-w-full max-h-full" />
                ) : (
                  <p className="text-gray-400 text-xs">Logo preview</p>
                )}
              </div>

              {/* Officer info */}
              <div className="text-center flex-1 flex flex-col justify-center">
                <p className="text-lg font-bold text-gray-900 mb-1">Officer Name</p>
                <p className="text-sm text-gray-600 mb-2">Senior Loan Officer • NMLS #123456</p>
                <p className="text-sm text-gray-600 mb-1">officer@company.com</p>
                <p className="text-sm text-gray-600">(555) 123-4567</p>
              </div>

              {/* Disclaimer */}
              <div className="border-t border-gray-300 pt-4 text-center">
                <p className="text-xs text-gray-500 mb-2">{branding.disclaimer_text}</p>
                <p className="text-xs font-semibold text-gray-700">{branding.equal_housing_text}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
