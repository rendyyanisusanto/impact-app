export type SaldoNormal = 'D' | 'K'

export interface CoaGroup {
  id: number
  name: string
  is_active: number
  parent_count?: number
  account_count?: number
}

export interface CoaParent {
  id: number
  no_akun: number
  nama: string
  coa_id: number
  coa_name?: string
  is_active: number
  account_count?: number
}

export interface CoaAccount {
  id: number
  no_ref: string
  nama: string
  indukakun_id: number
  induk_nama?: string
  induk_no_akun?: number
  coa_id?: number
  coa_name?: string
  saldo_normal: SaldoNormal
  create_at?: string | null
  is_edit?: number | null
  is_active: number
  updated_at?: string | null
  is_used?: boolean
  transaction_count?: number
  last_transaction_date?: string | null
}

export interface CoaTreeNodeAccount {
  id: number
  no_ref: string
  nama: string
  saldo_normal: SaldoNormal
  is_active: number
  is_used: boolean
  transaction_count: number
  create_at?: string | null
}

export interface CoaTreeNodeParent {
  id: number
  no_akun: number
  nama: string
  coa_id: number
  is_active: number
  account_count: number
  accounts: CoaTreeNodeAccount[]
}

export interface CoaTreeNodeGroup {
  id: number
  name: string
  is_active: number
  parent_count: number
  account_count: number
  parents: CoaTreeNodeParent[]
}

export interface CoaKpiSummary {
  total_accounts: number
  active_accounts: number
  total_groups: number
  total_parents: number
  used_accounts: number
}

export interface CoaFilterParams {
  search?: string
  coa_id?: number | string
  indukakun_id?: number | string
  saldo_normal?: 'D' | 'K' | 'all' | string
  status?: 'active' | 'inactive' | 'all' | string
  is_used?: 'used' | 'unused' | 'all' | string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface CreateCoaGroupPayload {
  name: string
}

export interface UpdateCoaGroupPayload {
  name: string
  is_active?: number
}

export interface CreateCoaParentPayload {
  coa_id: number
  no_akun: number
  nama: string
}

export interface UpdateCoaParentPayload {
  coa_id?: number
  no_akun?: number
  nama?: string
  is_active?: number
}

export interface CreateCoaAccountPayload {
  no_ref: string
  nama: string
  indukakun_id: number
  saldo_normal: SaldoNormal
  is_active?: number
}

export interface UpdateCoaAccountPayload {
  no_ref?: string
  nama?: string
  indukakun_id?: number
  saldo_normal?: SaldoNormal
  is_active?: number
}

export interface ImportAccountRow {
  row_number: number
  no_ref: string
  nama: string
  kelompok_nama?: string
  induk_no_akun?: number | string
  induk_nama?: string
  saldo_normal: string
  is_active?: number | string
  status?: 'valid' | 'invalid'
  errors: string[]
  resolved_induk_id?: number
  resolved_saldo_normal?: SaldoNormal
}

export interface ImportValidationResult {
  total_rows: number
  valid_rows: number
  invalid_rows: number
  items: ImportAccountRow[]
}

export interface ImportCommitResult {
  inserted_count: number
  failed_count: number
  errors: string[]
}
