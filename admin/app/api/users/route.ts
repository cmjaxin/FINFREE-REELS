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
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      fullName,
      password,
      role = 'loan_officer',
      direct_phone,
      title_on_end_card,
      nmls_number,
    } = body

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase admin credentials')
    }

    // Create auth account with admin client
    const authClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: authData, error: authError } = await authClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError) throw new Error(`Auth creation failed: ${authError.message}`)

    // Create user record in database with all contact info
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          full_name: fullName,
          role,
          status: 'active',
          auth_id: authData?.user?.id,
          direct_phone: direct_phone || null,
          title_on_end_card: title_on_end_card || null,
          nmls_number: nmls_number || null,
        },
      ])
      .select()

    if (error) throw error

    // Supabase automatically sends confirmation email when email_confirm is false
    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
