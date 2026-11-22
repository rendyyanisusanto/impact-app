export type JournalStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED'
export type JournalSourceType = 'MANUAL' | 'AUTOMATIC'

export interface JournalLineItem {
  id?: number
  line_number: number
  akun_id: number
  kode_akun?: string
  nama_akun?: string
  saldo_normal?: string
  description?: string | null
  debit: number
  credit: number
  jurnal_umum_id?: number | null
}

export interface JournalHeader {
  id: number
  journal_number: string
  journal_date: string
  reference_number?: string | null
  description: string
  source_type: JournalSourceType
  source_table?: string | null
  source_id?: number | null
  source_document_url?: string | null
  status: JournalStatus
  currency: string
  total_debit: number
  total_credit: number
  difference: number
  is_balanced: boolean
  is_legacy: boolean
  line_count: number
  lines?: JournalLineItem[]
  created_by?: number | null
  creator_name?: string | null
  created_at: string
  updated_by?: number | null
  updater_name?: string | null
  updated_at?: string | null
  posted_by?: number | null
  poster_name?: string | null
  posted_at?: string | null
  reversed_by?: number | null
  reverser_name?: string | null
  reversed_at?: string | null
  reversal_of_id?: number | null
  reversal_journal_number?: string | null
  version: number
}

export interface JournalFilterParams {
  search?: string
  start_date?: string
  end_date?: string
  status?: string // 'ALL' | JournalStatus
  source_type?: string // 'ALL' | 'MANUAL' | 'AUTOMATIC'
  akun_id?: number
  created_by?: number
  page?: number
  limit?: number
  sort_by?: string
  sort_dir?: 'ASC' | 'DESC'
}

export interface JournalKpiSummary {
  total_count: number
  draft_count: number
  posted_count: number
  reversed_count: number
  total_value: number
}

export interface CreateJournalPayload {
  journal_date: string
  reference_number?: string | null
  description: string
  lines: Array<{
    akun_id: number
    description?: string | null
    debit: number
    credit: number
  }>
}

export interface UpdateJournalPayload {
  journal_date?: string
  reference_number?: string | null
  description?: string
  lines?: Array<{
    id?: number
    akun_id: number
    description?: string | null
    debit: number
    credit: number
  }>
}

export interface ReverseJournalPayload {
  reversal_date: string
  reason: string
}

export interface SelectableAccount {
  id: number
  no_ref: string
  nama: string
  induk_nama: string
  induk_no_akun: number
  coa_nama: string
  saldo_normal: string
  is_active: number
}
