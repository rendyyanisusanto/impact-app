/**
 * Sales Order History & Audit Trail Types
 * Mapped to legacy MariaDB table: `histori_table`
 */

export type HistoryActionType =
  'CREATE' | 'UPDATE' | 'EDIT_DATE' | 'PRINT' | 'CANCEL' | 'INVOICE_CREATE' | 'INVOICE_CANCEL'

export interface HistoriTable {
  id: number
  table: 'sales_order' | string
  tanggal: string // YYYY-MM-DD
  metode: HistoryActionType | string
  keterangan: string
  created_at: string // YYYY-MM-DD HH:mm:ss
  table_id: number // Foreign key to sales_order.id
  user_id: number
  user_nama?: string
}

export interface SalesOrderHistoryEntry extends HistoriTable {
  status_sebelumnya?: string
  status_baru?: string
}
