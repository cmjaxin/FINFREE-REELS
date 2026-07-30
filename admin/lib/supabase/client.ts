import { createClient } from '@supabase/supabase-js'

let supabase: any = null

export function getSupabase() {
  if (typeof window === 'undefined') {
    // Server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    return createClient(supabaseUrl, supabaseKey)
  } else {
    // Client-side
    if (!supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      supabase = createClient(supabaseUrl, supabaseKey)
    }
    return supabase
  }
}

export const supabase = new Proxy({}, {
  get: (target, prop) => {
    return getSupabase()[prop as string]
  }
}) as any
