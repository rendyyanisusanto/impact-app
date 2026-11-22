import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { bomService } from '@/modules/production/services/bom.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { stockPostingService } from '@/modules/inventory/materials/services/stock-posting.service'

describe('Sprint 6 — Task 1: BoM Foundation, Schema & Service Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    bomService.reset()
    materialService.reset()
    stockPostingService.reset()
  })

  it('1.1 satisfies legacy database schema for template_produk and detail_template_produk', async () => {
    const list = await bomService.getTemplates()
    expect(list.data.length).toBeGreaterThan(0)

    const first = list.data[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('kode')
    expect(first).toHaveProperty('nama')
    expect(first).toHaveProperty('produk_id')
    expect(first).toHaveProperty('status_aktif')

    const detail = await bomService.getTemplateById(first.id)
    expect(detail).not.toBeNull()
    expect(detail!.items.length).toBeGreaterThan(0)

    const item = detail!.items[0]
    expect(item).toHaveProperty('id')
    expect(item).toHaveProperty('template_produk_id')
    expect(item).toHaveProperty('produk_id')
    expect(item).toHaveProperty('bahan_id')
    expect(item).toHaveProperty('satuan_id')
    expect(item).toHaveProperty('qty')
  })

  it('1.2 creates a new BoM template atomically with details', async () => {
    const newBom = await bomService.createTemplate({
      kode: 'TPL-202611-999',
      nama: 'Template Meja Belajar Minimalis Test',
      produk_id: 43,
      status_aktif: 1,
      items: [
        {
          bahan_id: 1,
          satuan_id: 1,
          qty: 2.5
        },
        {
          bahan_id: 2,
          satuan_id: 1,
          qty: 0.8
        }
      ]
    })

    expect(newBom.id).toBeDefined()
    expect(newBom.kode).toBe('TPL-202611-999')
    expect(newBom.nama).toBe('Template Meja Belajar Minimalis Test')

    const fetched = await bomService.getTemplateById(newBom.id)
    expect(fetched).not.toBeNull()
    expect(fetched!.items).toHaveLength(2)
    expect(fetched!.items[0].qty).toBe(2.5)
    expect(fetched!.items[1].qty).toBe(0.8)
  })

  it('1.3 generates auto sequence code matching legacy pattern (TPL-YYYYMM-NNN)', async () => {
    const code = await bomService.generateNextCode()
    expect(code).toMatch(/^TPL-\d{6}-\d{3}$/)
  })

  it('1.4 validates mandatory fields: product, name, and items > 0', async () => {
    // Missing product
    await expect(
      bomService.createTemplate({
        kode: 'TPL-TEST-001',
        nama: 'BoM Tanpa Produk',
        produk_id: 0,
        status_aktif: 1,
        items: [{ bahan_id: 1, satuan_id: 1, qty: 1 }]
      })
    ).rejects.toThrow('Produk furniture harus dipilih.')

    // Missing name
    await expect(
      bomService.createTemplate({
        kode: 'TPL-TEST-002',
        nama: '',
        produk_id: 43,
        status_aktif: 1,
        items: [{ bahan_id: 1, satuan_id: 1, qty: 1 }]
      })
    ).rejects.toThrow('Nama template produk tidak boleh kosong.')

    // Missing items
    await expect(
      bomService.createTemplate({
        kode: 'TPL-TEST-003',
        nama: 'BoM Kosong',
        produk_id: 43,
        status_aktif: 1,
        items: []
      })
    ).rejects.toThrow('Minimal harus menambahkan satu bahan baku ke dalam komposisi produk.')

    // Item with non-positive qty
    await expect(
      bomService.createTemplate({
        kode: 'TPL-TEST-004',
        nama: 'BoM Qty Nol',
        produk_id: 43,
        status_aktif: 1,
        items: [{ bahan_id: 1, satuan_id: 1, qty: 0 }]
      })
    ).rejects.toThrow('Kuantitas kebutuhan bahan harus bernilai lebih dari 0.')
  })

  it('1.5 updates existing BoM template header and item composition', async () => {
    const target = await bomService.getTemplateById(1)
    expect(target).not.toBeNull()

    const updated = await bomService.updateTemplate(1, {
      nama: 'Template Meja Makan 6 Kursi (Revisi Kayu Jati)',
      produk_id: 43,
      status_aktif: 1,
      items: [
        {
          bahan_id: 1,
          satuan_id: 1,
          qty: 5.0
        }
      ]
    })

    expect(updated.nama).toBe('Template Meja Makan 6 Kursi (Revisi Kayu Jati)')
    const reloaded = await bomService.getTemplateById(1)
    expect(reloaded!.items).toHaveLength(1)
    expect(reloaded!.items[0].qty).toBe(5.0)
  })

  it('1.6 duplicates an existing template with new auto code and copied items', async () => {
    const original = await bomService.getTemplateById(1)
    expect(original).not.toBeNull()

    const duplicated = await bomService.duplicateTemplate(1)

    expect(duplicated.id).not.toBe(1)
    expect(duplicated.nama).toContain('(Salinan)')

    const duplicatedDetail = await bomService.getTemplateById(duplicated.id)
    expect(duplicatedDetail).not.toBeNull()
    expect(duplicatedDetail!.items.length).toBe(original!.items.length)
  })

  it('1.7 deletes BoM template and cleans up related details', async () => {
    await bomService.deleteTemplate(3)

    const reloaded = await bomService.getTemplateById(3)
    expect(reloaded!.status_aktif).toBe(0)
  })

  it('1.8 guarantees ZERO stock movement on BoM creation, update, and deletion', async () => {
    const initialMaterials = materialService.getRawItems()
    const initialQtyMap = new Map<number, number>()
    initialMaterials.forEach(m => initialQtyMap.set(m.id, m.qty || 0))
    const initialHistoryCount = stockPostingService.getAllHistori().length

    // 1. Create BoM
    const created = await bomService.createTemplate({
      kode: 'TPL-ZERO-STOCK-001',
      nama: 'BoM Zero Stock Verification',
      produk_id: 43,
      status_aktif: 1,
      items: [
        { bahan_id: 1, satuan_id: 1, qty: 100 },
        { bahan_id: 2, satuan_id: 1, qty: 50 }
      ]
    })

    // 2. Update BoM
    await bomService.updateTemplate(created.id, {
      nama: 'BoM Zero Stock Updated',
      produk_id: 43,
      status_aktif: 1,
      items: [{ bahan_id: 1, satuan_id: 1, qty: 500 }]
    })

    // 3. Delete BoM
    await bomService.deleteTemplate(created.id)

    // Verify raw material balances are COMPLETELY UNCHANGED
    const currentMaterials = materialService.getRawItems()
    currentMaterials.forEach(m => {
      expect(m.qty).toBe(initialQtyMap.get(m.id))
    })

    // Verify NO stock movements were logged in histori_stok_bahan
    const currentHistoryCount = stockPostingService.getAllHistori().length
    expect(currentHistoryCount).toBe(initialHistoryCount)
  })
})
