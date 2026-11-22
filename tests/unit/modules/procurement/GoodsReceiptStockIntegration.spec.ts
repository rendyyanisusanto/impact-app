import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { stockPostingService } from '@/modules/inventory/materials/services/stock-posting.service'
import { goodsReceiptService } from '@/modules/procurement/goods-receipts/services/goods-receipt.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'

describe('Sprint 4 — Task 8: Goods Receipt Stock Integration & Stock History', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    materialService.reset()
    goodsReceiptService.reset()
    stockPostingService.reset()
  })

  it('8.1 verifies initial seeded stock posting and history entries', () => {
    expect(stockPostingService.isPosted(1)).toBe(true)
    const history = stockPostingService.getAllHistori()
    expect(history.length).toBeGreaterThanOrEqual(2)
    expect(history.some(h => h.tbl_id === 1 && h.tbl === 'penerimaan_barang')).toBe(true)
  })

  it('8.2 posts stock accurately and records to histori_stok_bahan when a new PB is created', async () => {
    const matBefore = materialService.getRawItems().find(m => m.id === 1)!
    const initialQty = matBefore.qty || 0

    // Create a new PB for PO #1 receiving 5 units
    const created = await goodsReceiptService.create({
      header: {
        kode: 'PB-TEST-STOCK-001',
        purchase_order_id: 1,
        no_surat_jalan: 'SJ-STOCK-01',
        gudang_id: 1,
        tanggal: '2026-11-01',
        status: 1,
        nilai_pb: 500000,
        is_ppn: 0,
        subtotal: 500000,
        diskon: 0,
        total: 500000,
        total_ppn: 0
      },
      details: [
        {
          bahan_id: 1,
          qty_pesan: 50,
          qty_terima: 5,
          satuan_beli_id: 1,
          harga_satuan: 100000,
          diskon: 0
        }
      ]
    })

    const newPbId = created.header.id
    expect(stockPostingService.isPosted(newPbId)).toBe(true)

    // Verify stock increased
    const matAfter = materialService.getRawItems().find(m => m.id === 1)!
    // Unit conversion: Bahan 1 with Satuan 1 has konversi nilai 25 (1 Kubik = 25 Batang)
    expect(matAfter.qty).toBe(initialQty + 5 * 25)

    // Verify histori_stok_bahan entry
    const docHistory = stockPostingService.getHistoryByDocument('penerimaan_barang', newPbId)
    expect(docHistory).toHaveLength(1)
    expect(docHistory[0].masuk).toBe(5 * 25)
    expect(docHistory[0].keluar).toBe(0)
    expect(docHistory[0].kode).toBe('PB-TEST-STOCK-001')
  })

  it('8.3 guarantees idempotency: subsequent posting calls for the same PB do not mutate stock twice', async () => {
    const mat = materialService.getRawItems().find(m => m.id === 1)!
    const qtyBefore = mat.qty || 0

    // Call postGoodsReceipt again for seeded PB #1
    const result = await stockPostingService.postGoodsReceipt(1)
    expect(result.posted).toBe(true)
    expect(result.affectedMaterials).toBe(0)
    expect(result.message).toContain('Idempotent')

    // Stock must remain unchanged
    expect(mat.qty).toBe(qtyBefore)
  })

  it('8.4 does not post stock for Draft (status = 0) Goods Receipts', async () => {
    const matBefore = materialService.getRawItems().find(m => m.id === 1)!
    const initialQty = matBefore.qty || 0

    const created = await goodsReceiptService.create({
      header: {
        kode: 'PB-DRAFT-001',
        purchase_order_id: 1,
        no_surat_jalan: 'SJ-DRAFT-01',
        gudang_id: 1,
        tanggal: '2026-11-01',
        status: 0, // Draft
        nilai_pb: 100000,
        is_ppn: 0,
        subtotal: 100000,
        diskon: 0,
        total: 100000,
        total_ppn: 0
      },
      details: [
        {
          bahan_id: 1,
          qty_pesan: 50,
          qty_terima: 2,
          satuan_beli_id: 1,
          harga_satuan: 50000,
          diskon: 0
        }
      ]
    })

    const draftPbId = created.header.id
    expect(stockPostingService.isPosted(draftPbId)).toBe(false)
    expect(matBefore.qty).toBe(initialQty)
  })

  it('8.5 reverses stock and appends reversal entry when a posted PB is cancelled/deleted', async () => {
    const mat = materialService.getRawItems().find(m => m.id === 1)!
    const qtyInitial = mat.qty || 0

    // 1. Create a PB that adds 2 units (2 * 25 = 50 stock)
    const created = await goodsReceiptService.create({
      header: {
        kode: 'PB-REVERSE-001',
        purchase_order_id: 1,
        no_surat_jalan: 'SJ-REV-01',
        gudang_id: 1,
        tanggal: '2026-11-01',
        status: 1,
        nilai_pb: 200000,
        is_ppn: 0,
        subtotal: 200000,
        diskon: 0,
        total: 200000,
        total_ppn: 0
      },
      details: [
        {
          bahan_id: 1,
          qty_pesan: 50,
          qty_terima: 2,
          satuan_beli_id: 1,
          harga_satuan: 100000,
          diskon: 0
        }
      ]
    })

    const pbId = created.header.id
    expect(stockPostingService.isPosted(pbId)).toBe(true)
    expect(mat.qty).toBe(qtyInitial + 50)

    // 2. Delete / cancel PB
    await goodsReceiptService.delete(pbId)

    // Should now be unposted
    expect(stockPostingService.isPosted(pbId)).toBe(false)

    // Stock should be restored to initial
    expect(mat.qty).toBe(qtyInitial)

    // Histori must contain reversal record with keluar = 50
    const history = stockPostingService.getHistoryByDocument('penerimaan_barang', pbId)
    const reversal = history.find(h => h.keluar === 50)
    expect(reversal).toBeDefined()
    expect(reversal?.keterangan).toContain('Batal data bahan')
  })
})
