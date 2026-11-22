/**
 * Stock & Material Inventory Types
 * Aligned with MariaDB `histori_stok_bahan` and `konversi_satuan_bahan`
 */

import type {
  MutationPostingInput,
  StockAdjustmentPostingInput
} from '../services/stock-posting.service'

export interface HistoriStokBahan {
  id: number
  bahan_id: number
  keterangan: string
  tanggal: string // YYYY-MM-DD
  created_at?: string
  created_by?: number | null
  updated_at?: string | null
  updated_by?: number | null
  kode: string
  masuk: number
  keluar: number
  tbl: string
  tbl_id: number
}

export interface StockPostingResult {
  documentId: number
  posted: boolean
  affectedMaterials: number
  message?: string
}

export interface StockPostingService {
  postGoodsReceipt(goodsReceiptId: number): Promise<StockPostingResult>
  reverseGoodsReceipt(goodsReceiptId: number): Promise<StockPostingResult>
  postMaterialMutation?(input: MutationPostingInput): Promise<StockPostingResult>
  reverseMaterialMutation?(mutationId: number, mutationKode?: string): Promise<StockPostingResult>
  postStockAdjustment?(input: StockAdjustmentPostingInput): Promise<StockPostingResult>
  reverseStockAdjustment?(
    adjustmentId: number,
    adjustmentKode?: string
  ): Promise<StockPostingResult>
}
