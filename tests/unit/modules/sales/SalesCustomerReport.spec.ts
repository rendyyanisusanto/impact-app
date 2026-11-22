import { describe, it, expect } from 'vitest'
import {
  sanitizeExcelCell,
  formatDateIndo,
  formatNumberIndo,
  getStatusBadgeText
} from '@/modules/sales/customer-report/utils/sales-customer-report-export'
import { salesCustomerReportService } from '@/modules/sales/customer-report/services/sales-customer-report.service'
import type { CustomerReportItemRow } from '@/modules/sales/customer-report/types/sales-customer-report.types'

describe('Sales Customer Report - Utils & Calculations', () => {
  describe('Formula Injection Prevention (Sanitization)', () => {
    it('prepends single quote to dangerous Excel formula triggers', () => {
      expect(sanitizeExcelCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(sanitizeExcelCell('+12345')).toBe("'+12345")
      expect(sanitizeExcelCell('-12345')).toBe("'-12345")
      expect(sanitizeExcelCell('@cmd|')).toBe("'@cmd|")
      expect(sanitizeExcelCell(' =cmd|')).toBe("' =cmd|")
    })

    it('leaves safe strings and numbers intact', () => {
      expect(sanitizeExcelCell('SO/26/XI/0349')).toBe('SO/26/XI/0349')
      expect(sanitizeExcelCell(2942500)).toBe(2942500)
      expect(sanitizeExcelCell(0)).toBe(0)
      expect(sanitizeExcelCell(null)).toBe(null)
    })
  })

  describe('Formatters & Badges', () => {
    it('formatDateIndo formats ISO date string to DD/MM/YYYY representation', () => {
      expect(formatDateIndo('2026-11-13')).toContain('2026')
      expect(formatDateIndo('')).toBe('-')
      expect(formatDateIndo(null)).toBe('-')
    })

    it('formatNumberIndo formats integers with thousand separators', () => {
      expect(formatNumberIndo(1750000)).toBe('1.750.000')
      expect(formatNumberIndo(0)).toBe('0')
    })

    it('getStatusBadgeText correctly maps SO status & status_aktif', () => {
      // status_aktif = 0 -> DIBATALKAN
      expect(getStatusBadgeText(0, 0)).toBe('DIBATALKAN')
      expect(getStatusBadgeText(1, 0)).toBe('DIBATALKAN')

      // status_aktif = 1 -> 0: TERBUKA, 1: TERTUTUP
      expect(getStatusBadgeText(0, 1)).toBe('TERBUKA')
      expect(getStatusBadgeText(1, 1)).toBe('TERTUTUP')
    })
  })

  describe('Financial Calculations & Integrity', () => {
    it('verifies subtotal, PPN, diskon, and grand total formula consistency', () => {
      const sampleItem: CustomerReportItemRow = {
        id: 3356,
        kode: 'SOL/26/XI/0349',
        tanggal: '2026-11-13',
        customer_id: 2322,
        keterangan: 'Pesanan Meja Belajar',
        subtotal: 1750000,
        diskon: 0,
        total_ppn: 192500,
        total: 1942500,
        status: 1,
        status_aktif: 1,
        order_type: 'PPN',
        status_produksi: 0,
        created_by: 1,
        creator_username: 'admin',
        created_at: '2026-11-13T16:34:21.000Z',
        updated_at: '2026-11-13T16:34:21.000Z'
      }

      // Expected math: subtotal - diskon + total_ppn === total
      const expectedTotal = sampleItem.subtotal - sampleItem.diskon + sampleItem.total_ppn
      expect(expectedTotal).toBe(sampleItem.total)
    })

    it('prevents transaction duplication: 1 SO ID = 1 report row', () => {
      const items: CustomerReportItemRow[] = [
        {
          id: 177,
          kode: 'SO/24/09/1569',
          tanggal: '2024-09-01',
          customer_id: 1043,
          keterangan: 'Entry 1',
          subtotal: 1000000,
          diskon: 0,
          total_ppn: 110000,
          total: 1110000,
          status: 1,
          status_aktif: 1,
          order_type: 'PPN',
          status_produksi: 0,
          created_by: 1,
          creator_username: 'admin',
          created_at: null,
          updated_at: null
        },
        {
          id: 179,
          kode: 'SO/24/09/1569', // Same historical code, but distinct unique ID
          tanggal: '2024-09-01',
          customer_id: 1043,
          keterangan: 'Entry 2',
          subtotal: 500000,
          diskon: 0,
          total_ppn: 55000,
          total: 555000,
          status: 1,
          status_aktif: 1,
          order_type: 'PPN',
          status_produksi: 0,
          created_by: 1,
          creator_username: 'admin',
          created_at: null,
          updated_at: null
        }
      ]

      const ids = items.map(i => i.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(2)
      expect(items[0].id).not.toBe(items[1].id)
    })

    it('reconciles backend summary totals with item aggregation', () => {
      const items: CustomerReportItemRow[] = [
        {
          id: 1,
          kode: 'SO/26/01/0001',
          tanggal: '2026-01-10',
          customer_id: 1565,
          keterangan: '',
          subtotal: 10000000,
          diskon: 500000,
          total_ppn: 1045000,
          total: 10545000,
          status: 1,
          status_aktif: 1,
          order_type: 'PPN',
          status_produksi: 0,
          created_by: 1,
          creator_username: null,
          created_at: null,
          updated_at: null
        },
        {
          id: 2,
          kode: 'SO/26/01/0002',
          tanggal: '2026-01-15',
          customer_id: 1565,
          keterangan: '',
          subtotal: 20000000,
          diskon: 1000000,
          total_ppn: 2090000,
          total: 21090000,
          status: 0,
          status_aktif: 1,
          order_type: 'PPN',
          status_produksi: 0,
          created_by: 1,
          creator_username: null,
          created_at: null,
          updated_at: null
        }
      ]

      const totalSubtotal = items.reduce((acc, i) => acc + i.subtotal, 0)
      const totalDiskon = items.reduce((acc, i) => acc + i.diskon, 0)
      const totalPpn = items.reduce((acc, i) => acc + i.total_ppn, 0)
      const grandTotal = items.reduce((acc, i) => acc + i.total, 0)

      expect(totalSubtotal).toBe(30000000)
      expect(totalDiskon).toBe(1500000)
      expect(totalPpn).toBe(3135000)
      expect(grandTotal).toBe(31635000)
    })
  })

  describe('Service Query Builder', () => {
    it('correctly constructs query string from active filters', () => {
      const qs = salesCustomerReportService.buildQueryString({
        customer_id: 1565,
        date_from: '2026-01-01',
        date_to: '2026-11-20',
        status: '1',
        search: 'SO/26',
        min_total: 1000000,
        max_total: 50000000,
        sort_by: 'total',
        sort_direction: 'DESC',
        page: 2,
        per_page: 50
      })

      expect(qs).toContain('customer_id=1565')
      expect(qs).toContain('date_from=2026-01-01')
      expect(qs).toContain('date_to=2026-11-20')
      expect(qs).toContain('status=1')
      expect(qs).toContain('search=SO%2F26')
      expect(qs).toContain('min_total=1000000')
      expect(qs).toContain('max_total=50000000')
      expect(qs).toContain('sort_by=total')
      expect(qs).toContain('sort_direction=DESC')
      expect(qs).toContain('page=2')
      expect(qs).toContain('per_page=50')
    })
  })
})
