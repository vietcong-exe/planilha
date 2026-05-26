import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Force every HTTP request this client makes to bypass
        // Next.js's server-side fetch cache, so F5 always returns live data.
        fetch: (url, options = {}) =>
          fetch(url, { ...(options as RequestInit), cache: 'no-store' }),
      },
    }
  )
}
