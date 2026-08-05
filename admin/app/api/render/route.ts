import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase credentials')
  return createClient(supabaseUrl, supabaseKey)
}

const LOGO_URL = 'https://8blocks.s3-us-west-1.amazonaws.com/neo/images/logo.png'
const DISCLAIMER = '© 2026 NEO Home Loans and/or its affiliates. All rights reserved. Equal Housing Lender.'
const END_CARD_SECONDS = 4

// Build an HTML end card as a single Shotstack HTML asset — avoids all positioning conflicts
function buildEndCardHtml(name: string, title: string, nmls: string, phone: string, email: string) {
  const titleLine = [title, nmls ? `NMLS# ${nmls}` : ''].filter(Boolean).join(' • ')
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 720px; height: 1280px;
    background: #0C2033;
    font-family: Arial, sans-serif;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 80px 60px 60px;
  }
  .logo { width: 160px; }
  .info { text-align: center; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
  .name { font-size: 38px; font-weight: 700; color: #fff; }
  .title { font-size: 22px; color: #a0b4c8; }
  .contact { font-size: 20px; color: #c0d0dc; margin-top: 6px; }
  .disclaimer { font-size: 11px; color: #4a6070; text-align: center; line-height: 1.4; }
  .ehl { width: 28px; margin-bottom: 6px; }
</style>
</head>
<body>
  <img class="logo" src="${LOGO_URL}" />
  <div class="info">
    <div class="name">${name}</div>
    ${titleLine ? `<div class="title">${titleLine}</div>` : ''}
    ${phone ? `<div class="contact">${phone}</div>` : ''}
    ${email ? `<div class="contact">${email}</div>` : ''}
  </div>
  <div>
    <div class="disclaimer">${DISCLAIMER}</div>
  </div>
</body>
</html>`.trim()
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

    // Sort clips by scene order
    const clips = (video.video_clips || []).sort(
      (a: any, b: any) => (a.scenes?.scene_order ?? 0) - (b.scenes?.scene_order ?? 0)
    )

    // Build main video track — chain clips sequentially with speech trimming
    let cursor = 0
    const videoClips: any[] = []
    const captionClips: any[] = []

    for (const clip of clips) {
      const rawDuration = clip.duration_seconds || 5
      const speechStart: number = clip.speech_start_seconds ?? 0
      const speechEnd: number = clip.speech_end_seconds ?? rawDuration

      // Only trim silence if speech starts more than 0.08s in (avoids black-frame bug on near-zero values)
      const trimIn = speechStart > 0.08 ? speechStart - 0.05 : 0
      const clipDuration = Math.max(0.5, (speechEnd + 0.05) - trimIn)

      const videoClip: any = {
        asset: { type: 'video', src: clip.clip_url },
        start: cursor,
        length: clipDuration,
      }
      if (trimIn > 0) videoClip.asset.trim = trimIn

      videoClips.push(videoClip)

      // Caption for this clip if transcript text is available
      const transcript: string = clip.transcript_text || ''
      if (transcript.trim()) {
        captionClips.push({
          asset: {
            type: 'html',
            html: `<html><body style="margin:0;padding:0;display:flex;align-items:flex-end;justify-content:center;width:720px;height:1280px;"><div style="background:rgba(0,0,0,0.62);color:#fff;font-family:Arial,sans-serif;font-size:32px;font-weight:600;line-height:1.35;text-align:center;padding:14px 24px;border-radius:10px;margin-bottom:80px;width:660px;word-break:break-word;">${transcript.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div></body></html>`,
            width: 720,
            height: 1280,
            background: 'transparent',
          },
          start: cursor,
          length: clipDuration,
        })
      }

      cursor += clipDuration
    }

    // End card as single HTML clip
    const endCardHtml = buildEndCardHtml(
      user?.full_name || 'Loan Officer',
      user?.title_on_end_card || '',
      user?.nmls_number || '',
      user?.direct_phone || '',
      user?.work_email || ''
    )

    const endCardClip = {
      asset: {
        type: 'html',
        html: endCardHtml,
        width: 720,
        height: 1280,
        background: '#0C2033',
      },
      start: cursor,
      length: END_CARD_SECONDS,
    }

    const tracks: any[] = [{ clips: videoClips }, { clips: [endCardClip] }]
    if (captionClips.length > 0) tracks.push({ clips: captionClips })

    const timeline = {
      background: { color: '#000000' },
      tracks,
    }

    const shotStackResponse = await fetch(shotStackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': shotStackApiKey,
      },
      body: JSON.stringify({
        timeline,
        output: {
          format: 'mp4',
          resolution: 'sd',    // 720×1280 portrait (SD vertical)
          aspectRatio: '9:16',
          fps: 30,
        },
      }),
    })

    if (!shotStackResponse.ok) {
      throw new Error('Shotstack API error: ' + (await shotStackResponse.text()))
    }

    const shotStackData = await shotStackResponse.json()
    const renderId = shotStackData.response?.id

    await supabase
      .from('videos')
      .update({ render_job_id: renderId, status: 'rendering', updated_at: new Date().toISOString() })
      .eq('id', videoId)

    return NextResponse.json({ renderId, videoId })
  } catch (error: any) {
    console.error('Render error:', error)
    return NextResponse.json({ error: error.message || 'Render failed' }, { status: 500 })
  }
}
