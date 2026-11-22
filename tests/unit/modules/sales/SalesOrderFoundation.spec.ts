import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  getRomanMonth,
  formatSalesOrderCode,
  calculateItemSubtotal,
  calculateOrderTotals,
  resolvePaymentStatus,
  formatPaymentStatusLabel,
  getPaymentStatusBadgeClass
} from '@/modules/sales/utils/sales-order-calculations'
import { validateSalesOrderForm } from '@/modules/sales/utils/sales-order-validation'
import { getVariantConfig, SALES_ORDER_VARIANTS } from '@/modules/sales/config/sales-order-variants'
import type {
  SalesOrderFormValues,
  SalesOrderProductRow
} from '@/modules/sales/types/sales-order.types'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'

describe('Sprint 7 — Sales Order Foundation, Calculations & Validation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    salesOrderTransactionService.reset()
  })

  describe('1. Roman Numerals & Document Numbering', () => {
    it('1.1 correctly converts all 12 calendar months to Roman numerals', () => {
      const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
      romanMonths.forEach((expected, index) => {
        expect(getRomanMonth(index + 1)).toBe(expected)
      })
    })

    it('1.2 formats SO Impact code matching legacy format SO/{year}/{romawi_bulan}/{last_number}', () => {
      // November 2026, sequence 344 -> SO/26/XI/0344
      const code = formatSalesOrderCode('impact', '2026-11-15', 344)
      expect(code).toBe('SO/26/XI/0344')
    })

    it('1.3 formats SO Pola code matching legacy format SO/{year}/PL/{month}/{last_number}', () => {
      // March 2026, sequence 93 -> SO/26/PL/03/0093
      const code = formatSalesOrderCode('pola', '2026-03-10', 93)
      expect(code).toBe('SO/26/PL/03/0093')
    })

    it('1.4 formats SO KS code matching legacy format SO/{year}/{month}/{last_number}', () => {
      // January 2026, sequence 65 -> SO/26/01/0065
      const code = formatSalesOrderCode('ks', '2026-01-20', 65)
      expect(code).toBe('SO/26/01/0065')
    })

    it('1.5 auto-generates sequential, unique codes per variant via service', () => {
      const codeImpact = salesOrderTransactionService.generateSalesOrderCode('impact', '2026-11-01')
      expect(codeImpact).toMatch(/^SO\/26\/XI\/\d{4}$/)

      const codePola = salesOrderTransactionService.generateSalesOrderCode('pola', '2026-03-01')
      expect(codePola).toMatch(/^SO\/26\/PL\/03\/\d{4}$/)

      const codeKs = salesOrderTransactionService.generateSalesOrderCode('ks', '2026-01-01')
      expect(codeKs).toMatch(/^SO\/26\/01\/\d{4}$/)
    })
  })

  describe('2. Financial Calculations (Subtotals, Discounts, PPN & Additional Costs)', () => {
    it('2.1 calculates item subtotal with quantity and discount accurately', () => {
      // 2 unit @ Rp 1.500.000, diskon 10% -> 2 * 1.500.000 * 0.9 = 2.700.000
      const subtotal1 = calculateItemSubtotal(2, 1500000, 10)
      expect(subtotal1).toBe(2700000)

      // 5 unit @ Rp 450.000, diskon 0% -> 2.250.000
      const subtotal2 = calculateItemSubtotal(5, 450000, 0)
      expect(subtotal2).toBe(2250000)
    })

    it('2.2 calculates SO Impact totals with 11% PPN on (items + additional costs)', () => {
      const mockRows: SalesOrderProductRow[] = [
        {
          rowId: 'row-1',
          produk_id: 1,
          nama_produk: 'Meja Direktur',
          stok_saat_ini: 10,
          qty: 2,
          status_produksi: 0,
          harga: 1000000,
          diskon: 0,
          subtotal: 2000000,
          keterangan: ''
        }
      ]
      const mockCosts = [{ komponen: 'ONGKIR SURABAYA', jumlah: 100000 }]

      // Subtotal items = 2.000.000
      // Total Sebelum PPN = 2.000.000
      // PPN 11% = 220.000 (dihitung dari Total Sebelum PPN)
      // Additional costs = 100.000
      // Grand Total = 2.320.000
      const totals = calculateOrderTotals('impact', mockRows, mockCosts, 11)
      expect(totals.itemsSubtotal).toBe(2000000)
      expect(totals.totalSebelumPpn).toBe(2000000)
      expect(totals.totalAdditionalCosts).toBe(100000)
      expect(totals.totalPpn).toBe(220000)
      expect(totals.grandTotal).toBe(2320000)
    })

    it('2.2b calculates SO Impact totals with order discount deducted before PPN', () => {
      const mockRows: SalesOrderProductRow[] = [
        {
          rowId: 'row-1',
          produk_id: 1,
          nama_produk: 'Meja Direktur',
          stok_saat_ini: 10,
          qty: 2,
          status_produksi: 0,
          harga: 1000000,
          diskon: 0,
          subtotal: 2000000,
          keterangan: ''
        }
      ]
      const mockCosts = [{ komponen: 'ONGKIR', jumlah: 50000 }]
      const orderDiscount = 200000

      // Subtotal = 2.000.000, Diskon = 200.000 -> Total Sebelum PPN = 1.800.000
      // PPN 11% = 198.000
      // Grand Total = 1.800.000 + 50.000 + 198.000 = 2.048.000
      const totals = calculateOrderTotals('impact', mockRows, mockCosts, 11, orderDiscount)
      expect(totals.itemsSubtotal).toBe(2000000)
      expect(totals.totalSebelumPpn).toBe(1800000)
      expect(totals.totalAdditionalCosts).toBe(50000)
      expect(totals.totalPpn).toBe(198000)
      expect(totals.grandTotal).toBe(2048000)
    })

    it('2.3 calculates SO Pola & KS totals as Non-PPN (PPN = 0) even if rate is provided', () => {
      const mockRows: SalesOrderProductRow[] = [
        {
          rowId: 'row-1',
          produk_id: 2,
          nama_produk: 'Kursi Kerja Ergonomis',
          stok_saat_ini: 15,
          qty: 4,
          status_produksi: 0,
          harga: 500000,
          diskon: 0,
          subtotal: 2000000,
          keterangan: ''
        }
      ]
      const mockCosts = [{ komponen: 'BIAYA PACKING KAYU', jumlah: 50000 }]

      const totalsPola = calculateOrderTotals('pola', mockRows, mockCosts, 11)
      expect(totalsPola.itemsSubtotal).toBe(2000000)
      expect(totalsPola.totalAdditionalCosts).toBe(50000)
      expect(totalsPola.totalPpn).toBe(0)
      expect(totalsPola.grandTotal).toBe(2050000)

      const totalsKs = calculateOrderTotals('ks', mockRows, mockCosts, 11)
      expect(totalsKs.totalPpn).toBe(0)
      expect(totalsKs.grandTotal).toBe(2050000)
    })

    it('2.4 resolves payment status correctly according to total and paid amount', () => {
      expect(resolvePaymentStatus(1000000, 0)).toBe('BELUM_BAYAR')
      expect(resolvePaymentStatus(1000000, 400000)).toBe('SEBAGIAN')
      expect(resolvePaymentStatus(1000000, 1000000)).toBe('LUNAS')
      expect(resolvePaymentStatus(1000000, 1200000)).toBe('LUNAS')
    })
  })

  describe('3. Form Validation Engine', () => {
    const validForm: SalesOrderFormValues = {
      kode: 'SO/26/XI/0001',
      customer_id: 1,
      tanggal: '2026-11-01',
      sales_id: 118,
      keterangan: 'Order test',
      no_faktur_pajak: '010.000-26.00000001',
      is_ppn: 1,
      ppn_id: 1,
      ppn_rate: 11,
      status: 0
    }

    const validRows: SalesOrderProductRow[] = [
      {
        rowId: 'row-1',
        produk_id: 1,
        nama_produk: 'Meja Makan',
        stok_saat_ini: 5,
        qty: 1,
        status_produksi: 0,
        harga: 750000,
        diskon: 0,
        subtotal: 750000,
        keterangan: ''
      }
    ]

    it('3.1 passes validation when all header and item fields are valid', () => {
      const result = validateSalesOrderForm('impact', validForm, validRows)
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
      expect(result.itemErrors.length).toBe(0)
    })

    it('3.2 rejects form if customer, date, or salesman is missing', () => {
      const invalidForm = { ...validForm, customer_id: null, tanggal: '', sales_id: null }
      const result = validateSalesOrderForm('impact', invalidForm, validRows)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveProperty('customer_id')
      expect(result.errors).toHaveProperty('tanggal')
      expect(result.errors).toHaveProperty('sales_id')
    })

    it('3.2.1 accepts form when salesman is set to "Tanpa Sales" (sales_id = 0)', () => {
      const formWithoutSales = { ...validForm, sales_id: 0 }
      const result = validateSalesOrderForm('impact', formWithoutSales, validRows)
      expect(result.isValid).toBe(true)
      expect(result.errors).not.toHaveProperty('sales_id')
    })

    it('3.3 rejects form if items list is empty or has zero qty', () => {
      const emptyRows: SalesOrderProductRow[] = []
      const result = validateSalesOrderForm('impact', validForm, emptyRows)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveProperty('items')

      const zeroQtyRows: SalesOrderProductRow[] = [{ ...validRows[0], qty: 0 }]
      const resultZero = validateSalesOrderForm('impact', validForm, zeroQtyRows)
      expect(resultZero.isValid).toBe(false)
    })

    it('3.4 catches duplicate products in spreadsheet rows', () => {
      const duplicateRows: SalesOrderProductRow[] = [
        { ...validRows[0], rowId: 'row-1', produk_id: 10 },
        { ...validRows[0], rowId: 'row-2', produk_id: 10 }
      ]
      const result = validateSalesOrderForm('impact', validForm, duplicateRows)
      expect(result.isValid).toBe(false)
      expect(result.itemErrors.some(e => e.message.includes('duplikasi'))).toBe(true)
    })
  })

  describe('4. Variant Configuration Registry', () => {
    it('4.1 provides valid configuration for all three variants', () => {
      const variants = ['impact', 'pola', 'ks'] as const
      variants.forEach(key => {
        const config = getVariantConfig(key)
        expect(config.key).toBe(key)
        expect(config.routePrefix).toContain(key)
        expect(config.companyLetterhead.title).toBeTruthy()
        expect(config.companyLetterhead.phone).toBeTruthy()
      })

      expect(SALES_ORDER_VARIANTS.impact.hasTax).toBe(true)
      expect(SALES_ORDER_VARIANTS.pola.hasTax).toBe(false)
      expect(SALES_ORDER_VARIANTS.ks.hasTax).toBe(false)
    })
  })

  describe('5. Payment Status Resolution & Indonesian Formatting', () => {
    it('5.1 correctly resolves PaymentStatus from total and paid amount', () => {
      expect(resolvePaymentStatus(5000000, 5000000)).toBe('LUNAS')
      expect(resolvePaymentStatus(5000000, 6000000)).toBe('LUNAS')
      expect(resolvePaymentStatus(5000000, 2500000)).toBe('SEBAGIAN')
      expect(resolvePaymentStatus(5000000, 0)).toBe('BELUM_BAYAR')
      expect(resolvePaymentStatus(0, 0)).toBe('BELUM_BAYAR')
    })

    it('5.2 formats human-readable Indonesian labels: Terbayar, Terbayar Sebagian, Belum Bayar', () => {
      expect(formatPaymentStatusLabel('LUNAS')).toBe('Terbayar')
      expect(formatPaymentStatusLabel('TERBAYAR')).toBe('Terbayar')
      expect(formatPaymentStatusLabel('SEBAGIAN')).toBe('Terbayar Sebagian')
      expect(formatPaymentStatusLabel('TERBAYAR_SEBAGIAN')).toBe('Terbayar Sebagian')
      expect(formatPaymentStatusLabel('BELUM_BAYAR')).toBe('Belum Bayar')
      expect(formatPaymentStatusLabel(null)).toBe('Belum Bayar')
    })

    it('5.3 assigns appropriate semantic Tailwind badge colors', () => {
      expect(getPaymentStatusBadgeClass('LUNAS')).toContain('emerald')
      expect(getPaymentStatusBadgeClass('SEBAGIAN')).toContain('amber')
      expect(getPaymentStatusBadgeClass('BELUM_BAYAR')).toContain('rose')
    })
  })
})
