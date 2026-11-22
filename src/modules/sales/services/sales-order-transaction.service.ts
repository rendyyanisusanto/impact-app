import type { PaginatedResponse } from '@/shared/types/crud.types'
import {
  type SalesOrder,
  type DetailSalesOrder,
  type KomponenSalesOrder,
  type SalesPerson,
  type MasterPpn,
  type SalesOrderListItem,
  type SalesOrderWithDetails,
  type SalesOrderCreatePayload,
  type SalesOrderUpdatePayload,
  type SalesOrderFilters,
  type SalesOrderFormValues,
  type SalesOrderProductRow,
  type LinkedProductionsResponse,
  type ProductionRequirementAnalysis,
  type ProductionSyncResponse,
  type PaymentStatus
} from '../types/sales-order.types'
import { getVariantConfig, type SalesOrderVariantKey } from '../config/sales-order-variants'
import {
  formatSalesOrderCode,
  calculateOrderTotals,
  resolvePaymentStatus,
  formatPaymentStatusLabel
} from '../utils/sales-order-calculations'
import {
  INITIAL_MOCK_SALES_ORDERS,
  INITIAL_MOCK_DETAIL_SALES_ORDERS,
  INITIAL_MOCK_KOMPONEN_SALES_ORDERS,
  INITIAL_MOCK_SALES_PERSONS,
  INITIAL_MOCK_PPN,
  INITIAL_MOCK_PAYMENTS,
  INITIAL_MOCK_DELIVERIES,
  INITIAL_MOCK_HISTORI
} from '../mocks/sales-orders-data.mock'
import type { HistoriTable } from '../types/sales-history.types'
import { customerService } from '../customers/services/customer.service'
import { productService } from '@/modules/inventory/products/services/product.service'
import { apiClient } from '@/shared/services/api-client'

export class SalesOrderTransactionService {
  private orders: SalesOrder[] = []
  private details: DetailSalesOrder[] = []
  private komponen: KomponenSalesOrder[] = []
  private salesPersons: SalesPerson[] = []
  private ppnList: MasterPpn[] = []
  private payments: Record<number, number> = {}
  private deliveries: Record<number, 'BELUM_KIRIM' | 'TERKIRIM'> = {}
  private history: HistoriTable[] = []

  constructor() {
    this.reset()
  }

  public reset(): void {
    this.orders = JSON.parse(JSON.stringify(INITIAL_MOCK_SALES_ORDERS))
    this.details = JSON.parse(JSON.stringify(INITIAL_MOCK_DETAIL_SALES_ORDERS))
    this.komponen = JSON.parse(JSON.stringify(INITIAL_MOCK_KOMPONEN_SALES_ORDERS))
    this.salesPersons = JSON.parse(JSON.stringify(INITIAL_MOCK_SALES_PERSONS))
    this.ppnList = JSON.parse(JSON.stringify(INITIAL_MOCK_PPN))
    this.payments = { ...INITIAL_MOCK_PAYMENTS }
    this.deliveries = { ...INITIAL_MOCK_DELIVERIES }
    this.history = JSON.parse(JSON.stringify(INITIAL_MOCK_HISTORI))
  }

  public getSalesPersons(): SalesPerson[] {
    return [...this.salesPersons]
  }

  public getMasterPpn(): MasterPpn[] {
    return [...this.ppnList]
  }

  public getActivePpnRate(): number {
    const active = this.ppnList.find(p => p.is_active === 1)
    return active ? Number(active.nama) : 11
  }

  /**
   * Updates total paid amount for a Sales Order (called upon invoice payment changes).
   */
  public updateOrderPayment(orderId: number, terbayar: number): void {
    this.payments[orderId] = Math.max(0, Math.round(terbayar))
  }

  /**
   * Mengambil template penomoran kode Sales Order dari API backend.
   */
  public async getCodeTemplates(): Promise<{
    kode_ppn: string
    kode_non_ppn: string
    kode_non_ppn_2: string
  }> {
    try {
      const res = await apiClient<{
        kode_ppn: string
        kode_non_ppn: string
        kode_non_ppn_2: string
      }>('/sales-orders/code-templates')
      if (res && res.data) return res.data
    } catch {
      // Fallback
    }
    return {
      kode_ppn: 'SO/{year}/{romawi_bulan}/{last_number_ppn}',
      kode_non_ppn: 'SO/{year}/{month}/{last_number}',
      kode_non_ppn_2: 'SO/N2/{year}/{month}/{last_number}'
    }
  }

  /**
   * Memperbarui template penomoran kode Sales Order via API backend.
   */
  public async updateCodeTemplates(dto: {
    kode_ppn?: string
    kode_non_ppn?: string
    kode_non_ppn_2?: string
  }): Promise<void> {
    await apiClient('/sales-orders/code-templates', {
      method: 'PUT',
      body: JSON.stringify(dto)
    })
  }

  /**
   * Preview nomor kode Sales Order otomatis berikutnya via API backend.
   */
  public async previewCode(variant: SalesOrderVariantKey, dateStr?: string): Promise<string> {
    const cfg = getVariantConfig(variant)
    try {
      const params = new URLSearchParams({ order_type: cfg.orderType })
      if (dateStr) params.append('date', dateStr)
      const res = await apiClient<{ kode: string }>(
        `/sales-orders/preview-code?${params.toString()}`
      )
      if (res.data?.kode) return res.data.kode
    } catch { }
    return this.generateSalesOrderCode(variant, dateStr || new Date().toISOString().slice(0, 10))
  }

  /**
   * Generates next unique SO document code for a given variant and date.
   */
  public generateSalesOrderCode(variant: SalesOrderVariantKey, dateStr: string): string {
    const cfg = getVariantConfig(variant)
    const existingOrders = this.orders.filter(o => o.order_type === cfg.orderType)

    // Calculate max sequence
    let seq = 1
    existingOrders.forEach(o => {
      const parts = o.kode.split('/')
      const lastPart = parts[parts.length - 1]
      const num = parseInt(lastPart, 10)
      if (!isNaN(num) && num >= seq) {
        seq = num + 1
      }
    })

    let candidate = formatSalesOrderCode(variant, dateStr, seq)
    // Guarantee uniqueness
    while (this.orders.some(o => o.kode.toUpperCase() === candidate.toUpperCase())) {
      seq++
      candidate = formatSalesOrderCode(variant, dateStr, seq)
    }

    return candidate
  }

  /**
   * Retrieves paginated Sales Orders filtered by variant and optional query filters.
   */
  public async getOrders(
    variant: SalesOrderVariantKey,
    filters: SalesOrderFilters = {},
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResponse<SalesOrderListItem>> {
    const cfg = getVariantConfig(variant)

    // Coba ambil dari backend API terlebih dahulu
    try {
      const params = new URLSearchParams()
      params.append('order_type', cfg.orderType)
      params.append('page', String(page))
      params.append('limit', String(pageSize))
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      if (filters.search) params.append('search', filters.search)
      if (filters.sales_id !== undefined && String(filters.sales_id) !== 'all') {
        params.append('sales_id', String(filters.sales_id))
      }
      if (
        filters.status !== undefined &&
        filters.status !== null &&
        String(filters.status) !== 'all'
      ) {
        params.append('status', String(filters.status))
      }
      if (filters.startDate) params.append('start_date', String(filters.startDate))
      if (filters.endDate) params.append('end_date', String(filters.endDate))

      const res = await apiClient<any[]>(`/sales-orders?${params.toString()}`)
      if (res && res.data) {
        const totalItems =
          (res as any).pagination?.totalItems ?? res.meta?.totalItems ?? res.data.length
        const totalPages =
          (res as any).pagination?.totalPages ??
          res.meta?.totalPages ??
          (Math.ceil(totalItems / pageSize) || 1)
        const viewModels: SalesOrderListItem[] = res.data.map(o => {
          const totalNum = Number(o.total) || 0
          const terbayar = o.terbayar !== undefined ? Number(o.terbayar) : (this.payments[o.id] || 0)
          const sisa = o.sisa !== undefined ? Number(o.sisa) : Math.max(0, totalNum - terbayar)
          const paymentStatus = o.payment_status || resolvePaymentStatus(totalNum, terbayar)
          const deliveryStatus = this.deliveries[o.id] || 'BELUM_KIRIM'

          return {
            id: o.id,
            variant,
            kode: o.kode,
            tanggal: o.tanggal,
            customer_id: o.customer_id,
            customer_nama: o.customer_nama,
            sales_id: o.sales_id,
            sales_nama: o.sales_nama,
            subtotal: Number(o.subtotal) || 0,
            diskon: Number(o.diskon) || 0,
            total_ppn: Number(o.total_ppn) || 0,
            total: totalNum,
            terbayar,
            sisa,
            payment_status: paymentStatus,
            delivery_status: deliveryStatus,
            status: o.status,
            status_aktif: o.status_aktif,
            count_print: o.count_print || 0,
            no_faktur_pajak: o.no_faktur_pajak,
            has_komponen: false,
            total_komponen: 0
          }
        })

        let finalViewModels = viewModels
        if (filters.payment_status && filters.payment_status !== 'all') {
          finalViewModels = viewModels.filter(m => {
            const rawStatus = String(m.payment_status || '').toUpperCase()
            const label = formatPaymentStatusLabel(rawStatus).toLowerCase()
            const filterVal = filters.payment_status!.toLowerCase()
            return (
              label === filterVal ||
              rawStatus.toLowerCase() === filterVal ||
              (filterVal === 'terbayar' && (rawStatus === 'LUNAS' || rawStatus === 'TERBAYAR')) ||
              (filterVal === 'terbayar sebagian' && (rawStatus === 'SEBAGIAN' || rawStatus === 'TERBAYAR_SEBAGIAN')) ||
              (filterVal === 'belum bayar' && rawStatus === 'BELUM_BAYAR')
            )
          })
        }

        return {
          data: finalViewModels,
          total: filters.payment_status && filters.payment_status !== 'all' ? finalViewModels.length : totalItems,
          page,
          pageSize,
          totalPages: filters.payment_status && filters.payment_status !== 'all' ? (Math.ceil(finalViewModels.length / pageSize) || 1) : totalPages
        }
      }
    } catch {
      // Fallback ke in-memory mock jika API belum terhubung atau saat offline
    }

    // 1. Filter by Variant (Strict Isolation)
    let filtered = this.orders.filter(o => o.order_type === cfg.orderType && o.status_aktif === 1)

    // 2. Search Keyword
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim()
      filtered = filtered.filter(o => {
        const customer = this.resolveCustomer(o.customer_id)
        const sales = this.resolveSalesPerson(o.sales_id)
        return (
          o.kode.toLowerCase().includes(q) ||
          (customer?.nama || '').toLowerCase().includes(q) ||
          (sales?.nama || '').toLowerCase().includes(q) ||
          (o.keterangan || '').toLowerCase().includes(q)
        )
      })
    }

    // 3. Date Range Filter
    if (filters.startDate) {
      filtered = filtered.filter(o => o.tanggal >= (filters.startDate as string))
    }
    if (filters.endDate) {
      filtered = filtered.filter(o => o.tanggal <= (filters.endDate as string))
    }

    // 4. Sales Person Filter
    if (filters.sales_id !== undefined && String(filters.sales_id) !== 'all') {
      filtered = filtered.filter(o => o.sales_id === Number(filters.sales_id))
    }

    // 5. Document Status Filter
    if (filters.status !== undefined && filters.status !== null) {
      filtered = filtered.filter(o => o.status === Number(filters.status))
    }

    // 6. Payment Status Filter
    if (filters.payment_status && filters.payment_status !== 'all') {
      filtered = filtered.filter(o => {
        const totalNum = Number(o.total) || 0
        const terbayar = o.terbayar !== undefined ? Number(o.terbayar) : (this.payments[o.id] || 0)
        const status = o.payment_status || resolvePaymentStatus(totalNum, terbayar)
        const rawStatus = String(status || '').toUpperCase()
        const label = formatPaymentStatusLabel(rawStatus).toLowerCase()
        const filterVal = filters.payment_status!.toLowerCase()
        return (
          label === filterVal ||
          rawStatus.toLowerCase() === filterVal ||
          (filterVal === 'terbayar' && (rawStatus === 'LUNAS' || rawStatus === 'TERBAYAR')) ||
          (filterVal === 'terbayar sebagian' && (rawStatus === 'SEBAGIAN' || rawStatus === 'TERBAYAR_SEBAGIAN')) ||
          (filterVal === 'belum bayar' && rawStatus === 'BELUM_BAYAR')
        )
      })
    }

    // Sort descending by tanggal, then ID
    filtered.sort((a, b) => {
      const dateCmp = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      return dateCmp !== 0 ? dateCmp : b.id - a.id
    })

    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / pageSize) || 1
    const validPage = Math.max(1, Math.min(page, totalPages))
    const startIndex = (validPage - 1) * pageSize
    const pageItems = filtered.slice(startIndex, startIndex + pageSize)

    const viewModels: SalesOrderListItem[] = pageItems.map(o => {
      const customer = this.resolveCustomer(o.customer_id)
      const sales = this.resolveSalesPerson(o.sales_id)
      const totalNum = Number(o.total) || 0
      const terbayar = o.terbayar !== undefined ? Number(o.terbayar) : (this.payments[o.id] || 0)
      const sisa = o.sisa !== undefined ? Number(o.sisa) : Math.max(0, totalNum - terbayar)
      const paymentStatus: PaymentStatus = (o.payment_status as PaymentStatus) || resolvePaymentStatus(totalNum, terbayar)
      const deliveryStatus = this.deliveries[o.id] || 'BELUM_KIRIM'

      const comps = this.komponen.filter(k => k.sales_order_id === o.id)
      const totalKomponen = comps.reduce((sum, c) => sum + c.jumlah, 0)

      return {
        id: o.id,
        variant,
        kode: o.kode,
        tanggal: o.tanggal,
        customer_id: o.customer_id,
        customer_nama: customer?.nama || `Customer #${o.customer_id}`,
        customer_kode: customer?.kode || undefined,
        sales_id: o.sales_id,
        sales_nama: sales?.nama || 'Tanpa Sales',
        subtotal: o.subtotal,
        diskon: o.diskon,
        total_ppn: o.total_ppn,
        total: o.total,
        terbayar,
        sisa,
        payment_status: paymentStatus,
        delivery_status: deliveryStatus,
        status: o.status,
        status_aktif: o.status_aktif,
        count_print: o.count_print || 0,
        no_faktur_pajak: o.no_faktur_pajak,
        has_komponen: comps.length > 0,
        total_komponen: totalKomponen
      }
    })

    return {
      data: viewModels,
      total: totalItems,
      page: validPage,
      pageSize,
      totalPages
    }
  }

  /**
   * Retrieves all Sales Orders across all variants with basic customer and variant info.
   */
  public async getAllOrders(): Promise<
    Array<{
      id: number
      kode: string
      variant: SalesOrderVariantKey
      customer_id?: number
      customer_nama: string
      total: number
    }>
  > {
    try {
      const res = await apiClient<any[]>('/sales-orders?limit=100')
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((o: any) => ({
          id: Number(o.id),
          kode: String(o.kode),
          variant: this.resolveOrderVariant(o.order_type),
          customer_id: o.customer_id ? Number(o.customer_id) : undefined,
          customer_nama: o.customer?.nama || `Customer #${o.customer_id}`,
          total: Number(o.total) || 0
        }))
      }
    } catch {
      // Fallback ke in-memory mock jika offline
    }

    return this.orders.map(order => {
      const customer = this.resolveCustomer(order.customer_id)
      return {
        id: order.id,
        kode: order.kode,
        variant: this.resolveOrderVariant(order.order_type),
        customer_id: order.customer_id,
        customer_nama: customer?.nama || '-',
        total: order.total
      }
    })
  }

  /**
   * Updates delivery status for a Sales Order (e.g. from delivery note service).
   */
  public updateDeliveryStatus(orderId: number, status: 'BELUM_KIRIM' | 'TERKIRIM'): void {
    this.deliveries[orderId] = status
  }

  /**
   * Gets delivery statuses map.
   */
  public getDeliveries(): Record<number, 'BELUM_KIRIM' | 'TERKIRIM'> {
    return { ...this.deliveries }
  }

  /**
   * Retrieves single Sales Order by ID with strict variant isolation check.
   */
  public async getOrderById(
    id: number,
    expectedVariant?: SalesOrderVariantKey
  ): Promise<SalesOrderWithDetails> {
    // 1. Coba ambil dari backend API terlebih dahulu
    try {
      const res = await apiClient<any>(`/sales-orders/${id}`)
      if (res && res.data) {
        const o = res.data
        const orderVariant = this.resolveOrderVariant(o.order_type)

        if (expectedVariant && orderVariant !== expectedVariant) {
          throw new Error(
            `Pelanggaran Isolasi Dokumen: Sales Order ${o.kode} adalah tipe '${orderVariant}', bukan '${expectedVariant}'. Akses ditolak.`
          )
        }

        const items = (o.details || o.detail_sales_orders || o.items || []).map((d: any) => {
          const prod = d.product || d.produk
          return {
            id: d.id,
            sales_order_id: o.id,
            produk_id: d.produk_id,
            kode_produk: prod?.kode || d.kode_produk,
            nama_produk: prod?.nama || d.nama_produk,
            satuan_nama: prod?.satuan?.nama || 'Pcs',
            qty: Number(d.qty),
            harga: Number(d.harga),
            diskon: Number(d.diskon || 0),
            subtotal: Number(d.subtotal),
            status_produksi: Number(d.status_produksi || 0),
            keterangan: d.keterangan || null,
            stok_saat_ini: Number(prod?.qty || 0)
          }
        })

        const biayaTambahan = (o.komponen_sales_orders || o.komponen || []).map((k: any) => ({
          id: k.id,
          sales_order_id: o.id,
          komponen: k.komponen,
          jumlah: Number(k.jumlah || 0)
        }))

        const totalNum = Number(o.total) || 0
        const terbayar = o.terbayar !== undefined ? Number(o.terbayar) : (this.payments[o.id] || 0)
        const sisa = o.sisa !== undefined ? Number(o.sisa) : Math.max(0, totalNum - terbayar)
        const paymentStatus = o.payment_status || resolvePaymentStatus(totalNum, terbayar)

        return {
          id: o.id,
          kode: o.kode,
          tanggal: o.tanggal,
          customer_id: o.customer_id,
          customer_nama: o.customer?.nama || `Customer #${o.customer_id}`,
          customer_alamat: o.customer?.alamat,
          customer_telepon: o.customer?.no_hp,
          sales_id: o.sales_id,
          sales_nama:
            o.salesman?.nama ||
            o.sales?.nama ||
            (o.sales_id ? `Sales #${o.sales_id}` : 'Tanpa Sales'),
          subtotal: Number(o.subtotal),
          diskon: Number(o.diskon || 0),
          total_ppn: Number(o.total_ppn),
          total: totalNum,
          is_ppn: o.is_ppn,
          ppn_id: o.ppn_id,
          no_faktur_pajak: o.no_faktur_pajak,
          keterangan: o.keterangan,
          status: o.status,
          status_produksi: o.status_produksi,
          status_aktif: o.status_aktif,
          count_print: o.count_print || 0,
          order_type: o.order_type,
          created_at: o.created_at,
          created_by: o.created_by,
          variant: orderVariant,
          items,
          biaya_tambahan: biayaTambahan,
          terbayar,
          sisa,
          payment_status: paymentStatus,
          delivery_status: this.deliveries[o.id] || 'BELUM_KIRIM'
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('Pelanggaran Isolasi Dokumen')) {
        throw err
      }
      // Fallback ke memory jika API offline atau record belum disinkronkan
    }

    const order = this.orders.find(o => o.id === Number(id))
    if (!order) {
      throw new Error(`Transaksi Sales Order dengan ID #${id} tidak ditemukan.`)
    }

    const orderVariant = this.resolveOrderVariant(order.order_type)

    if (expectedVariant && orderVariant !== expectedVariant) {
      throw new Error(
        `Pelanggaran Isolasi Dokumen: Sales Order ${order.kode} adalah tipe '${orderVariant}', bukan '${expectedVariant}'. Akses ditolak.`
      )
    }

    const customer = this.resolveCustomer(order.customer_id)
    const sales = this.resolveSalesPerson(order.sales_id)
    const itemsRaw = this.details.filter(d => d.sales_order_id === order.id)
    const biayaTambahan = this.komponen.filter(k => k.sales_order_id === order.id)

    const items = itemsRaw.map(item => {
      const prod = productService.getRawItems().find(p => p.id === item.produk_id)
      return {
        ...item,
        kode_produk: prod?.kode || undefined,
        nama_produk: prod?.nama || undefined,
        satuan_nama: prod ? 'Pcs' : 'Unit',
        stok_saat_ini: prod?.qty || 0
      }
    })

    const totalNum = Number(order.total) || 0
    const terbayar = order.terbayar !== undefined ? Number(order.terbayar) : (this.payments[order.id] || 0)
    const sisa = order.sisa !== undefined ? Number(order.sisa) : Math.max(0, totalNum - terbayar)
    const paymentStatus: PaymentStatus = (order.payment_status as PaymentStatus) || resolvePaymentStatus(totalNum, terbayar)
    const deliveryStatus = this.deliveries[order.id] || 'BELUM_KIRIM'

    return {
      ...order,
      variant: orderVariant,
      customer_nama: customer?.nama || `Customer #${order.customer_id}`,
      customer_alamat: customer?.alamat || undefined,
      customer_telepon: customer?.no_hp || undefined,
      sales_nama: sales?.nama || 'Tanpa Sales',
      items,
      biaya_tambahan: biayaTambahan,
      terbayar,
      sisa,
      payment_status: paymentStatus,
      delivery_status: deliveryStatus
    }
  }

  /**
   * Creates a new Sales Order atomically (header, items, additional components).
   */
  public async createOrder(payload: SalesOrderCreatePayload): Promise<SalesOrderWithDetails> {
    const cfg = getVariantConfig(payload.variant)

    // Uniqueness validation
    if (this.orders.some(o => o.kode.toUpperCase() === payload.kode.trim().toUpperCase())) {
      throw new Error(`Nomor Sales Order '${payload.kode}' sudah digunakan. Gunakan nomor lain.`)
    }

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Minimal satu baris produk harus dimasukkan.')
    }

    // Calculate totals
    const totals = calculateOrderTotals(
      payload.variant,
      payload.items,
      payload.biaya_tambahan || [],
      cfg.hasTax ? this.getActivePpnRate() : 0,
      payload.diskon || 0
    )

    const newId = this.orders.length > 0 ? Math.max(...this.orders.map(o => o.id)) + 1 : 1

    const newOrder: SalesOrder = {
      id: newId,
      customer_id: payload.customer_id,
      kode: payload.kode.trim(),
      tanggal: payload.tanggal,
      keterangan: payload.keterangan || null,
      is_ppn: cfg.hasTax ? 1 : 0,
      ppn_id: cfg.hasTax ? 1 : null,
      subtotal: totals.itemsSubtotal,
      diskon: payload.diskon || 0,
      total_ppn: totals.totalPpn,
      total: totals.grandTotal,
      status: payload.items.some(i => i.status_produksi === 1) ? 0 : (payload.status ?? 0),
      status_produksi: payload.items.some(i => i.status_produksi === 1) ? 1 : 0,
      status_aktif: 1,
      count_print: 0,
      no_faktur_pajak: cfg.hasTax ? payload.no_faktur_pajak || null : null,
      sales_id: payload.sales_id ?? 0,
      order_type: cfg.orderType,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      created_by: 1
    }

    this.orders.push(newOrder)

    // Details
    let nextDetailId = this.details.length > 0 ? Math.max(...this.details.map(d => d.id)) + 1 : 100

    payload.items.forEach(item => {
      const subtotal = Math.round(item.qty * item.harga * (1 - item.diskon / 100))
      this.details.push({
        id: nextDetailId++,
        sales_order_id: newId,
        produk_id: item.produk_id,
        qty: item.qty,
        harga: item.harga,
        diskon: item.diskon,
        subtotal,
        status_produksi: item.status_produksi,
        keterangan: item.keterangan || null
      })
    })

    // Biaya Tambahan
    if (payload.biaya_tambahan && payload.biaya_tambahan.length > 0) {
      let nextKsoId = this.komponen.length > 0 ? Math.max(...this.komponen.map(k => k.id)) + 1 : 200

      payload.biaya_tambahan.forEach(comp => {
        this.komponen.push({
          id: nextKsoId++,
          sales_order_id: newId,
          komponen: comp.komponen,
          jumlah: Number(comp.jumlah) || 0
        })
      })
    }

    // Sinkronkan ke API backend jika aktif
    try {
      const apiRes = await apiClient<any>('/sales-orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: payload.customer_id,
          kode: payload.kode,
          tanggal: payload.tanggal,
          keterangan: payload.keterangan || null,
          order_type: cfg.orderType,
          sales_id: payload.sales_id ?? 0,
          no_faktur_pajak: cfg.hasTax ? payload.no_faktur_pajak || null : null,
          is_ppn: cfg.hasTax ? 1 : 0,
          ppn_id: cfg.hasTax ? 1 : null,
          diskon: payload.diskon || 0,
          status: payload.items.some(i => i.status_produksi === 1) ? 0 : (payload.status ?? 0),
          items: payload.items.map(i => ({
            produk_id: i.produk_id,
            qty: i.qty,
            harga: i.harga,
            diskon: i.diskon || 0,
            keterangan: i.keterangan || null
          })),
          komponen: payload.biaya_tambahan || []
        })
      })
      if (apiRes?.data?.id) {
        newOrder.id = apiRes.data.id
        newOrder.kode = apiRes.data.kode || newOrder.kode
      }
    } catch (err: any) {
      console.error('Failed to create sales order on backend:', err)
      const msg = err?.response?.data?.message || err?.message
      if (
        msg &&
        !msg.toLowerCase().includes('network') &&
        !msg.toLowerCase().includes('failed to fetch') &&
        !msg.toLowerCase().includes('failed to parse url')
      ) {
        throw new Error(msg)
      }
    }

    return this.getOrderById(newOrder.id, payload.variant)
  }

  /**
   * Updates an existing Sales Order.
   */
  public async updateOrder(payload: SalesOrderUpdatePayload): Promise<SalesOrderWithDetails> {
    const existing = this.orders.find(o => o.id === payload.id)
    if (existing && existing.status === 1) {
      throw new Error(
        `Sales Order '${existing.kode}' sudah berstatus SUCCEEDED dan terkunci dari pengeditan.`
      )
    }

    let detectedVariant = payload.variant
    if (!detectedVariant && existing) {
      detectedVariant = this.resolveOrderVariant(existing.order_type)
    }
    if (!detectedVariant && payload.kode) {
      const k = payload.kode.toUpperCase()
      if (k.includes('/N2/') || k.includes('/KS/')) {
        detectedVariant = 'ks'
      } else if (k.includes('/PL/') || k.includes('/POLA/')) {
        detectedVariant = 'pola'
      } else if (k.includes('/26/') || k.includes('/IMP/')) {
        detectedVariant = 'impact'
      }
    }

    const cfg = getVariantConfig(detectedVariant || 'impact')

    // Uniqueness validation if code changed
    if (
      existing &&
      payload.kode &&
      payload.kode.trim().toUpperCase() !== existing.kode.toUpperCase() &&
      this.orders.some(
        o => o.id !== payload.id && o.kode.toUpperCase() === payload.kode!.trim().toUpperCase()
      )
    ) {
      throw new Error(`Nomor Sales Order '${payload.kode}' sudah digunakan.`)
    }

    if (payload.items && payload.items.length === 0) {
      throw new Error('Minimal satu baris produk harus dimasukkan.')
    }

    if (existing) {
      // Update Header
      if (payload.kode) existing.kode = payload.kode.trim()
      if (payload.customer_id) existing.customer_id = payload.customer_id
      if (payload.tanggal) existing.tanggal = payload.tanggal
      if (payload.sales_id !== undefined) existing.sales_id = payload.sales_id
      if (payload.keterangan !== undefined) existing.keterangan = payload.keterangan
      if (cfg.hasTax && payload.no_faktur_pajak !== undefined) {
        existing.no_faktur_pajak = payload.no_faktur_pajak
      }
      if (payload.diskon !== undefined) {
        existing.diskon = payload.diskon
      }
      if (payload.status !== undefined) existing.status = payload.status
      existing.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19)

      // Replace items if provided
      if (payload.items) {
        this.details = this.details.filter(d => d.sales_order_id !== payload.id)
        let nextDetailId =
          this.details.length > 0 ? Math.max(...this.details.map(d => d.id)) + 1 : 100

        payload.items.forEach(item => {
          const subtotal = Math.round(item.qty * item.harga * (1 - item.diskon / 100))
          this.details.push({
            id: nextDetailId++,
            sales_order_id: payload.id,
            produk_id: item.produk_id,
            qty: item.qty,
            harga: item.harga,
            diskon: item.diskon,
            subtotal,
            status_produksi: item.status_produksi,
            keterangan: item.keterangan || null
          })
        })

        // Recalculate totals
        const comps = this.komponen.filter(k => k.sales_order_id === payload.id)
        const totals = calculateOrderTotals(
          cfg.key,
          payload.items,
          comps,
          cfg.hasTax ? this.getActivePpnRate() : 0,
          existing.diskon || 0
        )
        existing.subtotal = totals.itemsSubtotal
        existing.total_ppn = totals.totalPpn
        existing.total = totals.grandTotal
        existing.status_produksi = payload.items.some(i => i.status_produksi === 1) ? 1 : 0
        if (payload.status !== undefined) {
          existing.status = payload.status
        }
      }
    }

    try {
      await apiClient(`/sales-orders/${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          customer_id: payload.customer_id,
          kode: payload.kode,
          tanggal: payload.tanggal,
          keterangan: payload.keterangan || null,
          order_type: cfg.orderType,
          sales_id: payload.sales_id !== undefined ? payload.sales_id : existing?.sales_id,
          status: payload.status,
          no_faktur_pajak: cfg.hasTax ? payload.no_faktur_pajak : null,
          diskon: payload.diskon !== undefined ? payload.diskon : existing?.diskon,
          items: payload.items?.map(i => ({
            produk_id: i.produk_id,
            qty: i.qty,
            harga: i.harga,
            diskon: i.diskon || 0,
            keterangan: i.keterangan || null
          })),
          komponen: payload.biaya_tambahan
        })
      })
    } catch (err: any) {
      console.error('Failed to update sales order on backend:', err)
      const msg = err?.response?.data?.message || err?.message
      if (
        msg &&
        !msg.toLowerCase().includes('network') &&
        !msg.toLowerCase().includes('failed to fetch') &&
        !msg.toLowerCase().includes('failed to parse url')
      ) {
        throw new Error(msg)
      }
    }

    return this.getOrderById(payload.id, detectedVariant)
  }

  /**
   * Retrieves audit history trail for a Sales Order document.
   */
  public async getHistory(orderId: number): Promise<HistoriTable[]> {
    return this.history
      .filter(h => h.table === 'sales_order' && h.table_id === Number(orderId))
      .sort((a, b) => b.id - a.id)
  }

  /**
   * Appends an audit entry into histori_table.
   */
  public async addHistory(entry: Omit<HistoriTable, 'id' | 'created_at'>): Promise<HistoriTable> {
    const newId = this.history.length > 0 ? Math.max(...this.history.map(h => h.id)) + 1 : 1
    const record: HistoriTable = {
      ...entry,
      id: newId,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    }
    this.history.unshift(record)
    return record
  }

  /**
   * Updates the transaction date of a Sales Order with safety checks and audit tracking.
   */
  public async updateOrderDate(
    orderId: number,
    newDate: string,
    reason?: string
  ): Promise<boolean> {
    const record = this.orders.find(o => o.id === Number(orderId))
    if (!record) {
      throw new Error(`Sales Order #${orderId} tidak ditemukan.`)
    }

    if (record.status_aktif === 0) {
      throw new Error(
        `Sales Order '${record.kode}' telah dibatalkan dan tanggal tidak dapat diedit.`
      )
    }

    const oldDate = record.tanggal
    if (oldDate === newDate) {
      return true
    }

    record.tanggal = newDate
    record.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19)

    try {
      await apiClient(`/sales-orders/${orderId}/date`, {
        method: 'PATCH',
        body: JSON.stringify({ tanggal: newDate })
      })
    } catch {
      // fallback
    }

    await this.addHistory({
      table: 'sales_order',
      table_id: record.id,
      tanggal: new Date().toISOString().slice(0, 10),
      metode: 'EDIT_DATE',
      keterangan: `Ubah tanggal sales order dari ${oldDate} ke ${newDate}. Alasan: ${reason || 'Perubahan jadwal'}`,
      user_id: 1,
      user_nama: 'Super Admin'
    })

    return true
  }

  /**
   * Cancels (voids) a Sales Order document safely with transaction audit.
   */
  public async cancelOrder(
    id: number,
    expectedVariant?: SalesOrderVariantKey,
    reason?: string
  ): Promise<boolean> {
    const order = await this.getOrderById(id, expectedVariant)
    const record = this.orders.find(o => o.id === order.id)
    if (!record) {
      throw new Error(`Sales Order #${id} tidak ditemukan.`)
    }

    if (record.status_aktif === 0) {
      throw new Error(`Sales Order '${record.kode}' sudah dalam status Batal.`)
    }

    // Check if payments exist
    const paidAmount = this.payments[order.id] || 0
    if (paidAmount > 0) {
      throw new Error(
        `Sales Order '${record.kode}' sudah memiliki pembayaran tercatat sebesar Rp ${paidAmount.toLocaleString('id-ID')}. Batalkan atau lakukan penyesuaian pembayaran terlebih dahulu.`
      )
    }

    record.status_aktif = 0
    record.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19)

    try {
      await apiClient(`/sales-orders/${id}`, {
        method: 'DELETE'
      })
    } catch {
      // fallback
    }

    await this.addHistory({
      table: 'sales_order',
      table_id: record.id,
      tanggal: new Date().toISOString().slice(0, 10),
      metode: 'CANCEL',
      keterangan: `Batalkan transaksi sales order ${record.kode}. Alasan: ${reason || 'Pembatalan transaksi'}`,
      user_id: 1,
      user_nama: 'Super Admin'
    })

    return true
  }

  /**
   * Increments the print counter for a sales order.
   */
  public async incrementPrintCounter(id: number): Promise<number> {
    const order = this.orders.find(o => o.id === Number(id))
    if (!order) throw new Error(`Sales Order #${id} tidak ditemukan.`)
    order.count_print = (order.count_print || 0) + 1
    return order.count_print
  }

  /**
   * Resets print counter back to 0.
   */
  public async resetPrintCounter(id: number): Promise<boolean> {
    const order = this.orders.find(o => o.id === Number(id))
    if (!order) throw new Error(`Sales Order #${id} tidak ditemukan.`)
    order.count_print = 0
    return true
  }

  // Aliases for clean page calling
  public async getAll(
    queryOrVariant?:
      | SalesOrderVariantKey
      | ({
        variant?: SalesOrderVariantKey
        page?: number
        limit?: number
        pageSize?: number
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
      } & SalesOrderFilters),
    filters?: SalesOrderFilters,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<SalesOrderListItem>> {
    if (typeof queryOrVariant === 'object') {
      const {
        variant = 'impact',
        page: p = 1,
        limit,
        pageSize: ps = limit || 10,
        sortBy = 'created_at',
        sortOrder = 'desc',
        ...restFilters
      } = queryOrVariant
      return this.getOrders(variant, restFilters, p, ps, sortBy, sortOrder)
    }
    return this.getOrders(queryOrVariant || 'impact', filters || {}, page || 1, pageSize || 10)
  }

  public async getById(
    id: number,
    expectedVariant?: SalesOrderVariantKey
  ): Promise<SalesOrderWithDetails | null> {
    try {
      return await this.getOrderById(id, expectedVariant)
    } catch {
      return null
    }
  }

  public async create(
    variant: SalesOrderVariantKey,
    form: SalesOrderFormValues,
    rows: SalesOrderProductRow[],
    costs?: Array<{ komponen: string; jumlah: number }>
  ): Promise<SalesOrderWithDetails> {
    const payload: SalesOrderCreatePayload = {
      variant,
      kode: form.kode,
      customer_id: form.customer_id as number,
      tanggal: form.tanggal,
      sales_id: form.sales_id ?? 0,
      keterangan: form.keterangan || null,
      no_faktur_pajak: form.no_faktur_pajak || null,
      is_ppn: form.is_ppn,
      ppn_id: form.ppn_id,
      diskon: form.diskon || 0,
      status: form.status,
      items: rows
        .filter(r => (r.produk_id || 0) > 0 && Number(r.qty || 0) > 0)
        .map(r => ({
          produk_id: r.produk_id as number,
          qty: Number(r.qty),
          harga: Number(r.harga),
          diskon: Number(r.diskon || 0),
          status_produksi: Number(r.status_produksi || 0),
          keterangan: r.keterangan || null
        })),
      biaya_tambahan: costs
    }
    return this.createOrder(payload)
  }

  public async update(
    id: number,
    form: SalesOrderFormValues,
    rows: SalesOrderProductRow[],
    costs?: Array<{ komponen: string; jumlah: number }>,
    variant?: SalesOrderVariantKey
  ): Promise<SalesOrderWithDetails> {
    const payload: SalesOrderUpdatePayload = {
      id,
      variant,
      kode: form.kode,
      customer_id: form.customer_id as number,
      tanggal: form.tanggal,
      sales_id: form.sales_id ?? 0,
      keterangan: form.keterangan || null,
      no_faktur_pajak: form.no_faktur_pajak || null,
      is_ppn: form.is_ppn,
      ppn_id: form.ppn_id,
      diskon: form.diskon || 0,
      status: form.status,
      items: rows
        .filter(r => (r.produk_id || 0) > 0 && Number(r.qty || 0) > 0)
        .map(r => ({
          produk_id: r.produk_id as number,
          qty: Number(r.qty),
          harga: Number(r.harga),
          diskon: Number(r.diskon || 0),
          status_produksi: Number(r.status_produksi || 0),
          keterangan: r.keterangan || null
        })),
      biaya_tambahan: costs
    }
    return this.updateOrder(payload)
  }

  public async delete(id: number): Promise<boolean> {
    const record = this.orders.find(o => o.id === Number(id))
    if (!record) return false
    record.status_aktif = 0
    return true
  }

  public async incrementPrintCount(id: number): Promise<number> {
    return this.incrementPrintCounter(id)
  }

  public async resetPrintCount(id: number): Promise<boolean> {
    return this.resetPrintCounter(id)
  }

  /**
   * Mengambil analisis kebutuhan kekurangan stok produksi untuk Sales Order.
   */
  public async getProductionRequirements(id: number): Promise<ProductionRequirementAnalysis> {
    const res = await apiClient<ProductionRequirementAnalysis>(`/sales-orders/${id}/production-requirements`)
    if (res && res.data) {
      return res.data
    }
    throw new Error('Gagal memuat kebutuhan produksi Sales Order.')
  }

  /**
   * Mengambil daftar transaksi produksi yang terhubung ke Sales Order beserta ringkasan statusnya.
   */
  public async getLinkedProductions(id: number): Promise<LinkedProductionsResponse> {
    const res = await apiClient<LinkedProductionsResponse>(`/sales-orders/${id}/productions`)
    if (res && res.data) {
      return res.data
    }
    throw new Error('Gagal memuat relasi transaksi produksi.')
  }

  /**
   * Menyelaraskan/membuat perintah produksi secara manual (Recovery Sync Endpoint).
   */
  public async syncProduction(id: number): Promise<ProductionSyncResponse> {
    const res = await apiClient<ProductionSyncResponse>(`/sales-orders/${id}/sync-production`, {
      method: 'POST'
    })
    if (res && res.data) {
      return res.data
    }
    throw new Error('Gagal melakukan sinkronisasi produksi.')
  }

  /* =========================================================================
     PRIVATE HELPERS
     ========================================================================= */
  private resolveCustomer(customerId: number) {
    return customerService.getRawItems().find(c => c.id === customerId)
  }

  private resolveSalesPerson(salesId: number): SalesPerson | undefined {
    if (!salesId || salesId === 0) return undefined
    return this.salesPersons.find(s => s.id === salesId)
  }

  private resolveOrderVariant(orderType: string): SalesOrderVariantKey {
    switch (orderType) {
      case 'PPN':
        return 'impact'
      case 'NON_PPN':
        return 'pola'
      case 'NON_PPN_2':
        return 'ks'
      default:
        return 'impact'
    }
  }
}

export const salesOrderTransactionService = new SalesOrderTransactionService()
