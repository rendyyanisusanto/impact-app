export type OtherExpenseStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'CANCELLED'

export interface OtherExpenseDetail {
  id?: number
  keterangan: string
  jumlah: number
  akun_beban_id?: number | null
  kode_akun_beban?: string | null
  nama_akun_beban?: string | null
}

export interface OtherExpenseAttachment {
  id: number
  expense_id: number
  file_path: string
  original_filename: string
  mime_type: string
  file_size: number
  uploaded_by?: number | null
  uploader_name?: string | null
  uploaded_at: string
}

export interface OtherExpenseHeader {
  id: number
  trans_code: string
  tanggal: string
  keterangan: string
  total: number
  akun_beban: number | null
  kode_akun_beban?: string | null
  nama_akun_beban?: string | null
  akun_kas: number
  kode_akun_kas?: string | null
  nama_akun_kas?: string | null
  status: OtherExpenseStatus
  reference_number?: string | null
  payment_method?: string | null
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
  reversal_reason?: string | null
  reversal_id?: number | null
  journal_id?: number | null
  journal_number?: string | null
  version: number
  item_count: number
  items?: OtherExpenseDetail[]
  attachments?: OtherExpenseAttachment[]
}

export interface OtherExpenseFilterParams {
  search?: string
  status?: string // 'ALL' | OtherExpenseStatus
  start_date?: string
  end_date?: string
  akun_beban?: number
  akun_kas?: number
  created_by?: number
  page?: number
  limit?: number
  sort_by?: string
  sort_dir?: 'ASC' | 'DESC'
}

export interface OtherExpenseKpiSummary {
  total_count: number
  posted_total_amount: number
  posted_count: number
  draft_count: number
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

export interface CreateOtherExpensePayload {
  tanggal: string
  keterangan: string
  akun_kas: number
  akun_beban?: number | null
  reference_number?: string | null
  payment_method?: string | null
  items: Array<{
    keterangan: string
    jumlah: number
    akun_beban_id?: number | null
  }>
}

export interface UpdateOtherExpensePayload {
  tanggal?: string
  keterangan?: string
  akun_kas?: number
  akun_beban?: number | null
  reference_number?: string | null
  payment_method?: string | null
  items?: Array<{
    id?: number
    keterangan: string
    jumlah: number
    akun_beban_id?: number | null
  }>
}

export interface ReverseOtherExpensePayload {
  reversal_date?: string
  reason: string
}
