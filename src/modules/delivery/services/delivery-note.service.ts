import { apiClient } from '@/shared/services/api-client'
import type { SalesOrderVariantKey } from '@/modules/sales/config/sales-order-variants'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'
import { productService } from '@/modules/inventory/products/services/product.service'
import { customerService } from '@/modules/sales/customers/services/customer.service'
import {
  DELIVERY_DOCUMENT_STATUS,
  DELIVERY_SHIPPING_STATUS,
  type SuratJalan,
  type DetailSuratJalan,
  type DeliveryNoteListItem,
  type DeliveryNoteWithDetails,
  type DeliveryNoteItem,
  type CreateDeliveryNotePayload,
  type UpdateDeliveryNotePayload,
  type DeliveryProofPayload,
  type DeliveryNoteFilters,
  type DriverOption
} from '../types/delivery-note.types'
import {
  INITIAL_MOCK_DELIVERY_NOTES,
  INITIAL_MOCK_DELIVERY_ITEMS
} from '../mocks/delivery-notes.mock'
import {
  resolveDocumentStatusLabel,
  resolveShippingStatusLabel,
  generateDeliveryNoteCode,
  validateDeliveryQuantities
} from '../utils/delivery-note-calculations'

export class DeliveryNoteService {
  private deliveryNotes: SuratJalan[] = []
  private deliveryItems: DetailSuratJalan[] = []

  constructor() {
    this.resetMockData()
  }

  /**
   * Resets mock data to initial fixtures.
   */
  public resetMockData(): void {
    this.deliveryNotes = JSON.parse(JSON.stringify(INITIAL_MOCK_DELIVERY_NOTES))
    this.deliveryItems = JSON.parse(JSON.stringify(INITIAL_MOCK_DELIVERY_ITEMS))
  }

  /**
   * Retrieves all delivery notes formatted for the 13-column DataTable.
   */
  public async getAllDeliveryNotes(filters?: DeliveryNoteFilters): Promise<DeliveryNoteListItem[]> {
    try {
      const q = new URLSearchParams()
      if (filters?.search) q.append('search', filters.search)
      if (filters?.startDate) q.append('startDate', filters.startDate)
      if (filters?.endDate) q.append('endDate', filters.endDate)
      if (filters?.status_kirim !== undefined && filters.status_kirim !== null) {
        q.append('status_kirim', String(filters.status_kirim))
      }
      if (filters?.status_dokumen !== undefined && filters.status_dokumen !== null) {
        q.append('status', String(filters.status_dokumen))
      }
      q.append('limit', '100')
      const res = await apiClient<DeliveryNoteListItem[]>(`/delivery-notes?${q.toString()}`)
      if (res && res.data && Array.isArray(res.data)) {
        return res.data
      }
    } catch {
      // Fallback ke mock in-memory jika API offline
    }

    const orders = await salesOrderTransactionService.getAllOrders()
    const orderMap = new Map(orders.map(o => [o.id, o]))

    let filtered = this.deliveryNotes.filter(dn => dn.status_aktif === 1)

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim()
      filtered = filtered.filter(dn => {
        const order = orderMap.get(dn.so_id)
        return (
          dn.kode.toLowerCase().includes(q) ||
          (order?.kode && order.kode.toLowerCase().includes(q)) ||
          (order?.customer_nama && order.customer_nama.toLowerCase().includes(q)) ||
          (dn.nama_pengirim && dn.nama_pengirim.toLowerCase().includes(q)) ||
          (dn.keterangan && dn.keterangan.toLowerCase().includes(q)) ||
          (dn.penerima && dn.penerima.toLowerCase().includes(q))
        )
      })
    }

    if (filters?.startDate) {
      filtered = filtered.filter(dn => dn.tanggal >= filters.startDate!)
    }
    if (filters?.endDate) {
      filtered = filtered.filter(dn => dn.tanggal <= filters.endDate!)
    }
    if (filters?.status_kirim !== undefined && filters.status_kirim !== null) {
      filtered = filtered.filter(dn => dn.status_kirim === filters.status_kirim)
    }
    if (filters?.status_dokumen !== undefined && filters.status_dokumen !== null) {
      filtered = filtered.filter(dn => dn.status === filters.status_dokumen)
    }
    if (filters?.is_pickup !== undefined && filters.is_pickup !== null) {
      filtered = filtered.filter(dn =>
        filters.is_pickup ? dn.status_ambil === 1 : dn.status_ambil !== 1
      )
    }

    return filtered
      .map(dn => {
        const order = orderMap.get(dn.so_id)
        const items = this.deliveryItems.filter(it => it.surat_jalan_id === dn.id)
        const qtyPemesanan = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0)
        const qtyPengiriman = items.reduce((sum, it) => sum + (Number(it.qty_kirim) || 0), 0)

        const shippingLabel = resolveShippingStatusLabel(dn.status_kirim, dn.status_ambil)
        const docLabel = resolveDocumentStatusLabel(dn.status)

        return {
          id: dn.id,
          tanggal: dn.tanggal,
          kode: dn.kode,
          so_id: dn.so_id,
          so_kode: order?.kode || `SO #${dn.so_id}`,
          so_variant: order?.variant,
          customer_id: order?.customer_id || 0,
          customer_nama: order?.customer_nama || 'Customer Umum',
          keterangan: dn.keterangan || '-',
          qty_pemesanan: qtyPemesanan,
          qty_pengiriman: qtyPengiriman,
          total_pembelian: order?.total || 0,
          status_kirim: dn.status_kirim,
          status_kirim_label: shippingLabel,
          has_bukti: Boolean(dn.foto_bukti && dn.foto_bukti.trim()),
          foto_bukti: dn.foto_bukti,
          penerima: dn.penerima,
          status_dokumen: dn.status,
          status_dokumen_label: docLabel,
          status_ambil: dn.status_ambil || 0,
          nama_pengirim: dn.nama_pengirim || '-'
        }
      })
      .sort((a, b) => b.id - a.id)
  }

  /**
   * Retrieves single delivery note with items and full metadata.
   */
  public async getDeliveryNoteById(id: number): Promise<DeliveryNoteWithDetails> {
    try {
      const res = await apiClient<DeliveryNoteWithDetails>(`/delivery-notes/${id}`)
      if (res && res.data && res.data.id) {
        return res.data
      }
    } catch {
      // Fallback ke mock in-memory jika API offline
    }

    const note = this.deliveryNotes.find(dn => dn.id === Number(id))
    if (!note) {
      throw new Error(`Surat Jalan dengan ID ${id} tidak ditemukan.`)
    }

    const order = await salesOrderTransactionService.getOrderById(note.so_id)
    const rawProducts = productService.getRawItems()
    const productMap = new Map(rawProducts.map(p => [p.id, p]))

    const rawItems = this.deliveryItems.filter(it => it.surat_jalan_id === note.id)

    // Calculate delivery history per product for this SO up to now
    const soDeliveries = this.deliveryNotes.filter(
      dn =>
        dn.so_id === note.so_id && dn.status !== DELIVERY_DOCUMENT_STATUS.BATAL && dn.id !== note.id
    )
    const otherDeliveredMap = new Map<number, number>()
    soDeliveries.forEach(d => {
      const items = this.deliveryItems.filter(it => it.surat_jalan_id === d.id)
      items.forEach(it => {
        const cur = otherDeliveredMap.get(it.produk_id) || 0
        otherDeliveredMap.set(it.produk_id, cur + it.qty_kirim)
      })
    })

    const enrichedItems: DeliveryNoteItem[] = rawItems.map(it => {
      const prod = productMap.get(it.produk_id)
      const prevDelivered = otherDeliveredMap.get(it.produk_id) || 0
      const remaining = Math.max(0, it.qty - prevDelivered - it.qty_kirim)

      return {
        ...it,
        kode_produk: prod?.kode || '-',
        nama_produk: prod?.nama || 'Produk Tidak Dikenal',
        satuan_nama: prod?.satuan_barang_nama || 'Unit',
        stok_saat_ini: prod?.qty || 0,
        qty_sudah_dikirim: prevDelivered,
        sisa_qty: remaining
      }
    })

    const totalOrdered = enrichedItems.reduce((sum, it) => sum + (Number(it.qty) || 0), 0)
    const totalDelivered = enrichedItems.reduce((sum, it) => sum + (Number(it.qty_kirim) || 0), 0)

    const customer = customerService.getRawItems().find(c => c.id === order.customer_id)

    return {
      ...note,
      items: enrichedItems,
      so_kode: order.kode,
      so_variant: order.variant,
      customer_id: order.customer_id,
      customer_nama: order.customer_nama,
      customer_alamat: customer?.alamat || note.alamat || 'Alamat Customer',
      customer_no_hp: customer?.no_hp || note.no_hp || '-',
      sales_id: order.sales_id,
      sales_nama: order.sales_nama,
      total_pembelian: order.total,
      qty_pemesanan: totalOrdered,
      qty_pengiriman: totalDelivered
    }
  }

  /**
   * Retrieves active delivery notes for a specific Sales Order.
   */
  public async getDeliveryNotesByOrderId(soId: number): Promise<SuratJalan[]> {
    return this.deliveryNotes.filter(
      dn =>
        dn.so_id === Number(soId) &&
        dn.status_aktif === 1 &&
        dn.status !== DELIVERY_DOCUMENT_STATUS.BATAL
    )
  }

  /**
   * Retrieves Sales Orders eligible for delivery directly from backend database API,
   * with fallback to mock data if backend is offline.
   */
  public async getEligibleSalesOrders(
    search?: string,
    limit?: number
  ): Promise<
    Array<{
      id: number
      kode: string
      tanggal?: string
      variant: SalesOrderVariantKey
      customer_id?: number | null
      customer_nama: string
      total: number
      total_ordered_qty?: number
      total_delivered_qty?: number
      total_remaining_qty?: number
      total_deliverable_stock?: number
      delivery_status?: string
    }>
  > {
    try {
      const q = new URLSearchParams()
      if (search && search.trim()) q.append('search', search.trim())
      if (limit) q.append('limit', String(limit))
      const qs = q.toString() ? `?${q.toString()}` : ''
      const res = await apiClient<any[]>(`/delivery-notes/eligible-sales-orders${qs}`)
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data
          .filter((o: any) => {
            if (o.total_remaining_qty !== undefined && Number(o.total_remaining_qty) <= 0) return false
            if (o.total_deliverable_stock !== undefined && Number(o.total_deliverable_stock) <= 0) return false
            return true
          })
          .map((o: any) => ({
            id: Number(o.id),
            kode: String(o.kode),
            tanggal: o.tanggal ? String(o.tanggal) : undefined,
            variant: (o.variant || 'impact') as SalesOrderVariantKey,
            customer_id: o.customer_id ? Number(o.customer_id) : null,
            customer_nama: String(o.customer_nama || '-'),
            total: Number(o.total) || 0,
            total_ordered_qty: o.total_ordered_qty !== undefined ? Number(o.total_ordered_qty) : undefined,
            total_delivered_qty: o.total_delivered_qty !== undefined ? Number(o.total_delivered_qty) : undefined,
            total_remaining_qty: o.total_remaining_qty !== undefined ? Number(o.total_remaining_qty) : undefined,
            total_deliverable_stock: o.total_deliverable_stock !== undefined ? Number(o.total_deliverable_stock) : undefined,
            delivery_status: o.delivery_status ? String(o.delivery_status) : undefined
          }))
      }
    } catch {
      // Fallback ke in-memory mock jika API offline atau saat unit testing
    }

    const list = await salesOrderTransactionService.getAllOrders()
    let filtered = list.map(o => ({
      ...o,
      tanggal: undefined,
      total_ordered_qty: undefined,
      total_delivered_qty: undefined,
      total_remaining_qty: undefined,
      total_deliverable_stock: undefined,
      delivery_status: undefined
    }))
    if (search && search.trim()) {
      const term = search.toLowerCase().trim()
      filtered = filtered.filter(
        o =>
          o.kode.toLowerCase().includes(term) ||
          o.customer_nama.toLowerCase().includes(term) ||
          o.variant.toLowerCase().includes(term)
      )
    }

    const rawProducts = productService.getRawItems()
    const productMap = new Map(rawProducts.map(p => [p.id, p]))

    const result = []
    for (const order of filtered) {
      let orderItems: any[] = []
      try {
        const fullOrder = await salesOrderTransactionService.getOrderById(order.id)
        orderItems = fullOrder?.items || []
      } catch {
        orderItems = []
      }

      const activeNotes = this.deliveryNotes.filter(
        dn => dn.so_id === order.id && dn.status === DELIVERY_DOCUMENT_STATUS.SUCCEEDED && dn.status_aktif === 1
      )
      const deliveredTotals = new Map<number, number>()
      activeNotes.forEach(dn => {
        const items = this.deliveryItems.filter(it => it.surat_jalan_id === dn.id)
        items.forEach(it => {
          const cur = deliveredTotals.get(it.produk_id) || 0
          deliveredTotals.set(it.produk_id, cur + it.qty_kirim)
        })
      })

      let totalOrdered = 0
      let totalDelivered = 0
      let totalRemaining = 0
      let totalDeliverableStock = 0

      for (const item of orderItems) {
        const prod = productMap.get(item.produk_id)
        const ordered = Number(item.qty) || 0
        const delivered = deliveredTotals.get(item.produk_id) || 0
        const remaining = Math.max(0, ordered - delivered)
        const stock = prod ? Number(prod.qty) || 0 : remaining

        totalOrdered += ordered
        totalDelivered += delivered
        totalRemaining += remaining
        if (remaining > 0 && stock > 0) {
          totalDeliverableStock += Math.min(remaining, stock)
        }
      }

      // If all items delivered or all out of stock, exclude from Pilih SO
      if (orderItems.length > 0) {
        if (totalRemaining <= 0 || totalDeliverableStock <= 0) {
          continue
        }
      }

      result.push({
        ...order,
        total_ordered_qty: totalOrdered,
        total_delivered_qty: totalDelivered,
        total_remaining_qty: totalRemaining,
        total_deliverable_stock: totalDeliverableStock,
        delivery_status: totalDelivered >= totalOrdered ? 'TERKIRIM' : totalDelivered > 0 ? 'SEBAGIAN' : 'BELUM_KIRIM'
      })
    }
    return result
  }

  /**
   * Calculates remaining undelivered quantities for each item in a Sales Order.
   */
  public async getDeliveryRemainingBySoId(soId: number): Promise<
    Array<{
      detail_sales_order_id: number
      produk_id: number
      kode_produk: string
      nama_produk: string
      satuan_nama: string
      stok_saat_ini: number
      qty_pemesanan: number
      qty_sudah_dikirim: number
      sisa_qty: number
    }>
  > {
    try {
      const res = await apiClient<{ items: DeliveryNoteItem[] }>(
        `/delivery-notes/sales-orders/${soId}/delivery-summary`
      )
      if (res && res.data && (res.data as any).items && (res.data as any).items.length > 0) {
        return (res.data as any).items.map((it: any) => ({
          detail_sales_order_id: it.detail_sales_order_id,
          produk_id: it.produk_id,
          kode_produk: it.kode_produk,
          nama_produk: it.nama_produk,
          satuan_nama: it.satuan_nama,
          stok_saat_ini: it.stok_tersedia ?? it.stok_saat_ini ?? 0,
          qty_pemesanan: it.qty_pemesanan ?? it.qty ?? 0,
          qty_sudah_dikirim: it.qty_sudah_dikirim ?? 0,
          sisa_qty: it.sisa_qty ?? 0
        }))
      }
    } catch {
      // Fallback ke mock in-memory jika API offline
    }

    const order = await salesOrderTransactionService.getOrderById(soId)
    const existingNotes = await this.getDeliveryNotesByOrderId(soId)
    const rawProducts = productService.getRawItems()
    const productMap = new Map(rawProducts.map(p => [p.id, p]))

    const deliveredTotals = new Map<number, number>()
    existingNotes.forEach(dn => {
      const items = this.deliveryItems.filter(it => it.surat_jalan_id === dn.id)
      items.forEach(it => {
        const cur = deliveredTotals.get(it.produk_id) || 0
        deliveredTotals.set(it.produk_id, cur + it.qty_kirim)
      })
    })

    return order.items.map(item => {
      const prod = productMap.get(item.produk_id)
      const alreadyDelivered = deliveredTotals.get(item.produk_id) || 0
      const remaining = Math.max(0, item.qty - alreadyDelivered)

      return {
        detail_sales_order_id: item.id,
        produk_id: item.produk_id,
        kode_produk: prod?.kode || item.kode_produk || '-',
        nama_produk: prod?.nama || item.nama_produk || 'Produk',
        satuan_nama: prod?.satuan_barang_nama || item.satuan_nama || 'Unit',
        stok_saat_ini: prod?.qty || 0,
        qty_pemesanan: item.qty,
        qty_sudah_dikirim: alreadyDelivered,
        sisa_qty: remaining
      }
    })
  }

  /**
   * Generates next sequential delivery note code based on variant and isPickup.
   */
  public generateNextDeliveryCode(
    variant: SalesOrderVariantKey = 'impact',
    isPickup: boolean = false
  ): string {
    const nextSeq = this.deliveryNotes.length + 1
    return generateDeliveryNoteCode(variant, nextSeq, undefined, isPickup)
  }

  /**
   * Previews sequential delivery code from backend API matching real database sequences.
   */
  public async previewDeliveryCode(
    variant: SalesOrderVariantKey = 'impact',
    isPickup: boolean = false,
    date?: string
  ): Promise<string> {
    try {
      const q = new URLSearchParams()
      q.append('variant', variant)
      if (isPickup) q.append('is_pickup', 'true')
      if (date) q.append('date', date)
      const res = await apiClient<{ kode: string; deliveryCode: string }>(
        `/delivery-notes/generate-code?${q.toString()}`
      )
      if (res?.data?.kode) {
        return res.data.kode
      }
    } catch {
      // Fallback ke in-memory generator jika offline
    }
    return this.generateNextDeliveryCode(variant, isPickup)
  }

  /**
   * Fetches active driver employees from the driver / supir groups.
   */
  public async getDrivers(): Promise<DriverOption[]> {
    try {
      const res = await apiClient<DriverOption[]>('/delivery-notes/drivers')
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data
      }
    } catch {
      // Fallback ke fixture drivers jika offline / mock mode
    }
    return [
      { id: 54, nama: 'ACHMAD', nik: '2', no_hp: '-', jabatan_nama: 'SUPIR', grup_nama: 'Grup Driver Achmad' },
      { id: 55, nama: 'SOEDJAI', nik: '3', no_hp: '-', jabatan_nama: 'SUPIR', grup_nama: 'Group Driver Soedjai' },
      { id: 56, nama: 'TANO/MARKUS', nik: '4', no_hp: '-', jabatan_nama: 'SUPIR', grup_nama: 'Group Driver Tano' },
      { id: 57, nama: 'SUHARIYANTO/TOTOK', nik: '5', no_hp: '-', jabatan_nama: 'SUPIR', grup_nama: 'Grup Driver Totok' },
      { id: 58, nama: 'SUWONDO', nik: '71', no_hp: '-', jabatan_nama: 'SUPIR', grup_nama: 'Grup Driver Wondo' },
      { id: 53, nama: 'IWAN', nik: '1', no_hp: '-', jabatan_nama: 'PENGIRIMAN', grup_nama: '-' },
      { id: 59, nama: 'RACHMAN', nik: '72', no_hp: '-', jabatan_nama: 'PENGIRIMAN', grup_nama: '-' },
      { id: 60, nama: 'ALI BASORI', nik: '73', no_hp: '-', jabatan_nama: 'PENGIRIMAN', grup_nama: '-' },
      { id: 62, nama: 'SAIFUL', nik: '75', no_hp: '-', jabatan_nama: 'PENGIRIMAN', grup_nama: '-' }
    ]
  }

  /**
   * Creates a new delivery note with items, stock deduction, and SO status sync.
   */
  public async createDeliveryNote(
    payload: CreateDeliveryNotePayload
  ): Promise<DeliveryNoteWithDetails> {
    try {
      const res = await apiClient<DeliveryNoteWithDetails>('/delivery-notes', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      if (res && res.data && res.data.id) {
        return res.data
      }
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR' && err?.status !== 0) {
        throw new Error(err.message || 'Gagal menyimpan Surat Jalan ke backend.')
      }
    }

    const order = await salesOrderTransactionService.getOrderById(payload.so_id)

    // Code uniqueness check
    const codeTrimmed = payload.kode.trim().toUpperCase()
    if (this.deliveryNotes.some(dn => dn.kode.toUpperCase() === codeTrimmed)) {
      throw new Error(
        `Nomor Surat Jalan '${payload.kode}' sudah digunakan. Harap gunakan nomor lain.`
      )
    }

    // Validate quantities
    const valResult = validateDeliveryQuantities(payload.items)
    if (!valResult.isValid) {
      throw new Error(valResult.errors.join(' '))
    }

    const nextId =
      this.deliveryNotes.length > 0 ? Math.max(...this.deliveryNotes.map(dn => dn.id)) + 1 : 1

    const isPickup = Boolean(payload.is_pickup)
    const isSucceeded = payload.status === DELIVERY_DOCUMENT_STATUS.SUCCEEDED
    const statusKirim = isPickup
      ? DELIVERY_SHIPPING_STATUS.AMBIL_SENDIRI
      : isSucceeded
        ? DELIVERY_SHIPPING_STATUS.TERKIRIM
        : DELIVERY_SHIPPING_STATUS.BELUM_DIKIRIM

    const customer = customerService.getRawItems().find(c => c.id === order.customer_id)

    const newNote: SuratJalan = {
      id: nextId,
      so_id: payload.so_id,
      kode: payload.kode.trim(),
      tanggal: payload.tanggal,
      keterangan: payload.keterangan || null,
      status: payload.status,
      status_kirim: statusKirim,
      status_ambil: isPickup ? 1 : 0,
      nama_pengirim: payload.nama_pengirim || (isPickup ? 'Diambil Sendiri oleh Pelanggan' : null),
      penerima: null,
      foto_bukti: null,
      alamat: customer?.alamat || 'Alamat Customer',
      no_hp: customer?.no_hp || null,
      karyawan_id: payload.karyawan_id ?? null,
      note: null,
      status_aktif: 1,
      is_stock_deducted: false,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      created_by: 1
    }

    // Insert items
    let nextItemId =
      this.deliveryItems.length > 0 ? Math.max(...this.deliveryItems.map(it => it.id)) + 1 : 1

    const insertedItems: DetailSuratJalan[] = payload.items
      .filter(it => it.qty_kirim > 0)
      .map(it => ({
        id: nextItemId++,
        surat_jalan_id: nextId,
        produk_id: it.produk_id,
        qty: it.qty,
        qty_kirim: it.qty_kirim,
        detail_sales_order_id: it.detail_sales_order_id || null,
        keterangan: it.keterangan || null
      }))

    this.deliveryNotes.push(newNote)
    this.deliveryItems.push(...insertedItems)

    // Stock deduction if SUCCEEDED
    if (isSucceeded) {
      this.deductStock(newNote, insertedItems)
    }

    // Update SO delivery status
    await this.syncSoDeliveryStatus(order.id)

    return this.getDeliveryNoteById(nextId)
  }

  /**
   * Updates an existing delivery note (only if draft).
   */
  public async updateDeliveryNote(
    id: number,
    payload: UpdateDeliveryNotePayload
  ): Promise<DeliveryNoteWithDetails> {
    try {
      const res = await apiClient<DeliveryNoteWithDetails>(`/delivery-notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      if (res && res.data && res.data.id) {
        return res.data
      }
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR' && err?.status !== 0) {
        throw new Error(err.message || 'Gagal memperbarui Surat Jalan.')
      }
    }

    const note = this.deliveryNotes.find(dn => dn.id === Number(id))
    if (!note) {
      throw new Error(`Surat Jalan dengan ID ${id} tidak ditemukan.`)
    }

    if (note.status === DELIVERY_DOCUMENT_STATUS.BATAL) {
      throw new Error('Surat Jalan yang telah dibatalkan tidak dapat diedit.')
    }

    if (payload.kode && payload.kode.trim().toUpperCase() !== note.kode.toUpperCase()) {
      if (
        this.deliveryNotes.some(
          dn => dn.id !== note.id && dn.kode.toUpperCase() === payload.kode!.trim().toUpperCase()
        )
      ) {
        throw new Error(`Nomor Surat Jalan '${payload.kode}' sudah digunakan.`)
      }
      note.kode = payload.kode.trim()
    }

    if (payload.tanggal) note.tanggal = payload.tanggal
    if (payload.nama_pengirim !== undefined) note.nama_pengirim = payload.nama_pengirim
    if (payload.karyawan_id !== undefined) note.karyawan_id = payload.karyawan_id
    if (payload.keterangan !== undefined) note.keterangan = payload.keterangan

    if (payload.items && payload.items.length > 0) {
      const valResult = validateDeliveryQuantities(payload.items)
      if (!valResult.isValid) {
        throw new Error(valResult.errors.join(' '))
      }

      // Remove old items
      this.deliveryItems = this.deliveryItems.filter(it => it.surat_jalan_id !== note.id)

      let nextItemId =
        this.deliveryItems.length > 0 ? Math.max(...this.deliveryItems.map(it => it.id)) + 1 : 1

      const newItems: DetailSuratJalan[] = payload.items
        .filter(it => it.qty_kirim > 0)
        .map(it => ({
          id: nextItemId++,
          surat_jalan_id: note.id,
          produk_id: it.produk_id,
          qty: it.qty,
          qty_kirim: it.qty_kirim,
          detail_sales_order_id: it.detail_sales_order_id || null,
          keterangan: it.keterangan || null
        }))

      this.deliveryItems.push(...newItems)
    }

    if (payload.status !== undefined && payload.status !== note.status) {
      note.status = payload.status
      if (note.status === DELIVERY_DOCUMENT_STATUS.SUCCEEDED && !note.is_stock_deducted) {
        const items = this.deliveryItems.filter(it => it.surat_jalan_id === note.id)
        this.deductStock(note, items)
      }
    }

    note.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)
    note.updated_by = 1

    await this.syncSoDeliveryStatus(note.so_id)

    return this.getDeliveryNoteById(note.id)
  }

  /**
   * Cancels a delivery note with stock reversal and SO status sync.
   */
  public async cancelDeliveryNote(id: number, reason: string): Promise<boolean> {
    try {
      const res = await apiClient<{ success: boolean; message: string }>(
        `/delivery-notes/${id}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify({ reason })
        }
      )
      if (res && res.data && ((res.data as any).id || (res.data as any).success !== false)) {
        return true
      }
    } catch {
      // Fallback ke mock in-memory jika API offline
    }

    const note = this.deliveryNotes.find(dn => dn.id === Number(id))
    if (!note) {
      throw new Error(`Surat Jalan dengan ID ${id} tidak ditemukan.`)
    }

    if (note.status === DELIVERY_DOCUMENT_STATUS.BATAL) {
      return true
    }

    // Revert stock if previously deducted
    if (note.is_stock_deducted) {
      const items = this.deliveryItems.filter(it => it.surat_jalan_id === note.id)
      this.revertStock(note, items)
    }

    note.status = DELIVERY_DOCUMENT_STATUS.BATAL
    note.note = reason ? `Dibatalkan: ${reason}` : 'Dibatalkan oleh pengguna.'
    note.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)
    note.updated_by = 1

    await this.syncSoDeliveryStatus(note.so_id)
    return true
  }

  /**
   * Confirms delivery or records proof of delivery (TERKIRIM).
   */
  public async confirmDelivery(
    id: number,
    proof: DeliveryProofPayload
  ): Promise<DeliveryNoteWithDetails> {
    const note = this.deliveryNotes.find(dn => dn.id === Number(id))
    if (!note) {
      throw new Error(`Surat Jalan dengan ID ${id} tidak ditemukan.`)
    }

    note.penerima = proof.penerima.trim()
    note.foto_bukti = proof.foto_bukti.trim()
    if (proof.note) {
      note.note = proof.note.trim()
    }

    if (note.status_ambil === 1) {
      note.status_kirim = DELIVERY_SHIPPING_STATUS.AMBIL_SENDIRI
    } else {
      note.status_kirim = DELIVERY_SHIPPING_STATUS.TERKIRIM
    }

    // If was Draft, mark as Succeeded and deduct stock
    if (note.status === DELIVERY_DOCUMENT_STATUS.DRAFT) {
      note.status = DELIVERY_DOCUMENT_STATUS.SUCCEEDED
    }

    if (!note.is_stock_deducted) {
      const items = this.deliveryItems.filter(it => it.surat_jalan_id === note.id)
      this.deductStock(note, items)
    }

    note.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)
    note.updated_by = 1

    await this.syncSoDeliveryStatus(note.so_id)

    return this.getDeliveryNoteById(note.id)
  }

  /* =========================================================================
     PRIVATE HELPERS & INVENTORY INTEGRATION
     ========================================================================= */

  private deductStock(note: SuratJalan, items: DetailSuratJalan[]): void {
    if (note.is_stock_deducted) return
    items.forEach(it => {
      productService.adjustStock(it.produk_id, -it.qty_kirim)
    })
    note.is_stock_deducted = true
  }

  private revertStock(note: SuratJalan, items: DetailSuratJalan[]): void {
    if (!note.is_stock_deducted) return
    items.forEach(it => {
      productService.adjustStock(it.produk_id, it.qty_kirim)
    })
    note.is_stock_deducted = false
  }

  /**
   * Checks whether total delivered items for a SO meet or exceed ordered items,
   * updating the SO's delivery_status accordingly.
   */
  private async syncSoDeliveryStatus(soId: number): Promise<void> {
    try {
      const order = await salesOrderTransactionService.getOrderById(soId)
      const totalOrdered = order.items.reduce((sum, it) => sum + it.qty, 0)

      const activeNotes = this.deliveryNotes.filter(
        dn =>
          dn.so_id === soId && dn.status !== DELIVERY_DOCUMENT_STATUS.BATAL && dn.status_aktif === 1
      )

      let totalDelivered = 0
      activeNotes.forEach(dn => {
        const items = this.deliveryItems.filter(it => it.surat_jalan_id === dn.id)
        totalDelivered += items.reduce((sum, it) => sum + it.qty_kirim, 0)
      })

      if (totalDelivered >= totalOrdered && totalOrdered > 0) {
        salesOrderTransactionService.updateDeliveryStatus(soId, 'TERKIRIM')
      } else {
        salesOrderTransactionService.updateDeliveryStatus(soId, 'BELUM_KIRIM')
      }
    } catch {
      // Keep going if order cannot be found
    }
  }
}

export const deliveryNoteService = new DeliveryNoteService()
