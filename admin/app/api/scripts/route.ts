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

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching scripts:', error)
    return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, scenes } = body

    if (!title || !slug || !scenes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Create script
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .insert([{ title, slug, status: 'draft' }])
      .select()

    if (scriptError) throw scriptError

    const scriptId = script[0].id

    // Create scenes
    const scenesToInsert = scenes.map((scene: any, idx: number) => ({
      script_id: scriptId,
      kind: scene.kind,
      text: scene.text,
      duration_seconds: scene.duration_seconds,
      scene_order: idx,
    }))

    const { error: scenesError } = await supabase.from('scenes').insert(scenesToInsert)

    if (scenesError) throw scenesError

    return NextResponse.json(script[0], { status: 201 })
  } catch (error) {
    console.error('Error creating script:', error)
    return NextResponse.json({ error: 'Failed to create script' }, { status: 500 })
  }
}
