import { describe, it, expect, beforeEach } from 'vitest'
import { salesInvoiceService } from '@/modules/sales/services/sales-invoice.service'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'

describe('Sales Invoice & Order Enhancement Workflow (Sprint 7)', () => {
  beforeEach(() => {
    salesOrderTransactionService.reset()
    salesInvoiceService.reset()
  })

  describe('Scenario A: SO Impact Multiple Invoices & PPN Integration', () => {
    it('creates partial DP invoice for SO Impact with correct DPP & PPN and updates summary', async () => {
      // SO 2 (SO/26/XI/0345) has Total: 12.654.000, 0 invoices initially
      const summaryInitial = await salesInvoiceService.getInvoiceSummary(2, 'impact')
      expect(summaryInitial.sudah_invoice).toBe(0)
      expect(summaryInitial.sisa_invoice).toBe(12654000)
      expect(summaryInitial.invoice_status).toBe('Belum Invoice')

      // 1. Create DP Invoice of Rp 5.000.000
      const inv1 = await salesInvoiceService.createInvoice({
        so_id: 2,
        kode: 'INV/26/XI/0345-1',
        jenis: 'DP',
        tanggal: '2026-11-01',
        total: 5000000,
        subtotal: 4504505,
        total_ppn: 495495,
        no_faktur_pajak: '010.002-26.11111111',
        variant: 'impact',
        keterangan: 'DP 40%'
      })

      expect(inv1.id).toBeGreaterThan(0)
      expect(inv1.status).toBe(1)
      expect(inv1.total).toBe(5000000)
      expect(inv1.subtotal + inv1.total_ppn).toBe(5000000)

      // Verify summary updated
      const summaryAfter1 = await salesInvoiceService.getInvoiceSummary(2, 'impact')
      expect(summaryAfter1.sudah_invoice).toBe(5000000)
      expect(summaryAfter1.sisa_invoice).toBe(7654000)
      expect(summaryAfter1.invoice_status).toBe('Sebagian Invoice')

      // 2. Create Pelunasan Invoice for remaining Rp 7.654.000
      const nextCode = await salesInvoiceService.generateNextInvoiceCode(2)
      expect(nextCode).toBe('INV/26/XI/0345-2')

      const inv2 = await salesInvoiceService.createInvoice({
        so_id: 2,
        kode: nextCode,
        jenis: 'Pelunasan',
        tanggal: '2026-11-01',
        total: 7654000,
        subtotal: 6895495,
        total_ppn: 758505,
        variant: 'impact'
      })

      expect(inv2.total).toBe(7654000)

      // Verify summary is now fully invoiced
      const summaryAfter2 = await salesInvoiceService.getInvoiceSummary(2, 'impact')
      expect(summaryAfter2.sudah_invoice).toBe(12654000)
      expect(summaryAfter2.sisa_invoice).toBe(0)
      expect(summaryAfter2.invoice_status).toBe('Sudah Invoice')
    })

    it('rejects over-invoicing beyond remaining un-invoiced amount', async () => {
      // SO 2 has Sisa: 12.654.000
      await expect(
        salesInvoiceService.createInvoice({
          so_id: 2,
          kode: 'INV/26/XI/0345-9',
          jenis: 'Pelunasan',
          tanggal: '2026-11-01',
          total: 15000000, // Exceeds 12.654.000
          subtotal: 13513514,
          total_ppn: 1486486,
          variant: 'impact'
        })
      ).rejects.toThrow(/melebihi sisa yang belum di-invoice/)
    })
  })

  describe('Scenario B & C: Non-PPN Variants (SO Pola & SO KS)', () => {
    it('creates Non-PPN invoice for SO Pola with PPN = 0 and DPP = Total', async () => {
      // SO 4 (SO/26/PL/03/0094) Total: 2.400.000
      const inv = await salesInvoiceService.createInvoice({
        so_id: 4,
        kode: 'INV/26/PL/03/0094-1',
        jenis: 'Pelunasan',
        tanggal: '2026-11-01',
        total: 2400000,
        subtotal: 2400000,
        total_ppn: 0,
        variant: 'pola'
      })

      expect(inv.total_ppn).toBe(0)
      expect(inv.subtotal).toBe(2400000)
      expect(inv.no_faktur_pajak).toBeNull()
    })

    it('creates Non-PPN invoice for SO KS with PPN = 0', async () => {
      // SO 5 (SO/26/01/0065) Total: 6.500.000
      const inv = await salesInvoiceService.createInvoice({
        so_id: 5,
        kode: 'INV/26/01/0065-1',
        jenis: 'DP',
        tanggal: '2026-11-01',
        total: 3000000,
        subtotal: 3000000,
        total_ppn: 0,
        variant: 'ks'
      })

      expect(inv.total_ppn).toBe(0)
      expect(inv.total).toBe(3000000)
    })
  })

  describe('Scenario D: Invoice Cancellation Safety', () => {
    it('cancels an unpaid active invoice and restores sisaInvoice', async () => {
      // Create invoice for SO 2
      const inv = await salesInvoiceService.createInvoice({
        so_id: 2,
        kode: 'INV/26/XI/0345-1',
        jenis: 'DP',
        tanggal: '2026-11-01',
        total: 2000000,
        subtotal: 1801802,
        total_ppn: 198198,
        variant: 'impact'
      })

      let summary = await salesInvoiceService.getInvoiceSummary(2, 'impact')
      expect(summary.sudah_invoice).toBe(2000000)
      expect(summary.sisa_invoice).toBe(10654000)

      // Cancel invoice
      const cancelled = await salesInvoiceService.cancelInvoice(inv.id, 'Salah nominal tagihan')
      expect(cancelled).toBe(true)

      // Sisa invoice must be restored back to full 12.654.000
      summary = await salesInvoiceService.getInvoiceSummary(2, 'impact')
      expect(summary.sudah_invoice).toBe(0)
      expect(summary.sisa_invoice).toBe(12654000)
      expect(summary.invoice_status).toBe('Belum Invoice')
    })

    it('rejects cancelling an invoice that already has payment recorded (terbayar > 0)', async () => {
      // Invoice 1001 on SO 1 has terbayar: 4.162.500
      await expect(salesInvoiceService.cancelInvoice(1001)).rejects.toThrow(
        /sudah memiliki pembayaran/
      )
    })
  })

  describe('Scenario E: Edit Tanggal & Histori Tracking', () => {
    it('updates order date and appends audit record to histori_table', async () => {
      const orderId = 2
      const historyBefore = await salesOrderTransactionService.getHistory(orderId)
      const countBefore = historyBefore.length

      const success = await salesOrderTransactionService.updateOrderDate(
        orderId,
        '2026-11-15',
        'Penundaan jadwal kirim customer'
      )
      expect(success).toBe(true)

      const order = await salesOrderTransactionService.getOrderById(orderId)
      expect(order.tanggal).toBe('2026-11-15')

      const historyAfter = await salesOrderTransactionService.getHistory(orderId)
      expect(historyAfter.length).toBe(countBefore + 1)
      expect(historyAfter[0].metode).toBe('EDIT_DATE')
      expect(historyAfter[0].keterangan).toContain('Penundaan jadwal kirim customer')
    })

    it('rejects editing date on a cancelled SO', async () => {
      await salesOrderTransactionService.cancelOrder(4, 'pola')

      await expect(salesOrderTransactionService.updateOrderDate(4, '2026-11-20')).rejects.toThrow(
        /telah dibatalkan/
      )
    })
  })

  describe('Scenario F: Batalkan Transaksi Sales Order', () => {
    it('cancels an unpaid SO and logs CANCEL action into histori_table', async () => {
      // SO 2 is unpaid
      const success = await salesOrderTransactionService.cancelOrder(
        2,
        'impact',
        'Customer membatalkan proyek'
      )
      expect(success).toBe(true)

      const order = await salesOrderTransactionService.getOrderById(2)
      expect(order.status_aktif).toBe(0)

      const history = await salesOrderTransactionService.getHistory(2)
      const cancelEntry = history.find(h => h.metode === 'CANCEL')
      expect(cancelEntry).toBeDefined()
      expect(cancelEntry?.keterangan).toContain('Customer membatalkan proyek')
    })

    it('rejects cancelling an SO that already has paid amounts', async () => {
      // SO 1 has terbayar: 8.325.000
      await expect(salesOrderTransactionService.cancelOrder(1, 'impact')).rejects.toThrow(
        /sudah memiliki pembayaran/
      )
    })
  })
})
