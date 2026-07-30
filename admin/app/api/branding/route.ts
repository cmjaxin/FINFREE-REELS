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
    const { data, error } = await supabase.from('branding').select('*').limit(1).single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json(data || {})
  } catch (error) {
    console.error('Error fetching branding:', error)
    return NextResponse.json({})
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getSupabaseClient()

    const { data: existing } = await supabase.from('branding').select('id').limit(1).single()

    if (existing?.id) {
      const { error } = await supabase
        .from('branding')
        .update(body)
        .eq('id', existing.id)

      if (error) throw error
    } else {
      const { error } = await supabase.from('branding').insert([body])

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving branding:', error)
    return NextResponse.json({ error: 'Failed to save branding' }, { status: 500 })
  }
}
