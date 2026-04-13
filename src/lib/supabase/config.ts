function requirePublicEnv(name: string, value: string | undefined) {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`Missing Supabase environment variable: ${name}`)
  }

  return normalizedValue
}

export const supabaseUrl = requirePublicEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  process.env.NEXT_PUBLIC_SUPABASE_URL
)

export const supabaseAnonKey = requirePublicEnv(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
