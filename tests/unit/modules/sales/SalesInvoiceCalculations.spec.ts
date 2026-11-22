import { describe, it, expect } from 'vitest'
import {
  generateInvoiceCode,
  calculateInvoiceTaxes,
  calculateInvoiceSummary,
  resolveInvoicePaymentStatus
} from '@/modules/sales/utils/sales-invoice-calculations'
import type { SalesInvoice } from '@/modules/sales/types/sales-invoice.types'

describe('Sales Invoice Calculations & Code Generation (Sprint 7)', () => {
  describe('Invoice Code Generation (Legacy Schema & Screenshot Reference)', () => {
    it('generates first invoice code by replacing SO prefix with INV and suffix -1', () => {
      const code = generateInvoiceCode('SO/26/XI/0344', [])
      expect(code).toBe('INV/26/XI/0344-1')
    })

    it('generates sequential suffix for subsequent invoices for same SO', () => {
      const existing: Partial<SalesInvoice>[] = [
        { kode: 'INV/26/XI/0344-1', so_id: 1, total: 1000000, status: 1 } as SalesInvoice
      ]
      const code = generateInvoiceCode('SO/26/XI/0344', existing as SalesInvoice[])
      expect(code).toBe('INV/26/XI/0344-2')
    })

    it('handles SO Pola and SO KS code patterns correctly', () => {
      const polaCode = generateInvoiceCode('SO/26/PL/03/0093', [])
      expect(polaCode).toBe('INV/26/PL/03/0093-1')

      const ksCode = generateInvoiceCode('SO/26/01/0065', [])
      expect(ksCode).toBe('INV/26/01/0065-1')
    })
  })

  describe('DPP & PPN Tax Calculations', () => {
    it('calculates DPP and PPN backwards from gross total for SO Impact (11% Tax)', () => {
      // Example: Gross Rp 1.110.000 -> DPP = Rp 1.000.000, PPN = Rp 110.000
      const result = calculateInvoiceTaxes(1110000, true, 11)
      expect(result.total).toBe(1110000)
      expect(result.dpp).toBe(1000000)
      expect(result.ppn).toBe(110000)
      expect(result.dpp + result.ppn).toBe(result.total)
    })

    it('maintains exact decimal-safe balance where DPP + PPN === Total', () => {
      // Example with non-round division: Rp 1.000.000
      const result = calculateInvoiceTaxes(1000000, true, 11)
      expect(result.total).toBe(1000000)
      expect(result.dpp + result.ppn).toBe(1000000)
    })

    it('sets DPP = Total and PPN = 0 for Non-PPN variants (SO Pola & SO KS)', () => {
      const result = calculateInvoiceTaxes(4900000, false, 0)
      expect(result.total).toBe(4900000)
      expect(result.dpp).toBe(4900000)
      expect(result.ppn).toBe(0)
    })
  })

  describe('Invoice Summary & Sisa Calculation', () => {
    it('returns Belum Invoice when no active invoices exist', () => {
      const summary = calculateInvoiceSummary(8325000, [])
      expect(summary.sudahInvoice).toBe(0)
      expect(summary.sisaInvoice).toBe(8325000)
      expect(summary.status).toBe('Belum Invoice')
    })

    it('returns Sebagian Invoice when active invoices sum to less than SO total', () => {
      const invoices: Partial<SalesInvoice>[] = [
        { id: 1, total: 3000000, status: 1 } as SalesInvoice
      ]
      const summary = calculateInvoiceSummary(8325000, invoices as SalesInvoice[])
      expect(summary.sudahInvoice).toBe(3000000)
      expect(summary.sisaInvoice).toBe(5325000)
      expect(summary.status).toBe('Sebagian Invoice')
    })

    it('returns Sudah Invoice when active invoices cover full SO total', () => {
      const invoices: Partial<SalesInvoice>[] = [
        { id: 1, total: 4000000, status: 1 } as SalesInvoice,
        { id: 2, total: 4325000, status: 1 } as SalesInvoice
      ]
      const summary = calculateInvoiceSummary(8325000, invoices as SalesInvoice[])
      expect(summary.sudahInvoice).toBe(8325000)
      expect(summary.sisaInvoice).toBe(0)
      expect(summary.status).toBe('Sudah Invoice')
    })

    it('strictly excludes cancelled invoices (status: 0) from sudahInvoice and restores sisaInvoice', () => {
      const invoices: Partial<SalesInvoice>[] = [
        { id: 1, total: 4000000, status: 1 } as SalesInvoice,
        { id: 2, total: 4325000, status: 0 } as SalesInvoice // Cancelled
      ]
      const summary = calculateInvoiceSummary(8325000, invoices as SalesInvoice[])
      expect(summary.sudahInvoice).toBe(4000000)
      expect(summary.sisaInvoice).toBe(4325000)
      expect(summary.status).toBe('Sebagian Invoice')
    })
  })

  describe('Invoice Payment Status Resolution', () => {
    it('resolves BELUM_BAYAR when terbayar <= 0', () => {
      expect(resolveInvoicePaymentStatus(1000000, 0)).toBe('BELUM_BAYAR')
    })

    it('resolves SEBAGIAN when 0 < terbayar < total', () => {
      expect(resolveInvoicePaymentStatus(1000000, 400000)).toBe('SEBAGIAN')
    })

    it('resolves LUNAS when terbayar >= total', () => {
      expect(resolveInvoicePaymentStatus(1000000, 1000000)).toBe('LUNAS')
      expect(resolveInvoicePaymentStatus(1000000, 1200000)).toBe('LUNAS')
    })
  })
})
