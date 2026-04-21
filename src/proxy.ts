import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  // Use the proxy session handler for auth redirects
  // This prevents expensive redirect chains by handling auth at the edge
  return await updateSession(request)
}
