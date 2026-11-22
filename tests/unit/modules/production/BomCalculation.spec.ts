import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  calculateMaterialRequirements,
  roundToDecimal
} from '@/modules/production/utils/bom-calculations'
import type { BomTemplateViewDetail } from '@/modules/production/types/bom.types'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { stockPostingService } from '@/modules/inventory/materials/services/stock-posting.service'

describe('Sprint 6 — Task 5: BoM Material Requirements Simulation & Calculation Rules', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    materialService.reset()
    stockPostingService.reset()
  })

  // Material 1 in mock has stock = 12, price = 450000
  // Material 2 in mock has stock = 8, price = 185000
  const mockItems: BomTemplateViewDetail[] = [
    {
      id: 1,
      template_produk_id: 1,
      produk_id: 43,
      bahan_id: 1,
      kode_bahan: 'MAT-001',
      nama_bahan: 'Kayu Jati Solid Grade A',
      satuan_id: 1,
      nama_satuan: 'Batang',
      qty: 2.5,
      harga_satuan: 450000,
      estimasi_biaya: 1125000,
      stok_tersedia: 12
    },
    {
      id: 2,
      template_produk_id: 1,
      produk_id: 43,
      bahan_id: 2,
      kode_bahan: 'MAT-002',
      nama_bahan: 'Busa Density 32',
      satuan_id: 2,
      nama_satuan: 'Lembar',
      qty: 1.0,
      harga_satuan: 185000,
      estimasi_biaya: 185000,
      stok_tersedia: 8
    }
  ]

  it('5.1 correctly calculates total requirements for target = 2 units (stock sufficient)', () => {
    const sim = calculateMaterialRequirements(
      1,
      'TPL-202611-001',
      43,
      'Meja Makan Jati Minimalis 6 Kursi',
      mockItems,
      2
    )

    expect(sim.target_produksi).toBe(2)
    expect(sim.items).toHaveLength(2)

    // Item 1: 2.5 * 2 = 5 batang. Stock = 12 -> Selisih = +7, Status CUKUP
    const item1 = sim.items[0]
    expect(item1.total_kebutuhan).toBe(5)
    expect(item1.stok_tersedia).toBe(12)
    expect(item1.selisih_stok).toBe(7)
    expect(item1.status_ketersediaan).toBe('CUKUP')
    expect(item1.kekurangan_qty).toBe(0)
    expect(item1.estimasi_total_biaya).toBe(5 * 450000)

    // Item 2: 1.0 * 2 = 2 lembar. Stock = 8 -> Selisih = +6, Status CUKUP
    const item2 = sim.items[1]
    expect(item2.total_kebutuhan).toBe(2)
    expect(item2.stok_tersedia).toBe(8)
    expect(item2.selisih_stok).toBe(6)
    expect(item2.status_ketersediaan).toBe('CUKUP')
    expect(item2.kekurangan_qty).toBe(0)
    expect(item2.estimasi_total_biaya).toBe(2 * 185000)

    // Overall summary
    expect(sim.status_kelayakan).toBe('SIAP_PRODUKSI')
    expect(sim.jumlah_bahan_kurang).toBe(0)
    expect(sim.jumlah_bahan_cukup).toBe(2)
  })

  it('5.2 correctly flags KURANG and calculates shortage when target exceeds available stock', () => {
    // Target = 10 units -> Item 1 needs 2.5 * 10 = 25 batang (Stock = 12)
    // Item 2 needs 1.0 * 10 = 10 lembar (Stock = 8)
    const sim = calculateMaterialRequirements(
      1,
      'TPL-202611-001',
      43,
      'Meja Makan Jati Minimalis 6 Kursi',
      mockItems,
      10
    )

    expect(sim.target_produksi).toBe(10)

    const item1 = sim.items[0]
    expect(item1.total_kebutuhan).toBe(25)
    expect(item1.selisih_stok).toBe(-13)
    expect(item1.status_ketersediaan).toBe('KURANG')
    expect(item1.kekurangan_qty).toBe(13)

    const item2 = sim.items[1]
    expect(item2.total_kebutuhan).toBe(10)
    expect(item2.selisih_stok).toBe(-2)
    expect(item2.status_ketersediaan).toBe('KURANG')
    expect(item2.kekurangan_qty).toBe(2)

    expect(sim.status_kelayakan).toBe('BAHAN_KURANG')
    expect(sim.jumlah_bahan_kurang).toBe(2)
  })

  it('5.3 handles zero and negative target gracefully (clamped to 0)', () => {
    const simZero = calculateMaterialRequirements(1, 'TPL-001', 43, 'Meja', mockItems, 0)
    expect(simZero.target_produksi).toBe(0)
    expect(simZero.items[0].total_kebutuhan).toBe(0)
    expect(simZero.status_kelayakan).toBe('SIAP_PRODUKSI')

    const simNegative = calculateMaterialRequirements(1, 'TPL-001', 43, 'Meja', mockItems, -5)
    expect(simNegative.target_produksi).toBe(0)
    expect(simNegative.items[0].total_kebutuhan).toBe(0)
    expect(simNegative.status_kelayakan).toBe('SIAP_PRODUKSI')
  })

  it('5.4 strictly maintains zero stock deduction during calculation', () => {
    const initialRawMaterials = materialService.getRawItems()
    const initialStock1 = initialRawMaterials.find(m => m.id === 1)?.qty
    const initialStock2 = initialRawMaterials.find(m => m.id === 2)?.qty

    // Run simulation multiple times with large targets
    calculateMaterialRequirements(1, 'TPL-001', 43, 'Meja', mockItems, 500)
    calculateMaterialRequirements(1, 'TPL-001', 43, 'Meja', mockItems, 1000)

    // Stock balances must be untouched
    const afterRawMaterials = materialService.getRawItems()
    expect(afterRawMaterials.find(m => m.id === 1)?.qty).toBe(initialStock1)
    expect(afterRawMaterials.find(m => m.id === 2)?.qty).toBe(initialStock2)

    // History must be empty of BoM transactions
    const history = stockPostingService.getAllHistori()
    expect(
      history.some(h => h.tbl === 'template_produk' || h.tbl === 'detail_template_produk')
    ).toBe(false)
  })

  it('5.5 performs decimal-safe rounding using roundToDecimal', () => {
    const val = roundToDecimal(0.1 + 0.2, 2)
    expect(val).toBe(0.3)

    const val4 = roundToDecimal(1.005, 2)
    expect(val4).toBe(1.01)
  })
})
