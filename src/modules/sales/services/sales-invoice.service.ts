/**
 * Sales Invoice Transaction Service
 * Manages Sales Invoices per Sales Order, tax calculations, and payment readiness.
 * End-to-End API integration with offline/unit-test fallback.
 */

import type {
  SalesInvoice,
  SalesInvoiceListItem,
  SalesInvoiceCreatePayload,
  SalesOrderInvoiceSummary,
  InvoicePaymentStatus
} from '../types/sales-invoice.types'
import {
  generateInvoiceCode,
  calculateInvoiceTaxes,
  calculateInvoiceSummary
} from '../utils/sales-invoice-calculations'
import { INITIAL_MOCK_INVOICES } from '../mocks/sales-orders-data.mock'
import { salesOrderTransactionService } from './sales-order-transaction.service'
import { getVariantConfig, type SalesOrderVariantKey } from '../config/sales-order-variants'
import { apiClient } from '@/shared/services/api-client'

export class SalesInvoiceService {
  private invoices: SalesInvoice[] = []

  constructor() {
    this.reset()
  }

  public reset(): void {
    this.invoices = JSON.parse(JSON.stringify(INITIAL_MOCK_INVOICES))
  }

  /**
   * Retrieves all invoices belonging to a specific Sales Order ID.
   */
  public async getInvoicesByOrderId(soId: number): Promise<SalesInvoice[]> {
    try {
      const res = await apiClient<any[]>(`/sales-orders/${soId}/invoices`)
      if (res && res.data) {
        return res.data.map((inv: any) => ({
          id: inv.id,
          so_id: inv.sales_order_id ?? soId,
          kode: inv.kode,
          tanggal: inv.tanggal,
          jenis: inv.jenis,
          subtotal: Number(inv.subtotal) || 0,
          total_ppn: Number(inv.total_ppn) || 0,
          total: Number(inv.total) || 0,
          no_faktur_pajak: inv.no_faktur_pajak || null,
          terbayar: Number(inv.terbayar) || 0,
          status_pembayaran: inv.status_pembayaran || 'BELUM_BAYAR',
          status: inv.status,
          keterangan: inv.keterangan || null,
          count_print: inv.count_print || 0,
          created_at: inv.created_at,
          created_by: inv.created_by || 1
        })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || b.id - a.id)
      }
    } catch {
      // Fallback to local memory in tests or offline mode
    }

    return this.invoices
      .filter(inv => inv.so_id === Number(soId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || b.id - a.id)
  }

  /**
   * Retrieves a single invoice by its ID.
   */
  public async getInvoiceById(id: number): Promise<SalesInvoice | null> {
    try {
      const res = await apiClient<any>(`/sales-invoices/${id}`)
      if (res && res.data) {
        const inv = res.data
        return {
          id: inv.id,
          so_id: inv.sales_order_id,
          kode: inv.kode,
          tanggal: inv.tanggal,
          jenis: inv.jenis,
          subtotal: Number(inv.subtotal) || 0,
          total_ppn: Number(inv.total_ppn) || 0,
          total: Number(inv.total) || 0,
          no_faktur_pajak: inv.no_faktur_pajak || null,
          terbayar: Number(inv.terbayar) || 0,
          status_pembayaran: inv.status_pembayaran || 'BELUM_BAYAR',
          status: inv.status,
          keterangan: inv.keterangan || null,
          count_print: inv.count_print || 0,
          created_at: inv.created_at,
          created_by: inv.created_by || 1
        }
      }
    } catch {
      // Fallback
    }

    const inv = this.invoices.find(i => i.id === Number(id))
    return inv ? { ...inv } : null
  }

  /**
   * Retrieves all invoices across all sales orders with enriched order metadata.
   */
  public async getAllInvoicesWithSummary(): Promise<SalesInvoiceListItem[]> {
    try {
      const res = await apiClient<any[]>('/sales-invoices')
      if (res && res.data) {
        return res.data.map((inv: any) => ({
          id: inv.id,
          so_id: inv.sales_order_id,
          so_kode: inv.so_kode || '-',
          so_variant: (inv.order_type === 'NON_PPN' ? 'pola' : inv.order_type === 'NON_PPN_2' ? 'ks' : 'impact') as SalesOrderVariantKey,
          customer_id: inv.customer_id,
          customer_nama: inv.customer_nama || '-',
          kode: inv.kode,
          tanggal: inv.tanggal,
          jenis: inv.jenis,
          subtotal: Number(inv.subtotal) || 0,
          total_ppn: Number(inv.total_ppn) || 0,
          total: Number(inv.total) || 0,
          no_faktur_pajak: inv.no_faktur_pajak || null,
          terbayar: Number(inv.terbayar) || 0,
          sisa_pembayaran: Math.max(0, (Number(inv.total) || 0) - (Number(inv.terbayar) || 0)),
          status_pembayaran: inv.status_pembayaran || 'BELUM_BAYAR',
          status: inv.status,
          keterangan: inv.keterangan || null,
          count_print: inv.count_print || 0,
          created_at: inv.created_at,
          created_by: inv.created_by || 1,
          payment_count: 0
        })).sort((a: any, b: any) => b.id - a.id)
      }
    } catch {
      // Fallback
    }

    const orders = await salesOrderTransactionService.getAllOrders()
    const orderMap = new Map(orders.map(o => [o.id, o]))

    return this.invoices
      .map(inv => {
        const order = orderMap.get(inv.so_id)
        const sisa = Math.max(0, inv.total - (inv.terbayar || 0))
        return {
          ...inv,
          so_kode: order?.kode || '-',
          so_variant: order?.variant,
          customer_id: order?.customer_id,
          customer_nama: order?.customer_nama || '-',
          sisa_pembayaran: sisa,
          payment_count: 0
        }
      })
      .sort((a, b) => b.id - a.id)
  }

  /**
   * Updates an invoice's paid amount and payment status (called by salesPaymentService).
   */
  public updateInvoicePayment(
    invoiceId: number,
    terbayar: number,
    statusPembayaran: InvoicePaymentStatus
  ): void {
    const index = this.invoices.findIndex(i => i.id === Number(invoiceId))
    if (index !== -1) {
      this.invoices[index] = {
        ...this.invoices[index],
        terbayar,
        status_pembayaran: statusPembayaran,
        updated_at: new Date().toISOString()
      }
    }
  }

  /**
   * Generates the next sequential invoice code for a given Sales Order.
   */
  public async generateNextInvoiceCode(soId: number): Promise<string> {
    try {
      const res = await apiClient<{ kode: string }>(`/sales-orders/${soId}/preview-invoice-code`)
      if (res && res.data?.kode) {
        return res.data.kode
      }
    } catch {
      // Fallback
    }

    const order = await salesOrderTransactionService.getOrderById(soId)
    const existingInvoices = this.invoices.filter(i => i.so_id === Number(soId))
    return generateInvoiceCode(order.kode, existingInvoices)
  }

  /**
   * Computes the 2-column header summary for a Sales Order and its invoices.
   */
  public async getInvoiceSummary(
    soId: number,
    variant: SalesOrderVariantKey
  ): Promise<SalesOrderInvoiceSummary> {
    try {
      const res = await apiClient<any>(`/sales-orders/${soId}/invoice-summary`)
      if (res && res.data) {
        const d = res.data
        return {
          order_id: d.order_id,
          order_kode: d.order_kode,
          variant,
          tanggal: d.tanggal,
          customer_nama: d.customer_nama,
          customer_alamat: d.customer_alamat,
          customer_telepon: d.customer_telepon,
          sales_nama: d.sales_nama,
          is_ppn: d.is_ppn,
          ppn_rate: d.ppn_rate,
          total_dpp: d.total_dpp,
          total_ppn: d.total_ppn,
          total_so: d.total_so,
          sudah_invoice: d.sudah_invoice,
          sisa_invoice: d.sisa_invoice,
          invoice_status: d.invoice_status,
          count_invoices: d.count_invoices
        }
      }
    } catch {
      // Fallback
    }

    const order = await salesOrderTransactionService.getOrderById(soId, variant)
    const existingInvoices = this.invoices.filter(i => i.so_id === Number(soId))

    const summary = calculateInvoiceSummary(order.total, existingInvoices)
    const cfg = getVariantConfig(variant)

    return {
      order_id: order.id,
      order_kode: order.kode,
      variant,
      tanggal: order.tanggal,
      customer_nama: order.customer_nama,
      customer_alamat: order.customer_alamat,
      customer_telepon: order.customer_telepon,
      sales_nama: order.sales_nama,
      is_ppn: order.is_ppn,
      ppn_rate: cfg.hasTax ? salesOrderTransactionService.getActivePpnRate() : 0,
      total_dpp: order.subtotal,
      total_ppn: order.total_ppn,
      total_so: order.total,
      sudah_invoice: summary.sudahInvoice,
      sisa_invoice: summary.sisaInvoice,
      invoice_status: summary.status,
      count_invoices: existingInvoices.length
    }
  }

  /**
   * Creates a new Sales Invoice atomically.
   */
  public async createInvoice(payload: SalesInvoiceCreatePayload): Promise<SalesInvoice> {
    // Normalisasi jenis untuk backend ENUM: 'DP' | 'TERMIN' | 'PELUNASAN'
    const backendJenis = (payload.jenis || 'DP').toUpperCase() as 'DP' | 'TERMIN' | 'PELUNASAN'

    try {
      const res = await apiClient<any>(`/sales-orders/${payload.so_id}/invoices`, {
        method: 'POST',
        body: JSON.stringify({
          tanggal: payload.tanggal,
          jenis: backendJenis,
          total: payload.total,
          no_faktur_pajak: payload.no_faktur_pajak,
          keterangan: payload.keterangan
        })
      })

      if (res && res.data) {
        const inv = res.data
        const createdInvoice: SalesInvoice = {
          id: inv.id,
          so_id: inv.sales_order_id ?? payload.so_id,
          kode: inv.kode,
          tanggal: inv.tanggal,
          jenis: inv.jenis,
          subtotal: Number(inv.subtotal) || 0,
          total_ppn: Number(inv.total_ppn) || 0,
          total: Number(inv.total) || 0,
          no_faktur_pajak: inv.no_faktur_pajak || null,
          terbayar: 0,
          status_pembayaran: 'BELUM_BAYAR',
          status: inv.status ?? 1,
          keterangan: inv.keterangan || null,
          count_print: inv.count_print || 0,
          created_at: inv.created_at,
          created_by: inv.created_by || 1,
          created_by_nama: 'Administrator'
        }

        this.invoices.push(createdInvoice)
        return createdInvoice
      }
    } catch (err: any) {
      // Re-throw if it's an API error (HTTP 4xx or 5xx) from the server
      if (err?.status && err.status >= 400) {
        throw err
      }
      // If network / URL parse error (test environment without live backend), fallback below
    }

    // Fallback: local in-memory creation
    const order = await salesOrderTransactionService.getOrderById(payload.so_id, payload.variant)

    if (order.status_aktif === 0) {
      throw new Error(`Sales Order ${order.kode} telah dibatalkan. Tidak dapat membuat invoice.`)
    }

    const existingInvoices = this.invoices.filter(i => i.so_id === Number(payload.so_id))
    const summary = calculateInvoiceSummary(order.total, existingInvoices)

    const nominalTotal = Math.round(Number(payload.total) || 0)
    if (nominalTotal <= 0) {
      throw new Error('Nominal total invoice harus lebih besar dari Rp 0.')
    }

    if (nominalTotal > summary.sisaInvoice) {
      throw new Error(
        `Nominal invoice (Rp ${nominalTotal.toLocaleString('id-ID')}) melebihi sisa yang belum di-invoice (Rp ${summary.sisaInvoice.toLocaleString('id-ID')}).`
      )
    }

    const cfg = getVariantConfig(payload.variant)
    const taxCalc = calculateInvoiceTaxes(
      nominalTotal,
      cfg.hasTax,
      cfg.hasTax ? salesOrderTransactionService.getActivePpnRate() : 0
    )

    const newId = this.invoices.length > 0 ? Math.max(...this.invoices.map(i => i.id)) + 1 : 1001
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const newInvoice: SalesInvoice = {
      id: newId,
      so_id: payload.so_id,
      kode: payload.kode.trim(),
      tanggal: payload.tanggal,
      jenis: payload.jenis,
      subtotal: taxCalc.dpp,
      total_ppn: taxCalc.ppn,
      total: taxCalc.total,
      no_faktur_pajak: cfg.hasTax ? payload.no_faktur_pajak || null : null,
      terbayar: 0,
      status_pembayaran: 'BELUM_BAYAR',
      status: 1, // Aktif
      keterangan: payload.keterangan || null,
      created_at: nowStr,
      created_by: 1,
      created_by_nama: 'Super Admin'
    }

    this.invoices.push(newInvoice)

    await salesOrderTransactionService.addHistory({
      table: 'sales_order',
      table_id: payload.so_id,
      tanggal: payload.tanggal,
      metode: 'INVOICE_CREATE',
      keterangan: `Penerbitan Invoice ${newInvoice.kode} (${newInvoice.jenis}) sebesar Rp ${newInvoice.total.toLocaleString('id-ID')}`,
      user_id: 1,
      user_nama: 'Super Admin'
    })

    return { ...newInvoice }
  }

  /**
   * Cancels (voids) an existing Sales Invoice safely.
   */
  public async cancelInvoice(invoiceId: number, reason?: string): Promise<boolean> {
    try {
      await apiClient(`/sales-invoices/${invoiceId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ alasan: reason || 'Dibatalkan oleh pengguna' })
      })
    } catch (err: any) {
      if (err?.status && err.status >= 400 && err.status < 500) {
        throw err
      }
    }

    const inv = this.invoices.find(i => i.id === Number(invoiceId))
    if (!inv) {
      throw new Error(`Invoice #${invoiceId} tidak ditemukan.`)
    }

    if (inv.status === 0) {
      throw new Error(`Invoice ${inv.kode} sudah dalam status Batal.`)
    }

    if (inv.terbayar > 0) {
      throw new Error(
        `Invoice ${inv.kode} sudah memiliki pembayaran sebesar Rp ${inv.terbayar.toLocaleString('id-ID')}. Invoice yang sudah dibayar tidak dapat dibatalkan secara langsung.`
      )
    }

    inv.status = 0
    inv.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19)
    inv.updated_by = 1

    await salesOrderTransactionService.addHistory({
      table: 'sales_order',
      table_id: inv.so_id,
      tanggal: new Date().toISOString().slice(0, 10),
      metode: 'INVOICE_CANCEL',
      keterangan: `Pembatalan Invoice ${inv.kode}. Alasan: ${reason || 'Pembatalan tagihan'}`,
      user_id: 1,
      user_nama: 'Super Admin'
    })

    return true
  }

  /**
   * Records print event for an invoice.
   */
  public async recordPrint(invoiceId: number): Promise<void> {
    try {
      await apiClient(`/sales-invoices/${invoiceId}/print`, {
        method: 'POST'
      })
    } catch { }

    const inv = this.invoices.find(i => i.id === Number(invoiceId))
    if (inv) {
      inv.count_print = (inv.count_print || 0) + 1
    }
  }
}

export const salesInvoiceService = new SalesInvoiceService()
