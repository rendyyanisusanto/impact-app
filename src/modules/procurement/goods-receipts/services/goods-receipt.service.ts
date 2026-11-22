/**
 * IMPACT FURNITURE V2 - SPRINT 16
 * GOODS RECEIPT SERVICE (PENERIMAAN BARANG & POSTING STOK BAHAN)
 *
 * Implements full CRUD, PO enrichment, warehouse/supplier resolution,
 * partial receipt remaining quantity calculation, atomic rollback, and RBAC assertion.
 * Integrates with backend REST API with fallback to in-memory mock for tests and offline resilience.
 */

import { apiClient } from '@/shared/services/api-client'
import type {
  GoodsReceipt,
  GoodsReceiptDetail,
  GoodsReceiptListItem,
  GoodsReceiptDetailRow,
  GoodsReceiptFormValues,
  GoodsReceiptCreatePayload,
  GoodsReceiptUpdatePayload,
  GoodsReceiptFilters,
  EligiblePurchaseOrder,
  PaginatedGoodsReceiptResponse,
  GoodsReceiptCodeSettingResponse
} from '../types/goods-receipt.types'
import {
  INITIAL_MOCK_GOODS_RECEIPTS,
  INITIAL_MOCK_GOODS_RECEIPT_DETAILS
} from '../mocks/goods-receipts.mock'
import { purchaseOrderService } from '@/modules/procurement/purchase-orders/services/purchase-order.service'
import { supplierService } from '@/modules/procurement/suppliers/services/supplier.service'
import { warehouseService } from '@/modules/settings/warehouses/services/warehouse.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { satuanBeliService } from '@/modules/settings/units/services/unit.service'
import { taxService } from '@/modules/settings/tax/services/tax.service'
import { stockPostingService } from '@/modules/inventory/materials/services/stock-posting.service'
import { assertPermission } from '@/shared/services/service-guard'
import { calculateGoodsReceiptRowSubtotal } from '../utils/goods-receipt-calculations'

export class GoodsReceiptService {
  private receipts: GoodsReceipt[] = []
  private details: GoodsReceiptDetail[] = []
  private currentTemplate: string = 'PB/{year}{month}-{last_number}'

  constructor() {
    this.reset()
  }

  reset(): void {
    this.receipts = JSON.parse(JSON.stringify(INITIAL_MOCK_GOODS_RECEIPTS))
    this.details = JSON.parse(JSON.stringify(INITIAL_MOCK_GOODS_RECEIPT_DETAILS))
  }

  /**
   * Helper to enrich a GoodsReceipt header into GoodsReceiptListItem
   */
  private enrichReceipt(receipt: GoodsReceipt): GoodsReceiptListItem {
    // 1. Resolve PO and Supplier
    let kodePo = '-'
    let suplierId: number | null = null
    let namaSuplier = '-'

    if (receipt.purchase_order_id) {
      const po = purchaseOrderService.getRawOrders().find(p => p.id === receipt.purchase_order_id)
      if (po) {
        kodePo = po.kode || '-'
        suplierId = po.suplier_id
        if (po.suplier_id) {
          const sup = supplierService.getRawItems().find(s => s.id === po.suplier_id)
          if (sup && sup.nama) namaSuplier = sup.nama
        }
      }
    }

    // 2. Resolve Warehouse
    let namaGudang = '-'
    if (receipt.gudang_id) {
      const g = warehouseService.getRawItems().find(w => w.id === receipt.gudang_id)
      if (g && g.nama) namaGudang = g.nama
    }

    // 3. Resolve detail item count
    const itemCount = this.details.filter(
      d => d.penerimaan_barang_id === receipt.id && d.bahan_id
    ).length

    // 4. Status labels
    const statusLabel = receipt.status === 1 ? 'Diterima' : 'Draft'
    const statusAktifLabel = receipt.status_aktif === 1 ? 'Aktif' : 'Dibatalkan'

    return {
      id: receipt.id,
      kode: receipt.kode || `PB-${receipt.id}`,
      purchase_order_id: receipt.purchase_order_id,
      kode_po: kodePo,
      suplier_id: suplierId,
      nama_suplier: namaSuplier,
      no_surat_jalan: receipt.no_surat_jalan || '-',
      gudang_id: receipt.gudang_id,
      nama_gudang: namaGudang,
      tanggal: receipt.tanggal || '-',
      nama_pengirim: receipt.nama_pengirim || '-',
      keterangan: receipt.keterangan || '-',
      nilai_pb: receipt.nilai_pb || 0,
      subtotal: receipt.subtotal || 0,
      diskon: receipt.diskon || 0,
      total_ppn: receipt.total_ppn || 0,
      total: receipt.total || 0,
      status: receipt.status ?? 0,
      status_label: statusLabel,
      status_aktif: receipt.status_aktif,
      status_aktif_label: statusAktifLabel,
      item_count: itemCount
    }
  }

  /**
   * List goods receipts with search, multi-field filters, sorting, and pagination
   */
  async list(filters?: GoodsReceiptFilters): Promise<PaginatedGoodsReceiptResponse> {
    assertPermission('procurement', 'read')

    // 1. Try real backend API
    try {
      const q = new URLSearchParams()
      if (filters?.search) q.append('search', String(filters.search))
      if (filters?.suplier_id) q.append('suplier_id', String(filters.suplier_id))
      if (filters?.gudang_id) q.append('gudang_id', String(filters.gudang_id))
      if (
        filters?.status !== undefined &&
        filters?.status !== null &&
        filters?.status !== '' &&
        Number(filters?.status) !== -1
      ) {
        q.append('status', String(filters.status))
      }
      if (filters?.status_aktif !== undefined && filters?.status_aktif !== null) {
        q.append('status_aktif', String(filters.status_aktif))
      }
      if (filters?.startDate) q.append('startDate', filters.startDate)
      if (filters?.endDate) q.append('endDate', filters.endDate)
      if (filters?.page) q.append('page', String(filters.page))
      const perPage = filters?.pageSize || (filters as any)?.perPage
      if (perPage) q.append('limit', String(perPage))
      if (filters?.sortBy) q.append('sortBy', String(filters.sortBy))
      if (filters?.sortOrder) q.append('sortOrder', String(filters.sortOrder))

      const res = await apiClient<GoodsReceiptListItem[]>(`/goods-receipts?${q.toString()}`)
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
      // Fallback ke in-memory mock untuk offline / unit testing
    }

    let dataset = this.receipts
      .filter(r =>
        filters?.status_aktif !== undefined
          ? r.status_aktif === Number(filters.status_aktif)
          : r.status_aktif === 1
      )
      .map(r => this.enrichReceipt(r))

    // Search filter
    if (typeof filters?.search === 'string' && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      dataset = dataset.filter(r => {
        return (
          r.kode.toLowerCase().includes(q) ||
          r.kode_po.toLowerCase().includes(q) ||
          r.no_surat_jalan.toLowerCase().includes(q) ||
          r.nama_suplier.toLowerCase().includes(q) ||
          r.nama_pengirim.toLowerCase().includes(q) ||
          r.keterangan.toLowerCase().includes(q)
        )
      })
    }

    // Supplier filter
    if (filters?.suplier_id !== undefined && filters.suplier_id !== '') {
      const supId = Number(filters.suplier_id)
      dataset = dataset.filter(r => r.suplier_id === supId)
    }

    // Warehouse filter
    if (filters?.gudang_id !== undefined && filters.gudang_id !== '') {
      const gId = Number(filters.gudang_id)
      dataset = dataset.filter(r => r.gudang_id === gId)
    }

    // Status filter
    if (filters?.status !== undefined && filters.status !== '' && Number(filters.status) !== -1) {
      const st = Number(filters.status)
      dataset = dataset.filter(r => r.status === st)
    }

    // Date range filter
    if (filters?.startDate) {
      dataset = dataset.filter(r => (r.tanggal ? r.tanggal >= filters.startDate! : false))
    }
    if (filters?.endDate) {
      dataset = dataset.filter(r => (r.tanggal ? r.tanggal <= filters.endDate! : false))
    }

    // Sorting
    const sortBy = filters?.sortBy || 'tanggal'
    const sortOrder = filters?.sortOrder || 'desc'

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
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 10
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
   * Get single receipt by ID with enriched header and detail rows
   */
  async getById(id: number): Promise<{
    header: GoodsReceiptFormValues & {
      kode_po: string
      nama_suplier: string
      nama_gudang: string
      suplier_id: number | null
      total: number
      nilai_pb: number
      total_ppn: number
    }
    details: GoodsReceiptDetailRow[]
  }> {
    assertPermission('procurement', 'read')

    try {
      const res = await apiClient<{
        header: GoodsReceiptFormValues & {
          kode_po: string
          nama_suplier: string
          nama_gudang: string
          suplier_id: number | null
          total: number
          nilai_pb: number
          total_ppn: number
        }
        details: GoodsReceiptDetailRow[]
      }>(`/goods-receipts/${id}`)
      if (res && res.data) {
        return res.data
      }
    } catch {
      // Fallback
    }

    const receipt = this.receipts.find(r => r.id === Number(id))
    if (!receipt) {
      throw new Error(`Penerimaan Barang dengan ID #${id} tidak ditemukan.`)
    }

    const enriched = this.enrichReceipt(receipt)
    const rawDetails = this.details.filter(d => d.penerimaan_barang_id === Number(id))

    // Resolve materials and units
    const materials = materialService.getRawItems()
    const units = satuanBeliService.getRawItems()

    // Determine tax rate
    let ppnPersen = 11
    if (receipt.is_ppn && receipt.ppn_id) {
      const tax = taxService.getRawItems().find(t => t.id === receipt.ppn_id)
      if (tax && tax.nama) ppnPersen = tax.nama
    }

    // Determine already received qty from other PBs for this PO
    const detailRows: GoodsReceiptDetailRow[] = rawDetails.map(d => {
      const mat = materials.find(m => m.id === d.bahan_id)
      const u = units.find(unit => unit.id === d.satuan_beli_id)

      // Calculate other received qty excluding this receipt
      const otherReceived = this.calculateReceivedQtyForPoItem(
        receipt.purchase_order_id,
        d.bahan_id,
        receipt.id
      )
      const qtyPesan = d.qty_pesan || 0
      const remainingQty = Math.max(0, qtyPesan - otherReceived)
      const subtotal = calculateGoodsReceiptRowSubtotal(d.qty_terima, d.harga_satuan, d.diskon)

      return {
        row_id: `row-${d.id}-${Date.now()}`,
        id: d.id,
        bahan_id: d.bahan_id,
        kode_bahan: mat?.kode || '-',
        nama_bahan: mat?.nama || 'Unknown Bahan',
        satuan_beli_id: d.satuan_beli_id,
        nama_satuan: u?.nama || mat?.satuan_beli_nama || '-',
        stok: mat?.qty || 0,
        qty_pesan: qtyPesan,
        already_received_qty: otherReceived,
        remaining_qty: remainingQty,
        qty_terima: d.qty_terima,
        harga_satuan: d.harga_satuan,
        diskon: d.diskon,
        subtotal
      }
    })

    return {
      header: {
        id: receipt.id,
        kode: receipt.kode || '',
        purchase_order_id: receipt.purchase_order_id,
        kode_po: enriched.kode_po,
        nama_suplier: enriched.nama_suplier,
        nama_gudang: enriched.nama_gudang,
        suplier_id: enriched.suplier_id,
        no_surat_jalan: receipt.no_surat_jalan || '',
        gudang_id: receipt.gudang_id,
        tanggal: receipt.tanggal || '',
        nama_pengirim: receipt.nama_pengirim || '',
        keterangan: receipt.keterangan || '',
        is_ppn: receipt.is_ppn === 1,
        ppn_id: receipt.ppn_id,
        ppn_persen: ppnPersen,
        diskon_persen:
          receipt.subtotal && receipt.diskon
            ? Math.round((receipt.diskon / receipt.subtotal) * 100)
            : 0,
        status: receipt.status ?? 0,
        total: receipt.total || 0,
        nilai_pb: receipt.nilai_pb || 0,
        total_ppn: receipt.total_ppn || 0
      },
      details: detailRows
    }
  }

  /**
   * Helper: Calculates how much has already been received for a specific PO and material,
   * optionally excluding a specific PB ID (useful when editing).
   */
  private calculateReceivedQtyForPoItem(
    poId: number | null,
    bahanId: number | null,
    excludePbId?: number
  ): number {
    if (!poId || !bahanId) return 0

    // Find all active PBs for this PO
    const pbIds = this.receipts
      .filter(r => r.purchase_order_id === poId && r.status_aktif === 1 && r.id !== excludePbId)
      .map(r => r.id)

    let totalReceived = 0
    for (const d of this.details) {
      if (
        d.penerimaan_barang_id &&
        pbIds.includes(d.penerimaan_barang_id) &&
        d.bahan_id === bahanId
      ) {
        totalReceived += d.qty_terima || 0
      }
    }
    return totalReceived
  }

  /**
   * Returns list of approved, eligible POs for selection in Create PB form.
   */
  async getEligiblePurchaseOrders(): Promise<EligiblePurchaseOrder[]> {
    assertPermission('procurement', 'read')

    try {
      const res = await apiClient<EligiblePurchaseOrder[]>('/goods-receipts/lookups/eligible-pos')
      if (res && res.data) {
        return res.data
      }
    } catch {
      // Fallback
    }

    const orders = purchaseOrderService
      .getRawOrders()
      .filter(po => po.status === 1 && po.status_aktif === 1)
    const suppliers = supplierService.getRawItems()
    const allPoDetails = purchaseOrderService.getRawDetails()

    return orders.map(po => {
      const sup = suppliers.find(s => s.id === po.suplier_id)
      const poItems = allPoDetails.filter(d => d.purchase_order_id === po.id && d.bahan_id)

      // Check if all items in this PO have already been completely received
      let fullyReceived = poItems.length > 0
      for (const item of poItems) {
        const received = this.calculateReceivedQtyForPoItem(po.id, item.bahan_id)
        if (received < (item.qty || 0)) {
          fullyReceived = false
          break
        }
      }

      return {
        id: po.id,
        kode: po.kode || `PO-${po.id}`,
        tanggal: po.tanggal,
        suplier_id: po.suplier_id,
        nama_suplier: sup?.nama || 'Unknown Supplier',
        status: po.status,
        is_ppn: po.is_ppn,
        ppn_id: po.ppn_id,
        total: po.total,
        item_count: poItems.length,
        fully_received: fullyReceived
      }
    })
  }

  /**
   * Loads a PO's details and populates GoodsReceipt detail rows ready for receiving.
   */
  async getPoDetailsForReceipt(
    poId: number,
    currentPbId?: number
  ): Promise<{
    poHeader: {
      id: number
      kode: string
      suplier_id: number
      nama_suplier: string
      is_ppn: boolean
      ppn_id: number | null
      ppn_persen: number
    }
    rows: GoodsReceiptDetailRow[]
  }> {
    assertPermission('procurement', 'read')

    try {
      const q = currentPbId ? `?current_pb_id=${currentPbId}` : ''
      const res = await apiClient<{
        poHeader: {
          id: number
          kode: string
          suplier_id: number
          nama_suplier: string
          is_ppn: boolean
          ppn_id: number | null
          ppn_persen: number
        }
        rows: GoodsReceiptDetailRow[]
      }>(`/goods-receipts/lookups/po-details/${poId}${q}`)
      if (res && res.data) {
        return res.data
      }
    } catch {
      // Fallback
    }

    const po = purchaseOrderService.getRawOrders().find(p => p.id === poId)
    if (!po) {
      throw new Error(`Purchase Order #${poId} tidak ditemukan.`)
    }

    const suppliers = supplierService.getRawItems()
    const sup = suppliers.find(s => s.id === po.suplier_id)
    const materials = materialService.getRawItems()
    const units = satuanBeliService.getRawItems()
    const taxes = taxService.getRawItems()

    let ppnPersen = 11
    if (po.is_ppn && po.ppn_id) {
      const tax = taxes.find(t => t.id === po.ppn_id)
      if (tax?.nama) ppnPersen = tax.nama
    }

    const poItems = purchaseOrderService
      .getRawDetails()
      .filter(d => d.purchase_order_id === poId && d.bahan_id)

    const rows: GoodsReceiptDetailRow[] = poItems.map((item, idx) => {
      const mat = materials.find(m => m.id === item.bahan_id)
      const itemSatuanId = item.satuan_beli_id || mat?.satuan_beli_id || null
      const u = units.find(unit => unit.id === itemSatuanId)

      const alreadyReceived = this.calculateReceivedQtyForPoItem(poId, item.bahan_id, currentPbId)
      const qtyPesan = item.qty || 0
      const remainingQty = Math.max(0, qtyPesan - alreadyReceived)
      const qtyTerima = remainingQty
      const hargaSatuan = item.harga || 0
      const diskon = item.diskon || 0
      const subtotal = calculateGoodsReceiptRowSubtotal(qtyTerima, hargaSatuan, diskon)

      return {
        row_id: `po-row-${idx}-${Date.now()}`,
        bahan_id: item.bahan_id,
        kode_bahan: mat?.kode || '-',
        nama_bahan: mat?.nama || 'Unknown Bahan',
        satuan_beli_id: itemSatuanId,
        nama_satuan: u?.nama || mat?.satuan_beli_nama || '-',
        stok: mat?.qty || 0,
        qty_pesan: qtyPesan,
        already_received_qty: alreadyReceived,
        remaining_qty: remainingQty,
        qty_terima: qtyTerima,
        harga_satuan: hargaSatuan,
        diskon: diskon,
        subtotal
      }
    })

    return {
      poHeader: {
        id: po.id,
        kode: po.kode || `PO-${po.id}`,
        suplier_id: po.suplier_id || 0,
        nama_suplier: sup?.nama || '-',
        is_ppn: po.is_ppn === 1,
        ppn_id: po.ppn_id,
        ppn_persen: ppnPersen
      },
      rows
    }
  }

  /**
   * Create new Goods Receipt with atomic snapshot rollback
   */
  async create(payload: GoodsReceiptCreatePayload): Promise<{
    header: GoodsReceiptListItem
    details: GoodsReceiptDetail[]
  }> {
    assertPermission('procurement', 'create')

    // 1. Try real backend API
    try {
      const res = await apiClient<{
        header: GoodsReceiptListItem
        details: GoodsReceiptDetail[]
      }>('/goods-receipts', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      if (res && res.data) {
        return res.data
      }
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR') {
        throw err
      }
    }

    // Snapshot state for atomic rollback in fallback mock
    const snapshotReceipts = JSON.parse(JSON.stringify(this.receipts))
    const snapshotDetails = JSON.parse(JSON.stringify(this.details))

    try {
      if (!payload.header.kode?.trim()) {
        throw new Error('Kode Penerimaan Barang wajib diisi.')
      }
      if (!payload.header.purchase_order_id) {
        throw new Error('Purchase Order wajib dipilih.')
      }
      if (!payload.header.no_surat_jalan?.trim()) {
        throw new Error('Nomor Surat Jalan wajib diisi.')
      }
      if (!payload.header.gudang_id) {
        throw new Error('Gudang penerimaan wajib dipilih.')
      }
      if (!payload.details || payload.details.length === 0) {
        throw new Error('Penerimaan barang harus memiliki setidaknya satu item bahan.')
      }

      // Check duplicate kode
      if (
        this.receipts.some(
          r =>
            r.kode?.toLowerCase() === payload.header.kode.trim().toLowerCase() &&
            r.status_aktif === 1
        )
      ) {
        throw new Error(`Kode Penerimaan Barang "${payload.header.kode}" sudah terdaftar.`)
      }

      // Validate quantities against PO remaining
      for (const item of payload.details) {
        const otherReceived = this.calculateReceivedQtyForPoItem(
          payload.header.purchase_order_id,
          item.bahan_id
        )
        const remaining = Math.max(0, item.qty_pesan - otherReceived)
        if (item.qty_terima < 0) {
          throw new Error('Qty Terima tidak boleh bernilai negatif.')
        }
        if (item.qty_terima > remaining) {
          throw new Error(`Qty Terima (${item.qty_terima}) melebihi sisa pesanan (${remaining}).`)
        }
      }

      const newId = this.receipts.length > 0 ? Math.max(...this.receipts.map(r => r.id)) + 1 : 1
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

      const newReceipt: GoodsReceipt = {
        id: newId,
        kode: payload.header.kode.trim(),
        purchase_order_id: payload.header.purchase_order_id,
        no_surat_jalan: payload.header.no_surat_jalan.trim(),
        gudang_id: payload.header.gudang_id,
        tanggal: payload.header.tanggal,
        nama_pengirim: payload.header.nama_pengirim || null,
        keterangan: payload.header.keterangan || null,
        status: payload.header.status ?? 1,
        created_at: nowStr,
        created_by: 1,
        updated_at: nowStr,
        updated_by: 1,
        status_aktif: 1,
        total_pembayaran: 0.0,
        nilai_pb: payload.header.nilai_pb,
        is_ppn: payload.header.is_ppn,
        ppn_id: payload.header.ppn_id || null,
        subtotal: payload.header.subtotal,
        diskon: payload.header.diskon,
        total: payload.header.total,
        total_ppn: payload.header.total_ppn,
        uuid: `pb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }

      this.receipts.unshift(newReceipt)

      let detailIdCounter =
        this.details.length > 0 ? Math.max(...this.details.map(d => d.id)) + 1 : 1
      const createdDetails: GoodsReceiptDetail[] = []

      for (const item of payload.details) {
        const detailRecord: GoodsReceiptDetail = {
          id: detailIdCounter++,
          penerimaan_barang_id: newId,
          bahan_id: item.bahan_id,
          qty_pesan: item.qty_pesan,
          qty_terima: item.qty_terima,
          satuan_beli_id: item.satuan_beli_id,
          harga_satuan: item.harga_satuan,
          diskon: item.diskon
        }
        this.details.push(detailRecord)
        createdDetails.push(detailRecord)
      }

      // Post stock atomically when PB is confirmed (status = 1)
      if (newReceipt.status === 1) {
        await stockPostingService.postGoodsReceipt(newId)
      }

      return {
        header: this.enrichReceipt(newReceipt),
        details: createdDetails
      }
    } catch (err) {
      this.receipts = snapshotReceipts
      this.details = snapshotDetails
      throw err
    }
  }

  /**
   * Update existing Goods Receipt with atomic rollback
   */
  async update(
    id: number,
    payload: GoodsReceiptUpdatePayload
  ): Promise<{
    header: GoodsReceiptListItem
    details: GoodsReceiptDetail[]
  }> {
    assertPermission('procurement', 'update')

    try {
      const res = await apiClient<{
        header: GoodsReceiptListItem
        details: GoodsReceiptDetail[]
      }>(`/goods-receipts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      if (res && res.data) {
        return res.data
      }
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR') {
        throw err
      }
    }

    const snapshotReceipts = JSON.parse(JSON.stringify(this.receipts))
    const snapshotDetails = JSON.parse(JSON.stringify(this.details))

    try {
      const index = this.receipts.findIndex(r => r.id === Number(id))
      if (index === -1) {
        throw new Error(`Penerimaan Barang #${id} tidak ditemukan.`)
      }

      const current = this.receipts[index]

      // Check duplicate kode if modified
      if (payload.header?.kode && payload.header.kode !== current.kode) {
        if (
          this.receipts.some(
            r =>
              r.id !== Number(id) &&
              r.kode?.toLowerCase() === payload.header?.kode?.trim().toLowerCase() &&
              r.status_aktif === 1
          )
        ) {
          throw new Error(`Kode Penerimaan Barang "${payload.header.kode}" sudah terdaftar.`)
        }
      }

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

      const updatedReceipt: GoodsReceipt = {
        ...current,
        ...(payload.header as Partial<GoodsReceipt>),
        updated_at: nowStr,
        updated_by: 1
      }
      this.receipts[index] = updatedReceipt

      // Replace details
      if (payload.details && payload.details.length > 0) {
        this.details = this.details.filter(d => d.penerimaan_barang_id !== Number(id))

        let detailIdCounter =
          this.details.length > 0 ? Math.max(...this.details.map(d => d.id)) + 1 : 1
        for (const item of payload.details) {
          const detailRecord: GoodsReceiptDetail = {
            id: item.id || detailIdCounter++,
            penerimaan_barang_id: Number(id),
            bahan_id: item.bahan_id,
            qty_pesan: item.qty_pesan,
            qty_terima: item.qty_terima,
            satuan_beli_id: item.satuan_beli_id,
            harga_satuan: item.harga_satuan,
            diskon: item.diskon
          }
          this.details.push(detailRecord)
        }
      }

      return {
        header: this.enrichReceipt(updatedReceipt),
        details: this.details.filter(d => d.penerimaan_barang_id === Number(id))
      }
    } catch (err) {
      this.receipts = snapshotReceipts
      this.details = snapshotDetails
      throw err
    }
  }

  /**
   * Delete / Cancel Goods Receipt
   */
  async delete(id: number, reason?: string): Promise<boolean> {
    assertPermission('procurement', 'delete')

    try {
      await apiClient(`/goods-receipts/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'Dibatalkan oleh pengguna' })
      })
      const r = this.receipts.find(item => item.id === Number(id))
      if (r) r.status_aktif = 0
      return true
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR') {
        throw err
      }
    }

    const index = this.receipts.findIndex(r => r.id === Number(id))
    if (index === -1) {
      throw new Error(`Penerimaan Barang #${id} tidak ditemukan.`)
    }

    // Soft-delete
    this.receipts[index].status_aktif = 0
    this.receipts[index].updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)

    // Reversal in Task 8: reverse stock if it was posted
    await stockPostingService.reverseGoodsReceipt(Number(id))

    return true
  }

  /**
   * Finalize Goods Receipt (Draft status 0 -> Final status 1)
   */
  async finalize(id: number): Promise<boolean> {
    assertPermission('procurement', 'update')

    try {
      await apiClient(`/goods-receipts/${id}/finalize`, { method: 'POST' })
      const r = this.receipts.find(item => item.id === Number(id))
      if (r) {
        r.status = 1
      }
      return true
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR') {
        throw err
      }
    }

    const receipt = this.receipts.find(r => r.id === Number(id))
    if (!receipt) {
      throw new Error(`Penerimaan Barang #${id} tidak ditemukan.`)
    }
    if (receipt.status === 1) {
      return true
    }

    receipt.status = 1
    receipt.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)
    await stockPostingService.postGoodsReceipt(Number(id))
    return true
  }

  /**
   * Generates a new unique PB code based on template
   */
  async generateCode(dateStr?: string): Promise<string> {
    try {
      const q = dateStr ? `?tanggal=${encodeURIComponent(dateStr)}` : ''
      const res = await apiClient<{ kode?: string; code?: string }>(`/goods-receipts/generate-code${q}`)
      const generated = res?.data?.kode || res?.data?.code
      if (generated) {
        return generated
      }
    } catch {
      // Fallback
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date()
    const validDate = isNaN(targetDate.getTime()) ? new Date() : targetDate
    const yearShort = validDate.getFullYear().toString().slice(-2)
    const monthPadded = String(validDate.getMonth() + 1).padStart(2, '0')
    const prefix = `PB/${yearShort}${monthPadded}`

    const count = this.receipts.filter(r => r.kode?.startsWith(prefix)).length
    const seq = String(count + 1).padStart(4, '0')
    return `${prefix}-${seq}`
  }

  /**
   * Preview code based on template string without modifying sequence
   */
  async previewCode(templateStr?: string, dateStr?: string): Promise<string> {
    try {
      let t = templateStr || this.currentTemplate
      if (t.startsWith('PBA/')) t = 'PB/' + t.slice(4)
      const q = `?template=${encodeURIComponent(t)}${dateStr ? '&tanggal=' + encodeURIComponent(dateStr) : ''}`
      const res = await apiClient<{ preview: string }>(`/goods-receipts/preview-code${q}`)
      if (res && res.data && res.data.preview) {
        return res.data.preview
      }
    } catch {
      // Fallback
    }

    let template = templateStr || this.currentTemplate
    if (template.startsWith('PBA/')) template = 'PB/' + template.slice(4)
    const d = dateStr ? new Date(dateStr) : new Date()
    const validDate = isNaN(d.getTime()) ? new Date() : d

    const yearFull = validDate.getFullYear().toString()
    const yearShort = yearFull.slice(-2)
    const monthPadded = (validDate.getMonth() + 1).toString().padStart(2, '0')
    const dayPadded = validDate.getDate().toString().padStart(2, '0')
    const dateFormatted = `${dayPadded}-${monthPadded}-${yearShort}`

    return template
      .replace(/\{YEAR\}/g, yearFull)
      .replace(/\{year\}/g, yearShort)
      .replace(/\{month\}/g, monthPadded)
      .replace(/\{date_of_month\}/g, dayPadded)
      .replace(/\{date\}/g, dateFormatted)
      .replace(/\{rand\}/g, '1234')
      .replace(/\{last_number\}/g, '0001')
  }

  /**
   * Get Setting Table Configuration for PB code formatting
   */
  async getSettingTable(): Promise<GoodsReceiptCodeSettingResponse> {
    try {
      const res = await apiClient<GoodsReceiptCodeSettingResponse>('/goods-receipts/setting-table')
      if (res && res.data) {
        let tmpl = res.data.template
        if (tmpl.startsWith('PBA/')) tmpl = 'PB/' + tmpl.slice(4)
        this.currentTemplate = tmpl
        return {
          ...res.data,
          template: tmpl,
          preview: res.data.preview?.startsWith('PBA/') ? 'PB/' + res.data.preview.slice(4) : res.data.preview
        }
      }
    } catch {
      // Fallback
    }

    return {
      template: this.currentTemplate,
      preview: await this.previewCode(this.currentTemplate),
      supported_placeholders: [
        { token: '{last_number}', description: 'Nomor urut otomatis 4 digit', example: '0001' },
        { token: '{year}', description: '2-digit tahun transaksi', example: '26' },
        { token: '{YEAR}', description: '4-digit tahun transaksi', example: '2026' },
        { token: '{month}', description: '2-digit bulan transaksi (01–12)', example: '11' },
        { token: '{date_of_month}', description: '2-digit tanggal dalam bulan (01–31)', example: '18' },
        { token: '{date}', description: 'Tanggal lengkap transaksi (DD-MM-YY)', example: '18-11-26' },
        { token: '{rand}', description: 'Angka acak 4 digit', example: '4821' }
      ]
    }
  }

  /**
   * Update Setting Table Configuration for PB
   */
  async updateSettingTable(template: string): Promise<GoodsReceiptCodeSettingResponse> {
    assertPermission('procurement', 'update')

    let clean = template.trim()
    if (clean.startsWith('PBA/')) clean = 'PB/' + clean.slice(4)

    try {
      const res = await apiClient<GoodsReceiptCodeSettingResponse>('/goods-receipts/setting-table', {
        method: 'PUT',
        body: JSON.stringify({ template: clean })
      })
      if (res && res.data) {
        let tmpl = res.data.template
        if (tmpl.startsWith('PBA/')) tmpl = 'PB/' + tmpl.slice(4)
        this.currentTemplate = tmpl
        return {
          ...res.data,
          template: tmpl,
          preview: res.data.preview?.startsWith('PBA/') ? 'PB/' + res.data.preview.slice(4) : res.data.preview
        }
      }
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR') {
        throw err
      }
    }

    this.currentTemplate = clean
    return {
      template: this.currentTemplate,
      preview: await this.previewCode(this.currentTemplate),
      supported_placeholders: [
        { token: '{last_number}', description: 'Nomor urut otomatis 4 digit', example: '0001' },
        { token: '{year}', description: '2-digit tahun transaksi', example: '26' },
        { token: '{YEAR}', description: '4-digit tahun transaksi', example: '2026' },
        { token: '{month}', description: '2-digit bulan transaksi (01–12)', example: '11' },
        { token: '{date_of_month}', description: '2-digit tanggal dalam bulan (01–31)', example: '18' },
        { token: '{date}', description: 'Tanggal lengkap transaksi (DD-MM-YY)', example: '18-11-26' },
        { token: '{rand}', description: 'Angka acak 4 digit', example: '4821' }
      ]
    }
  }

  // Lookup helpers
  async getWarehouses(): Promise<Array<{ id: number; nama: string; kode?: string }>> {
    try {
      const res = await apiClient<Array<{ id: number; nama: string; kode?: string }>>('/goods-receipts/lookups/warehouses')
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data
      }
    } catch {
      // Fallback
    }

    try {
      const resGudang = await apiClient<any>('/master/gudang')
      const items = Array.isArray(resGudang?.data) ? resGudang.data : (resGudang?.data?.rows || [])
      if (items.length > 0) {
        return items
          .filter((w: any) => w.status === 1)
          .map((w: any) => ({ id: w.id, nama: w.nama || '', kode: w.kode ?? undefined }))
      }
    } catch {
      // Fallback
    }

    return warehouseService.getRawItems().map(w => ({ id: w.id, nama: w.nama || '', kode: w.kode ?? undefined }))
  }

  async getSuppliers(): Promise<Array<{ id: number; nama: string }>> {
    return supplierService.getRawItems().map(s => ({ id: s.id, nama: s.nama || '' }))
  }

  getRawReceipts(): GoodsReceipt[] {
    return this.receipts
  }

  getRawDetails(): GoodsReceiptDetail[] {
    return this.details
  }
}

export const goodsReceiptService = new GoodsReceiptService()
