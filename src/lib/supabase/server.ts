import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const safeOptions = { ...options }
              if (process.env.NODE_ENV !== 'production') {
                safeOptions.secure = false
                safeOptions.sameSite = 'lax'
              }
              cookieStore.set(name, value, safeOptions)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceRoleKey) {
    return null
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
