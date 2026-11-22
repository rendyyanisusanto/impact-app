import { apiClient } from '@/shared/services/api-client'
import type { PaginatedResponse } from '@/shared/types/crud.types'
import type {
  PurchaseOrder,
  PurchaseOrderDetail,
  PurchaseOrderListItem,
  PurchaseOrderDetailRow,
  PurchaseOrderCreatePayload,
  PurchaseOrderUpdatePayload,
  PurchaseOrderFilters,
  StatusTransaksi,
  PurchaseOrderCodeSettingResponse
} from '../types/purchase-order.types'
import {
  INITIAL_MOCK_PURCHASE_ORDERS,
  INITIAL_MOCK_PURCHASE_ORDER_DETAILS,
  MOCK_STATUS_TRANSAKSI
} from '../mocks/purchase-orders.mock'
import { supplierService } from '@/modules/procurement/suppliers/services/supplier.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { satuanBeliService } from '@/modules/settings/units/services/unit.service'
import { taxService } from '@/modules/settings/tax/services/tax.service'
import { assertPermission } from '@/shared/services/service-guard'
import {
  calculateRowSubtotal,
  calculateDocumentSummary
} from '../utils/purchase-order-calculations'

export class PurchaseOrderService {
  private orders: PurchaseOrder[] = []
  private details: PurchaseOrderDetail[] = []
  private currentTemplate: string = 'PO/{last_number}'

  constructor() {
    this.reset()
  }

  reset(): void {
    this.orders = JSON.parse(JSON.stringify(INITIAL_MOCK_PURCHASE_ORDERS))
    this.details = JSON.parse(JSON.stringify(INITIAL_MOCK_PURCHASE_ORDER_DETAILS))
  }

  /**
   * Helper to resolve presentation names (supplier, status transaksi, status label, item count)
   */
  private enrichOrder(order: PurchaseOrder): PurchaseOrderListItem {
    // 1. Resolve Supplier name
    let suplierNama = 'Unknown Supplier'
    if (order.suplier_id) {
      const sup = supplierService.getRawItems().find(s => s.id === order.suplier_id)
      if (sup) suplierNama = sup.nama
    }

    // 2. Resolve Status Transaksi
    const st = MOCK_STATUS_TRANSAKSI.find(s => s.id === order.status_transaksi_id)
    const statusTransaksiNama = st ? st.status_transaksi : 'CASH'

    // 3. Resolve Business Status: 0 = Draft, 1 = Disetujui
    const statusLabel = order.status === 1 ? 'Disetujui' : 'Draft'

    // 4. Resolve Active Status: 1 = Aktif, 0 = Dibatalkan
    const statusAktifLabel = order.status_aktif === 1 ? 'Aktif' : 'Dibatalkan'

    // 5. Count items
    const itemCount = this.details.filter(d => d.purchase_order_id === order.id).length

    // 6. Tax percentage
    let ppnPersen = 0
    if (order.is_ppn) {
      if (order.ppn_id) {
        const tax = taxService.getRawItems().find(t => t.id === order.ppn_id)
        if (tax && tax.nama) ppnPersen = tax.nama
      } else {
        ppnPersen = 11
      }
    }

    return {
      ...order,
      suplier_nama: suplierNama,
      status_transaksi_nama: statusTransaksiNama,
      status_label: statusLabel,
      status_aktif_label: statusAktifLabel,
      ppn_persen: ppnPersen,
      items_count: itemCount
    }
  }

  /**
   * List Purchase Orders with sorting, pagination, and multi-field filters
   */
  async list(filters?: PurchaseOrderFilters): Promise<PaginatedResponse<PurchaseOrderListItem>> {
    assertPermission('procurement', 'read')

    // 1. Try real backend API
    try {
      const q = new URLSearchParams()
      if (filters?.search) q.append('search', String(filters.search))
      if (filters?.suplier_id) q.append('suplier_id', String(filters.suplier_id))
      if (filters?.status_transaksi_id) q.append('status_transaksi_id', String(filters.status_transaksi_id))
      if (filters?.status !== undefined && filters?.status !== null && filters?.status !== -1) {
        q.append('status', String(filters.status))
      }
      if (filters?.status_aktif !== undefined && filters?.status_aktif !== null) {
        q.append('status_aktif', String(filters.status_aktif))
      }
      if (filters?.startDate) q.append('startDate', filters.startDate)
      if (filters?.endDate) q.append('endDate', filters.endDate)
      if (filters?.page) q.append('page', String(filters.page))
      const perPage = filters?.pageSize || filters?.perPage
      if (perPage) q.append('limit', String(perPage))
      if (filters?.sortField) q.append('sortBy', String(filters.sortField))
      if (filters?.sortOrder) q.append('sortOrder', String(filters.sortOrder))

      const res = await apiClient<PurchaseOrderListItem[]>(`/purchase-orders?${q.toString()}`)
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

    let filtered = [...this.orders]

    // By default, show active documents (status_aktif: 1) unless explicitly filtered
    if (filters?.status_aktif !== undefined && filters?.status_aktif !== null) {
      filtered = filtered.filter(o => o.status_aktif === Number(filters.status_aktif))
    }

    // Filter by search query (kode, keterangan, supplier)
    if (typeof filters?.search === 'string' && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      filtered = filtered.filter(o => {
        const kodeMatch = o.kode?.toLowerCase().includes(q)
        const ketMatch = o.keterangan?.toLowerCase().includes(q)
        const sup = supplierService.getRawItems().find(s => s.id === o.suplier_id)
        const supMatch = sup?.nama?.toLowerCase().includes(q)
        return kodeMatch || ketMatch || supMatch
      })
    }

    // Filter by Supplier
    if (filters?.suplier_id) {
      filtered = filtered.filter(o => o.suplier_id === Number(filters.suplier_id))
    }

    // Filter by Status Transaksi
    if (filters?.status_transaksi_id) {
      filtered = filtered.filter(o => o.status_transaksi_id === Number(filters.status_transaksi_id))
    }

    // Filter by Status (0 = Draft, 1 = Disetujui)
    if (filters?.status !== undefined && filters?.status !== null && filters?.status !== -1) {
      filtered = filtered.filter(o => o.status === Number(filters.status))
    }

    // Filter by Date Range
    if (filters?.startDate) {
      filtered = filtered.filter(o => (o.tanggal ? o.tanggal >= filters.startDate! : false))
    }
    if (filters?.endDate) {
      filtered = filtered.filter(o => (o.tanggal ? o.tanggal <= filters.endDate! : false))
    }

    // Sorting
    const sortField = (filters?.sortField || 'tanggal') as keyof PurchaseOrder
    const sortOrder = filters?.sortOrder || 'desc'

    filtered.sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]

      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      let comp = 0
      if (typeof valA === 'number' && typeof valB === 'number') {
        comp = valA - valB
      } else {
        comp = String(valA).localeCompare(String(valB))
      }
      return sortOrder === 'asc' ? comp : -comp
    })

    const total = filtered.length
    const page = Math.max(1, Number(filters?.page) || 1)
    const perPage = Math.max(1, Number(filters?.pageSize || filters?.perPage) || 10)
    const start = (page - 1) * perPage
    const end = start + perPage
    const paged = filtered.slice(start, end)

    const data = paged.map(o => this.enrichOrder(o))

    return {
      data,
      total,
      page,
      pageSize: perPage,
      totalPages: Math.ceil(total / perPage) || 1
    }
  }

  /**
   * Get PO header and its resolved detail rows by PO ID
   */
  async getById(id: number): Promise<{
    header: PurchaseOrderListItem
    details: PurchaseOrderDetailRow[]
  }> {
    assertPermission('procurement', 'read')

    try {
      const res = await apiClient<{
        header: PurchaseOrderListItem
        details: PurchaseOrderDetailRow[]
      }>(`/purchase-orders/${id}`)
      if (res && res.data) {
        return res.data
      }
    } catch {
      // Fallback
    }

    const order = this.orders.find(o => o.id === Number(id))
    if (!order) {
      throw new Error(`Purchase Order dengan ID '${id}' tidak ditemukan.`)
    }

    const orderDetails = this.details.filter(d => d.purchase_order_id === Number(id))

    // Resolve materials and units for spreadsheet display
    const rawMaterials = materialService.getRawItems()
    const rawUnits = satuanBeliService.getRawItems()

    const detailRows: PurchaseOrderDetailRow[] = orderDetails.map(d => {
      const mat = rawMaterials.find(m => m.id === d.bahan_id)
      const unit = rawUnits.find(u => u.id === d.satuan_beli_id)

      const calculatedSub = calculateRowSubtotal(d.qty, d.harga, d.diskon)

      return {
        row_id: `row-${d.id}-${Math.random().toString(36).slice(2, 7)}`,
        id: d.id,
        bahan_id: d.bahan_id,
        nama_bahan: mat?.nama || `Bahan #${d.bahan_id}`,
        satuan_beli_id: d.satuan_beli_id,
        nama_satuan: unit?.nama || mat?.satuan_beli_nama || '-',
        stok: mat?.qty ?? 0,
        qty: d.qty,
        harga: d.harga,
        diskon: d.diskon,
        subtotal: calculatedSub,
        keterangan: d.keterangan || ''
      }
    })

    return {
      header: this.enrichOrder(order),
      details: detailRows
    }
  }

  /**
   * Atomic Create Purchase Order & its Details
   */
  async create(payload: PurchaseOrderCreatePayload): Promise<{
    header: PurchaseOrder
    details: PurchaseOrderDetail[]
  }> {
    assertPermission('procurement', 'create')

    try {
      const res = await apiClient<{
        header: PurchaseOrder
        details: PurchaseOrderDetail[]
      }>('/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      if (res && res.data) {
        // Update in-memory snapshot for reactive UI
        this.orders.unshift(res.data.header)
        return res.data
      }
    } catch (err: any) {
      // If server error, throw so caller displays error toast
      if (err?.code !== 'NETWORK_ERROR') {
        throw err
      }
    }

    const orderSnapshot = JSON.parse(JSON.stringify(this.orders))
    const detailSnapshot = JSON.parse(JSON.stringify(this.details))

    try {
      // 1. Validation pass on payload
      if (!payload.header.kode?.trim()) {
        throw new Error('Kode PO wajib diisi.')
      }
      if (!payload.header.suplier_id) {
        throw new Error('Supplier wajib dipilih.')
      }
      if (!payload.header.tanggal?.trim()) {
        throw new Error('Tanggal PO wajib diisi.')
      }
      if (!payload.details || payload.details.length === 0) {
        throw new Error('Minimal harus menambahkan satu bahan pada detail Purchase Order.')
      }

      for (let i = 0; i < payload.details.length; i++) {
        const item = payload.details[i]
        if (!item.bahan_id) {
          throw new Error(`Item baris ke-${i + 1}: Bahan wajib dipilih.`)
        }
        if (!item.qty || item.qty <= 0) {
          throw new Error(`Item baris ke-${i + 1}: Qty harus lebih besar dari 0.`)
        }
        if (item.harga === undefined || item.harga === null || item.harga < 0) {
          throw new Error(`Item baris ke-${i + 1}: Harga tidak boleh negatif.`)
        }
      }

      // 2. Generate new primary key
      const newOrderId = this.orders.length > 0 ? Math.max(...this.orders.map(o => o.id)) + 1 : 52
      const uuid =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `uuid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

      // 3. Recalculate document summary for server-side integrity
      const summary = calculateDocumentSummary(payload.details, payload.header.is_ppn === 1, 11, 0)

      const newOrder: PurchaseOrder = {
        id: newOrderId,
        kode: payload.header.kode.trim(),
        suplier_id: Number(payload.header.suplier_id),
        tanggal: payload.header.tanggal,
        keterangan: payload.header.keterangan || '',
        is_ppn: payload.header.is_ppn,
        ppn_id: payload.header.ppn_id ?? (payload.header.is_ppn ? 1 : null),
        subtotal: summary.subtotal,
        diskon: payload.header.diskon ?? 0,
        total_ppn: summary.total_ppn,
        total: payload.header.total ?? summary.total,
        status: payload.header.status ?? 0,
        status_aktif: 1,
        status_transaksi_id: Number(payload.header.status_transaksi_id || 1),
        uuid,
        created_at: now,
        created_by: 1,
        updated_at: null,
        updated_by: null
      }

      // 4. Create detail records
      let nextDetailId =
        this.details.length > 0 ? Math.max(...this.details.map(d => d.id)) + 1 : 125
      const createdDetails: PurchaseOrderDetail[] = []

      for (const item of payload.details) {
        const rowSubtotal = calculateRowSubtotal(item.qty, item.harga, item.diskon)
        const newDetail: PurchaseOrderDetail = {
          id: nextDetailId++,
          purchase_order_id: newOrderId,
          bahan_id: Number(item.bahan_id),
          qty: Number(item.qty),
          satuan_beli_id: item.satuan_beli_id ? Number(item.satuan_beli_id) : 1,
          harga: Number(item.harga),
          diskon: item.diskon ? Number(item.diskon) : 0,
          subtotal: rowSubtotal,
          keterangan: item.keterangan || null
        }
        createdDetails.push(newDetail)
      }

      // Commit to memory
      this.orders.unshift(newOrder)
      this.details.push(...createdDetails)

      return {
        header: newOrder,
        details: createdDetails
      }
    } catch (err) {
      this.orders = orderSnapshot
      this.details = detailSnapshot
      throw err
    }
  }

  /**
   * Atomic Update Purchase Order & its Details
   */
  async update(
    id: number,
    payload: PurchaseOrderUpdatePayload
  ): Promise<{
    header: PurchaseOrder
    details: PurchaseOrderDetail[]
  }> {
    assertPermission('procurement', 'update')

    try {
      const res = await apiClient<{
        header: PurchaseOrder
        details: PurchaseOrderDetail[]
      }>(`/purchase-orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      if (res && res.data) {
        const idx = this.orders.findIndex(o => o.id === Number(id))
        if (idx !== -1) {
          this.orders[idx] = res.data.header
        }
        return res.data
      }
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR') {
        throw err
      }
    }

    const orderSnapshot = JSON.parse(JSON.stringify(this.orders))
    const detailSnapshot = JSON.parse(JSON.stringify(this.details))

    try {
      const index = this.orders.findIndex(o => o.id === Number(id))
      if (index === -1) {
        throw new Error(`Purchase Order dengan ID '${id}' tidak ditemukan.`)
      }

      if (!payload.details || payload.details.length === 0) {
        throw new Error('Minimal harus menambahkan satu bahan pada detail Purchase Order.')
      }

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

      // Recalculate summary
      const summary = calculateDocumentSummary(payload.details, payload.header.is_ppn === 1, 11, 0)

      const existing = this.orders[index]
      const updatedOrder: PurchaseOrder = {
        ...existing,
        kode: payload.header.kode.trim(),
        suplier_id: Number(payload.header.suplier_id),
        tanggal: payload.header.tanggal,
        keterangan: payload.header.keterangan || '',
        is_ppn: payload.header.is_ppn,
        ppn_id: payload.header.ppn_id ?? (payload.header.is_ppn ? 1 : null),
        subtotal: summary.subtotal,
        diskon: payload.header.diskon ?? 0,
        total_ppn: summary.total_ppn,
        total: payload.header.total ?? summary.total,
        status: payload.header.status ?? existing.status,
        status_transaksi_id: Number(payload.header.status_transaksi_id || 1),
        updated_at: now,
        updated_by: 1
      }

      // Remove previous details and insert new ones
      this.details = this.details.filter(d => d.purchase_order_id !== Number(id))

      let nextDetailId =
        this.details.length > 0 ? Math.max(...this.details.map(d => d.id)) + 1 : 125
      const updatedDetails: PurchaseOrderDetail[] = []

      for (const item of payload.details) {
        const rowSubtotal = calculateRowSubtotal(item.qty, item.harga, item.diskon)
        const detailRecord: PurchaseOrderDetail = {
          id: nextDetailId++,
          purchase_order_id: Number(id),
          bahan_id: Number(item.bahan_id),
          qty: Number(item.qty),
          satuan_beli_id: item.satuan_beli_id ? Number(item.satuan_beli_id) : 1,
          harga: Number(item.harga),
          diskon: item.diskon ? Number(item.diskon) : 0,
          subtotal: rowSubtotal,
          keterangan: item.keterangan || null
        }
        updatedDetails.push(detailRecord)
      }

      this.orders[index] = updatedOrder
      this.details.push(...updatedDetails)

      return {
        header: updatedOrder,
        details: updatedDetails
      }
    } catch (err) {
      this.orders = orderSnapshot
      this.details = detailSnapshot
      throw err
    }
  }

  /**
   * Soft-delete or cancel Purchase Order
   */
  async delete(id: number): Promise<boolean> {
    assertPermission('procurement', 'delete')

    try {
      await apiClient(`/purchase-orders/${id}/cancel`, { method: 'POST' })
      const order = this.orders.find(o => o.id === Number(id))
      if (order) {
        order.status_aktif = 0
      }
      return true
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR') {
        throw err
      }
    }

    const index = this.orders.findIndex(o => o.id === Number(id))
    if (index === -1) {
      throw new Error(`Purchase Order dengan ID '${id}' tidak ditemukan.`)
    }

    const order = this.orders[index]
    if (order.status === 1) {
      throw new Error('Purchase Order yang sudah disetujui tidak dapat dihapus.')
    }

    order.status_aktif = 0
    order.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)

    return true
  }

  /**
   * Approve Purchase Order
   */
  async approve(id: number): Promise<boolean> {
    assertPermission('procurement', 'update')

    try {
      await apiClient(`/purchase-orders/${id}/approve`, { method: 'POST' })
      const order = this.orders.find(o => o.id === Number(id))
      if (order) {
        order.status = 1
      }
      return true
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR') {
        throw err
      }
    }

    const order = this.orders.find(o => o.id === Number(id))
    if (order) {
      order.status = 1
      return true
    }
    return false
  }

  /**
   * Generates a unique, standardized PO code
   */
  async generateCode(dateStr?: string): Promise<string> {
    try {
      const q = dateStr ? `?tanggal=${encodeURIComponent(dateStr)}` : ''
      const res = await apiClient<{ kode: string }>(`/purchase-orders/generate-code${q}`)
      if (res && res.data && res.data.kode) {
        return res.data.kode
      }
    } catch {
      // Fallback
    }

    const d = dateStr ? new Date(dateStr) : new Date()
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(-2)

    const rand = Math.floor(1000 + Math.random() * 9000)
    return `PO/${dd}-${mm}-${yy}-${rand}`
  }

  /**
   * Preview code based on template string without modifying sequence
   */
  async previewCode(templateStr?: string, dateStr?: string): Promise<string> {
    try {
      const t = templateStr || this.currentTemplate
      const q = `?template=${encodeURIComponent(t)}${dateStr ? '&tanggal=' + encodeURIComponent(dateStr) : ''}`
      const res = await apiClient<{ preview: string }>(`/purchase-orders/preview-code${q}`)
      if (res && res.data && res.data.preview) {
        return res.data.preview
      }
    } catch {
      // Fallback
    }

    const template = templateStr || this.currentTemplate
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
   * Get Setting Table Configuration
   */
  async getSettingTable(): Promise<PurchaseOrderCodeSettingResponse> {
    try {
      const res = await apiClient<PurchaseOrderCodeSettingResponse>('/purchase-orders/setting-table')
      if (res && res.data) {
        this.currentTemplate = res.data.template
        return res.data
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
   * Update Setting Table Configuration
   */
  async updateSettingTable(template: string): Promise<PurchaseOrderCodeSettingResponse> {
    assertPermission('procurement', 'update')

    try {
      const res = await apiClient<PurchaseOrderCodeSettingResponse>('/purchase-orders/setting-table', {
        method: 'PUT',
        body: JSON.stringify({ template })
      })
      if (res && res.data) {
        this.currentTemplate = res.data.template
        return res.data
      }
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR') {
        throw err
      }
    }

    this.currentTemplate = template.trim()
    return this.getSettingTable()
  }

  /**
   * Lookups for dropdowns and pickers
   */
  async getSuppliers(): Promise<Array<{ id: number; nama: string; kode?: string }>> {
    try {
      const res = await apiClient<Array<{ id: number; nama: string; kode?: string }>>('/purchase-orders/lookups/suppliers')
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data
      }
    } catch {
      // Fallback
    }

    const items = supplierService.getRawItems()
    return items
      .filter(s => s.status === 1)
      .map(s => ({ id: s.id, nama: s.nama || 'Supplier', kode: s.kode || undefined }))
  }

  async getMaterials(): Promise<
    Array<{
      id: number
      kode: string
      nama: string
      qty: number
      satuan_beli_id: number | null
      satuan_beli_nama?: string
      harga_satuan: number | null
    }>
  > {
    try {
      const res = await apiClient<any[]>('/purchase-orders/lookups/materials')
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data
      }
    } catch {
      // Fallback
    }

    const items = materialService.getRawItems()
    return items
      .filter(m => m.status === 1)
      .map(m => ({
        id: m.id,
        kode: m.kode || `MAT-${m.id}`,
        nama: m.nama || `Bahan #${m.id}`,
        qty: m.qty ?? 0,
        satuan_beli_id: m.satuan_beli_id,
        satuan_beli_nama: m.satuan_beli_nama,
        harga_satuan: m.harga_satuan
      }))
  }

  async getPurchaseUnits(): Promise<Array<{ id: number; nama: string; kode?: string }>> {
    try {
      const res = await apiClient<any[]>('/purchase-orders/lookups/units')
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data
      }
    } catch {
      // Fallback
    }

    const items = satuanBeliService.getRawItems()
    return items
      .filter(u => u.status === 1)
      .map(u => ({ id: u.id, nama: u.nama || 'Unit', kode: u.kode || undefined }))
  }

  async getTaxes(): Promise<Array<{ id: number; nama: number; is_active: number }>> {
    try {
      const res = await apiClient<any[]>('/purchase-orders/lookups/taxes')
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data
      }
    } catch {
      // Fallback
    }

    const items = taxService.getRawItems()
    return items
      .filter(t => t.status === 1)
      .map(t => ({ id: t.id, nama: t.nama || 11, is_active: t.is_active || 0 }))
  }

  async getStatusTransaksiList(): Promise<StatusTransaksi[]> {
    try {
      const res = await apiClient<StatusTransaksi[]>('/purchase-orders/lookups/status-transaksi')
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data
      }
    } catch {
      // Fallback
    }

    return [...MOCK_STATUS_TRANSAKSI]
  }

  /**
   * Batch import Purchase Orders from Excel
   */
  async importBatch(
    rows: Array<{
      kode: string
      suplier_id: number
      tanggal: string
      status_transaksi_id: number
      is_ppn: number
      keterangan?: string | null
      bahan_id: number
      qty: number
      satuan_beli_id?: number | null
      harga: number
      diskon?: number
    }>
  ): Promise<{ importedCount: number }> {
    assertPermission('procurement', 'create')

    const orderSnapshot = JSON.parse(JSON.stringify(this.orders))
    const detailSnapshot = JSON.parse(JSON.stringify(this.details))

    try {
      const grouped = new Map<string, typeof rows>()
      for (const r of rows) {
        const list = grouped.get(r.kode) || []
        list.push(r)
        grouped.set(r.kode, list)
      }

      for (const [kode, rowList] of grouped.entries()) {
        const first = rowList[0]
        await this.create({
          header: {
            kode,
            suplier_id: first.suplier_id,
            tanggal: first.tanggal,
            keterangan: first.keterangan || '',
            is_ppn: first.is_ppn,
            subtotal: 0,
            diskon: 0,
            total: 0,
            total_ppn: 0,
            status: 0,
            status_transaksi_id: first.status_transaksi_id
          },
          details: rowList.map(item => ({
            bahan_id: item.bahan_id,
            qty: item.qty,
            satuan_beli_id: item.satuan_beli_id || 1,
            harga: item.harga,
            diskon: item.diskon || 0,
            subtotal: calculateRowSubtotal(item.qty, item.harga, item.diskon),
            keterangan: item.keterangan || null
          }))
        })
      }

      return { importedCount: grouped.size }
    } catch (err) {
      this.orders = orderSnapshot
      this.details = detailSnapshot
      throw err
    }
  }

  /**
   * Direct in-memory accessors for test suites and lookups
   */
  getRawOrders(): PurchaseOrder[] {
    return this.orders
  }

  getRawDetails(): PurchaseOrderDetail[] {
    return this.details
  }
}

export const purchaseOrderService = new PurchaseOrderService()
