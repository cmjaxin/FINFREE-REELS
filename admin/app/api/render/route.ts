import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase credentials')
  return createClient(supabaseUrl, supabaseKey)
}

const LOGO_URL = 'https://8blocks.s3-us-west-1.amazonaws.com/neo/images/logo.png'
const DISCLAIMER = '© 2026 NEO Home Loans. All rights reserved. Equal Housing Lender.'
const END_CARD_SECONDS = 5

// Shotstack portrait output — 720×1280 @ 30fps
const OUTPUT = {
  format: 'mp4',
  fps: 30,
  size: { width: 720, height: 1280 },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId } = body

    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 })

    const supabase = getSupabaseClient()
    const shotStackApiKey = process.env.SHOTSTACK_API_KEY
    const shotStackUrl = process.env.SHOTSTACK_API_URL
    if (!shotStackApiKey || !shotStackUrl) throw new Error('Missing Shotstack credentials')

    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*, video_clips(*, scenes(*))')
      .eq('id', videoId)
      .single()

    if (videoError || !video) throw new Error('Video not found')

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', video.user_id)
      .single()

    // Sort by scene order
    const clips = ((video.video_clips as any[]) || [])
      .filter((c: any) => c.clip_url)
      .sort((a: any, b: any) => (a.scenes?.scene_order ?? 0) - (b.scenes?.scene_order ?? 0))

    if (clips.length === 0) throw new Error('No clips found for this video')

    // ── Main video track ─────────────────────────────────────────────────────
    let cursor = 0
    const videoClips: any[] = []
    const captionClips: any[] = []

    for (const clip of clips) {
      const duration: number = clip.duration_seconds || 10 // fallback 10s if not stored
      const start = Math.round(cursor * 100) / 100
      const length = Math.round(duration * 100) / 100

      videoClips.push({
        asset: { type: 'video', src: clip.clip_url },
        start,
        length,
        fit: 'cover',
      })

      // Caption using native Shotstack title asset (works on all plans)
      const transcript: string = (clip.transcript_text || '').trim()
      if (transcript) {
        captionClips.push({
          asset: {
            type: 'title',
            text: transcript.toUpperCase(),
            style: 'future',        // clean sans-serif, white on transparent
            color: '#ffffff',
            size: 'small',
            background: '#000000',  // black pill behind text
            position: 'bottom',
          },
          start,
          length,
          position: 'bottom',
          offset: { x: 0, y: 0.12 }, // pull up from very bottom
        })
      }

      cursor += duration
    }

    // ── End card track ────────────────────────────────────────────────────────
    // Navy background block
    const endStart = Math.round(cursor * 100) / 100
    const endCardClips: any[] = []

    endCardClips.push({
      asset: { type: 'color', color: '#0C2033' },
      start: endStart,
      length: END_CARD_SECONDS,
    })

    // NEO logo
    endCardClips.push({
      asset: { type: 'image', src: LOGO_URL },
      start: endStart,
      length: END_CARD_SECONDS,
      position: 'top',
      offset: { x: 0, y: -0.1 },
      scale: 0.25,
    })

    // Officer name
    const name = user?.full_name || 'Loan Officer'
    endCardClips.push({
      asset: {
        type: 'title',
        text: name,
        style: 'future',
        color: '#ffffff',
        size: 'large',
      },
      start: endStart,
      length: END_CARD_SECONDS,
      position: 'center',
      offset: { x: 0, y: 0.08 },
    })

    // Title + NMLS line
    const titleNmls = [
      user?.title_on_end_card,
      user?.nmls_number ? `NMLS# ${user.nmls_number}` : null,
    ].filter(Boolean).join('  •  ')

    if (titleNmls) {
      endCardClips.push({
        asset: {
          type: 'title',
          text: titleNmls,
          style: 'future',
          color: '#a0b4c8',
          size: 'small',
        },
        start: endStart,
        length: END_CARD_SECONDS,
        position: 'center',
        offset: { x: 0, y: -0.02 },
      })
    }

    // Phone + email
    const contact = [user?.direct_phone, user?.work_email].filter(Boolean).join('   ')
    if (contact) {
      endCardClips.push({
        asset: {
          type: 'title',
          text: contact,
          style: 'future',
          color: '#c0d0dc',
          size: 'x-small',
        },
        start: endStart,
        length: END_CARD_SECONDS,
        position: 'center',
        offset: { x: 0, y: -0.1 },
      })
    }

    // Disclaimer
    endCardClips.push({
      asset: {
        type: 'title',
        text: DISCLAIMER,
        style: 'future',
        color: '#4a6070',
        size: 'xx-small',
      },
      start: endStart,
      length: END_CARD_SECONDS,
      position: 'bottom',
      offset: { x: 0, y: 0.05 },
    })

    // ── Assemble tracks ───────────────────────────────────────────────────────
    const tracks: any[] = [
      { clips: videoClips },
      { clips: endCardClips },
    ]
    if (captionClips.length > 0) tracks.push({ clips: captionClips })

    const timeline = {
      background: { color: '#000000' },
      tracks,
    }

    // Log payload for debugging
    console.log('Shotstack payload:', JSON.stringify({ timeline, output: OUTPUT }, null, 2))

    const shotStackResponse = await fetch(shotStackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': shotStackApiKey,
      },
      body: JSON.stringify({ timeline, output: OUTPUT }),
    })

    if (!shotStackResponse.ok) {
      const errText = await shotStackResponse.text()
      console.error('Shotstack error:', errText)
      throw new Error('Shotstack API error: ' + errText)
    }

    const shotStackData = await shotStackResponse.json()
    const renderId = shotStackData.response?.id

    await supabase
      .from('videos')
      .update({ render_job_id: renderId, status: 'rendering', updated_at: new Date().toISOString() })
      .eq('id', videoId)

    return NextResponse.json({ renderId, videoId, clipCount: videoClips.length })
  } catch (error: any) {
    console.error('Render error:', error)
    return NextResponse.json({ error: error.message || 'Render failed' }, { status: 500 })
  }
}
