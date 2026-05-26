'use client'

import { Entry } from '@/types'
import { calcSummary } from '@/lib/calculations'

interface Props {
  entries: Entry[]
}

function signColor(value: number): string {
  if (value > 0) return 'text-green-400'
  if (value < 0) return 'text-red-400'
  return 'text-gray-500'
}

function fmtR(value: number): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}R$ ${Math.abs(value).toFixed(2).replace('.', ',')}`
}

function fmtPlain(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export default function SummaryCards({ entries }: Props) {
  const s = calcSummary(entries)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Net result */}
      <div className="bg-[#0a1f0a] border border-[#1a4d1a] rounded-xl p-5">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">
          Resultado Total
        </p>
        <p className={`text-3xl font-bold ${signColor(s.totalNet)}`}>
          {fmtR(s.totalNet)}
        </p>
        <p className="text-gray-600 text-xs mt-2">no período selecionado</p>
      </div>

      {/* BR4 */}
      <div className="bg-[#0a0a1f] border border-[#1a1a4d] rounded-xl p-5">
        <p className="text-blue-400 text-xs uppercase tracking-widest mb-2">
          🔵 BR4
        </p>
        <p className={`text-3xl font-bold ${signColor(s.br4Net)}`}>
          {fmtR(s.br4Net)}
        </p>
        <p className="text-gray-600 text-xs mt-2">
          inv: {fmtPlain(s.br4TotalIn)} · saída: {fmtPlain(s.br4TotalOut)}
        </p>
      </div>

      {/* Stake */}
      <div className="bg-[#0a0a1f] border border-[#1a1a4d] rounded-xl p-5">
        <p className="text-purple-400 text-xs uppercase tracking-widest mb-2">
          🟣 Stake
        </p>
        <p className={`text-3xl font-bold ${signColor(s.stakeNet)}`}>
          {fmtR(s.stakeNet)}
        </p>
        <p className="text-gray-600 text-xs mt-2">
          inv: {fmtPlain(s.stakeTotalIn)} · saída: {fmtPlain(s.stakeTotalOut)}
        </p>
      </div>
    </div>
  )
}
