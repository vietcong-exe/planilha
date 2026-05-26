import { createServerClient } from '@/lib/supabase-server'
import { Entry } from '@/types'
import DashboardClient from '@/components/DashboardClient'

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

  if (error) console.error('[entries fetch]', error.message)

  const entries = (data as Entry[]) ?? []

  return (
    <DashboardClient
      entries={entries}
      dateFrom={searchParams.from ?? null}
      dateTo={searchParams.to ?? null}
    />
  )
}
