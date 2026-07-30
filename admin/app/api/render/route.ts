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

    const { data: user } = await supabase.from('users').select('*').eq('id', video.user_id).single()

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

    // Add end card with officer info
    timeline.tracks.push({
      clips: [
        {
          type: 'title',
          text: user?.full_name || 'Officer',
          style: 'bold',
          color: '#FFFFFF',
          size: 'medium',
          background: { color: '#2DAEFF' },
          length: 3,
        },
      ],
    })

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
      .update({ render_job_id: renderId, status: 'rendering' })
      .eq('id', videoId)

    if (updateError) throw updateError

    return NextResponse.json({ renderId, videoId })
  } catch (error: any) {
    console.error('Render error:', error)
    return NextResponse.json({ error: error.message || 'Render failed' }, { status: 500 })
  }
}
