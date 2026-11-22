import type {
  HistoriStokBahan,
  StockPostingResult,
  StockPostingService
} from '../types/stock.types'
import { materialService, INITIAL_KONVERSI_SATUAN } from './material.service'

export interface StockPostingItemSnapshot {
  bahan_id: number
  qty_terima: number
  conversion_factor: number
  stock_added: number
}

export interface MutationPostingItemInput {
  bahan_id: number
  qty: number
  satuan_beli_id?: number | null
}

export interface MutationPostingInput {
  id: number
  kode: string
  tanggal: string
  created_by?: number | null
  items: MutationPostingItemInput[]
}

export interface StockAdjustmentPostingItemInput {
  bahan_id: number
  stok_awal: number
  stok_akhir: number
}

export interface StockAdjustmentPostingInput {
  id: number
  kode: string
  tanggal: string
  created_by?: number | null
  items: StockAdjustmentPostingItemInput[]
}

export class MockStockPostingService implements StockPostingService {
  private history: HistoriStokBahan[] = []
  private postedReceiptIds = new Set<number>()
  private postingMetadata = new Map<number, StockPostingItemSnapshot[]>()
  private postedMutationIds = new Set<number>()
  private mutationMetadata = new Map<number, StockPostingItemSnapshot[]>()
  private postedAdjustmentIds = new Set<number>()
  private adjustmentMetadata = new Map<number, StockAdjustmentPostingItemInput[]>()
  private nextHistoryId = 100

  constructor() {
    this.reset()
  }

  reset(): void {
    this.history = []
    this.postedReceiptIds.clear()
    this.postingMetadata.clear()
    this.postedMutationIds.clear()
    this.mutationMetadata.clear()
    this.postedAdjustmentIds.clear()
    this.adjustmentMetadata.clear()
    this.nextHistoryId = 100

    // Seed mock initial PB-001 as already posted to reflect initial mock state
    this.postedReceiptIds.add(1)
    this.postingMetadata.set(1, [
      { bahan_id: 1, qty_terima: 20, conversion_factor: 1, stock_added: 20 },
      { bahan_id: 3, qty_terima: 10, conversion_factor: 1, stock_added: 10 }
    ])
    this.history.push(
      {
        id: 1,
        bahan_id: 1,
        keterangan: 'Tambah data bahan PB-202610-0001',
        tanggal: '2026-10-17',
        created_at: '2026-10-17 10:30:00',
        created_by: 1,
        kode: 'PB-202610-0001',
        masuk: 20,
        keluar: 0,
        tbl: 'penerimaan_barang',
        tbl_id: 1
      },
      {
        id: 2,
        bahan_id: 3,
        keterangan: 'Tambah data bahan PB-202610-0001',
        tanggal: '2026-10-17',
        created_at: '2026-10-17 10:30:00',
        created_by: 1,
        kode: 'PB-202610-0001',
        masuk: 10,
        keluar: 0,
        tbl: 'penerimaan_barang',
        tbl_id: 1
      }
    )

    // Seed mock initial MB-001 & MB-002 as already posted
    this.postedMutationIds.add(1)
    this.mutationMetadata.set(1, [
      { bahan_id: 1, qty_terima: 2, conversion_factor: 1, stock_added: 2 },
      { bahan_id: 3, qty_terima: 1, conversion_factor: 1, stock_added: 1 }
    ])
    this.history.push(
      {
        id: 3,
        bahan_id: 1,
        keterangan: 'Mutasi Bahan MB/202610-0001 2026-10-20',
        tanggal: '2026-10-20',
        created_at: '2026-10-20 09:30:00',
        created_by: 1,
        kode: 'MB/202610-0001',
        masuk: 0,
        keluar: 2,
        tbl: 'mutasi_bahan',
        tbl_id: 1
      },
      {
        id: 4,
        bahan_id: 3,
        keterangan: 'Mutasi Bahan MB/202610-0001 2026-10-20',
        tanggal: '2026-10-20',
        created_at: '2026-10-20 09:30:00',
        created_by: 1,
        kode: 'MB/202610-0001',
        masuk: 0,
        keluar: 1,
        tbl: 'mutasi_bahan',
        tbl_id: 1
      }
    )

    this.postedMutationIds.add(2)
    this.mutationMetadata.set(2, [
      { bahan_id: 2, qty_terima: 4, conversion_factor: 1, stock_added: 4 }
    ])
    this.history.push({
      id: 5,
      bahan_id: 2,
      keterangan: 'Mutasi Bahan MB/202610-0002 2026-10-25',
      tanggal: '2026-10-25',
      created_at: '2026-10-25 14:15:00',
      created_by: 1,
      kode: 'MB/202610-0002',
      masuk: 0,
      keluar: 4,
      tbl: 'mutasi_bahan',
      tbl_id: 2
    })
  }

  isMutationPosted(mutationId: number): boolean {
    return this.postedMutationIds.has(mutationId)
  }

  isPosted(goodsReceiptId: number): boolean {
    return this.postedReceiptIds.has(goodsReceiptId)
  }

  getAllHistori(): HistoriStokBahan[] {
    return [...this.history]
  }

  getHistoryByMaterialId(bahanId: number): HistoriStokBahan[] {
    return this.history.filter(h => h.bahan_id === bahanId)
  }

  getHistoryByDocument(tbl: string, tblId: number): HistoriStokBahan[] {
    return this.history.filter(h => h.tbl === tbl && h.tbl_id === tblId)
  }

  /**
   * Resolve conversion factor between unit of purchase and base unit (satuan pakai)
   */
  private resolveConversionFactor(bahanId: number, satuanBeliId: number | null): number {
    if (!satuanBeliId) return 1

    const konversi = INITIAL_KONVERSI_SATUAN.find(
      k => k.bahan_id === bahanId && k.satuan_id === satuanBeliId
    )
    if (konversi && konversi.nilai && konversi.nilai > 0) {
      return konversi.nilai
    }
    return 1
  }

  /**
   * Post Goods Receipt to material stock atomically with idempotency protection.
   */
  async postGoodsReceipt(goodsReceiptId: number): Promise<StockPostingResult> {
    // 1. Idempotency Check
    if (this.postedReceiptIds.has(goodsReceiptId)) {
      return {
        documentId: goodsReceiptId,
        posted: true,
        affectedMaterials: 0,
        message: 'Penerimaan Barang sudah diposting sebelumnya (Idempotent).'
      }
    }

    const { goodsReceiptService } =
      await import('@/modules/procurement/goods-receipts/services/goods-receipt.service')
    const receipts = goodsReceiptService.getRawReceipts()
    const pb = receipts.find(r => r.id === goodsReceiptId)
    if (!pb) {
      throw new Error(`Penerimaan Barang #${goodsReceiptId} tidak ditemukan.`)
    }

    if (pb.status_aktif !== 1) {
      throw new Error(
        `Penerimaan Barang #${goodsReceiptId} telah dibatalkan dan tidak dapat diposting.`
      )
    }

    // Only post confirmed receipts (status 1)
    if (pb.status !== 1) {
      return {
        documentId: goodsReceiptId,
        posted: false,
        affectedMaterials: 0,
        message: 'Penerimaan Barang berstatus Draft. Posting stok ditunda.'
      }
    }

    const details = goodsReceiptService
      .getRawDetails()
      .filter(d => d.penerimaan_barang_id === goodsReceiptId && d.bahan_id)

    if (details.length === 0) {
      return {
        documentId: goodsReceiptId,
        posted: true,
        affectedMaterials: 0,
        message: 'Tidak ada item bahan dalam Penerimaan Barang ini.'
      }
    }

    const materials = materialService.getRawItems()

    // 2. Atomic Snapshot
    const materialSnapshots = new Map<number, number>()
    const itemsToPost: StockPostingItemSnapshot[] = []

    for (const item of details) {
      const mat = materials.find(m => m.id === item.bahan_id)
      if (!mat) {
        throw new Error(`Bahan #${item.bahan_id} tidak ditemukan dalam Master Data.`)
      }
      if (!materialSnapshots.has(mat.id)) {
        materialSnapshots.set(mat.id, mat.qty || 0)
      }

      const factor = this.resolveConversionFactor(mat.id, item.satuan_beli_id)
      const qtyTerima = item.qty_terima || 0
      const stockAdded = qtyTerima * factor

      itemsToPost.push({
        bahan_id: mat.id,
        qty_terima: qtyTerima,
        conversion_factor: factor,
        stock_added: stockAdded
      })
    }

    // 3. Apply Mutations Atomically
    try {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

      for (const item of itemsToPost) {
        if (item.stock_added <= 0) continue

        const mat = materials.find(m => m.id === item.bahan_id)
        if (mat) {
          mat.qty = (mat.qty || 0) + item.stock_added
          mat.updated_at = nowStr

          // Insert into histori_stok_bahan matching SQL trigger behavior
          this.history.push({
            id: this.nextHistoryId++,
            bahan_id: mat.id,
            keterangan: `Tambah data bahan ${pb.kode || `PB-${pb.id}`}`,
            tanggal: pb.tanggal || nowStr.substring(0, 10),
            created_at: nowStr,
            created_by: pb.created_by || 1,
            kode: pb.kode || `PB-${pb.id}`,
            masuk: item.stock_added,
            keluar: 0,
            tbl: 'penerimaan_barang',
            tbl_id: pb.id
          })
        }
      }

      this.postedReceiptIds.add(goodsReceiptId)
      this.postingMetadata.set(goodsReceiptId, itemsToPost)

      return {
        documentId: goodsReceiptId,
        posted: true,
        affectedMaterials: itemsToPost.filter(i => i.stock_added > 0).length,
        message: 'Stok bahan berhasil diposting ke persediaan.'
      }
    } catch (err) {
      // Rollback on unexpected failure
      for (const [matId, originalQty] of materialSnapshots.entries()) {
        const mat = materials.find(m => m.id === matId)
        if (mat) mat.qty = originalQty
      }
      throw err
    }
  }

  /**
   * Reverse Goods Receipt stock posting atomically upon document cancellation.
   */
  async reverseGoodsReceipt(goodsReceiptId: number): Promise<StockPostingResult> {
    if (!this.postedReceiptIds.has(goodsReceiptId)) {
      return {
        documentId: goodsReceiptId,
        posted: false,
        affectedMaterials: 0,
        message: 'Penerimaan Barang belum diposting ke stok (Reversal no-op).'
      }
    }

    const postedItems = this.postingMetadata.get(goodsReceiptId) || []
    const { goodsReceiptService } =
      await import('@/modules/procurement/goods-receipts/services/goods-receipt.service')
    const receipts = goodsReceiptService.getRawReceipts()
    const pb = receipts.find(r => r.id === goodsReceiptId)
    const pbKode = pb?.kode || `PB-${goodsReceiptId}`

    const materials = materialService.getRawItems()
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

    for (const item of postedItems) {
      if (item.stock_added <= 0) continue

      const mat = materials.find(m => m.id === item.bahan_id)
      if (mat) {
        mat.qty = Math.max(0, (mat.qty || 0) - item.stock_added)
        mat.updated_at = nowStr

        // Insert into histori_stok_bahan reversal entry
        this.history.push({
          id: this.nextHistoryId++,
          bahan_id: mat.id,
          keterangan: `Batal data bahan ${pbKode}`,
          tanggal: nowStr.substring(0, 10),
          created_at: nowStr,
          created_by: 1,
          kode: pbKode,
          masuk: 0,
          keluar: item.stock_added,
          tbl: 'penerimaan_barang',
          tbl_id: goodsReceiptId
        })
      }
    }

    this.postedReceiptIds.delete(goodsReceiptId)
    this.postingMetadata.delete(goodsReceiptId)

    return {
      documentId: goodsReceiptId,
      posted: false,
      affectedMaterials: postedItems.length,
      message: 'Posting stok berhasil dibalikkan (Reversed).'
    }
  }

  /**
   * Post Material Mutation (deducts material stock) atomically with idempotency protection.
   */
  async postMaterialMutation(input: MutationPostingInput): Promise<StockPostingResult> {
    // 1. Idempotency Check
    if (this.postedMutationIds.has(input.id)) {
      return {
        documentId: input.id,
        posted: true,
        affectedMaterials: 0,
        message: 'Mutasi Bahan sudah diposting sebelumnya (Idempotent).'
      }
    }

    if (!input.items || input.items.length === 0) {
      return {
        documentId: input.id,
        posted: true,
        affectedMaterials: 0,
        message: 'Tidak ada item bahan dalam Mutasi Bahan ini.'
      }
    }

    const materials = materialService.getRawItems()

    // 2. Atomic Snapshot & Stock validation
    const materialSnapshots = new Map<number, number>()
    const itemsToPost: StockPostingItemSnapshot[] = []

    for (const item of input.items) {
      const mat = materials.find(m => m.id === item.bahan_id)
      if (!mat) {
        throw new Error(`Bahan #${item.bahan_id} tidak ditemukan dalam Master Data.`)
      }
      if (!materialSnapshots.has(mat.id)) {
        materialSnapshots.set(mat.id, mat.qty || 0)
      }

      const factor = this.resolveConversionFactor(mat.id, item.satuan_beli_id ?? null)
      const qtyOut = item.qty || 0
      const stockDeducted = qtyOut * factor

      itemsToPost.push({
        bahan_id: mat.id,
        qty_terima: qtyOut,
        conversion_factor: factor,
        stock_added: stockDeducted // represents quantity deducted
      })
    }

    // 3. Apply Mutations Atomically (Deduct Stock)
    try {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

      for (const item of itemsToPost) {
        if (item.stock_added <= 0) continue

        const mat = materials.find(m => m.id === item.bahan_id)
        if (mat) {
          mat.qty = Math.max(0, (mat.qty || 0) - item.stock_added)
          mat.updated_at = nowStr

          // Insert into histori_stok_bahan matching SQL trigger behavior
          this.history.push({
            id: this.nextHistoryId++,
            bahan_id: mat.id,
            keterangan: `Mutasi Bahan ${input.kode || `MB-${input.id}`} ${input.tanggal || nowStr.substring(0, 10)}`,
            tanggal: input.tanggal || nowStr.substring(0, 10),
            created_at: nowStr,
            created_by: input.created_by || 1,
            kode: input.kode || `MB-${input.id}`,
            masuk: 0,
            keluar: item.stock_added,
            tbl: 'mutasi_bahan',
            tbl_id: input.id
          })
        }
      }

      this.postedMutationIds.add(input.id)
      this.mutationMetadata.set(input.id, itemsToPost)

      return {
        documentId: input.id,
        posted: true,
        affectedMaterials: itemsToPost.filter(i => i.stock_added > 0).length,
        message: 'Stok bahan berhasil dimutasi / dikurangkan dari persediaan.'
      }
    } catch (err) {
      // Rollback on failure
      for (const [matId, originalQty] of materialSnapshots.entries()) {
        const mat = materials.find(m => m.id === matId)
        if (mat) mat.qty = originalQty
      }
      throw err
    }
  }

  /**
   * Reverse Material Mutation (restores deducted stock) atomically upon cancellation or deletion.
   */
  async reverseMaterialMutation(
    mutationId: number,
    mutationKode?: string
  ): Promise<StockPostingResult> {
    if (!this.postedMutationIds.has(mutationId)) {
      return {
        documentId: mutationId,
        posted: false,
        affectedMaterials: 0,
        message: 'Mutasi Bahan belum diposting ke stok (Reversal no-op).'
      }
    }

    const postedItems = this.mutationMetadata.get(mutationId) || []
    const kode = mutationKode || `MB-${mutationId}`
    const materials = materialService.getRawItems()
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

    for (const item of postedItems) {
      if (item.stock_added <= 0) continue

      const mat = materials.find(m => m.id === item.bahan_id)
      if (mat) {
        mat.qty = (mat.qty || 0) + item.stock_added
        mat.updated_at = nowStr

        // Insert into histori_stok_bahan reversal entry
        this.history.push({
          id: this.nextHistoryId++,
          bahan_id: mat.id,
          keterangan: `Batal Mutasi Bahan ${kode}`,
          tanggal: nowStr.substring(0, 10),
          created_at: nowStr,
          created_by: 1,
          kode: kode,
          masuk: item.stock_added,
          keluar: 0,
          tbl: 'mutasi_bahan',
          tbl_id: mutationId
        })
      }
    }

    this.postedMutationIds.delete(mutationId)
    this.mutationMetadata.delete(mutationId)

    return {
      documentId: mutationId,
      posted: false,
      affectedMaterials: postedItems.length,
      message: 'Mutasi stok berhasil dibatalkan dan stok dikembalikan.'
    }
  }

  isAdjustmentPosted(adjustmentId: number): boolean {
    return this.postedAdjustmentIds.has(adjustmentId)
  }

  /**
   * Post Stock Adjustment atomically with idempotency protection.
   */
  async postStockAdjustment(input: StockAdjustmentPostingInput): Promise<StockPostingResult> {
    if (this.postedAdjustmentIds.has(input.id)) {
      return {
        documentId: input.id,
        posted: true,
        affectedMaterials: 0,
        message: 'Penyesuaian Stok sudah diposting sebelumnya (Idempotent).'
      }
    }

    if (!input.items || input.items.length === 0) {
      return {
        documentId: input.id,
        posted: true,
        affectedMaterials: 0,
        message: 'Tidak ada item bahan dalam Penyesuaian Stok ini.'
      }
    }

    const materials = materialService.getRawItems()
    const materialSnapshots = new Map<number, number>()

    for (const item of input.items) {
      const mat = materials.find(m => m.id === item.bahan_id)
      if (!mat) {
        throw new Error(`Bahan #${item.bahan_id} tidak ditemukan dalam Master Data.`)
      }
      if (!materialSnapshots.has(mat.id)) {
        materialSnapshots.set(mat.id, mat.qty || 0)
      }
    }

    try {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)
      let affectedCount = 0

      for (const item of input.items) {
        const mat = materials.find(m => m.id === item.bahan_id)
        if (!mat) continue

        const diff = (item.stok_akhir ?? 0) - (item.stok_awal ?? 0)
        // Update master_data_bahan quantity to physical stock
        mat.qty = Math.max(0, item.stok_akhir ?? 0)
        mat.updated_at = nowStr

        if (diff !== 0) {
          affectedCount++
          const masuk = diff > 0 ? diff : 0
          const keluar = diff < 0 ? Math.abs(diff) : 0

          this.history.push({
            id: this.nextHistoryId++,
            bahan_id: mat.id,
            keterangan: `Penyesuaian stok ${input.kode || `PS-${input.id}`} - ${input.tanggal || nowStr.substring(0, 10)}`,
            tanggal: input.tanggal || nowStr.substring(0, 10),
            created_at: nowStr,
            created_by: input.created_by || 1,
            kode: input.kode || `PS-${input.id}`,
            masuk,
            keluar,
            tbl: 'penyesuaian_stok',
            tbl_id: input.id
          })
        }
      }

      this.postedAdjustmentIds.add(input.id)
      this.adjustmentMetadata.set(input.id, input.items)

      return {
        documentId: input.id,
        posted: true,
        affectedMaterials: affectedCount,
        message: 'Penyesuaian stok bahan berhasil diposting ke persediaan.'
      }
    } catch (err) {
      for (const [matId, originalQty] of materialSnapshots.entries()) {
        const mat = materials.find(m => m.id === matId)
        if (mat) mat.qty = originalQty
      }
      throw err
    }
  }

  /**
   * Reverse Stock Adjustment atomically upon cancellation or deletion.
   */
  async reverseStockAdjustment(
    adjustmentId: number,
    adjustmentKode?: string
  ): Promise<StockPostingResult> {
    if (!this.postedAdjustmentIds.has(adjustmentId)) {
      return {
        documentId: adjustmentId,
        posted: false,
        affectedMaterials: 0,
        message: 'Penyesuaian Stok belum diposting (Reversal no-op).'
      }
    }

    const postedItems = this.adjustmentMetadata.get(adjustmentId) || []
    const kode = adjustmentKode || `PS-${adjustmentId}`
    const materials = materialService.getRawItems()
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

    for (const item of postedItems) {
      const mat = materials.find(m => m.id === item.bahan_id)
      if (!mat) continue

      const diff = (item.stok_akhir ?? 0) - (item.stok_awal ?? 0)
      mat.qty = Math.max(0, item.stok_awal ?? 0)
      mat.updated_at = nowStr

      if (diff !== 0) {
        const masuk = diff < 0 ? Math.abs(diff) : 0
        const keluar = diff > 0 ? diff : 0

        this.history.push({
          id: this.nextHistoryId++,
          bahan_id: mat.id,
          keterangan: `Batal Penyesuaian stok ${kode}`,
          tanggal: nowStr.substring(0, 10),
          created_at: nowStr,
          created_by: 1,
          kode,
          masuk,
          keluar,
          tbl: 'penyesuaian_stok',
          tbl_id: adjustmentId
        })
      }
    }

    this.postedAdjustmentIds.delete(adjustmentId)
    this.adjustmentMetadata.delete(adjustmentId)

    return {
      documentId: adjustmentId,
      posted: false,
      affectedMaterials: postedItems.length,
      message: 'Penyesuaian stok berhasil dibatalkan dan saldo dikembalikan.'
    }
  }
}

export const stockPostingService = new MockStockPostingService()
