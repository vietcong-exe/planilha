'use client'

import { Entry } from '@/types'
import { calcBr4Result, calcStakeResult, calcDayResult } from '@/lib/calculations'

interface Props {
  entries: Entry[]
  onEdit: (entry: Entry) => void
  onDelete: (entry: Entry) => void
}

function signColor(value: number): string {
  if (value > 0) return 'text-green-400'
  if (value < 0) return 'text-red-400'
  return 'text-gray-500'
}

function fmtDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year.slice(2)}`
}

function fmtAmt(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

function fmtDelta(value: number): string {
  const sign = value >= 0 ? '+' : '-'
  return `${sign}${fmtAmt(Math.abs(value))}`
}

export default function EntriesTable({ entries, onEdit, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-xl p-10 text-center text-gray-600 text-sm">
        Nenhum registro ainda. Clique em &quot;+ Novo dia&quot; para começar.
      </div>
    )
  }

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-[90px_1fr_1fr_120px_72px] gap-2 px-4 py-3 bg-[#1a1a1a] text-gray-600 text-xs uppercase tracking-wider min-w-[620px]">
        <span>Data</span>
        <span>BR4 (entrou → saiu)</span>
        <span>Stake (entrou → saiu)</span>
        <span className="text-right">Resultado</span>
        <span></span>
      </div>

      {entries.map(entry => {
        const br4Result = calcBr4Result(entry)
        const stakeResult = calcStakeResult(entry)
        const dayResult = calcDayResult(entry)

        return (
          <div
            key={entry.id}
            className="grid grid-cols-[90px_1fr_1fr_120px_72px] gap-2 px-4 py-3 border-t border-[#1e1e1e] text-sm items-center hover:bg-[#141414] transition-colors min-w-[620px]"
          >
            <span className="text-gray-500">{fmtDate(entry.date)}</span>

            {/* BR4 */}
            <span className="text-gray-300">
              R${fmtAmt(entry.br4_in)} →{' '}
              <span className={signColor(br4Result)}>R${fmtAmt(entry.br4_out)}</span>
              <span className={`text-xs ml-1 ${signColor(br4Result)}`}>
                ({fmtDelta(br4Result)})
              </span>
            </span>

            {/* Stake */}
            <span className="text-gray-300">
              R${fmtAmt(entry.stake_in)} →{' '}
              <span className={signColor(stakeResult)}>R${fmtAmt(entry.stake_out)}</span>
              <span className={`text-xs ml-1 ${signColor(stakeResult)}`}>
                ({fmtDelta(stakeResult)})
              </span>
            </span>

            {/* Day result */}
            <span className={`font-bold text-right ${signColor(dayResult)}`}>
              {dayResult >= 0 ? '+' : '-'}R${fmtAmt(Math.abs(dayResult))}
            </span>

            {/* Actions */}
            <span className="flex gap-3 justify-end">
              <button
                onClick={() => onEdit(entry)}
                title="Editar"
                className="text-gray-600 hover:text-blue-400 transition-colors"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(entry)}
                title="Deletar"
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                🗑️
              </button>
            </span>
          </div>
        )
      })}
    </div>
  )
}
