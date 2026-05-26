'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Entry } from '@/types'
import { supabase } from '@/lib/supabase'

interface Props {
  entry: Entry
  onClose: () => void
}

function fmtDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export default function DeleteConfirm({ entry, onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    const result = await supabase.from('entries').delete().eq('id', entry.id)
    setLoading(false)

    if (result.error) {
      setError('Erro ao deletar. Tente novamente.')
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-sm p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-2">Deletar registro</h2>
        <p className="text-gray-400 text-sm mb-6">
          Tem certeza que quer deletar o registro do dia{' '}
          <span className="text-white font-medium">{fmtDate(entry.date)}</span>?
          Esta ação não pode ser desfeita.
        </p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 bg-red-900 text-red-400 py-2.5 rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Deletando...' : 'Deletar'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="bg-[#1a1a1a] border border-[#333] text-gray-500 px-5 py-2.5 rounded-lg hover:bg-[#222] transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
