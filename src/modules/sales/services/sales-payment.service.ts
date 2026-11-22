/**
 * Sales Payment Transaction Service
 * Manages invoice-based payments, partial payments, settlements, and audit tracking.
 * STRICT ERP RULE: Every payment references `invoice_id` (not directly `sales_order_id`).
 */

import type {
  SalesPayment,
  CreatePaymentPayload,
  UpdatePaymentPayload,
  SalesInvoicePaymentSummary,
  PaymentCalculationResult
} from '../types/sales-payment.types'
import type { SalesInvoiceListItem } from '../types/sales-invoice.types'
import type { SalesOrderVariantKey } from '../config/sales-order-variants'
import {
  calculatePaymentSummary,
  generatePaymentCode,
  validatePaymentAmount
} from '../utils/sales-payment-calculations'
import { INITIAL_MOCK_SALES_PAYMENTS } from '../mocks/sales-payments-data.mock'
import { salesInvoiceService } from './sales-invoice.service'
import { salesOrderTransactionService } from './sales-order-transaction.service'
import { bankService } from '@/modules/settings/banks/services/bank.service'
import { apiClient } from '@/shared/services/api-client'

export class SalesPaymentService {
  private payments: SalesPayment[] = []

  constructor() {
    this.reset()
  }

  public reset(): void {
    this.payments = JSON.parse(JSON.stringify(INITIAL_MOCK_SALES_PAYMENTS))
  }

  /**
   * Retrieves all payment transactions across all invoices and sales orders.
   */
  public async getAllPayments(params?: {
    search?: string
    status?: number
    metode?: string
    bank_id?: number
    variant?: SalesOrderVariantKey | 'ALL'
    dateFrom?: string
    dateTo?: string
  }): Promise<SalesPayment[]> {
    let result = [...this.payments]

    if (params) {
      if (params.search) {
        const q = params.search.toLowerCase().trim()
        result = result.filter(
          p =>
            p.kode.toLowerCase().includes(q) ||
            p.invoice_kode.toLowerCase().includes(q) ||
            p.so_kode.toLowerCase().includes(q) ||
            p.customer_nama.toLowerCase().includes(q) ||
            (p.keterangan && p.keterangan.toLowerCase().includes(q)) ||
            (p.bukti_bayar && p.bukti_bayar.toLowerCase().includes(q))
        )
      }

      if (params.status !== undefined && params.status !== -1) {
        result = result.filter(p => p.status === Number(params.status))
      }

      if (params.metode && params.metode !== 'ALL') {
        result = result.filter(p => p.metode_pembayaran === params.metode)
      }

      if (params.bank_id && params.bank_id !== -1) {
        result = result.filter(p => p.bank_id === Number(params.bank_id))
      }

      if (params.variant && params.variant !== 'ALL') {
        result = result.filter(p => p.variant === params.variant)
      }

      if (params.dateFrom) {
        result = result.filter(p => p.tanggal >= params.dateFrom!)
      }

      if (params.dateTo) {
        result = result.filter(p => p.tanggal <= params.dateTo!)
      }
    }

    return result.sort((a, b) => b.id - a.id)
  }

  /**
   * Retrieves all invoices enriched with SO, customer, balance, and payment counts for Mode A list.
   */
  public async getAllInvoicesForListing(params?: {
    search?: string
    variant?: string
    statusPembayaran?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<SalesInvoiceListItem[]> {
    const rawInvoices = await salesInvoiceService.getAllInvoicesWithSummary()
    const activePayments = this.payments.filter(p => p.status === 1)

    const paymentCountMap = new Map<number, number>()
    activePayments.forEach(p => {
      paymentCountMap.set(p.invoice_id, (paymentCountMap.get(p.invoice_id) || 0) + 1)
    })

    let result = rawInvoices.map(inv => ({
      ...inv,
      payment_count: paymentCountMap.get(inv.id) || 0
    }))

    if (params) {
      if (params.search) {
        const q = params.search.toLowerCase().trim()
        result = result.filter(
          i =>
            i.kode.toLowerCase().includes(q) ||
            i.so_kode.toLowerCase().includes(q) ||
            i.customer_nama.toLowerCase().includes(q) ||
            (i.keterangan && i.keterangan.toLowerCase().includes(q))
        )
      }

      if (params.variant && params.variant !== 'ALL') {
        result = result.filter(i => i.so_variant === params.variant)
      }

      if (params.statusPembayaran && params.statusPembayaran !== 'ALL') {
        result = result.filter(i => i.status_pembayaran === params.statusPembayaran)
      }

      if (params.dateFrom) {
        result = result.filter(i => i.tanggal >= params.dateFrom!)
      }

      if (params.dateTo) {
        result = result.filter(i => i.tanggal <= params.dateTo!)
      }
    }

    return result
  }

  /**
   * Retrieves all payments recorded for a specific Sales Invoice.
   */
  public async getPaymentsByInvoiceId(invoiceId: number): Promise<SalesPayment[]> {
    try {
      const res = await apiClient<any[]>(`/sales-invoices/${invoiceId}/payments`)
      if (res && res.data && Array.isArray(res.data)) {
        return res.data.map(p => ({
          id: p.id,
          kode: p.kode,
          invoice_id: p.invoice_id,
          invoice_kode: p.invoice_kode,
          so_id: p.so_id || 0,
          so_kode: p.so_kode || '-',
          variant: p.variant || 'impact',
          customer_id: p.customer_id,
          customer_nama: p.customer_nama || '-',
          tanggal: p.tanggal,
          metode_pembayaran: p.metode_pembayaran,
          bank_id: p.bank_id,
          bank_nama: p.bank_nama,
          bank_rekening: p.bank_rekening,
          jumlah: Number(p.jumlah) || 0,
          keterangan: p.keterangan || null,
          bukti_bayar: p.bukti_bayar || null,
          status: p.status,
          alasan_batal: p.alasan_batal || null,
          created_at: p.created_at,
          created_by: p.created_by || 1,
          created_by_nama: p.created_by_nama || 'User',
          is_posted_to_finance: false,
          uuid: p.uuid
        }))
      }
    } catch {
      // fallback to in-memory
    }

    return this.payments.filter(p => p.invoice_id === Number(invoiceId)).sort((a, b) => b.id - a.id)
  }

  /**
   * Retrieves a single payment record by its ID.
   */
  public async getPaymentById(paymentId: number): Promise<SalesPayment | null> {
    try {
      const res = await apiClient<any>(`/sales-payments/${paymentId}`)
      if (res && res.data) {
        const p = res.data
        return {
          id: p.id,
          kode: p.kode,
          invoice_id: p.details?.[0]?.sales_invoice_id || 0,
          invoice_kode: p.details?.[0]?.invoice_kode || '-',
          so_id: 0,
          so_kode: '-',
          variant: 'impact',
          customer_id: p.customer_id,
          customer_nama: p.customer_nama || '-',
          tanggal: p.tanggal,
          metode_pembayaran: p.details?.[0]?.metode_pembayaran || 'TRANSFER',
          bank_id: p.details?.[0]?.bank_id || null,
          bank_nama: p.details?.[0]?.bank_nama || null,
          bank_rekening: p.details?.[0]?.bank_rekening || null,
          jumlah: Number(p.total) || 0,
          keterangan: p.details?.[0]?.keterangan || p.keterangan || null,
          bukti_bayar: p.details?.[0]?.bukti_bayar || null,
          status: p.status === 'POSTED' ? 1 : 0,
          alasan_batal: null,
          invoice_count: p.details?.length || 1,
          invoices_summary: (p.details || []).map((d: any) => d.invoice_kode).filter(Boolean).join(', '),
          details: (p.details || []).map((d: any) => ({
            id: d.id,
            sales_invoice_id: d.sales_invoice_id,
            invoice_kode: d.invoice_kode,
            so_id: d.so_id,
            so_kode: d.so_kode,
            total_invoice: d.total_invoice || 0,
            jumlah: Number(d.jumlah) || 0,
            metode_pembayaran: d.metode_pembayaran,
            bank_id: d.bank_id,
            bank_nama: d.bank_nama,
            bank_rekening: d.bank_rekening,
            bukti_bayar: d.bukti_bayar,
            keterangan: d.keterangan
          })),
          created_at: p.created_at,
          created_by: p.created_by || 1,
          created_by_nama: p.created_by_nama || 'User',
          is_posted_to_finance: false,
          uuid: p.uuid
        }
      }
    } catch {
      // fallback
    }

    const payment = this.payments.find(p => p.id === Number(paymentId))
    return payment ? { ...payment } : null
  }

  /**
   * Generates the next sequential multi-payment code.
   * Format: PAY/{YY}/{MM}/{seq4}
   */
  public async generateMultiPaymentCode(customerId?: number | null): Promise<string> {
    try {
      const q = customerId ? `?customerId=${customerId}` : ''
      const res = await apiClient<{ kode: string }>(`/sales-payments/generate-code${q}`)
      if (res?.data?.kode) {
        return res.data.kode
      }
    } catch {
      // fallback
    }

    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const count = this.payments.length + 1
    return `PAY/${yy}/${mm}/${String(count).padStart(4, '0')}`
  }

  /**
   * Retrieves eligible invoices with remaining balance for a customer.
   */
  public async getEligibleInvoicesForPayment(customerId?: number | null, search?: string): Promise<SalesInvoiceListItem[]> {
    try {
      const queryParams = new URLSearchParams()
      if (customerId) queryParams.set('customerId', String(customerId))
      if (search) queryParams.set('search', search)
      queryParams.set('limit', '100')

      const res = await apiClient<any[]>(`/sales-payments/eligible-invoices?${queryParams.toString()}`)
      if (res && res.data && Array.isArray(res.data)) {
        return res.data.map(item => ({
          id: item.invoiceId || item.id,
          so_id: item.salesOrderId || item.sales_order_id,
          so_kode: item.salesOrderCode || item.so_kode,
          so_variant: item.soVariant,
          customer_id: item.customerId || item.customer_id,
          customer_nama: item.customerName || item.customer_nama,
          kode: item.invoiceCode || item.kode,
          tanggal: item.invoiceDate || item.tanggal,
          jenis: item.invoiceType || item.jenis,
          subtotal: item.subtotal || item.total,
          total_ppn: item.total_ppn || 0,
          total: item.invoiceTotal || item.total,
          no_faktur_pajak: item.no_faktur_pajak || null,
          terbayar: item.totalPaid || item.terbayar || 0,
          sisa_pembayaran: item.remainingBalance ?? item.sisa_tagihan ?? 0,
          status_pembayaran: item.paymentStatus || item.status_pembayaran || 'BELUM_BAYAR',
          status: item.status || 1,
          keterangan: item.keterangan || null,
          created_at: item.tanggal,
          created_by: 1,
          created_by_nama: 'System',
          payment_count: 0
        }))
      }
    } catch {
      // fallback
    }

    // Offline / unit test fallback
    const allInvoices = await salesInvoiceService.getAllInvoicesWithSummary()
    let filtered = allInvoices.filter(i => i.status === 1 && i.status_pembayaran !== 'LUNAS' && i.sisa_pembayaran > 0)
    if (customerId) {
      filtered = filtered.filter(i => Number(i.customer_id) === Number(customerId))
    }
    if (search) {
      const q = search.toLowerCase().trim()
      filtered = filtered.filter(i =>
        i.kode.toLowerCase().includes(q) ||
        i.so_kode.toLowerCase().includes(q) ||
        i.customer_nama.toLowerCase().includes(q)
      )
    }
    return filtered
  }

  /**
   * Generates the next unique payment code for an invoice.
   */
  public async generateNextPaymentCode(invoiceId: number): Promise<string> {
    try {
      const res = await apiClient<any>(`/sales-invoices/${invoiceId}/preview-payment-code`)
      if (res?.data?.kode) {
        return res.data.kode
      }
    } catch {
      // fallback
    }

    const invoice = await salesInvoiceService.getInvoiceById(invoiceId)
    if (!invoice) {
      throw new Error(`Invoice dengan ID ${invoiceId} tidak ditemukan.`)
    }
    const existingPayments = await this.getPaymentsByInvoiceId(invoiceId)
    return generatePaymentCode(invoice.kode, existingPayments)
  }

  /**
   * Calculates detailed payment summary for an invoice and its parent Sales Order.
   */
  public async getInvoicePaymentSummary(invoiceId: number): Promise<SalesInvoicePaymentSummary> {
    try {
      const res = await apiClient<any>(`/sales-invoices/${invoiceId}/payment-summary`)
      if (res && res.data) {
        const d = res.data
        return {
          invoice_id: d.invoice_id,
          invoice_kode: d.invoice_kode || d.invoice_code,
          so_id: d.sales_order_id,
          so_kode: d.sales_order_kode,
          variant: d.order_type === 'NON_PPN' ? 'pola' : d.order_type === 'NON_PPN_2' ? 'ks' : 'impact',
          customer_id: d.customer_id || d.customerId,
          customer_nama: d.customer_nama,
          customer_alamat: d.customer_alamat,
          customer_telepon: d.customer_telepon,
          tanggal_invoice: d.invoice_date || d.tanggal,
          jenis_invoice: d.invoice_type || d.jenis,
          total_invoice: d.invoice_total ?? d.total_invoice,
          total_dpp: d.subtotal_dpp,
          total_ppn: d.total_ppn,
          sudah_dibayar: d.total_paid ?? d.terbayar,
          sisa_pembayaran: d.remaining_balance ?? d.sisa_tagihan,
          status_pembayaran: d.payment_status ?? d.status_pembayaran,
          count_payments: d.count_payments || 0,
          total_so: d.total_so || 0,
          total_sudah_invoice_so: 0,
          total_sudah_dibayar_so: 0
        }
      }
    } catch {
      // fallback
    }

    const invoice = await salesInvoiceService.getInvoiceById(invoiceId)
    if (!invoice) {
      throw new Error(`Sales Invoice dengan ID ${invoiceId} tidak ditemukan.`)
    }

    const order = await salesOrderTransactionService.getOrderById(invoice.so_id)
    const invoicePayments = await this.getPaymentsByInvoiceId(invoiceId)
    const calc: PaymentCalculationResult = calculatePaymentSummary(invoice.total, invoicePayments)

    // Calculate overall SO payments context
    const allSoInvoices = await salesInvoiceService.getInvoicesByOrderId(order.id)
    const activeSoInvoiceIds = new Set(allSoInvoices.filter(i => i.status === 1).map(i => i.id))
    const totalSoPaid = this.payments
      .filter(p => p.status === 1 && activeSoInvoiceIds.has(p.invoice_id))
      .reduce((sum, p) => sum + p.jumlah, 0)
    const totalSoInvoiced = allSoInvoices
      .filter(i => i.status === 1)
      .reduce((sum, i) => sum + i.total, 0)

    return {
      invoice_id: invoice.id,
      invoice_kode: invoice.kode,
      so_id: order.id,
      so_kode: order.kode,
      variant: order.variant,
      customer_id: order.customer_id || (invoice as any).customer_id,
      customer_nama: order.customer_nama,
      customer_alamat: order.customer_alamat,
      customer_telepon: order.customer_telepon,
      tanggal_invoice: invoice.tanggal,
      jenis_invoice: invoice.jenis,
      total_invoice: calc.totalInvoice,
      total_dpp: invoice.subtotal,
      total_ppn: invoice.total_ppn,
      sudah_dibayar: calc.sudahDibayar,
      sisa_pembayaran: calc.sisaPembayaran,
      status_pembayaran: calc.statusPembayaran,
      count_payments: invoicePayments.length,
      total_so: order.total,
      total_sudah_invoice_so: totalSoInvoiced,
      total_sudah_dibayar_so: totalSoPaid
    }
  }

  /**
   * Records a new payment against Sales Invoice(s).
   * Supports both single payment and multi-invoice allocations.
   * Atomically updates invoice balance, parent SO balance, and logs audit.
   */
  public async createPayment(payload: CreatePaymentPayload): Promise<SalesPayment> {
    const isMultiAllocation = Boolean(payload.allocations && payload.allocations.length > 0)

    // Lookup bank information if transfer or cek/giro
    let bankNama: string | null = null
    let bankRekening: string | null = null
    if (payload.metode_pembayaran === 'TRANSFER' || payload.metode_pembayaran === 'CEK/GIRO') {
      if (!payload.bank_id) {
        throw new Error('Bank wajib dipilih untuk metode pembayaran Transfer atau Cek/Giro.')
      }
      const banks = await bankService.getAll()
      const selectedBank = banks.data.find(b => b.id === Number(payload.bank_id))
      if (selectedBank) {
        bankNama = selectedBank.bank
        bankRekening = selectedBank.rekening
      }
    }

    if (isMultiAllocation) {
      const allocations = payload.allocations!.map(a => ({
        invoice_id: Number(a.invoice_id),
        amount: Math.round(Number(a.amount) || 0),
        keterangan: a.keterangan || null,
        bukti_bayar: a.bukti_bayar || null
      }))

      if (allocations.length === 0) {
        throw new Error('Minimal satu invoice harus dipilih untuk dialokasikan pembayaran.')
      }

      const totalNominal = allocations.reduce((sum, a) => sum + a.amount, 0)
      if (totalNominal <= 0) {
        throw new Error('Total nominal pembayaran harus lebih besar dari Rp 0.')
      }

      let apiPaymentResult: any = null
      try {
        const res = await apiClient<any>('/sales-payments', {
          method: 'POST',
          body: JSON.stringify({
            customerId: payload.customerId ?? payload.customer_id,
            customer_id: payload.customer_id ?? payload.customerId,
            tanggal: payload.tanggal,
            metode_pembayaran: payload.metode_pembayaran,
            bank_id: payload.bank_id ? Number(payload.bank_id) : null,
            keterangan: payload.keterangan || null,
            bukti_bayar: payload.bukti_bayar || null,
            idempotency_key: payload.idempotency_key || null,
            allocations
          })
        })
        if (res && res.data) {
          apiPaymentResult = res.data
        }
      } catch (apiErr: any) {
        if (
          apiErr?.code !== 'NETWORK_ERROR' &&
          apiErr?.message &&
          !apiErr.message.includes('fetch') &&
          !apiErr.message.includes('terputus')
        ) {
          throw new Error(apiErr.message)
        }
      }

      const paymentCode = apiPaymentResult?.paymentCode || `PAY/MULTI/${Date.now().toString().slice(-4)}`
      const now = new Date()
      const timestampStr = `${payload.tanggal} ${now.toTimeString().split(' ')[0]}`

      const firstInv = await salesInvoiceService.getInvoiceById(allocations[0].invoice_id)
      const order = firstInv ? await salesOrderTransactionService.getOrderById(firstInv.so_id) : null

      const newPayment: SalesPayment = {
        id: apiPaymentResult?.paymentId || (this.payments.length > 0 ? Math.max(...this.payments.map(p => p.id)) + 1 : 1),
        kode: paymentCode,
        invoice_id: allocations[0].invoice_id,
        invoice_kode: firstInv?.kode || '-',
        so_id: order?.id || 0,
        so_kode: order?.kode || '-',
        variant: order?.variant || 'impact',
        customer_id: order?.customer_id,
        customer_nama: order?.customer_nama || '-',
        tanggal: payload.tanggal,
        metode_pembayaran: payload.metode_pembayaran,
        bank_id: payload.bank_id ? Number(payload.bank_id) : null,
        bank_nama: bankNama,
        bank_rekening: bankRekening,
        jumlah: totalNominal,
        keterangan: payload.keterangan?.trim() || null,
        bukti_bayar: payload.bukti_bayar?.trim() || null,
        status: 1,
        invoice_count: allocations.length,
        invoices_summary: allocations.map(a => a.invoice_id).join(', '),
        details: allocations.map((a, idx) => ({
          id: idx + 1,
          sales_invoice_id: a.invoice_id,
          invoice_kode: String(a.invoice_id),
          jumlah: a.amount,
          metode_pembayaran: payload.metode_pembayaran,
          bank_id: payload.bank_id ? Number(payload.bank_id) : null,
          bank_nama: bankNama,
          bank_rekening: bankRekening,
          bukti_bayar: a.bukti_bayar,
          keterangan: a.keterangan
        })),
        created_at: timestampStr,
        created_by: 1,
        created_by_nama: 'Super Admin',
        is_posted_to_finance: false
      }

      this.payments.push(newPayment)

      for (const a of allocations) {
        const inv = await salesInvoiceService.getInvoiceById(a.invoice_id)
        if (inv) {
          const invPayments = await this.getPaymentsByInvoiceId(inv.id)
          const updatedCalc = calculatePaymentSummary(inv.total, [...invPayments, { jumlah: a.amount, status: 1 }])
          salesInvoiceService.updateInvoicePayment(inv.id, updatedCalc.sudahDibayar, updatedCalc.statusPembayaran)
          await this.syncParentOrderTotalPaid(inv.so_id)
        }
      }

      return newPayment
    }

    // Single Payment Flow
    if (!payload.invoice_id || isNaN(payload.invoice_id)) {
      throw new Error('Pembayaran gagal: ID invoice tidak valid atau belum dipilih.')
    }

    const invoice = await salesInvoiceService.getInvoiceById(payload.invoice_id)
    if (!invoice) {
      throw new Error(`Invoice dengan ID ${payload.invoice_id} tidak ditemukan.`)
    }

    if (invoice.status === 0) {
      throw new Error(`Invoice ${invoice.kode} telah dibatalkan. Tidak dapat menerima pembayaran.`)
    }

    const existingPayments = await this.getPaymentsByInvoiceId(payload.invoice_id)
    const currentCalc = calculatePaymentSummary(invoice.total, existingPayments)

    if (currentCalc.sisaPembayaran <= 0) {
      throw new Error(
        `Invoice ${invoice.kode} sudah LUNAS. Tidak ada sisa tagihan yang harus dibayar.`
      )
    }

    const nominalBayar = Math.round(Number(payload.jumlah) || 0)
    const validation = validatePaymentAmount(nominalBayar, currentCalc.sisaPembayaran)
    if (!validation.isValid) {
      throw new Error(validation.error || 'Nominal pembayaran tidak valid.')
    }

    // Attempt backend API call
    let apiPaymentResult: any = null
    try {
      const res = await apiClient<any>(`/sales-invoices/${payload.invoice_id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          tanggal: payload.tanggal,
          metode_pembayaran: payload.metode_pembayaran,
          bank_id: payload.bank_id ? Number(payload.bank_id) : null,
          nominal: nominalBayar,
          keterangan: payload.keterangan || null,
          bukti_bayar: payload.bukti_bayar || null
        })
      })
      if (res && res.data) {
        apiPaymentResult = res.data
      }
    } catch (apiErr: any) {
      if (
        apiErr?.code !== 'NETWORK_ERROR' &&
        apiErr?.message &&
        !apiErr.message.includes('fetch') &&
        !apiErr.message.includes('terputus')
      ) {
        throw new Error(apiErr.message)
      }
    }

    const order = await salesOrderTransactionService.getOrderById(invoice.so_id)
    const paymentCode = apiPaymentResult?.paymentCode || generatePaymentCode(invoice.kode, existingPayments)

    const now = new Date()
    const timestampStr = `${payload.tanggal} ${now.toTimeString().split(' ')[0]}`

    const newPayment: SalesPayment = {
      id: apiPaymentResult?.paymentId || (this.payments.length > 0 ? Math.max(...this.payments.map(p => p.id)) + 1 : 1),
      kode: paymentCode,
      invoice_id: invoice.id,
      invoice_kode: invoice.kode,
      so_id: order.id,
      so_kode: order.kode,
      variant: order.variant,
      customer_id: order.customer_id,
      customer_nama: order.customer_nama,
      tanggal: payload.tanggal,
      metode_pembayaran: payload.metode_pembayaran,
      bank_id: payload.bank_id ? Number(payload.bank_id) : null,
      bank_nama: bankNama,
      bank_rekening: bankRekening,
      jumlah: nominalBayar,
      keterangan: payload.keterangan?.trim() || null,
      bukti_bayar: payload.bukti_bayar?.trim() || null,
      status: 1,
      created_at: timestampStr,
      created_by: 1,
      created_by_nama: 'Super Admin',
      is_posted_to_finance: false
    }

    this.payments.push(newPayment)

    // Synchronize parent invoice
    const updatedPayments = [...existingPayments, newPayment]
    const updatedCalc = calculatePaymentSummary(invoice.total, updatedPayments)
    salesInvoiceService.updateInvoicePayment(
      invoice.id,
      updatedCalc.sudahDibayar,
      updatedCalc.statusPembayaran
    )

    // Synchronize parent Sales Order
    await this.syncParentOrderTotalPaid(order.id)

    // Audit Logging
    await salesOrderTransactionService.addHistory({
      table: 'sales_order',
      table_id: order.id,
      tanggal: payload.tanggal,
      metode: 'PAYMENT',
      keterangan: `Pembayaran ${newPayment.kode} untuk ${invoice.kode} sebesar Rp ${nominalBayar.toLocaleString('id-ID')} (${payload.metode_pembayaran})`,
      user_id: 1,
      user_nama: 'Super Admin'
    })

    return { ...newPayment }
  }

  /**
   * Cancels (reverses) a payment.
   * Restores invoice balance, updates SO balance, and logs audit.
   */
  public async cancelPayment(paymentId: number, reason: string): Promise<boolean> {
    const payment = this.payments.find(p => p.id === Number(paymentId))
    if (!payment) {
      throw new Error(`Pembayaran dengan ID ${paymentId} tidak ditemukan.`)
    }

    if (payment.status === 0) {
      throw new Error(`Pembayaran ${payment.kode} sudah pernah dibatalkan sebelumnya.`)
    }

    if (payment.is_posted_to_finance) {
      throw new Error(
        `Pembayaran ${payment.kode} telah diposting ke Keuangan. Lakukan jurnal pembalik pada modul Keuangan.`
      )
    }

    try {
      await apiClient(`/sales-payments/${paymentId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ alasan: reason })
      })
    } catch (apiErr: any) {
      if (
        apiErr?.code !== 'NETWORK_ERROR' &&
        apiErr?.message &&
        !apiErr.message.includes('fetch') &&
        !apiErr.message.includes('terputus')
      ) {
        throw new Error(apiErr.message)
      }
    }

    // Mark cancelled
    payment.status = 0
    payment.alasan_batal = reason.trim() || 'Dibatalkan oleh pengguna'
    payment.updated_at = new Date().toISOString()

    // Recalculate invoice balance
    const invoicePayments = await this.getPaymentsByInvoiceId(payment.invoice_id)
    const invoice = await salesInvoiceService.getInvoiceById(payment.invoice_id)
    if (invoice) {
      const calc = calculatePaymentSummary(invoice.total, invoicePayments)
      salesInvoiceService.updateInvoicePayment(invoice.id, calc.sudahDibayar, calc.statusPembayaran)
    }

    // Recalculate Sales Order balance
    await this.syncParentOrderTotalPaid(payment.so_id)

    // Audit log
    await salesOrderTransactionService.addHistory({
      table: 'sales_order',
      table_id: payment.so_id,
      tanggal: new Date().toISOString().split('T')[0],
      metode: 'PAYMENT_CANCEL',
      keterangan: `Pembatalan pembayaran ${payment.kode} sebesar Rp ${payment.jumlah.toLocaleString('id-ID')}. Alasan: ${reason}`,
      user_id: 1,
      user_nama: 'Super Admin'
    })

    return true
  }

  /**
   * Updates an existing payment (if not posted to finance and active).
   * Atomically recalculates invoice and SO balances if nominal is modified.
   */
  public async updatePayment(
    paymentId: number,
    payload: UpdatePaymentPayload
  ): Promise<SalesPayment> {
    const payment = this.payments.find(p => p.id === Number(paymentId))
    if (!payment) {
      throw new Error(`Pembayaran dengan ID ${paymentId} tidak ditemukan.`)
    }

    if (payment.status === 0) {
      throw new Error(`Pembayaran ${payment.kode} telah dibatalkan. Tidak dapat diedit.`)
    }

    if (payment.is_posted_to_finance) {
      throw new Error(
        `Pembayaran ${payment.kode} sudah diposting ke Keuangan dan tidak dapat diedit.`
      )
    }

    // Lookup bank if transfer or cek/giro
    if (payload.metode_pembayaran) {
      payment.metode_pembayaran = payload.metode_pembayaran
    }

    if (payment.metode_pembayaran === 'TRANSFER' || payment.metode_pembayaran === 'CEK/GIRO') {
      const bankId = payload.bank_id !== undefined ? payload.bank_id : payment.bank_id
      if (bankId) {
        const banks = await bankService.getAll()
        const selectedBank = banks.data.find(b => b.id === Number(bankId))
        if (selectedBank) {
          payment.bank_id = Number(bankId)
          payment.bank_nama = selectedBank.bank
          payment.bank_rekening = selectedBank.rekening
        }
      } else if (payload.metode_pembayaran === 'TUNAI') {
        payment.bank_id = null
        payment.bank_nama = null
        payment.bank_rekening = null
      }
    } else if (payment.metode_pembayaran === 'TUNAI') {
      payment.bank_id = null
      payment.bank_nama = null
      payment.bank_rekening = null
    }

    if (payload.tanggal) {
      payment.tanggal = payload.tanggal
    }

    if (payload.keterangan !== undefined) {
      payment.keterangan = payload.keterangan?.trim() || null
    }

    if (payload.bukti_bayar !== undefined) {
      payment.bukti_bayar = payload.bukti_bayar?.trim() || null
    }

    // If nominal changed, validate and synchronize
    if (payload.jumlah !== undefined && payload.jumlah !== payment.jumlah) {
      const newNominal = Math.round(Number(payload.jumlah) || 0)
      if (newNominal <= 0) {
        throw new Error('Nominal pembayaran harus lebih besar dari Rp 0.')
      }

      const invoice = await salesInvoiceService.getInvoiceById(payment.invoice_id)
      if (!invoice) {
        throw new Error(`Invoice dengan ID ${payment.invoice_id} tidak ditemukan.`)
      }

      // Check remaining limit: other active payments for this invoice
      const otherPayments = this.payments.filter(
        p => p.invoice_id === payment.invoice_id && p.id !== payment.id && p.status === 1
      )
      const otherTotalPaid = otherPayments.reduce((s, p) => s + p.jumlah, 0)
      const remainingLimit = invoice.total - otherTotalPaid

      if (newNominal > remainingLimit) {
        throw new Error(
          `Nominal pembayaran (Rp ${newNominal.toLocaleString('id-ID')}) melebihi sisa tagihan invoice yang dapat dibayar (Rp ${remainingLimit.toLocaleString('id-ID')}).`
        )
      }

      const oldNominal = payment.jumlah
      payment.jumlah = newNominal

      // Recalculate invoice balance
      const allInvoicePayments = await this.getPaymentsByInvoiceId(payment.invoice_id)
      const calc = calculatePaymentSummary(invoice.total, allInvoicePayments)
      salesInvoiceService.updateInvoicePayment(invoice.id, calc.sudahDibayar, calc.statusPembayaran)

      // Recalculate SO balance
      await this.syncParentOrderTotalPaid(payment.so_id)

      // Audit log
      await salesOrderTransactionService.addHistory({
        table: 'sales_order',
        table_id: payment.so_id,
        tanggal: new Date().toISOString().split('T')[0],
        metode: 'PAYMENT_UPDATE',
        keterangan: `Edit pembayaran ${payment.kode}: nominal diubah dari Rp ${oldNominal.toLocaleString('id-ID')} menjadi Rp ${newNominal.toLocaleString('id-ID')}`,
        user_id: 1,
        user_nama: 'Super Admin'
      })
    }

    payment.updated_at = new Date().toISOString()
    payment.updated_by = 1

    return { ...payment }
  }

  /**
   * Synchronizes parent Sales Order paid amount by aggregating all payments of all its active invoices.
   */
  private async syncParentOrderTotalPaid(orderId: number): Promise<void> {
    try {
      const invoices = await salesInvoiceService.getInvoicesByOrderId(orderId)
      const activeInvoices = invoices.filter(i => i.status === 1)
      const activeInvoiceIds = new Set(activeInvoices.map(i => i.id))

      const memoryPaid = this.payments
        .filter(p => p.status === 1 && activeInvoiceIds.has(p.invoice_id))
        .reduce((sum, p) => sum + p.jumlah, 0)

      const invoicePaid = activeInvoices.reduce((sum, i) => sum + (Number(i.terbayar) || 0), 0)
      const totalPaid = Math.max(memoryPaid, invoicePaid)

      salesOrderTransactionService.updateOrderPayment(orderId, totalPaid)
    } catch {
      // Fallback jika API invoice offline
    }
  }
}

export const salesPaymentService = new SalesPaymentService()
