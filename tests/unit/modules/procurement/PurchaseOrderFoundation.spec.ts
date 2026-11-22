import { describe, it, expect, beforeEach } from 'vitest'
import { purchaseOrderService } from '@/modules/procurement/purchase-orders/services/purchase-order.service'
import {
  calculateRowSubtotal,
  calculateDocumentSummary,
  roundDecimal
} from '@/modules/procurement/purchase-orders/utils/purchase-order-calculations'
import { validatePurchaseOrderForm } from '@/modules/procurement/purchase-orders/utils/purchase-order-validation'
import { createEmptyRow } from '@/modules/procurement/purchase-orders/composables/usePurchaseOrderSpreadsheet'

describe('Sprint 4 — Task 1: Purchase Order Foundation, Schema Mapping & Calculation Rules', () => {
  beforeEach(() => {
    purchaseOrderService.reset()
  })

  describe('1. Database Schema Mapping & Typed Service Contracts', () => {
    it('1.1 maps purchase_order header columns accurately without inventing non-schema fields', async () => {
      const res = await purchaseOrderService.list()
      expect(res.data.length).toBeGreaterThanOrEqual(1)

      const first = res.data[0]
      // Verify exact legacy schema fields
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('kode')
      expect(first).toHaveProperty('suplier_id') // legacy spelling
      expect(first).toHaveProperty('tanggal')
      expect(first).toHaveProperty('keterangan')
      expect(first).toHaveProperty('is_ppn')
      expect(first).toHaveProperty('ppn_id')
      expect(first).toHaveProperty('subtotal')
      expect(first).toHaveProperty('diskon')
      expect(first).toHaveProperty('total')
      expect(first).toHaveProperty('status')
      expect(first).toHaveProperty('total_ppn')
      expect(first).toHaveProperty('status_aktif')
      expect(first).toHaveProperty('status_transaksi_id')
      expect(first).toHaveProperty('uuid')
    })

    it('1.2 maps detail_purchase_order columns accurately', async () => {
      const res = await purchaseOrderService.getById(52)
      expect(res.header.id).toBe(52)
      expect(res.details.length).toBeGreaterThan(0)

      const firstDetail = res.details[0]
      expect(firstDetail).toHaveProperty('id')
      expect(firstDetail).toHaveProperty('bahan_id')
      expect(firstDetail).toHaveProperty('qty')
      expect(firstDetail).toHaveProperty('satuan_beli_id')
      expect(firstDetail).toHaveProperty('harga')
      expect(firstDetail).toHaveProperty('diskon')
      expect(firstDetail).toHaveProperty('subtotal')
      expect(firstDetail).toHaveProperty('keterangan')
    })

    it('1.3 provides reference lookups for suppliers, materials, units, and status transaksi', async () => {
      const suppliers = await purchaseOrderService.getSuppliers()
      expect(suppliers.length).toBeGreaterThan(0)
      expect(suppliers[0]).toHaveProperty('id')
      expect(suppliers[0]).toHaveProperty('nama')

      const materials = await purchaseOrderService.getMaterials()
      expect(materials.length).toBeGreaterThan(0)
      expect(materials[0]).toHaveProperty('id')
      expect(materials[0]).toHaveProperty('kode')
      expect(materials[0]).toHaveProperty('nama')
      expect(materials[0]).toHaveProperty('qty') // Read-only stock

      const units = await purchaseOrderService.getPurchaseUnits()
      expect(units.length).toBeGreaterThan(0)

      const statusList = await purchaseOrderService.getStatusTransaksiList()
      expect(statusList).toEqual([
        { id: 1, status_transaksi: 'CASH' },
        { id: 2, status_transaksi: 'JATUH TEMPO' }
      ])
    })
  })

  describe('2. Decimal-Safe Calculations & Rounding', () => {
    it('2.1 accurately computes row subtotal with quantity, price, and discount percentage', () => {
      // 10 pcs @ Rp 100.000 with 10% discount = Rp 900.000
      const subtotal1 = calculateRowSubtotal(10, 100000, 10)
      expect(subtotal1).toBe(900000)

      // Zero discount
      const subtotal2 = calculateRowSubtotal(5, 50000, 0)
      expect(subtotal2).toBe(250000)

      // 100% discount
      const subtotal3 = calculateRowSubtotal(5, 50000, 100)
      expect(subtotal3).toBe(0)

      // Negative values sanitized to 0
      const subtotal4 = calculateRowSubtotal(-5, -50000, -10)
      expect(subtotal4).toBe(0)
    })

    it('2.2 avoids floating point precision drift in decimals', () => {
      // 0.1 + 0.2 in floating point is 0.30000000000000004
      expect(roundDecimal(0.1 + 0.2)).toBe(0.3)
      expect(roundDecimal(19.99 * 3)).toBe(59.97)
    })

    it('2.3 accurately calculates complete document summary with subtotal, global discount, and PPN', () => {
      const rows = [
        { bahan_id: 1, qty: 10, harga: 100000, diskon: 0 }, // 1.000.000
        { bahan_id: 2, qty: 5, harga: 200000, diskon: 10 }, // 900.000
        { bahan_id: null, qty: 10, harga: 50000, diskon: 0 } // empty row ignored
      ]

      // Subtotal = 1.900.000
      // Diskon Global 10% = 190.000
      // Total Sebelum PPN = 1.710.000
      // PPN 11% = 188.100
      // Total Bayar = 1.898.100
      const summaryWithPpn = calculateDocumentSummary(rows, true, 11, 10)
      expect(summaryWithPpn.subtotal).toBe(1900000)
      expect(summaryWithPpn.diskon_persen).toBe(10)
      expect(summaryWithPpn.diskon_nominal).toBe(1900000 * 0.1)
      expect(summaryWithPpn.total_sebelum_ppn).toBe(1710000)
      expect(summaryWithPpn.total_ppn).toBe(188100)
      expect(summaryWithPpn.total).toBe(1898100)

      // Non-PPN summary
      const summaryNonPpn = calculateDocumentSummary(rows, false, 11, 10)
      expect(summaryNonPpn.total_ppn).toBe(0)
      expect(summaryNonPpn.total).toBe(1710000)
    })
  })

  describe('3. Form Validation Rules', () => {
    it('3.1 rejects form when required header fields are missing', () => {
      const header = {
        kode: '',
        suplier_id: null,
        tanggal: '',
        keterangan: '',
        is_ppn: false,
        ppn_id: null,
        status_transaksi_id: null,
        status: 0,
        diskon_persen: 0
      }
      const rows = [createEmptyRow(0)]

      const res = validatePurchaseOrderForm(header, rows)
      expect(res.isValid).toBe(false)
      expect(res.errors.kode).toBeDefined()
      expect(res.errors.suplier_id).toBeDefined()
      expect(res.errors.tanggal).toBeDefined()
      expect(res.errors.status_transaksi_id).toBeDefined()
      expect(res.errors.details).toBeDefined() // No valid material rows
    })

    it('3.2 validates active detail row constraints', () => {
      const header = {
        kode: 'PO/TEST-001',
        suplier_id: 1,
        tanggal: '2026-01-15',
        keterangan: '',
        is_ppn: false,
        ppn_id: null,
        status_transaksi_id: 1,
        status: 0,
        diskon_persen: 0
      }
      const invalidRow = {
        ...createEmptyRow(0),
        bahan_id: 1,
        qty: -5, // Invalid negative
        harga: -1000, // Invalid negative
        diskon: 150 // Invalid > 100%
      }

      const res = validatePurchaseOrderForm(header, [invalidRow])
      expect(res.isValid).toBe(false)
      expect(res.detailErrors.length).toBe(1)
      expect(res.detailErrors[0].errors.qty).toBeDefined()
      expect(res.detailErrors[0].errors.harga).toBeDefined()
      expect(res.detailErrors[0].errors.diskon).toBeDefined()
    })
  })

  describe('4. Mock Repository Atomic Transactions', () => {
    it('4.1 creates Purchase Order and its details atomically', async () => {
      const initialCount = (await purchaseOrderService.list()).total

      const created = await purchaseOrderService.create({
        header: {
          kode: 'PO/2026-NEW-01',
          suplier_id: 1,
          tanggal: '2026-01-20',
          keterangan: 'New batch atomic test',
          is_ppn: 1,
          subtotal: 900000,
          diskon: 0,
          total_ppn: 99000,
          total: 999000,
          status: 0,
          status_transaksi_id: 1
        },
        details: [
          {
            bahan_id: 1,
            qty: 2,
            satuan_beli_id: 1,
            harga: 450000,
            diskon: 0,
            subtotal: 900000,
            keterangan: 'Item note'
          }
        ]
      })

      expect(created.header.id).toBeDefined()
      expect(created.details.length).toBe(1)

      const after = await purchaseOrderService.list()
      expect(after.total).toBe(initialCount + 1)

      const fetched = await purchaseOrderService.getById(created.header.id)
      expect(fetched.header.kode).toBe('PO/2026-NEW-01')
      expect(fetched.details[0].qty).toBe(2)
    })

    it('4.2 rolls back cleanly if validation fails mid-create', async () => {
      const initialCount = (await purchaseOrderService.list()).total

      await expect(
        purchaseOrderService.create({
          header: {
            kode: '', // Invalid empty kode
            suplier_id: 1,
            tanggal: '2026-01-20',
            is_ppn: 0,
            subtotal: 0,
            diskon: 0,
            total: 0,
            total_ppn: 0,
            status: 0,
            status_transaksi_id: 1
          },
          details: []
        })
      ).rejects.toThrow('Kode PO wajib diisi.')

      const after = await purchaseOrderService.list()
      expect(after.total).toBe(initialCount)
    })

    it('4.3 blocks deletion of an approved Purchase Order', async () => {
      // PO 52 is approved (status = 1)
      await expect(purchaseOrderService.delete(52)).rejects.toThrow(
        'Purchase Order yang sudah disetujui tidak dapat dihapus.'
      )
    })
  })
})
