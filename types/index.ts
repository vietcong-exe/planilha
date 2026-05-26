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
