import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { materialMutationService } from '@/modules/inventory/material-mutations/services/material-mutation.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { stockPostingService } from '@/modules/inventory/materials/services/stock-posting.service'

describe('Sprint 5 — Fitur 1: Material Mutation Stock Movement & Posting Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    materialService.reset()
    stockPostingService.reset()
    materialMutationService.reset()
  })

  it('3.1 posts stock deduction atomically when a mutation is created with status 1 (Selesai)', async () => {
    const rawMaterials = materialService.getRawItems()
    const targetMat = rawMaterials.find(m => m.id === 1)!
    const initialQty = targetMat.qty || 0

    // Create a new mutation for 3 units of material #1 in base unit
    const mutation = await materialMutationService.createMutation({
      kode: 'MB/TEST-001',
      tanggal: '2026-11-01',
      status: 1, // Selesai / Posting
      items: [
        {
          bahan_id: 1,
          qty: 3,
          satuan_beli_id: null,
          keterangan: 'Tes Pengurangan Stok'
        }
      ]
    })

    expect(mutation.id).toBeDefined()
    expect(targetMat.qty).toBe(initialQty - 3)

    // Check histori_stok_bahan contains accurate movement record
    const history = stockPostingService.getAllHistori()
    const mutasiHistory = history.filter(
      h => h.tbl === 'mutasi_bahan' && h.tbl_id === mutation.id && h.bahan_id === 1
    )

    expect(mutasiHistory.length).toBe(1)
    expect(mutasiHistory[0].masuk).toBe(0)
    expect(mutasiHistory[0].keluar).toBe(3)
    expect(mutasiHistory[0].kode).toBe('MB/TEST-001')
  })

  it('3.2 does NOT deduct stock when mutation is saved as status 0 (Draft)', async () => {
    const rawMaterials = materialService.getRawItems()
    const targetMat = rawMaterials.find(m => m.id === 1)!
    const initialQty = targetMat.qty || 0

    const mutation = await materialMutationService.createMutation({
      kode: 'MB/TEST-DRAFT',
      tanggal: '2026-11-01',
      status: 0, // Draft
      items: [
        {
          bahan_id: 1,
          qty: 2,
          satuan_beli_id: null
        }
      ]
    })

    // Stock must remain unchanged
    expect(targetMat.qty).toBe(initialQty)

    // Then explicitly post it
    await materialMutationService.postMutation(mutation.id)
    expect(targetMat.qty).toBe(initialQty - 2)
  })

  it('3.3 reverses stock deduction and records reversal history when mutation is deleted', async () => {
    const rawMaterials = materialService.getRawItems()
    const targetMat = rawMaterials.find(m => m.id === 1)!
    const initialQty = targetMat.qty || 0

    const mutation = await materialMutationService.createMutation({
      kode: 'MB/TEST-REVERSE',
      tanggal: '2026-11-01',
      status: 1,
      items: [
        {
          bahan_id: 1,
          qty: 4,
          satuan_beli_id: null
        }
      ]
    })

    expect(targetMat.qty).toBe(initialQty - 4)

    // Now delete / cancel mutation
    await materialMutationService.deleteMutation(mutation.id)

    // Stock should be restored
    expect(targetMat.qty).toBe(initialQty)

    // Check reversal entry in histori_stok_bahan
    const history = stockPostingService.getAllHistori()
    const reversal = history.find(
      h => h.tbl === 'mutasi_bahan' && h.tbl_id === mutation.id && h.masuk === 4
    )
    expect(reversal).toBeDefined()
    expect(reversal?.keterangan).toContain('Batal Mutasi Bahan MB/TEST-REVERSE')
  })

  it('3.4 ensures stock posting is idempotent and does not double-deduct', async () => {
    const rawMaterials = materialService.getRawItems()
    const targetMat = rawMaterials.find(m => m.id === 2)!
    const initialQty = targetMat.qty || 0

    const postInput = {
      id: 99,
      kode: 'MB/IDEMPOTENT',
      tanggal: '2026-11-01',
      items: [{ bahan_id: 2, qty: 2 }]
    }

    const res1 = await stockPostingService.postMaterialMutation(postInput)
    expect(res1.posted).toBe(true)
    expect(targetMat.qty).toBe(initialQty - 2)

    // Call post again with identical ID
    const res2 = await stockPostingService.postMaterialMutation(postInput)
    expect(res2.posted).toBe(true)
    expect(res2.affectedMaterials).toBe(0)
    expect(res2.message).toContain('Idempotent')

    // Stock must still be initialQty - 2 (not decremented twice!)
    expect(targetMat.qty).toBe(initialQty - 2)
  })
})
