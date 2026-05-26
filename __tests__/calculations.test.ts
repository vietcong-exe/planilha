import {
  calcBr4Result,
  calcStakeResult,
  calcDayResult,
  calcSummary,
  formatCurrency,
} from '@/lib/calculations'
import { Entry } from '@/types'

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: 'test-id',
    date: '2026-05-26',
    br4_in: 200,
    br4_out: 150,
    stake_in: 200,
    stake_out: 550,
    created_at: '2026-05-26T00:00:00Z',
    ...overrides,
  }
}

describe('calcBr4Result', () => {
  it('returns negative when br4_out < br4_in', () => {
    expect(calcBr4Result(makeEntry({ br4_in: 200, br4_out: 150 }))).toBe(-50)
  })
  it('returns positive when br4_out > br4_in', () => {
    expect(calcBr4Result(makeEntry({ br4_in: 100, br4_out: 220 }))).toBe(120)
  })
  it('returns zero when equal', () => {
    expect(calcBr4Result(makeEntry({ br4_in: 100, br4_out: 100 }))).toBe(0)
  })
})

describe('calcStakeResult', () => {
  it('returns positive when stake_out > stake_in', () => {
    expect(calcStakeResult(makeEntry({ stake_in: 200, stake_out: 550 }))).toBe(350)
  })
  it('returns negative when stake_out < stake_in', () => {
    expect(calcStakeResult(makeEntry({ stake_in: 200, stake_out: 0 }))).toBe(-200)
  })
})

describe('calcDayResult', () => {
  it('sums br4 and stake results', () => {
    const entry = makeEntry({ br4_in: 200, br4_out: 150, stake_in: 200, stake_out: 550 })
    expect(calcDayResult(entry)).toBe(300)
  })
  it('can be negative if both houses lose', () => {
    const entry = makeEntry({ br4_in: 100, br4_out: 80, stake_in: 100, stake_out: 90 })
    expect(calcDayResult(entry)).toBe(-30)
  })
})

describe('calcSummary', () => {
  it('returns all-zero summary for empty array', () => {
    const s = calcSummary([])
    expect(s.totalNet).toBe(0)
    expect(s.br4Net).toBe(0)
    expect(s.stakeNet).toBe(0)
    expect(s.br4TotalIn).toBe(0)
    expect(s.stakeTotalIn).toBe(0)
  })

  it('aggregates two entries correctly', () => {
    const entries = [
      makeEntry({ br4_in: 200, br4_out: 150, stake_in: 200, stake_out: 550 }),
      makeEntry({ br4_in: 100, br4_out: 240, stake_in: 100, stake_out: 70 }),
    ]
    const s = calcSummary(entries)
    expect(s.br4Net).toBe(90)      // -50 + 140
    expect(s.stakeNet).toBe(320)   // 350 + (-30)
    expect(s.totalNet).toBe(410)
    expect(s.br4TotalIn).toBe(300)
    expect(s.br4TotalOut).toBe(390)
    expect(s.stakeTotalIn).toBe(300)
    expect(s.stakeTotalOut).toBe(620)
  })
})

describe('formatCurrency', () => {
  it('formats positive with + prefix', () => {
    expect(formatCurrency(300)).toBe('+R$ 300,00')
  })
  it('formats negative with - prefix', () => {
    expect(formatCurrency(-50)).toBe('-R$ 50,00')
  })
  it('formats zero as positive', () => {
    expect(formatCurrency(0)).toBe('+R$ 0,00')
  })
  it('handles decimal values', () => {
    expect(formatCurrency(1234.5)).toBe('+R$ 1234,50')
  })
})
