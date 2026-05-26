'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

interface Props {
  dateFrom: string | null
  dateTo: string | null
}

export default function PeriodFilter({ dateFrom, dateTo }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [from, setFrom] = useState(dateFrom ?? '')
  const [to, setTo] = useState(dateTo ?? '')

  function handleFilter() {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  function handleClear() {
    setFrom('')
    setTo('')
    router.push(pathname)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-gray-500 text-xs uppercase tracking-wider">
        Período:
      </span>
      <input
        type="date"
        value={from}
        onChange={e => setFrom(e.target.value)}
        className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
      />
      <span className="text-gray-600">→</span>
      <input
        type="date"
        value={to}
        onChange={e => setTo(e.target.value)}
        className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
      />
      <button
        onClick={handleFilter}
        className="bg-blue-900 text-blue-400 px-4 py-1.5 rounded text-sm hover:bg-blue-800 transition-colors"
      >
        Filtrar
      </button>
      <button
        onClick={handleClear}
        className="bg-[#1a1a1a] border border-[#333] text-gray-500 px-4 py-1.5 rounded text-sm hover:bg-[#222] transition-colors"
      >
        Tudo
      </button>
    </div>
  )
}
