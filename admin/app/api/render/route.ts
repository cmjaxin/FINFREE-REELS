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

// Trim first 0.1s from every clip — removes camera-init black frames
const CLIP_TRIM_START = 0.1
// Add 0.3s to every clip length — ensures last frame isn't cut early
const CLIP_END_BUFFER = 0.3

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
      const rawDuration: number = clip.duration_seconds || 10
      const start = Math.round(cursor * 100) / 100
      // Trim 0.1s from start, add 0.3s buffer at end so nothing gets clipped
      const length = Math.round(Math.max(0.5, rawDuration - CLIP_TRIM_START + CLIP_END_BUFFER) * 100) / 100

      videoClips.push({
        asset: {
          type: 'video',
          src: clip.clip_url,
          trim: CLIP_TRIM_START, // skip first 0.1s of every clip
        },
        start,
        length,
        fit: 'cover',
      })

      const transcript: string = (clip.transcript_text || '').trim()
      if (transcript) {
        captionClips.push({
          asset: {
            type: 'title',
            text: transcript.toUpperCase(),
            style: 'minimal',
            color: '#ffffff',
            size: 'small',
            background: '#000000',
          },
          start,
          length,
          position: 'bottom',
          offset: { x: 0, y: 0.1 },
        })
      }

      cursor += length
    }

    // ── End card track ────────────────────────────────────────────────────────
    const endStart = Math.round(cursor * 100) / 100
    const endCardClips: any[] = []

    // Navy background
    endCardClips.push({
      asset: { type: 'color', color: '#0C2033' },
      start: endStart,
      length: END_CARD_SECONDS,
    })

    // Logo — small, top-center
    endCardClips.push({
      asset: { type: 'image', src: LOGO_URL },
      start: endStart,
      length: END_CARD_SECONDS,
      position: 'top',
      offset: { x: 0, y: -0.2 },
      scale: 0.18,
    })

    // Name — large, centered slightly above middle
    endCardClips.push({
      asset: {
        type: 'title',
        text: user?.full_name || 'Loan Officer',
        style: 'minimal',
        color: '#ffffff',
        size: 'large',
      },
      start: endStart,
      length: END_CARD_SECONDS,
      position: 'center',
      offset: { x: 0, y: 0.06 },
    })

    // Title + NMLS — one line, below name
    const titleNmls = [
      user?.title_on_end_card,
      user?.nmls_number ? `NMLS# ${user.nmls_number}` : null,
    ].filter(Boolean).join(' • ')

    if (titleNmls) {
      endCardClips.push({
        asset: {
          type: 'title',
          text: titleNmls,
          style: 'minimal',
          color: '#a0b4c8',
          size: 'x-small',
        },
        start: endStart,
        length: END_CARD_SECONDS,
        position: 'center',
        offset: { x: 0, y: -0.01 },
      })
    }

    // Phone + email — below title
    const contact = [user?.direct_phone, user?.work_email].filter(Boolean).join('  |  ')
    if (contact) {
      endCardClips.push({
        asset: {
          type: 'title',
          text: contact,
          style: 'minimal',
          color: '#c0d0dc',
          size: 'x-small',
        },
        start: endStart,
        length: END_CARD_SECONDS,
        position: 'center',
        offset: { x: 0, y: -0.08 },
      })
    }

    // Disclaimer — bottom
    endCardClips.push({
      asset: {
        type: 'title',
        text: DISCLAIMER,
        style: 'minimal',
        color: '#4a6070',
        size: 'xx-small',
      },
      start: endStart,
      length: END_CARD_SECONDS,
      position: 'bottom',
      offset: { x: 0, y: 0.04 },
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
