import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { stockAdjustmentService } from '@/modules/inventory/stock-adjustments/services/stock-adjustment.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { stockPostingService } from '@/modules/inventory/materials/services/stock-posting.service'

describe('Sprint 5 — Fitur 2: Stock Adjustment Stock Movement & Posting Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    materialService.reset()
    stockPostingService.reset()
    stockAdjustmentService.reset()
  })

  it('3.1 increases stock balance when physical stock is higher than system stock (selisih > 0)', async () => {
    const rawMaterials = materialService.getRawItems()
    const targetMat = rawMaterials.find(m => m.id === 1)!
    const initialQty = targetMat.qty || 0

    // System stock = initialQty, Physical stock = initialQty + 5 (selisih = +5)
    const adjustment = await stockAdjustmentService.createAdjustment({
      kode: 'PS/TEST-POS-001',
      tanggal: '2026-11-01',
      status: 1, // Selesai / Posting
      items: [
        {
          bahan_id: 1,
          stok_awal: initialQty,
          stok_akhir: initialQty + 5,
          keterangan: 'Ditemukan kelebihan bahan saat opname'
        }
      ]
    })

    expect(adjustment.id).toBeDefined()
    expect(targetMat.qty).toBe(initialQty + 5)

    // Check histori_stok_bahan
    const history = stockPostingService.getAllHistori()
    const record = history.find(
      h => h.tbl === 'penyesuaian_stok' && h.tbl_id === adjustment.id && h.bahan_id === 1
    )

    expect(record).toBeDefined()
    expect(record?.masuk).toBe(5)
    expect(record?.keluar).toBe(0)
    expect(record?.kode).toBe('PS/TEST-POS-001')
  })

  it('3.2 decreases stock balance when physical stock is lower than system stock (selisih < 0)', async () => {
    const rawMaterials = materialService.getRawItems()
    const targetMat = rawMaterials.find(m => m.id === 1)!
    const initialQty = targetMat.qty || 0

    // System stock = initialQty, Physical stock = initialQty - 3 (selisih = -3)
    const adjustment = await stockAdjustmentService.createAdjustment({
      kode: 'PS/TEST-NEG-001',
      tanggal: '2026-11-01',
      status: 1, // Selesai / Posting
      items: [
        {
          bahan_id: 1,
          stok_awal: initialQty,
          stok_akhir: initialQty - 3,
          keterangan: 'Bahan lapuk / susut'
        }
      ]
    })

    expect(adjustment.id).toBeDefined()
    expect(targetMat.qty).toBe(initialQty - 3)

    // Check histori_stok_bahan
    const history = stockPostingService.getAllHistori()
    const record = history.find(
      h => h.tbl === 'penyesuaian_stok' && h.tbl_id === adjustment.id && h.bahan_id === 1
    )

    expect(record).toBeDefined()
    expect(record?.masuk).toBe(0)
    expect(record?.keluar).toBe(3)
    expect(record?.kode).toBe('PS/TEST-NEG-001')
  })

  it('3.3 does NOT alter stock when adjustment is saved as status 0 (Draft)', async () => {
    const rawMaterials = materialService.getRawItems()
    const targetMat = rawMaterials.find(m => m.id === 1)!
    const initialQty = targetMat.qty || 0

    const adjustment = await stockAdjustmentService.createAdjustment({
      kode: 'PS/TEST-DRAFT',
      tanggal: '2026-11-01',
      status: 0, // Draft
      items: [
        {
          bahan_id: 1,
          stok_awal: initialQty,
          stok_akhir: initialQty + 10
        }
      ]
    })

    // Stock must remain unchanged while draft
    expect(targetMat.qty).toBe(initialQty)

    // Then post it explicitly
    await stockAdjustmentService.postAdjustment(adjustment.id)
    expect(targetMat.qty).toBe(initialQty + 10)
  })

  it('3.4 reverses stock movement and restores original balance when adjustment is deleted', async () => {
    const rawMaterials = materialService.getRawItems()
    const targetMat = rawMaterials.find(m => m.id === 1)!
    const initialQty = targetMat.qty || 0

    // Create adjustment that deducted 4 units
    const adjustment = await stockAdjustmentService.createAdjustment({
      kode: 'PS/TEST-REVERSE',
      tanggal: '2026-11-01',
      status: 1,
      items: [
        {
          bahan_id: 1,
          stok_awal: initialQty,
          stok_akhir: initialQty - 4
        }
      ]
    })

    expect(targetMat.qty).toBe(initialQty - 4)

    // Now delete / cancel adjustment
    await stockAdjustmentService.deleteAdjustment(adjustment.id)

    // Stock should be restored to initialQty
    expect(targetMat.qty).toBe(initialQty)

    // Check reversal entry in histori_stok_bahan
    const history = stockPostingService.getAllHistori()
    const reversal = history.find(
      h => h.tbl === 'penyesuaian_stok' && h.tbl_id === adjustment.id && h.masuk === 4
    )
    expect(reversal).toBeDefined()
    expect(reversal?.keterangan).toContain('Batal Penyesuaian stok PS/TEST-REVERSE')
  })

  it('3.5 ensures stock posting is idempotent and protected against double-posting', async () => {
    const rawMaterials = materialService.getRawItems()
    const targetMat = rawMaterials.find(m => m.id === 2)!
    const initialQty = targetMat.qty || 0

    const postInput = {
      id: 999,
      kode: 'PS/IDEMPOTENT',
      tanggal: '2026-11-01',
      items: [{ bahan_id: 2, stok_awal: initialQty, stok_akhir: initialQty + 8 }]
    }

    await stockPostingService.postStockAdjustment(postInput)
    expect(targetMat.qty).toBe(initialQty + 8)

    // Second call with same ID must not modify stock again
    await stockPostingService.postStockAdjustment(postInput)
    expect(targetMat.qty).toBe(initialQty + 8)
  })
})
