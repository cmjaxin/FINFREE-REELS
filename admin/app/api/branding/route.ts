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
      .from('branding')
      .select('*')
      .eq('id', 'default')
      .single()

    if (error) return NextResponse.json({})
    return NextResponse.json(data || {})
  } catch (error) {
    return NextResponse.json({})
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('branding')
      .update(body)
      .eq('id', 'default')

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Branding error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
