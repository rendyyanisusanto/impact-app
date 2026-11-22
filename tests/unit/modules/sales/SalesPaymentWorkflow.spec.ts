import { describe, it, expect, beforeEach } from 'vitest'
import { salesPaymentService } from '@/modules/sales/services/sales-payment.service'
import { salesInvoiceService } from '@/modules/sales/services/sales-invoice.service'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'

describe('Sales Payment Workflow & Integration Service', () => {
  beforeEach(() => {
    salesPaymentService.reset()
    salesInvoiceService.reset()
    salesOrderTransactionService.reset()
  })

  it('rejects creating payment without valid invoice_id', async () => {
    await expect(
      salesPaymentService.createPayment({
        invoice_id: 0,
        tanggal: '2026-11-01',
        metode_pembayaran: 'TUNAI',
        jumlah: 1000000
      })
    ).rejects.toThrow('ID invoice tidak valid')
  })

  it('rejects creating payment for a non-existent invoice', async () => {
    await expect(
      salesPaymentService.createPayment({
        invoice_id: 999999,
        tanggal: '2026-11-01',
        metode_pembayaran: 'TUNAI',
        jumlah: 1000000
      })
    ).rejects.toThrow('tidak ditemukan')
  })

  it('creates a partial payment and updates invoice status to SEBAGIAN', async () => {
    // SO 2 has no invoices yet, let's create an invoice for SO 2
    const invoice = await salesInvoiceService.createInvoice({
      so_id: 2,
      kode: 'INV/26/XI/0345-1',
      jenis: 'DP',
      tanggal: '2026-11-01',
      total: 5000000,
      subtotal: 4504505,
      total_ppn: 495495,
      variant: 'impact'
    })

    // Pay partial 2,000,000
    const payment = await salesPaymentService.createPayment({
      invoice_id: invoice.id,
      tanggal: '2026-11-01',
      metode_pembayaran: 'TUNAI',
      jumlah: 2000000,
      keterangan: 'Pembayaran DP tahap 1'
    })

    expect(payment.kode).toBe('PAY/26/XI/0345-1/01')
    expect(payment.jumlah).toBe(2000000)

    const updatedSummary = await salesPaymentService.getInvoicePaymentSummary(invoice.id)
    expect(updatedSummary.sudah_dibayar).toBe(2000000)
    expect(updatedSummary.sisa_pembayaran).toBe(3000000)
    expect(updatedSummary.status_pembayaran).toBe('SEBAGIAN')

    // Invoice itself should be updated
    const updatedInvoice = await salesInvoiceService.getInvoiceById(invoice.id)
    expect(updatedInvoice?.terbayar).toBe(2000000)
    expect(updatedInvoice?.status_pembayaran).toBe('SEBAGIAN')
  })

  it('supports two payments for one invoice to reach full settlement (LUNAS)', async () => {
    const invoice = await salesInvoiceService.createInvoice({
      so_id: 2,
      kode: 'INV/26/XI/0345-1',
      jenis: 'DP',
      tanggal: '2026-11-01',
      total: 3000000,
      subtotal: 2702703,
      total_ppn: 297297,
      variant: 'impact'
    })

    // First payment: 1,000,000
    await salesPaymentService.createPayment({
      invoice_id: invoice.id,
      tanggal: '2026-11-01',
      metode_pembayaran: 'TUNAI',
      jumlah: 1000000
    })

    // Second payment: 2,000,000
    const payment2 = await salesPaymentService.createPayment({
      invoice_id: invoice.id,
      tanggal: '2026-11-01',
      metode_pembayaran: 'TRANSFER',
      bank_id: 3,
      jumlah: 2000000
    })

    expect(payment2.kode).toBe('PAY/26/XI/0345-1/02')

    const summary = await salesPaymentService.getInvoicePaymentSummary(invoice.id)
    expect(summary.sudah_dibayar).toBe(3000000)
    expect(summary.sisa_pembayaran).toBe(0)
    expect(summary.status_pembayaran).toBe('LUNAS')
  })

  it('rejects overpayment exceeding remaining invoice balance', async () => {
    const invoice = await salesInvoiceService.createInvoice({
      so_id: 2,
      kode: 'INV/26/XI/0345-1',
      jenis: 'DP',
      tanggal: '2026-11-01',
      total: 2000000,
      subtotal: 1801802,
      total_ppn: 198198,
      variant: 'impact'
    })

    await expect(
      salesPaymentService.createPayment({
        invoice_id: invoice.id,
        tanggal: '2026-11-01',
        metode_pembayaran: 'TUNAI',
        jumlah: 2500000 // Exceeds 2,000,000
      })
    ).rejects.toThrow('melebihi sisa tagihan invoice')
  })

  it('rejects payment on an already fully settled (LUNAS) invoice', async () => {
    // Invoice 1001 is already LUNAS in mock
    await expect(
      salesPaymentService.createPayment({
        invoice_id: 1001,
        tanggal: '2026-11-01',
        metode_pembayaran: 'TUNAI',
        jumlah: 500000
      })
    ).rejects.toThrow('sudah LUNAS')
  })

  it('rejects payment on a cancelled invoice', async () => {
    // Create and cancel invoice
    const invoice = await salesInvoiceService.createInvoice({
      so_id: 2,
      kode: 'INV/26/XI/0345-2',
      jenis: 'Termin',
      tanggal: '2026-11-01',
      total: 1000000,
      subtotal: 900901,
      total_ppn: 99099,
      variant: 'impact'
    })

    await salesInvoiceService.cancelInvoice(invoice.id, 'Test cancel')

    await expect(
      salesPaymentService.createPayment({
        invoice_id: invoice.id,
        tanggal: '2026-11-01',
        metode_pembayaran: 'TUNAI',
        jumlah: 500000
      })
    ).rejects.toThrow('telah dibatalkan')
  })

  it('requires bank_id when payment method is TRANSFER or CEK/GIRO', async () => {
    const invoice = await salesInvoiceService.createInvoice({
      so_id: 2,
      kode: 'INV/26/XI/0345-3',
      jenis: 'DP',
      tanggal: '2026-11-01',
      total: 1000000,
      subtotal: 900901,
      total_ppn: 99099,
      variant: 'impact'
    })

    await expect(
      salesPaymentService.createPayment({
        invoice_id: invoice.id,
        tanggal: '2026-11-01',
        metode_pembayaran: 'TRANSFER',
        jumlah: 500000
        // bank_id omitted
      })
    ).rejects.toThrow('Bank wajib dipilih')
  })

  it('cancels/reverses a payment and restores remaining balance', async () => {
    const invoice = await salesInvoiceService.createInvoice({
      so_id: 2,
      kode: 'INV/26/XI/0345-4',
      jenis: 'DP',
      tanggal: '2026-11-01',
      total: 2000000,
      subtotal: 1801802,
      total_ppn: 198198,
      variant: 'impact'
    })

    const payment = await salesPaymentService.createPayment({
      invoice_id: invoice.id,
      tanggal: '2026-11-01',
      metode_pembayaran: 'TUNAI',
      jumlah: 2000000
    })

    let summary = await salesPaymentService.getInvoicePaymentSummary(invoice.id)
    expect(summary.status_pembayaran).toBe('LUNAS')
    expect(summary.sisa_pembayaran).toBe(0)

    // Reverse payment
    const cancelRes = await salesPaymentService.cancelPayment(payment.id, 'Reversal test')
    expect(cancelRes).toBe(true)

    // Sisa balance restored
    summary = await salesPaymentService.getInvoicePaymentSummary(invoice.id)
    expect(summary.status_pembayaran).toBe('BELUM_BAYAR')
    expect(summary.sisa_pembayaran).toBe(2000000)
  })

  it('supports Non-PPN variants (SO Pola and SO KS)', async () => {
    // SO 4 is Pola with total 2,400,000
    const invoicePola = await salesInvoiceService.createInvoice({
      so_id: 4,
      kode: 'INV/26/PL/03/0094-1',
      jenis: 'DP',
      tanggal: '2026-11-01',
      total: 2000000,
      subtotal: 2000000,
      total_ppn: 0,
      variant: 'pola'
    })

    const paymentPola = await salesPaymentService.createPayment({
      invoice_id: invoicePola.id,
      tanggal: '2026-11-01',
      metode_pembayaran: 'TUNAI',
      jumlah: 2000000
    })

    expect(paymentPola.variant).toBe('pola')
    expect(paymentPola.jumlah).toBe(2000000)

    const summary = await salesPaymentService.getInvoicePaymentSummary(invoicePola.id)
    expect(summary.status_pembayaran).toBe('LUNAS')
    expect(summary.total_ppn).toBe(0)
  })

  it('records audit log into histori_table upon payment and payment cancellation', async () => {
    const invoice = await salesInvoiceService.createInvoice({
      so_id: 2,
      kode: 'INV/26/XI/0345-5',
      jenis: 'DP',
      tanggal: '2026-11-01',
      total: 1000000,
      subtotal: 900901,
      total_ppn: 99099,
      variant: 'impact'
    })

    const payment = await salesPaymentService.createPayment({
      invoice_id: invoice.id,
      tanggal: '2026-11-01',
      metode_pembayaran: 'TUNAI',
      jumlah: 500000
    })

    let history = await salesOrderTransactionService.getHistory(2)
    const paymentLog = history.find(h => h.metode === 'PAYMENT')
    expect(paymentLog).toBeDefined()
    expect(paymentLog?.keterangan).toContain(payment.kode)

    await salesPaymentService.cancelPayment(payment.id, 'Audit log test')
    history = await salesOrderTransactionService.getHistory(2)
    const cancelLog = history.find(h => h.metode === 'PAYMENT_CANCEL')
    expect(cancelLog).toBeDefined()
  })
})
