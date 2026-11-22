/**
 * Bill Payment (Pembayaran Tagihan) Service & Repository
 *
 * Implements full REST API integration, multi-document payment allocation,
 * overpayment prevention, atomic rollback, and RBAC assertion.
 * Integrates with backend REST API with fallback to in-memory mock for tests and offline resilience.
 */

import { apiClient } from '@/shared/services/api-client'
import type {
  BillPayment,
  BillPaymentDetail,
  DetailPbPt,
  BillPaymentListItem,
  BillPaymentFormValues,
  BillPaymentCreatePayload,
  BillPaymentUpdatePayload,
  BillPaymentFilters,
  EligibleGoodsReceiptForPayment,
  PaginatedBillPaymentResponse,
  BillPaymentCodeSettingResponse
} from '../types/bill-payment.types'
import {
  INITIAL_MOCK_BILL_PAYMENTS,
  INITIAL_MOCK_BILL_PAYMENT_DETAILS,
  INITIAL_MOCK_DETAIL_PB_PT
} from '../mocks/bill-payments.mock'
import { supplierService } from '@/modules/procurement/suppliers/services/supplier.service'
import { bankService } from '@/modules/settings/banks/services/bank.service'
import { goodsReceiptService } from '@/modules/procurement/goods-receipts/services/goods-receipt.service'
import { assertPermission } from '@/shared/services/service-guard'
import { calculateBillPaymentSummary } from '../utils/bill-payment-calculations'

export class MockBillPaymentService {
  private payments: BillPayment[] = []
  private paymentDetails: BillPaymentDetail[] = []
  private pbPtRelations: DetailPbPt[] = []
  private currentTemplate: string = 'PT/{year}{month}-{rand}'

  constructor() {
    this.reset()
  }

  reset(): void {
    this.payments = JSON.parse(JSON.stringify(INITIAL_MOCK_BILL_PAYMENTS))
    this.paymentDetails = JSON.parse(JSON.stringify(INITIAL_MOCK_BILL_PAYMENT_DETAILS))
    this.pbPtRelations = JSON.parse(JSON.stringify(INITIAL_MOCK_DETAIL_PB_PT))
  }

  getRawPayments(): BillPayment[] {
    return this.payments
  }

  getRawDetails(): BillPaymentDetail[] {
    return this.paymentDetails
  }

  getRawRelations(): DetailPbPt[] {
    return this.pbPtRelations
  }

  private enrich(payment: BillPayment): BillPaymentListItem {
    const suppliers = supplierService.getRawItems()
    const banks = bankService.getRawItems()

    const sup = suppliers.find(s => s.id === payment.suplier_id)
    const details = this.paymentDetails.filter(d => d.pembayaran_tagihan_id === payment.id)

    // Method and Bank summary
    const methodNames = Array.from(new Set(details.map(d => d.metode_pembayaran).filter(Boolean)))
    const bankIds = Array.from(new Set(details.map(d => d.bank_id).filter(Boolean)))
    const bankNames = bankIds.map(id => banks.find(b => b.id === id)?.bank).filter(Boolean)

    const pbCount = this.pbPtRelations.filter(r => r.pt_id === payment.id).length

    return {
      ...payment,
      nama_suplier: sup?.nama || '-',
      bank_nama: bankNames.join(', ') || '-',
      metode_pembayaran: methodNames.join(', ') || '-',
      status_label: payment.status === 1 ? 'Lunas' : 'Belum Lunas',
      status_aktif_label: payment.status_aktif === 1 ? 'Aktif' : 'Dibatalkan',
      pb_count: pbCount
    }
  }

  /**
   * List payments with search, filters, sorting, and pagination
   */
  async list(filters: BillPaymentFilters = {}): Promise<PaginatedBillPaymentResponse> {
    assertPermission('procurement', 'read')

    // 1. Try real backend API
    try {
      const q = new URLSearchParams()
      if (filters.search) q.append('search', String(filters.search))
      if (filters.suplier_id) q.append('suplier_id', String(filters.suplier_id))
      if (filters.bank_id) q.append('bank_id', String(filters.bank_id))
      if (filters.status !== undefined && filters.status !== '' && Number(filters.status) !== -1) {
        q.append('status', String(filters.status))
      }
      if (filters.startDate) q.append('startDate', filters.startDate)
      if (filters.endDate) q.append('endDate', filters.endDate)
      if (filters.page) q.append('page', String(filters.page))
      if (filters.pageSize) q.append('limit', String(filters.pageSize))
      if (filters.sortBy) q.append('sortBy', String(filters.sortBy))
      if (filters.sortOrder) q.append('sortOrder', String(filters.sortOrder))

      const res = await apiClient<BillPaymentListItem[]>(`/bill-payments?${q.toString()}`)
      if (res && res.data && Array.isArray(res.data)) {
        return {
          data: res.data,
          total: res.meta?.totalItems ?? res.data.length,
          page: res.meta?.page ?? 1,
          pageSize: res.meta?.pageSize ?? 10,
          totalPages: res.meta?.totalPages ?? 1
        }
      }
    } catch {
      // Fallback ke mock in-memory
    }

    let dataset = this.payments.map(p => this.enrich(p))

    // Active status filter (default to active only unless specified)
    dataset = dataset.filter(p => p.status_aktif === 1)

    // 1. Search
    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase()
      dataset = dataset.filter(item => {
        return (
          item.kode?.toLowerCase().includes(q) ||
          item.no_tagihan?.toLowerCase().includes(q) ||
          item.penagih?.toLowerCase().includes(q) ||
          item.nama_suplier?.toLowerCase().includes(q) ||
          item.bank_nama?.toLowerCase().includes(q)
        )
      })
    }

    // 2. Filter by Supplier
    if (filters.suplier_id !== undefined && filters.suplier_id !== '') {
      dataset = dataset.filter(item => item.suplier_id === Number(filters.suplier_id))
    }

    // 3. Filter by Status (0 or 1)
    if (filters.status !== undefined && filters.status !== '') {
      dataset = dataset.filter(item => item.status === Number(filters.status))
    }

    // 4. Date range filter
    if (filters.startDate) {
      dataset = dataset.filter(item => item.tanggal && item.tanggal >= filters.startDate!)
    }
    if (filters.endDate) {
      dataset = dataset.filter(item => item.tanggal && item.tanggal <= filters.endDate!)
    }

    // 5. Sorting
    const sortBy = filters.sortBy || 'tanggal'
    const sortOrder = filters.sortOrder || 'desc'
    dataset.sort((a, b) => {
      const valA = (a as unknown as Record<string, unknown>)[sortBy]
      const valB = (b as unknown as Record<string, unknown>)[sortBy]
      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA))
    })

    const total = dataset.length
    const page = filters.page || 1
    const pageSize = filters.pageSize || 10
    const start = (page - 1) * pageSize
    const paginatedItems = dataset.slice(start, start + pageSize)
    const totalPages = Math.ceil(total / pageSize) || 1

    return {
      data: paginatedItems,
      total,
      page,
      pageSize,
      totalPages
    }
  }

  /**
   * Get single bill payment by ID
   */
  async getById(id: number): Promise<{
    header: BillPaymentFormValues & {
      nama_suplier: string
      total: number
      total_bayar: number
      subtotal: number
      total_ppn: number
      diskon: number
      status_label: string
      status_aktif: number
      status_aktif_label: string
    }
    methods: BillPaymentDetail[]
    linkedPbs: EligibleGoodsReceiptForPayment[]
  }> {
    assertPermission('procurement', 'read')

    // 1. Try real backend API
    try {
      const res = await apiClient<any>(`/bill-payments/${id}`)
      if (res && res.data && res.data.header) {
        return {
          header: {
            ...res.data.header,
            selected_pb_ids: (res.data.allocations || []).map((a: any) => a.pb_id),
            allocations: res.data.allocations || [],
            payment_methods: (res.data.payment_methods || []).map((m: any) => ({
              id: m.id,
              metode_pembayaran: m.metode_pembayaran || 'Transfer Bank',
              bank_id: m.bank_id || null,
              jumlah: m.jumlah || 0,
              keterangan: m.keterangan || ''
            }))
          },
          methods: res.data.payment_methods || [],
          linkedPbs: (res.data.allocations || []).map((a: any) => ({
            id: a.pb_id,
            kode: a.kode_pb,
            kode_po: a.kode_po,
            tanggal: a.tanggal,
            suplier_id: res.data.header.suplier_id,
            nama_suplier: res.data.header.nama_suplier,
            total_pb: a.nilai_pb,
            sudah_dibayar: a.sudah_dibayar,
            sisa_tagihan: a.sisa_sebelum,
            nominal_alokasi: a.nominal_alokasi,
            sisa_setelah_bayar: a.sisa_sesudah,
            isSelected: true
          }))
        }
      }
    } catch {
      // Fallback ke mock in-memory
    }

    const payment = this.payments.find(p => p.id === id)
    if (!payment) {
      throw new Error(`Pembayaran Tagihan dengan ID #${id} tidak ditemukan.`)
    }

    const suppliers = supplierService.getRawItems()
    const sup = suppliers.find(s => s.id === payment.suplier_id)

    const methods = this.paymentDetails.filter(d => d.pembayaran_tagihan_id === id)
    const relations = this.pbPtRelations.filter(r => r.pt_id === id)
    const linkedPbIds = relations.map(r => r.pb_id).filter((pid): pid is number => pid !== null)

    const allPbs = await this.getEligibleGoodsReceipts(payment.suplier_id || 0, id)
    const linkedPbs = allPbs.filter(pb => linkedPbIds.includes(pb.id))

    // Set nominal_alokasi for each linked PB
    linkedPbs.forEach(pb => {
      const rel = relations.find(r => r.pb_id === pb.id)
      if (rel && rel.nominal_alokasi !== undefined) {
        pb.nominal_alokasi = rel.nominal_alokasi
        pb.sisa_setelah_bayar = Math.max(0, pb.sisa_tagihan - rel.nominal_alokasi)
      }
    })

    return {
      header: {
        id: payment.id,
        kode: payment.kode || '',
        no_tagihan: payment.no_tagihan || '',
        tanggal: payment.tanggal || '',
        jatuh_tempo: payment.jatuh_tempo || '',
        penagih: payment.penagih || '',
        suplier_id: payment.suplier_id,
        keterangan: payment.keterangan || '',
        status: payment.status || 0,
        selected_pb_ids: linkedPbIds,
        allocations: relations.map(r => ({ pb_id: r.pb_id!, nominal_alokasi: r.nominal_alokasi || 0 })),
        payment_methods: methods.map(m => ({
          id: m.id,
          metode_pembayaran: m.metode_pembayaran || 'Transfer Bank',
          bank_id: m.bank_id,
          jumlah: m.jumlah || 0,
          keterangan: m.keterangan || ''
        })),
        nama_suplier: sup?.nama || '-',
        total: payment.total || 0,
        total_bayar: payment.total_bayar || 0,
        subtotal: payment.subtotal || 0,
        total_ppn: payment.total_ppn || 0,
        diskon: payment.diskon || 0,
        status_label: payment.status === 1 ? 'Lunas' : 'Belum Lunas',
        status_aktif: payment.status_aktif,
        status_aktif_label: payment.status_aktif === 1 ? 'Aktif' : 'Dibatalkan'
      },
      methods,
      linkedPbs
    }
  }

  /**
   * Retrieves eligible Goods Receipts (PB) for a given supplier that have an outstanding balance.
   */
  async getEligibleGoodsReceipts(
    suplierId: number,
    currentPtId?: number
  ): Promise<EligibleGoodsReceiptForPayment[]> {
    assertPermission('procurement', 'read')

    // 1. Try real backend API
    try {
      const q = currentPtId ? `?suplier_id=${suplierId}&current_pt_id=${currentPtId}` : `?suplier_id=${suplierId}`
      const res = await apiClient<EligibleGoodsReceiptForPayment[]>(`/bill-payments/lookups/eligible-pbs${q}`)
      if (res && res.data && Array.isArray(res.data)) {
        return res.data
      }
    } catch {
      // Fallback
    }

    const receipts = goodsReceiptService.getRawReceipts()
    const suppliers = supplierService.getRawItems()

    // Find all active, confirmed PBs
    const activePbs = receipts.filter(r => r.status_aktif === 1 && r.status === 1)

    const eligible: EligibleGoodsReceiptForPayment[] = []

    for (const pb of activePbs) {
      let pbSuplierId: number | null = null
      let kodePo = '-'
      if (pb.purchase_order_id) {
        const enriched = (
          await goodsReceiptService.list({ search: pb.kode || undefined })
        ).data.find(item => item.id === pb.id)
        if (enriched) {
          if (enriched.suplier_id) pbSuplierId = enriched.suplier_id
          if (enriched.kode_po) kodePo = enriched.kode_po
        }
      }

      if (suplierId && pbSuplierId !== suplierId) {
        continue
      }

      const totalPb = pb.total || 0

      // Calculate total paid previously across other active bill payments using nominal_alokasi
      const otherRelations = this.pbPtRelations.filter(
        rel => rel.pb_id === pb.id && rel.pt_id !== currentPtId
      )

      let totalPaid = 0
      for (const rel of otherRelations) {
        const pt = this.payments.find(p => p.id === rel.pt_id && p.status_aktif === 1)
        if (pt) {
          totalPaid += Number(rel.nominal_alokasi) || 0
        }
      }

      const sisa = Math.max(0, totalPb - totalPaid)
      const sup = suppliers.find(s => s.id === pbSuplierId)

      // Include if outstanding balance > 0 OR if linked to current payment being edited
      const currentRel = currentPtId
        ? this.pbPtRelations.find(r => r.pt_id === currentPtId && r.pb_id === pb.id)
        : null
      const isLinkedToCurrent = !!currentRel
      const currentAlloc = currentRel ? (Number(currentRel.nominal_alokasi) || 0) : 0

      if (sisa > 0 || isLinkedToCurrent) {
        eligible.push({
          id: pb.id,
          kode: pb.kode || `PB-${pb.id}`,
          kode_po: kodePo,
          tanggal: pb.tanggal,
          suplier_id: pbSuplierId,
          nama_suplier: sup?.nama || '-',
          total_pb: totalPb,
          sudah_dibayar: totalPaid,
          sisa_tagihan: sisa,
          isSelected: isLinkedToCurrent,
          nominal_alokasi: currentAlloc,
          sisa_setelah_bayar: Math.max(0, sisa - currentAlloc)
        })
      }
    }

    return eligible
  }

  /**
   * Create a new Bill Payment atomically
   */
  async create(payload: BillPaymentCreatePayload): Promise<BillPaymentListItem> {
    assertPermission('procurement', 'create')

    // 1. Try real backend API
    try {
      const res = await apiClient<BillPaymentListItem>('/bill-payments', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      if (res && res.data) {
        return res.data
      }
    } catch (err: any) {
      if (err?.status && err.status >= 400 && err.status < 500) {
        throw err
      }
      // Fallback
    }

    const snapshotPayments = JSON.parse(JSON.stringify(this.payments))
    const snapshotDetails = JSON.parse(JSON.stringify(this.paymentDetails))
    const snapshotRelations = JSON.parse(JSON.stringify(this.pbPtRelations))

    try {
      if (!payload.kode?.trim()) {
        throw new Error('Kode Pembayaran Tagihan wajib diisi.')
      }
      if (!payload.suplier_id) {
        throw new Error('Supplier wajib dipilih.')
      }
      if (!payload.no_tagihan?.trim()) {
        throw new Error('Nomor tagihan / invoice wajib diisi.')
      }
      if (!payload.tanggal?.trim()) {
        throw new Error('Tanggal pembayaran wajib diisi.')
      }

      const pbIds = payload.pb_ids || (payload.allocations ? payload.allocations.map(a => a.pb_id) : [])
      if (!pbIds || pbIds.length === 0) {
        throw new Error('Pilih setidaknya satu dokumen Penerimaan Barang (PB).')
      }
      if (!payload.payment_methods || payload.payment_methods.length === 0) {
        throw new Error('Tambahkan setidaknya satu metode pembayaran.')
      }

      // Check duplicate kode
      if (
        this.payments.some(
          p => p.kode?.toLowerCase() === payload.kode.trim().toLowerCase() && p.status_aktif === 1
        )
      ) {
        throw new Error(`Kode Pembayaran "${payload.kode}" sudah terdaftar.`)
      }

      // Calculate totals and verify overpayment
      const eligiblePbs = await this.getEligibleGoodsReceipts(payload.suplier_id)
      const selectedPbs = eligiblePbs.filter(pb => pbIds.includes(pb.id))

      // Enrich with allocations
      if (payload.allocations && payload.allocations.length > 0) {
        selectedPbs.forEach(pb => {
          const alloc = payload.allocations?.find(a => a.pb_id === pb.id)
          if (alloc) {
            pb.nominal_alokasi = alloc.nominal_alokasi
          }
        })
      } else {
        const totalBayar = payload.payment_methods.reduce(
          (sum, m) => sum + (Number(m.jumlah) || 0),
          0
        )
        let remaining = totalBayar
        selectedPbs.forEach(pb => {
          const alloc = Math.min(pb.sisa_tagihan, remaining)
          pb.nominal_alokasi = alloc
          remaining -= alloc
        })
      }

      const summary = calculateBillPaymentSummary(selectedPbs, payload.payment_methods)

      if (summary.total_bayar <= 0) {
        throw new Error('Nominal pembayaran harus lebih besar dari 0.')
      }
      if (summary.total_bayar > summary.sisa_tagihan) {
        throw new Error(
          `Total pembayaran (${summary.total_bayar.toLocaleString('id-ID')}) melebihi sisa tagihan (${summary.sisa_tagihan.toLocaleString('id-ID')}).`
        )
      }

      const newId = this.payments.length > 0 ? Math.max(...this.payments.map(p => p.id)) + 1 : 1
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

      const newPayment: BillPayment = {
        id: newId,
        kode: payload.kode.trim(),
        no_tagihan: payload.no_tagihan.trim(),
        penagih: payload.penagih?.trim() || null,
        suplier_id: payload.suplier_id,
        tanggal: payload.tanggal,
        jatuh_tempo: payload.jatuh_tempo || null,
        keterangan: payload.keterangan || null,
        status: summary.is_lunas ? 1 : 0,
        status_aktif: 1,
        subtotal: summary.total_tagihan,
        diskon: 0,
        is_ppn: 0,
        ppn_id: null,
        total_ppn: 0,
        total: summary.total_tagihan,
        total_bayar: summary.total_bayar,
        uuid: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        created_at: nowStr,
        created_by: 1,
        updated_at: nowStr,
        updated_by: 1
      }

      this.payments.unshift(newPayment)

      // Insert details
      let detailId =
        this.paymentDetails.length > 0 ? Math.max(...this.paymentDetails.map(d => d.id)) + 1 : 1
      for (const m of payload.payment_methods) {
        this.paymentDetails.push({
          id: detailId++,
          pembayaran_tagihan_id: newId,
          metode_pembayaran: m.metode_pembayaran,
          bank_id: m.bank_id || null,
          jumlah: Number(m.jumlah) || 0,
          keterangan: m.keterangan || null
        })
      }

      // Insert PB-PT relations with nominal_alokasi
      let relId =
        this.pbPtRelations.length > 0 ? Math.max(...this.pbPtRelations.map(r => r.id)) + 1 : 1
      for (const pbId of pbIds) {
        const alloc = payload.allocations?.find(a => a.pb_id === pbId)
        const foundPb = selectedPbs.find(p => p.id === pbId)
        const alokasi = alloc
          ? Number(alloc.nominal_alokasi) || 0
          : (foundPb?.nominal_alokasi !== undefined ? foundPb.nominal_alokasi : summary.total_bayar / pbIds.length)

        this.pbPtRelations.push({
          id: relId++,
          pt_id: newId,
          pb_id: pbId,
          nominal_alokasi: alokasi
        })
      }

      return this.enrich(newPayment)
    } catch (err) {
      // Rollback
      this.payments = snapshotPayments
      this.paymentDetails = snapshotDetails
      this.pbPtRelations = snapshotRelations
      throw err
    }
  }

  /**
   * Update an existing Bill Payment atomically
   */
  async update(id: number, payload: BillPaymentUpdatePayload): Promise<BillPaymentListItem> {
    assertPermission('procurement', 'update')

    // 1. Try real backend API
    try {
      const res = await apiClient<BillPaymentListItem>(`/bill-payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      if (res && res.data) {
        return res.data
      }
    } catch (err: any) {
      if (err?.status && err.status >= 400 && err.status < 500) {
        throw err
      }
      // Fallback
    }

    const paymentIndex = this.payments.findIndex(p => p.id === id)
    if (paymentIndex === -1) {
      throw new Error(`Pembayaran Tagihan dengan ID #${id} tidak ditemukan.`)
    }

    const current = this.payments[paymentIndex]
    if (current.status_aktif === 0) {
      throw new Error('Tidak dapat mengedit transaksi yang sudah dibatalkan.')
    }

    const snapshotPayments = JSON.parse(JSON.stringify(this.payments))
    const snapshotDetails = JSON.parse(JSON.stringify(this.paymentDetails))
    const snapshotRelations = JSON.parse(JSON.stringify(this.pbPtRelations))

    try {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

      if (payload.no_tagihan !== undefined) current.no_tagihan = payload.no_tagihan.trim()
      if (payload.tanggal !== undefined) current.tanggal = payload.tanggal
      if (payload.jatuh_tempo !== undefined) current.jatuh_tempo = payload.jatuh_tempo || null
      if (payload.penagih !== undefined) current.penagih = payload.penagih?.trim() || null
      if (payload.keterangan !== undefined) current.keterangan = payload.keterangan || null
      current.updated_at = nowStr

      // Update payment methods keterangan
      if (payload.payment_methods) {
        for (const m of payload.payment_methods) {
          if (m.id) {
            const detail = this.paymentDetails.find(d => d.id === m.id)
            if (detail) {
              detail.keterangan = m.keterangan || null
            }
          }
        }
      }

      this.payments[paymentIndex] = current
      return this.enrich(current)
    } catch (err) {
      this.payments = snapshotPayments
      this.paymentDetails = snapshotDetails
      this.pbPtRelations = snapshotRelations
      throw err
    }
  }

  /**
   * Cancel / Reverse a Bill Payment atomically
   */
  async cancel(id: number, reason: string = 'Pembatalan transaksi'): Promise<void> {
    assertPermission('procurement', 'delete')

    // 1. Try real backend API
    try {
      await apiClient(`/bill-payments/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ alasan: reason })
      })
      return
    } catch (err: any) {
      if (err?.status && err.status >= 400 && err.status < 500) {
        throw err
      }
      // Fallback
    }

    const payment = this.payments.find(p => p.id === id)
    if (!payment) {
      throw new Error(`Pembayaran Tagihan dengan ID #${id} tidak ditemukan.`)
    }
    if (payment.status_aktif === 0) {
      throw new Error('Transaksi pembayaran ini sudah dibatalkan sebelumnya.')
    }

    payment.status_aktif = 0
    payment.keterangan = payment.keterangan
      ? `${payment.keterangan} [DIBATALKAN: ${reason}]`
      : `[DIBATALKAN: ${reason}]`
    payment.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)
  }

  /**
   * Delete Bill Payment (alias to cancel)
   */
  async delete(id: number, reason: string = 'Dihapus oleh pengguna'): Promise<void> {
    await this.cancel(id, reason)
  }

  /**
   * Generate sequential Bill Payment code
   */
  async generateCode(dateStr?: string): Promise<string> {
    try {
      const q = dateStr ? `?tanggal=${dateStr}` : ''
      const res = await apiClient<{ kode: string }>(`/bill-payments/generate-code${q}`)
      if (res && res.data && res.data.kode) {
        return res.data.kode
      }
    } catch {
      // Fallback
    }

    const d = dateStr ? new Date(dateStr) : new Date()
    const yy = d.getFullYear().toString().slice(-2)
    const mm = (d.getMonth() + 1).toString().padStart(2, '0')
    const rand = Math.floor(1000 + Math.random() * 9000).toString()
    return `PT/${yy}${mm}-${rand}`
  }

  /**
   * Preview code from template
   */
  async previewCode(templateStr?: string, dateStr?: string): Promise<string> {
    try {
      const q = new URLSearchParams()
      if (templateStr) q.append('template', templateStr)
      if (dateStr) q.append('tanggal', dateStr)
      const res = await apiClient<{ preview: string }>(`/bill-payments/preview-code?${q.toString()}`)
      if (res && res.data && res.data.preview) {
        return res.data.preview
      }
    } catch {
      // Fallback
    }

    const template = templateStr || this.currentTemplate
    const d = dateStr ? new Date(dateStr) : new Date()
    const yy = d.getFullYear().toString().slice(-2)
    const yyyy = d.getFullYear().toString()
    const mm = (d.getMonth() + 1).toString().padStart(2, '0')
    const dd = d.getDate().toString().padStart(2, '0')

    return template
      .replace(/\{year\}/g, yy)
      .replace(/\{YEAR\}/g, yyyy)
      .replace(/\{month\}/g, mm)
      .replace(/\{date_of_month\}/g, dd)
      .replace(/\{date\}/g, `${dd}-${mm}-${yy}`)
      .replace(/\{rand\}/g, '4821')
      .replace(/\{last_number\}/g, '0001')
  }

  /**
   * Get setting table for Bill Payment
   */
  async getSettingTable(): Promise<BillPaymentCodeSettingResponse> {
    try {
      const res = await apiClient<BillPaymentCodeSettingResponse>('/bill-payments/setting-table')
      if (res && res.data) {
        return res.data
      }
    } catch {
      // Fallback
    }

    return {
      template: this.currentTemplate,
      preview: await this.previewCode(this.currentTemplate),
      supported_placeholders: [
        { token: '{last_number}', description: 'Nomor urut 4 digit', example: '0001' },
        { token: '{year}', description: '2-digit tahun transaksi', example: '26' },
        { token: '{YEAR}', description: '4-digit tahun transaksi', example: '2026' },
        { token: '{month}', description: '2-digit bulan transaksi (01–12)', example: '11' },
        { token: '{date_of_month}', description: '2-digit tanggal bulan (01–31)', example: '18' },
        { token: '{date}', description: 'Tanggal lengkap (DD-MM-YY)', example: '18-11-26' },
        { token: '{rand}', description: 'Angka acak 4 digit', example: '4821' }
      ]
    }
  }

  /**
   * Update setting table template
   */
  async updateSettingTable(newTemplate: string): Promise<string> {
    try {
      const res = await apiClient<{ template: string }>('/bill-payments/setting-table', {
        method: 'PUT',
        body: JSON.stringify({ template: newTemplate })
      })
      if (res && res.data && res.data.template) {
        this.currentTemplate = res.data.template
        return res.data.template
      }
    } catch {
      // Fallback
    }

    this.currentTemplate = newTemplate.trim()
    return this.currentTemplate
  }
}

export const billPaymentService = new MockBillPaymentService()
