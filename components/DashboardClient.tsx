'use client'

import { useState } from 'react'
import { Entry } from '@/types'
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

export default function DashboardClient({ entries, dateFrom, dateTo }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<Entry | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<Entry | null>(null)

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
        <EntryModal entry={editEntry} onClose={handleModalClose} />
      )}

      {deleteEntry && (
        <DeleteConfirm entry={deleteEntry} onClose={handleDeleteClose} />
      )}
    </div>
  )
}
