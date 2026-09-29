import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase credentials')
  return createClient(url, key)
}

// POST /api/render-jobs — create a job from a video's clips
export async function POST(request: NextRequest) {
  try {
    const { video_id } = await request.json()
    if (!video_id) return NextResponse.json({ error: 'video_id required' }, { status: 400 })

    const supabase = getSupabase()

    // Fetch clips ordered by scene_order
    const { data: clips, error: clipsErr } = await supabase
      .from('video_clips')
      .select('clip_url, scenes(scene_order)')
      .eq('video_id', video_id)
      .order('scenes(scene_order)', { ascending: true })

    if (clipsErr) throw clipsErr
    if (!clips || clips.length === 0) {
      return NextResponse.json({ error: 'No clips found for this video' }, { status: 404 })
    }

    const clip_urls = clips.map((c: any) => c.clip_url)

    // Create the render job
    const { data: job, error: jobErr } = await supabase
      .from('render_jobs')
      .insert({ video_id, clip_urls, status: 'pending' })
      .select('id, status, created_at')
      .single()

    if (jobErr) throw jobErr

    return NextResponse.json(job)
  } catch (error: any) {
    console.error('Error creating render job:', error)
    return NextResponse.json({ error: error.message || 'Failed to create render job' }, { status: 500 })
  }
}

// GET /api/render-jobs?video_id=xxx — check job status
export async function GET(request: NextRequest) {
  try {
    const video_id = request.nextUrl.searchParams.get('video_id')
    if (!video_id) return NextResponse.json({ error: 'video_id required' }, { status: 400 })

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('render_jobs')
      .select('id, status, output_url, error_message, created_at, updated_at')
      .eq('video_id', video_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return NextResponse.json(data ?? null)
  } catch (error: any) {
    console.error('Error fetching render job:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch render job' }, { status: 500 })
  }
}
