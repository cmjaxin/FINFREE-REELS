import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json({ error: 'videoId required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const shotStackApiKey = process.env.SHOTSTACK_API_KEY
    const shotStackUrl = process.env.SHOTSTACK_API_URL

    if (!shotStackApiKey || !shotStackUrl) {
      throw new Error('Missing Shotstack credentials')
    }

    // Get video and clips
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*, video_clips(*, scenes(*))')
      .eq('id', videoId)
      .single()

    if (videoError || !video) throw new Error('Video not found')

    // Get officer info
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', video.user_id)
      .single()

    // Branding settings (hardcoded for MVP)
    const branding = {
      logo_url: 'https://8blocks.s3-us-west-1.amazonaws.com/neo/images/logo.png',
      disclaimer_text: '© 2026 Better Home & Finance Holding Company and/or its affiliates. Better is a family of companies. Better Mortgage Corporation provides home loans; Better Real Estate, LLC and Better Real Estate California Inc License # 02164055 provides real estate services; Better Cover, LLC sells insurance products; and Better Settlement Services provides title insurance services; and Better Inspect, LLC provides home inspection services. All rights reserved.',
      end_card_text_color: '#FFFFFF',
      disclaimer_text_color: '#999999',
      end_card_hold_seconds: 3,
    }

    // Build Shotstack timeline from clips
    const clips = (video.video_clips || []).sort((a: any, b: any) => a.scenes.scene_order - b.scenes.scene_order)

    const timeline: any = {
      background: { color: '#000000' },
      tracks: [
        {
          clips: clips.map((clip: any) => ({
            type: 'video',
            asset: {
              type: 'video',
              src: clip.clip_url,
            },
            length: clip.duration_seconds || 5,
          })),
        },
      ],
    }

    // Build end card with officer info
    const endCardClips: any[] = []

    // Officer name
    endCardClips.push({
      type: 'title',
      text: user?.full_name || 'Officer',
      style: 'bold',
      color: branding.end_card_text_color,
      size: 'large',
      position: 'top-left',
      length: branding.end_card_hold_seconds,
    })

    // Title and NMLS
    if (user?.title_on_end_card || user?.nmls_number) {
      endCardClips.push({
        type: 'title',
        text: `${user?.title_on_end_card || ''} ${user?.nmls_number ? `• NMLS #${user.nmls_number}` : ''}`.trim(),
        style: 'normal',
        color: branding.end_card_text_color,
        size: 'small',
        position: 'top-left',
        offsetY: 40,
        length: branding.end_card_hold_seconds,
      })
    }

    // Phone
    if (user?.direct_phone) {
      endCardClips.push({
        type: 'title',
        text: user.direct_phone,
        style: 'normal',
        color: branding.disclaimer_text_color,
        size: 'small',
        position: 'bottom-left',
        length: branding.end_card_hold_seconds,
      })
    }

    // Email
    if (user?.work_email) {
      endCardClips.push({
        type: 'title',
        text: user.work_email,
        style: 'normal',
        color: branding.disclaimer_text_color,
        size: 'small',
        position: 'bottom-left',
        offsetY: -20,
        length: branding.end_card_hold_seconds,
      })
    }

    // Disclaimer
    endCardClips.push({
      type: 'title',
      text: branding.disclaimer_text,
      style: 'normal',
      color: branding.disclaimer_text_color,
      size: 'xsmall',
      position: 'bottom-center',
      length: branding.end_card_hold_seconds,
    })

    // Add end card track
    if (endCardClips.length > 0) {
      timeline.tracks.push({
        clips: endCardClips,
      })
    }

    // Send to Shotstack
    const shotStackResponse = await fetch(`${shotStackUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': shotStackApiKey,
      },
      body: JSON.stringify({
        timeline,
        output: {
          format: 'mp4',
          resolution: '1920x1080',
        },
      }),
    })

    if (!shotStackResponse.ok) {
      throw new Error('Shotstack API error: ' + (await shotStackResponse.text()))
    }

    const shotStackData = await shotStackResponse.json()
    const renderId = shotStackData.response.id

    // Update video with render job ID
    const { error: updateError } = await supabase
      .from('videos')
      .update({ render_job_id: renderId, status: 'rendering', updated_at: new Date().toISOString() })
      .eq('id', videoId)

    if (updateError) throw updateError

    return NextResponse.json({ renderId, videoId })
  } catch (error: any) {
    console.error('Render error:', error)
    return NextResponse.json({ error: error.message || 'Render failed' }, { status: 500 })
  }
}
