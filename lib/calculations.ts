import { Entry, Summary } from '@/types'

export function calcBr4Result(entry: Entry): number {
  return entry.br4_out - entry.br4_in
}

export function calcStakeResult(entry: Entry): number {
  return entry.stake_out - entry.stake_in
}

export function calcDayResult(entry: Entry): number {
  return calcBr4Result(entry) + calcStakeResult(entry)
}

export function calcSummary(entries: Entry[]): Summary {
  return {
    totalNet: entries.reduce((acc, e) => acc + calcDayResult(e), 0),
    br4Net: entries.reduce((acc, e) => acc + calcBr4Result(e), 0),
    br4TotalIn: entries.reduce((acc, e) => acc + e.br4_in, 0),
    br4TotalOut: entries.reduce((acc, e) => acc + e.br4_out, 0),
    stakeNet: entries.reduce((acc, e) => acc + calcStakeResult(e), 0),
    stakeTotalIn: entries.reduce((acc, e) => acc + e.stake_in, 0),
    stakeTotalOut: entries.reduce((acc, e) => acc + e.stake_out, 0),
  }
}

export function formatCurrency(value: number): string {
  const abs = Math.abs(value)
  const formatted = abs.toFixed(2).replace('.', ',')
  const prefix = value >= 0 ? '+' : '-'
  return `${prefix}R$ ${formatted}`
}
