import { describe, it, expect } from 'vitest'
import {
  generateDeliveryNoteCode,
  getRomanMonth,
  resolveShippingStatusLabel,
  resolveDocumentStatusLabel,
  calculateDeliveryTotals,
  calculateRemainingDeliveryQty,
  validateDeliveryQuantities
} from '@/modules/delivery/utils/delivery-note-calculations'

describe('Sprint 7 — Surat Jalan Calculations & Utilities', () => {
  describe('getRomanMonth', () => {
    it('converts month numbers to correct Roman numerals', () => {
      expect(getRomanMonth(1)).toBe('I')
      expect(getRomanMonth(3)).toBe('III')
      expect(getRomanMonth(5)).toBe('V')
      expect(getRomanMonth(10)).toBe('X')
      expect(getRomanMonth(12)).toBe('XII')
    })
  })

  describe('generateDeliveryNoteCode', () => {
    it('generates standard Impact Surat Jalan code format: SJ/YY/MM/XXXX', () => {
      const code = generateDeliveryNoteCode('impact', 42, '2026-03-15')
      expect(code).toBe('SJ/26/03/0042')
    })

    it('generates Pola Surat Jalan code format with /PL/: SJ/YY/PL/MM/XXXX', () => {
      const code = generateDeliveryNoteCode('pola', 19, '2026-03-15')
      expect(code).toBe('SJ/26/PL/03/0019')
    })

    it('generates KS Surat Jalan code format with Roman Month: SJ/YY/ROMAN/XXXX', () => {
      const code = generateDeliveryNoteCode('ks', 7, '2026-04-20')
      expect(code).toBe('SJ/26/IV/0007')
    })

    it('generates Pickup (Ambil Sendiri) code format prefixed with SJA/', () => {
      const code = generateDeliveryNoteCode('impact', 5, '2026-05-10', true)
      expect(code).toBe('SJA/26/05/0005')
    })
  })

  describe('resolveShippingStatusLabel', () => {
    it('returns BELUM DIKIRIM when status_kirim is 0', () => {
      expect(resolveShippingStatusLabel(0, 0)).toBe('BELUM DIKIRIM')
    })

    it('returns TERKIRIM when status_kirim is 1', () => {
      expect(resolveShippingStatusLabel(1, 0)).toBe('TERKIRIM')
    })

    it('returns AMBIL SENDIRI when status_ambil is 1 or status_kirim is 2', () => {
      expect(resolveShippingStatusLabel(0, 1)).toBe('AMBIL SENDIRI')
      expect(resolveShippingStatusLabel(2, 0)).toBe('AMBIL SENDIRI')
    })
  })

  describe('resolveDocumentStatusLabel', () => {
    it('resolves 0 as DRAFT', () => {
      expect(resolveDocumentStatusLabel(0)).toBe('DRAFT')
    })

    it('resolves 1 as SUCCEEDED', () => {
      expect(resolveDocumentStatusLabel(1)).toBe('SUCCEEDED')
    })

    it('resolves 2 as BATAL', () => {
      expect(resolveDocumentStatusLabel(2)).toBe('BATAL')
    })
  })

  describe('calculateDeliveryTotals', () => {
    it('calculates sum of ordered and shipped quantities correctly', () => {
      const items = [
        { qty: 10, qty_kirim: 6 },
        { qty: 5, qty_kirim: 5 },
        { qty: 2, qty_kirim: 0 }
      ]
      const totals = calculateDeliveryTotals(items)
      expect(totals.totalOrdered).toBe(17)
      expect(totals.totalDelivered).toBe(11)
    })
  })

  describe('calculateRemainingDeliveryQty', () => {
    it('returns positive remaining quantity or 0 if completely shipped', () => {
      expect(calculateRemainingDeliveryQty(10, 4)).toBe(6)
      expect(calculateRemainingDeliveryQty(10, 10)).toBe(0)
      expect(calculateRemainingDeliveryQty(5, 7)).toBe(0) // Safe non-negative clamp
    })
  })

  describe('validateDeliveryQuantities', () => {
    it('fails when items list is empty', () => {
      const res = validateDeliveryQuantities([])
      expect(res.isValid).toBe(false)
      expect(res.errors[0]).toContain('Minimal harus ada 1 produk')
    })

    it('fails when total qty shipped is 0', () => {
      const res = validateDeliveryQuantities([{ produk_id: 1, qty: 5, qty_kirim: 0, sisa_qty: 5 }])
      expect(res.isValid).toBe(false)
      expect(res.errors).toContain('Total QTY pengiriman harus lebih dari 0.')
    })

    it('fails when qty shipped exceeds remaining quantity', () => {
      const res = validateDeliveryQuantities([
        { produk_id: 1, nama_produk: 'Kursi', qty: 10, qty_kirim: 12, sisa_qty: 10 }
      ])
      expect(res.isValid).toBe(false)
      expect(res.errors[0]).toContain('melebihi sisa pesanan')
    })

    it('passes when valid quantities are provided within limits', () => {
      const res = validateDeliveryQuantities([
        { produk_id: 1, qty: 10, qty_kirim: 5, sisa_qty: 10 },
        { produk_id: 2, qty: 8, qty_kirim: 8, sisa_qty: 8 }
      ])
      expect(res.isValid).toBe(true)
      expect(res.errors.length).toBe(0)
    })
  })
})
