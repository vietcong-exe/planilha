'use client'

import { useState, useEffect } from 'react'
import { Entry, EntryFormData } from '@/types'
import { supabase } from '@/lib/supabase'

interface Props {
  entry: Entry | null   // null = create mode, non-null = edit mode
  onSuccess: () => void
  onClose: () => void
}

function toFormData(entry: Entry | null): EntryFormData {
  if (!entry) {
    const today = new Date().toISOString().split('T')[0]
    return { date: today, br4_in: '', br4_out: '', stake_in: '', stake_out: '' }
  }
  return {
    date: entry.date,
    br4_in: entry.br4_in.toString(),
    br4_out: entry.br4_out.toString(),
    stake_in: entry.stake_in.toString(),
    stake_out: entry.stake_out.toString(),
  }
}

function parseNum(val: string): number {
  return parseFloat(val.replace(',', '.')) || 0
}

function signColor(val: number): string {
  if (val > 0) return 'text-green-400'
  if (val < 0) return 'text-red-400'
  return 'text-gray-500'
}

export default function EntryModal({ entry, onSuccess, onClose }: Props) {
  const [form, setForm] = useState<EntryFormData>(toFormData(entry))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(toFormData(entry))
    setError(null)
  }, [entry])

  // Live preview calculations
  const br4In = parseNum(form.br4_in)
  const br4Out = parseNum(form.br4_out)
  const stakeIn = parseNum(form.stake_in)
  const stakeOut = parseNum(form.stake_out)
  const br4Result = br4Out - br4In
  const stakeResult = stakeOut - stakeIn
  const netResult = br4Result + stakeResult
  const hasPreview = form.br4_in || form.br4_out || form.stake_in || form.stake_out

  function fmtDelta(val: number): string {
    const sign = val >= 0 ? '+' : '-'
    return `${sign}R$ ${Math.abs(val).toFixed(2).replace('.', ',')}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.date) {
      setError('Data é obrigatória.')
      return
    }

    const payload = {
      date: form.date,
      br4_in: parseNum(form.br4_in),
      br4_out: parseNum(form.br4_out),
      stake_in: parseNum(form.stake_in),
      stake_out: parseNum(form.stake_out),
    }

    setLoading(true)

    const result = entry
      ? await supabase.from('entries').update(payload).eq('id', entry.id)
      : await supabase.from('entries').insert(payload)

    setLoading(false)

    if (result.error) {
      if (result.error.code === '23505') {
        setError('Já existe um registro para esta data.')
      } else {
        setError(result.error.message)
      }
      return
    }

    onSuccess()
    onClose()
  }

  const inputCls =
    'w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-blue-500'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-5">
          {entry ? 'Editar dia' : 'Registrar novo dia'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-gray-500 text-xs uppercase tracking-wider mb-1">
              Data
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className={inputCls}
            />
          </div>

          {/* BR4 + Stake side by side */}
          <div className="grid grid-cols-2 gap-4">
            {/* BR4 */}
            <div>
              <p className="text-blue-400 text-xs uppercase tracking-wider mb-2">🔵 BR4</p>
              <label className="block text-gray-600 text-xs mb-1">Quanto entrou</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={form.br4_in}
                onChange={e => setForm(f => ({ ...f, br4_in: e.target.value }))}
                className={`${inputCls} mb-2`}
              />
              <label className="block text-gray-600 text-xs mb-1">Quanto saiu</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={form.br4_out}
                onChange={e => setForm(f => ({ ...f, br4_out: e.target.value }))}
                className={inputCls}
              />
            </div>

            {/* Stake */}
            <div>
              <p className="text-purple-400 text-xs uppercase tracking-wider mb-2">🟣 Stake</p>
              <label className="block text-gray-600 text-xs mb-1">Quanto entrou</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={form.stake_in}
                onChange={e => setForm(f => ({ ...f, stake_in: e.target.value }))}
                className={`${inputCls} mb-2`}
              />
              <label className="block text-gray-600 text-xs mb-1">Quanto saiu</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={form.stake_out}
                onChange={e => setForm(f => ({ ...f, stake_out: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Live preview */}
          {hasPreview && (
            <div className="bg-[#0a1f0a] border border-[#1a4d1a] rounded-lg px-4 py-3">
              <p className="text-gray-600 text-xs mb-2 uppercase tracking-wider">
                Resultado calculado
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-sm ${signColor(br4Result)}`}>
                  BR4: {fmtDelta(br4Result)}
                </span>
                <span className={`text-sm ${signColor(stakeResult)}`}>
                  Stake: {fmtDelta(stakeResult)}
                </span>
                <span className={`font-bold ml-auto text-base ${signColor(netResult)}`}>
                  NET: {fmtDelta(netResult)}
                </span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-900 text-green-400 py-2.5 rounded-lg font-medium hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-[#1a1a1a] border border-[#333] text-gray-500 px-5 py-2.5 rounded-lg hover:bg-[#222] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
