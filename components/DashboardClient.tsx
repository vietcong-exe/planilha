'use client'

import { useState, useEffect, useCallback } from 'react'
import { Entry } from '@/types'
import { supabase } from '@/lib/supabase'
import SummaryCards from './SummaryCards'
import PeriodFilter from './PeriodFilter'
import EntriesTable from './EntriesTable'
import EntryModal from './EntryModal'
import DeleteConfirm from './DeleteConfirm'

interface Props {
  entries: Entry[]
  dateFrom: string | null
  dateTo: string | null
}

export default function DashboardClient({ entries: initialEntries, dateFrom, dateTo }: Props) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<Entry | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<Entry | null>(null)

  // When the server re-fetches due to a period filter change, sync local state.
  useEffect(() => {
    setEntries(initialEntries)
  }, [initialEntries])

  // Client-side fetch — re-queries Supabase respecting the active date filter.
  const fetchEntries = useCallback(async () => {
    let query = supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false })

    if (dateFrom) query = query.gte('date', dateFrom)
    if (dateTo)   query = query.lte('date', dateTo)

    const { data } = await query
    if (data) setEntries(data as Entry[])
  }, [dateFrom, dateTo])

  // Supabase Realtime — fires for ANY change made by either user.
  useEffect(() => {
    const channel = supabase
      .channel('entries-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        () => fetchEntries()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEntries])

  function handleNewDay() {
    setEditEntry(null)
    setModalOpen(true)
  }

  function handleEdit(entry: Entry) {
    setEditEntry(entry)
    setModalOpen(true)
  }

  function handleDelete(entry: Entry) {
    setDeleteEntry(entry)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditEntry(null)
  }

  function handleDeleteClose() {
    setDeleteEntry(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Betting Tracker</h1>
          <p className="text-gray-600 text-sm mt-1">BR4 + Stake</p>
        </div>
        <button
          onClick={handleNewDay}
          className="bg-green-900 text-green-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
        >
          + Novo dia
        </button>
      </div>

      <PeriodFilter dateFrom={dateFrom} dateTo={dateTo} />
      <SummaryCards entries={entries} />
      <EntriesTable
        entries={entries}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {modalOpen && (
        <EntryModal
          entry={editEntry}
          onSuccess={fetchEntries}
          onClose={handleModalClose}
        />
      )}

      {deleteEntry && (
        <DeleteConfirm
          entry={deleteEntry}
          onSuccess={fetchEntries}
          onClose={handleDeleteClose}
        />
      )}
    </div>
  )
}
