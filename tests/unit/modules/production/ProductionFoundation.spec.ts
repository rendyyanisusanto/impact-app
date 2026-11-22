import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { productionService } from '@/modules/production/services/production.service'
import { productService } from '@/modules/inventory/products/services/product.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import {
  formatProductionCode,
  parseProductionCode,
  calculateProductionTotals
} from '@/modules/production/utils/production-calculations'
import {
  validateProductionForm,
  validateProductionPayload
} from '@/modules/production/utils/production-validation'
import {
  JENIS_PRODUKSI,
  STATUS_PRODUKSI,
  DOKUMEN_STATUS
} from '@/modules/production/types/production.types'

describe('Sprint 6 — Task 7: Production Foundation & Schema Audit', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    productionService.reset()
    productService.reset()
    materialService.reset()
  })

  it('7.1 maps database tables produksi and detail_produksi_produk accurately', async () => {
    const list = await productionService.getProductions()
    expect(list.data.length).toBeGreaterThan(0)

    const first = list.data[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('kode')
    expect(first).toHaveProperty('tanggal')
    expect(first).toHaveProperty('jenis_produksi')
    expect(first).toHaveProperty('status_produksi')
    expect(first).toHaveProperty('status')
    expect(first).toHaveProperty('status_aktif')
    expect(first).toHaveProperty('jumlah_jenis_produk')
    expect(first).toHaveProperty('total_qty')

    const detail = await productionService.getProductionById(first.id)
    expect(detail).not.toBeNull()
    expect(detail!.items.length).toBeGreaterThan(0)

    const item = detail!.items[0]
    expect(item).toHaveProperty('rowId')
    expect(item).toHaveProperty('produk_id')
    expect(item).toHaveProperty('kode_produk')
    expect(item).toHaveProperty('nama_produk')
    expect(item).toHaveProperty('stok')
    expect(item).toHaveProperty('qty')
  })

  it('7.2 generates production number matching legacy pattern PD{month}{year}-{seq}', () => {
    const date = new Date(2026, 10, 1) // November 2026
    const code = formatProductionCode(date, 5, 4)
    expect(code).toBe('PD1126-0005')

    const parsed = parseProductionCode('PD1126-0005')
    expect(parsed).not.toBeNull()
    expect(parsed!.month).toBe(11)
    expect(parsed!.year).toBe(26)
    expect(parsed!.sequence).toBe(5)
  })

  it('7.3 adheres to legacy Jenis Produksi and Status Produksi domain enums', () => {
    // 1 = Pesanan, 0 = Non Pesanan / Stok
    expect(JENIS_PRODUKSI.PESANAN).toBe(1)
    expect(JENIS_PRODUKSI.NON_PESANAN).toBe(0)

    // 0 = Pending, 1 = Proses, 2 = Selesai
    expect(STATUS_PRODUKSI.PENDING).toBe(0)
    expect(STATUS_PRODUKSI.PROSES).toBe(1)
    expect(STATUS_PRODUKSI.SELESAI).toBe(2)

    // Document status: 0 = Draft, 1 = Posted
    expect(DOKUMEN_STATUS.DRAFT).toBe(0)
    expect(DOKUMEN_STATUS.POSTED).toBe(1)
  })

  it('7.4 validates form fields and rejects invalid entries', () => {
    const invalidHeader = {
      kode: 'INVALID-CODE',
      jenis_produksi: 99,
      tanggal: 'invalid-date',
      status_produksi: 88,
      keterangan: 'a'.repeat(300)
    }

    const invalidRows = [
      {
        rowId: 'row-1',
        produk_id: null,
        kode_produk: '',
        nama_produk: '',
        stok: 0,
        qty: -5,
        keterangan: ''
      }
    ]

    const result = validateProductionForm(invalidHeader, invalidRows)
    expect(result.isValid).toBe(false)
    expect(result.errors.kode).toBeDefined()
    expect(result.errors.jenis_produksi).toBeDefined()
    expect(result.errors.tanggal).toBeDefined()
    expect(result.errors.status_produksi).toBeDefined()
    expect(result.errors.keterangan).toBeDefined()
    expect(result.itemErrors.length).toBeGreaterThan(0)
  })

  it('7.5 prevents duplicate products in spreadsheet rows', () => {
    const validHeader = {
      kode: 'PD1126-0001',
      jenis_produksi: 1,
      tanggal: '2026-11-01',
      status_produksi: 0
    }

    const duplicateRows = [
      {
        rowId: 'row-1',
        produk_id: 43,
        kode_produk: 'IC-74',
        nama_produk: 'Kursi Kantor Mesh',
        stok: 10,
        qty: 5,
        keterangan: ''
      },
      {
        rowId: 'row-2',
        produk_id: 43, // Duplicate!
        kode_produk: 'IC-74',
        nama_produk: 'Kursi Kantor Mesh',
        stok: 10,
        qty: 10,
        keterangan: ''
      }
    ]

    const result = validateProductionForm(validHeader, duplicateRows)
    expect(result.isValid).toBe(false)
    expect(result.itemErrors.some(e => e.message.includes('sudah terdaftar'))).toBe(true)
  })

  it('7.6 calculates totals accurately for valid rows', () => {
    const rows = [
      { produk_id: 43, qty: 10 },
      { produk_id: 44, qty: 5 },
      { produk_id: 43, qty: 0 }, // filtered
      { produk_id: null, qty: 8 } // filtered
    ]

    const totals = calculateProductionTotals(rows)
    expect(totals.distinctProducts).toBe(2)
    expect(totals.totalQty).toBe(15)
  })

  it('7.7 validates payload at service boundary before database save', () => {
    expect(() =>
      validateProductionPayload({
        tanggal: '',
        jenis_produksi: 1,
        status_produksi: 0,
        items: [{ produk_id: 43, qty: 10 }]
      })
    ).toThrow('Tanggal')

    expect(() =>
      validateProductionPayload({
        tanggal: '2026-11-01',
        jenis_produksi: 1,
        status_produksi: 0,
        items: []
      })
    ).toThrow('minimal 1 item')

    expect(() =>
      validateProductionPayload({
        tanggal: '2026-11-01',
        jenis_produksi: 1,
        status_produksi: 0,
        items: [{ produk_id: 43, qty: -2 }]
      })
    ).toThrow('lebih besar dari 0')
  })

  it('7.8 allows valid submission when only 2 rows are filled out of 10 spreadsheet rows', () => {
    const validHeader = {
      kode: 'PD1126-0001',
      jenis_produksi: 1,
      tanggal: '2026-11-01',
      status_produksi: 0
    }

    const tenRows = [
      { rowId: 'row-1', produk_id: 43, nama_produk: 'Kursi A', qty: 5, keterangan: '' },
      { rowId: 'row-2', produk_id: 44, nama_produk: 'Meja B', qty: 3, keterangan: '' },
      // Rows 3-10 are untouched placeholders with default qty: 1
      ...Array.from({ length: 8 }, (_, i) => ({
        rowId: `row-${i + 3}`,
        produk_id: null,
        kode_produk: '',
        nama_produk: '',
        stok: 0,
        qty: 1,
        keterangan: '',
        has_bom: false
      }))
    ]

    const result = validateProductionForm(validHeader, tenRows as any)
    expect(result.isValid).toBe(true)
    expect(result.itemErrors.length).toBe(0)
    expect(Object.keys(result.errors).length).toBe(0)
  })
})
