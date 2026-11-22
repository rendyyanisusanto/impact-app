import { describe, it, expect } from 'vitest'
import {
  resolvePaymentStatus,
  calculatePaymentSummary,
  generatePaymentCode,
  validatePaymentAmount,
  calculateSalesOrderPaymentSummary
} from '@/modules/sales/utils/sales-payment-calculations'
import type { SalesPayment } from '@/modules/sales/types/sales-payment.types'

describe('Sales Payment Calculations Utility', () => {
  describe('resolvePaymentStatus', () => {
    it('returns BELUM_BAYAR when paid is 0', () => {
      expect(resolvePaymentStatus(1000000, 0)).toBe('BELUM_BAYAR')
      expect(resolvePaymentStatus(1000000, -500)).toBe('BELUM_BAYAR')
    })

    it('returns SEBAGIAN when paid is greater than 0 but less than total', () => {
      expect(resolvePaymentStatus(1000000, 400000)).toBe('SEBAGIAN')
      expect(resolvePaymentStatus(1000000, 999999)).toBe('SEBAGIAN')
    })

    it('returns LUNAS when paid equals or exceeds total', () => {
      expect(resolvePaymentStatus(1000000, 1000000)).toBe('LUNAS')
      expect(resolvePaymentStatus(1000000, 1500000)).toBe('LUNAS')
    })
  })

  describe('calculatePaymentSummary', () => {
    it('calculates full settlement in single payment', () => {
      const payments = [{ jumlah: 4162500, status: 1 }]
      const result = calculatePaymentSummary(4162500, payments)

      expect(result.totalInvoice).toBe(4162500)
      expect(result.sudahDibayar).toBe(4162500)
      expect(result.sisaPembayaran).toBe(0)
      expect(result.statusPembayaran).toBe('LUNAS')
    })

    it('calculates partial payments in two installments', () => {
      const payments = [
        { jumlah: 400000, status: 1 },
        { jumlah: 300000, status: 1 }
      ]
      const result = calculatePaymentSummary(1000000, payments)

      expect(result.totalInvoice).toBe(1000000)
      expect(result.sudahDibayar).toBe(700000)
      expect(result.sisaPembayaran).toBe(300000)
      expect(result.statusPembayaran).toBe('SEBAGIAN')
    })

    it('strictly excludes cancelled payments (status === 0)', () => {
      const payments = [
        { jumlah: 500000, status: 1 },
        { jumlah: 500000, status: 0 } // cancelled reversal
      ]
      const result = calculatePaymentSummary(1000000, payments)

      expect(result.sudahDibayar).toBe(500000)
      expect(result.sisaPembayaran).toBe(500000)
      expect(result.statusPembayaran).toBe('SEBAGIAN')
    })

    it('handles zero payments correctly', () => {
      const result = calculatePaymentSummary(2500000, [])
      expect(result.sudahDibayar).toBe(0)
      expect(result.sisaPembayaran).toBe(2500000)
      expect(result.statusPembayaran).toBe('BELUM_BAYAR')
    })
  })

  describe('generatePaymentCode', () => {
    it('generates sequential payment code from invoice code', () => {
      const code1 = generatePaymentCode('INV/26/XI/0344-1', [])
      expect(code1).toBe('PAY/26/XI/0344-1/01')

      const dummyPayment = { id: 1, kode: 'PAY/26/XI/0344-1/01' } as SalesPayment
      const code2 = generatePaymentCode('INV/26/XI/0344-1', [dummyPayment])
      expect(code2).toBe('PAY/26/XI/0344-1/02')
    })
  })

  describe('validatePaymentAmount', () => {
    it('rejects 0 or negative amounts', () => {
      expect(validatePaymentAmount(0, 1000000).isValid).toBe(false)
      expect(validatePaymentAmount(-100, 1000000).isValid).toBe(false)
    })

    it('rejects overpayments exceeding remaining balance', () => {
      const check = validatePaymentAmount(1500000, 1000000)
      expect(check.isValid).toBe(false)
      expect(check.error).toContain('melebihi sisa tagihan')
    })

    it('accepts exact remaining balance and partial amount', () => {
      expect(validatePaymentAmount(1000000, 1000000).isValid).toBe(true)
      expect(validatePaymentAmount(400000, 1000000).isValid).toBe(true)
    })
  })

  describe('calculateSalesOrderPaymentSummary', () => {
    it('separates total_so, sudah_invoice, and sudah_dibayar clearly', () => {
      const invoices = [
        { id: 101, total: 4000000, status: 1 },
        { id: 102, total: 3000000, status: 1 }
      ]
      const payments = [
        { invoice_id: 101, jumlah: 4000000, status: 1 }, // Inv 101 paid
        { invoice_id: 102, jumlah: 1500000, status: 1 } // Inv 102 partial
      ]

      const summary = calculateSalesOrderPaymentSummary(10000000, invoices, payments)

      expect(summary.total_so).toBe(10000000)
      expect(summary.total_sudah_invoice).toBe(7000000)
      expect(summary.total_sudah_dibayar).toBe(5500000)
      expect(summary.sisa_so_dibayar).toBe(4500000)
      expect(summary.payment_status).toBe('SEBAGIAN')
    })
  })
})
