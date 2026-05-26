import { createServerClient } from '@/lib/supabase-server'
import { Entry } from '@/types'
import DashboardClient from '@/components/DashboardClient'

// Force dynamic rendering — prevents Next.js from caching Supabase fetch responses.
// Without this, router.refresh() re-renders the component server-side but the
// underlying fetch() calls return stale cached data instead of querying Supabase.
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { from?: string; to?: string }
}

export default async function Home({ searchParams }: PageProps) {
  const supabase = createServerClient()

  let query = supabase
    .from('entries')
    .select('*')
    .order('date', { ascending: false })

  if (searchParams.from) query = query.gte('date', searchParams.from)
  if (searchParams.to)   query = query.lte('date', searchParams.to)

  const { data, error } = await query

  // TEMPORARY DIAGNOSTIC — remove after debugging
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'MISSING'
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (error || !data) {
    return (
      <div style={{ color: 'white', padding: '40px', fontFamily: 'monospace' }}>
        <h2 style={{ color: 'red' }}>⚠ Supabase fetch failed</h2>
        <p><b>URL:</b> {supabaseUrl.slice(0, 40)}...</p>
        <p><b>Key present:</b> {String(hasKey)}</p>
        <p><b>Error:</b> {error?.message ?? 'no error but data is null'}</p>
        <p><b>Error code:</b> {error?.code ?? 'none'}</p>
      </div>
    )
  }

  const entries = (data as Entry[]) ?? []

  return (
    <>
      {/* TEMPORARY: show row count for debugging */}
      {entries.length === 0 && (
        <div style={{ color: 'yellow', padding: '8px 40px', fontFamily: 'monospace', fontSize: 12 }}>
          DEBUG: query returned 0 rows | URL: {supabaseUrl.slice(0, 35)}... | key: {String(hasKey)}
        </div>
      )}
      <DashboardClient
        entries={entries}
        dateFrom={searchParams.from ?? null}
        dateTo={searchParams.to ?? null}
      />
    </>
  )
}
