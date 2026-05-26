# Betting Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark-mode Next.js web app to track daily arbitrage bets across BR4 and Stake, with period filtering and summary cards, backed by Supabase PostgreSQL.

**Architecture:** Next.js 14 App Router. `page.tsx` is a Server Component that fetches entries from Supabase and passes them to `DashboardClient` (a Client Component). All mutations (create/edit/delete) happen client-side via Supabase JS SDK, followed by `router.refresh()` to re-sync server state. Period filter lives in URL query params.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js`), Jest (unit tests for calculations), Vercel (deploy).

---

## File Map

| File | Responsibility |
|------|---------------|
| `app/layout.tsx` | Root layout, dark background, metadata |
| `app/page.tsx` | Server Component — reads searchParams, fetches entries, renders DashboardClient |
| `app/globals.css` | Tailwind directives only |
| `types/index.ts` | `Entry`, `EntryFormData`, `Summary` types |
| `lib/calculations.ts` | Pure functions: `calcBr4Result`, `calcStakeResult`, `calcDayResult`, `calcSummary`, `formatCurrency` |
| `lib/supabase.ts` | Browser Supabase client (singleton) |
| `lib/supabase-server.ts` | Server Supabase client factory |
| `components/DashboardClient.tsx` | Client Component — modal state, wires all sub-components |
| `components/SummaryCards.tsx` | 3 summary cards (pure display) |
| `components/PeriodFilter.tsx` | Date range inputs, updates URL query params |
| `components/EntriesTable.tsx` | Table of daily entries with edit/delete buttons |
| `components/EntryModal.tsx` | Modal for create + edit, live result preview |
| `components/DeleteConfirm.tsx` | Delete confirmation dialog |
| `__tests__/calculations.test.ts` | Unit tests for all calculation functions |
| `supabase/schema.sql` | Database schema |
| `.env.local` | Supabase credentials (not committed) |
| `jest.config.ts` | Jest config with Next.js preset |

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.mjs`, `jest.config.ts`

- [ ] **Step 1: Scaffold Next.js 14 with TypeScript + Tailwind in the project dir**

Run in `C:\Users\dimi\Desktop\PLANILHA`:
```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias="@/*"
```

When prompted about the existing directory, type `y` to proceed. When asked about each option interactively, choose:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: `@/*`

Expected output ends with: `Success! Created your Next.js app`

- [ ] **Step 2: Install Supabase JS client**

```bash
npm install @supabase/supabase-js
```

Expected: package added to `node_modules` and `package.json`

- [ ] **Step 3: Install Jest and ts-jest for unit tests**

```bash
npm install -D jest ts-jest @types/jest
```

- [ ] **Step 4: Create `jest.config.ts`**

Create file `jest.config.ts` at project root:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
```

- [ ] **Step 5: Add test script to `package.json`**

Open `package.json`. In the `"scripts"` section, add after the existing scripts:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Create `.env.local` with placeholder values**

Create `.env.local` at project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 7: Verify `.gitignore` includes `.env.local`**

Open `.gitignore` (created by create-next-app). Confirm the line `.env.local` is present. If not, add it.

- [ ] **Step 8: Verify the dev server starts**

```bash
npm run dev
```

Expected: `ready started server on 0.0.0.0:3000`. Open `http://localhost:3000` in browser — default Next.js page should appear. Stop with Ctrl+C.

- [ ] **Step 9: Initial commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 14 + Tailwind + Supabase + Jest"
```

---

## Task 2: Types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Create `types/index.ts`**

```typescript
export type Entry = {
  id: string
  date: string          // 'YYYY-MM-DD'
  br4_in: number
  br4_out: number
  stake_in: number
  stake_out: number
  created_at: string
}

export type EntryFormData = {
  date: string
  br4_in: string        // string so inputs work without forced numeric parsing
  br4_out: string
  stake_in: string
  stake_out: string
}

export type Summary = {
  totalNet: number
  br4Net: number
  br4TotalIn: number
  br4TotalOut: number
  stakeNet: number
  stakeTotalIn: number
  stakeTotalOut: number
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add TypeScript types"
```

---

## Task 3: Calculations library (TDD)

**Files:**
- Create: `__tests__/calculations.test.ts`
- Create: `lib/calculations.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/calculations.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests — confirm they FAIL with "Cannot find module"**

```bash
npm test
```

Expected: `FAIL __tests__/calculations.test.ts` — `Cannot find module '@/lib/calculations'`

- [ ] **Step 3: Create `lib/calculations.ts`**

```typescript
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
```

- [ ] **Step 4: Run tests — confirm they PASS**

```bash
npm test
```

Expected: `PASS __tests__/calculations.test.ts` — all 11 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/calculations.ts __tests__/calculations.test.ts
git commit -m "feat: add calculations lib with passing tests"
```

---

## Task 4: Supabase clients + database schema

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/supabase-server.ts`
- Create: `supabase/schema.sql`

- [ ] **Step 1: Create browser Supabase client `lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

- [ ] **Step 2: Create server Supabase client factory `lib/supabase-server.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create database schema `supabase/schema.sql`**

```sql
create table entries (
  id          uuid          primary key default gen_random_uuid(),
  date        date          not null unique,
  br4_in      numeric(10,2) not null check (br4_in >= 0),
  br4_out     numeric(10,2) not null check (br4_out >= 0),
  stake_in    numeric(10,2) not null check (stake_in >= 0),
  stake_out   numeric(10,2) not null check (stake_out >= 0),
  created_at  timestamptz   default now()
);
```

> **Note:** You will run this SQL later in the Supabase dashboard (Task 13). Do not run it yet.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase.ts lib/supabase-server.ts supabase/schema.sql
git commit -m "feat: add Supabase clients and database schema"
```

---

## Task 5: Root layout + global styles

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace `app/globals.css` with Tailwind directives only**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Betting Tracker',
  description: 'Rastreador de apostas BR4 e Stake',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0d0d0d] text-gray-200 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: configure dark theme root layout"
```

---

## Task 6: SummaryCards component

**Files:**
- Create: `components/SummaryCards.tsx`

- [ ] **Step 1: Create `components/SummaryCards.tsx`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/SummaryCards.tsx
git commit -m "feat: add SummaryCards component"
```

---

## Task 7: PeriodFilter component

**Files:**
- Create: `components/PeriodFilter.tsx`

- [ ] **Step 1: Create `components/PeriodFilter.tsx`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/PeriodFilter.tsx
git commit -m "feat: add PeriodFilter component with URL query params"
```

---

## Task 8: EntriesTable component

**Files:**
- Create: `components/EntriesTable.tsx`

- [ ] **Step 1: Create `components/EntriesTable.tsx`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/EntriesTable.tsx
git commit -m "feat: add EntriesTable component"
```

---

## Task 9: EntryModal component

**Files:**
- Create: `components/EntryModal.tsx`

- [ ] **Step 1: Create `components/EntryModal.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Entry, EntryFormData } from '@/types'
import { supabase } from '@/lib/supabase'

interface Props {
  entry: Entry | null   // null = create mode, non-null = edit mode
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

export default function EntryModal({ entry, onClose }: Props) {
  const router = useRouter()
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

    const payload = {
      date: form.date,
      br4_in: parseNum(form.br4_in),
      br4_out: parseNum(form.br4_out),
      stake_in: parseNum(form.stake_in),
      stake_out: parseNum(form.stake_out),
    }

    if (!form.date) {
      setError('Data é obrigatória.')
      return
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

    router.refresh()
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
```

- [ ] **Step 2: Commit**

```bash
git add components/EntryModal.tsx
git commit -m "feat: add EntryModal with live result preview"
```

---

## Task 10: DeleteConfirm component

**Files:**
- Create: `components/DeleteConfirm.tsx`

- [ ] **Step 1: Create `components/DeleteConfirm.tsx`**

```typescript
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

  async function handleDelete() {
    setLoading(true)
    await supabase.from('entries').delete().eq('id', entry.id)
    setLoading(false)
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
            className="bg-[#1a1a1a] border border-[#333] text-gray-500 px-5 py-2.5 rounded-lg hover:bg-[#222] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/DeleteConfirm.tsx
git commit -m "feat: add DeleteConfirm component"
```

---

## Task 11: DashboardClient component

**Files:**
- Create: `components/DashboardClient.tsx`

- [ ] **Step 1: Create `components/DashboardClient.tsx`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/DashboardClient.tsx
git commit -m "feat: add DashboardClient — wires all sub-components"
```

---

## Task 12: Dashboard page (Server Component)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```typescript
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
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: complete dashboard server component"
```

---

## Task 13: Deploy to Vercel

This task is manual. No code changes required.

- [ ] **Step 1: Create a Supabase project**

1. Go to [https://supabase.com](https://supabase.com) → **New project**
2. Fill in: name `betting-tracker`, choose a strong password, choose a region close to Brazil (South America)
3. Wait for the project to be ready (~2 min)

- [ ] **Step 2: Run the database schema**

1. In the Supabase dashboard → **SQL Editor** → **New query**
2. Paste the contents of `supabase/schema.sql`:

```sql
create table entries (
  id          uuid          primary key default gen_random_uuid(),
  date        date          not null unique,
  br4_in      numeric(10,2) not null check (br4_in >= 0),
  br4_out     numeric(10,2) not null check (br4_out >= 0),
  stake_in    numeric(10,2) not null check (stake_in >= 0),
  stake_out   numeric(10,2) not null check (stake_out >= 0),
  created_at  timestamptz   default now()
);
```

3. Click **Run** → confirm "Success"

- [ ] **Step 3: Get Supabase credentials**

In Supabase dashboard → **Project Settings** → **API**:
- Copy **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Update `.env.local` with the real values (for local testing):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

- [ ] **Step 4: Test locally with real Supabase**

```bash
npm run dev
```

Open `http://localhost:3000` → add a test entry → confirm it appears. Confirm it was saved by checking the Supabase table editor.

- [ ] **Step 5: Push code to GitHub**

1. Create a new GitHub repository (public or private) at [https://github.com/new](https://github.com/new)
2. Push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/betting-tracker.git
git branch -M main
git push -u origin main
```

- [ ] **Step 6: Deploy on Vercel**

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your Supabase anon key)
4. Click **Deploy** → wait ~2 min
5. Open the generated URL (e.g., `https://betting-tracker-xxx.vercel.app`) → confirm the app works

- [ ] **Step 7: Done**

Share the Vercel URL with your friend. Both of you can use it without any login.

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Dashboard with period filter (URL query params) → Task 7 + 12
- ✅ 3 summary cards (total net, BR4, Stake) → Task 6
- ✅ Table: date, BR4 in→out, Stake in→out, day result → Task 8
- ✅ Result colored green/red → Tasks 6, 8
- ✅ Edit button per row → Task 8 + 9
- ✅ Delete button per row with confirmation → Task 8 + 10
- ✅ Modal: 4 fields + live preview → Task 9
- ✅ Duplicate date validation (DB: UNIQUE constraint + frontend error message) → Task 4 + 9
- ✅ Dark theme → Task 5
- ✅ Responsive layout → all components use Tailwind responsive classes
- ✅ No auth → no auth code anywhere
- ✅ Deploy to Vercel → Task 13
