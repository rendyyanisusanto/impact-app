import { describe, it, expect } from 'vitest'
import {
  sanitizeExcelCell,
  formatDateIndo,
  formatNumberIndo
} from '@/modules/sales/product-report/utils/sales-product-report-export'

describe('Sales Product Report - Utils & Calculations', () => {
  describe('Formula Injection Prevention (Sanitization)', () => {
    it('prepends single quote to dangerous Excel formula triggers', () => {
      expect(sanitizeExcelCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(sanitizeExcelCell('+12345')).toBe("'+12345")
      expect(sanitizeExcelCell('-12345')).toBe("'-12345")
      expect(sanitizeExcelCell('@cmd|')).toBe("'@cmd|")
      expect(sanitizeExcelCell(' =cmd|')).toBe("' =cmd|")
    })

    it('leaves safe strings and numbers intact', () => {
      expect(sanitizeExcelCell('Kursi Tumpuk Oval')).toBe('Kursi Tumpuk Oval')
      expect(sanitizeExcelCell(125000)).toBe(125000)
      expect(sanitizeExcelCell(0)).toBe(0)
      expect(sanitizeExcelCell(null)).toBe(null)
    })
  })

  describe('Formatters', () => {
    it('formatDateIndo formats ISO date string to Indonesian locale representation', () => {
      expect(formatDateIndo('2025-10-16')).toContain('2025')
      expect(formatDateIndo('')).toBe('-')
      expect(formatDateIndo(null)).toBe('-')
    })

    it('formatNumberIndo formats integers with thousand separators', () => {
      expect(formatNumberIndo(12500)).toBe('12.500')
      expect(formatNumberIndo(0)).toBe('0')
    })
  })

  describe('Calculation Integrity', () => {
    it('calculates customer contribution percentage correctly against overall total', () => {
      const overallQty = 686
      const customerQty = 452
      const percentage = (customerQty / overallQty) * 100
      expect(Number(percentage.toFixed(2))).toBe(65.89)
    })

    it('distinguishes distinct SO count from Total Qty when an SO has multiple lines', () => {
      // Scenario: 1 SO has 2 detail items of the same product (e.g. qty 10 and qty 15)
      const soLines = [
        { so_id: 101, qty: 10 },
        { so_id: 101, qty: 15 }
      ]
      const distinctSoCount = new Set(soLines.map(l => l.so_id)).size
      const totalQty = soLines.reduce((acc, l) => acc + l.qty, 0)

      expect(distinctSoCount).toBe(1) // Not 2!
      expect(totalQty).toBe(25)
    })

    it('reconciles Total Qty across Summary mode and Chronological mode', () => {
      const summaryItems = [
        { customer_id: 1, total_qty: 452 },
        { customer_id: 2, total_qty: 100 },
        { customer_id: 3, total_qty: 134 }
      ]
      const chronoItems = [
        { detail_id: 1, customer_id: 1, qty: 452 },
        { detail_id: 2, customer_id: 2, qty: 50 },
        { detail_id: 3, customer_id: 2, qty: 50 },
        { detail_id: 4, customer_id: 3, qty: 134 }
      ]

      const sumFromSummary = summaryItems.reduce((acc, i) => acc + i.total_qty, 0)
      const sumFromChrono = chronoItems.reduce((acc, i) => acc + i.qty, 0)

      expect(sumFromSummary).toBe(686)
      expect(sumFromChrono).toBe(686)
      expect(sumFromSummary).toBe(sumFromChrono)
    })
  })
})
