import type { PaginatedResponse } from '@/shared/types/crud.types'
import type {
  Produksi,
  DetailProduksiProduk,
  DetailBahanProduksi,
  KartuStokProduk,
  ProductionListItem,
  ProductionWithItems,
  ProductionCreatePayload,
  ProductionUpdatePayload,
  ProductionFilters,
  SelectableProduct,
  ProductionPostingResult
} from '../types/production.types'
import {
  INITIAL_MOCK_PRODUKSI,
  INITIAL_MOCK_DETAIL_PRODUKSI_PRODUK,
  INITIAL_MOCK_KARTU_STOK_PRODUK,
  INITIAL_MOCK_DETAIL_BAHAN_PRODUKSI
} from '../mocks/production.mock'
import { productService } from '@/modules/inventory/products/services/product.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { bomService } from './bom.service'
import { assertPermission } from '@/shared/services/service-guard'
import {
  formatProductionCode,
  parseProductionCode,
  calculateProductionTotals,
  calculateProductionMaterialRequirements
} from '../utils/production-calculations'
import { validateProductionPayload } from '../utils/production-validation'
import { apiClient } from '@/shared/services/api-client'

export class MockProductionService {
  private productions: Produksi[] = []
  private productDetails: DetailProduksiProduk[] = []
  private materialDetails: DetailBahanProduksi[] = []
  private productStockCards: KartuStokProduk[] = []
  private postedProductionIds = new Set<number>()
  private reversedProductionIds = new Set<number>()
  private nextProductionId = 100
  private nextProductDetailId = 500
  private nextMaterialDetailId = 500
  private nextStockCardId = 500

  constructor() {
    this.reset()
  }

  reset(): void {
    this.productions = JSON.parse(JSON.stringify(INITIAL_MOCK_PRODUKSI))
    this.productDetails = JSON.parse(JSON.stringify(INITIAL_MOCK_DETAIL_PRODUKSI_PRODUK))
    this.materialDetails = JSON.parse(JSON.stringify(INITIAL_MOCK_DETAIL_BAHAN_PRODUKSI))
    this.productStockCards = JSON.parse(JSON.stringify(INITIAL_MOCK_KARTU_STOK_PRODUK))
    this.postedProductionIds.clear()
    this.reversedProductionIds.clear()

    // Mark initial posted production #1
    this.postedProductionIds.add(1)

    this.nextProductionId = 100
    this.nextProductDetailId = 500
    this.nextMaterialDetailId = 500
    this.nextStockCardId = 500
  }

  getRawProductions(): Produksi[] {
    return this.productions
  }

  getRawProductDetails(): DetailProduksiProduk[] {
    return this.productDetails
  }

  getRawProductStockCards(): KartuStokProduk[] {
    return this.productStockCards
  }

  isProductionPosted(productionId: number): boolean {
    return this.postedProductionIds.has(productionId)
  }

  isProductionReversed(productionId: number): boolean {
    return this.reversedProductionIds.has(productionId)
  }

  /**
   * List production transactions with pagination, search, and filters
   */
  async getProductions(
    params: ProductionFilters = {}
  ): Promise<PaginatedResponse<ProductionListItem>> {
    assertPermission('production', 'read')

    const page = params.page || 1
    const limit = params.limit || 10

    // Coba ambil dari backend API terlebih dahulu
    try {
      const q = new URLSearchParams()
      q.append('page', String(page))
      q.append('limit', String(limit))
      if (params.search) q.append('search', params.search)
      if (params.start_date) q.append('start_date', params.start_date)
      if (params.end_date) q.append('end_date', params.end_date)
      if (params.jenis_produksi !== undefined && params.jenis_produksi !== 'all') {
        q.append('jenis_produksi', String(params.jenis_produksi))
      }
      if (params.status_produksi !== undefined && params.status_produksi !== 'all') {
        q.append('status_produksi', String(params.status_produksi))
      }
      if (params.status_aktif !== undefined && params.status_aktif !== 'all') {
        q.append('status_aktif', String(params.status_aktif))
      }
      if (params.sortBy) q.append('sortBy', params.sortBy)
      if (params.sortOrder) q.append('sortOrder', params.sortOrder)

      const res = await apiClient<any[]>(`/production?${q.toString()}`)
      if (res && res.data) {
        const total = (res as any).pagination?.totalItems ?? res.meta?.totalItems ?? res.data.length
        const totalPages =
          (res as any).pagination?.totalPages ?? res.meta?.totalPages ?? (Math.ceil(total / limit) || 1)

        return {
          data: res.data,
          total,
          page,
          pageSize: limit,
          totalPages
        }
      }
    } catch {
      // Fallback ke in-memory mock jika API belum terhubung atau saat offline
    }

    const search = (params.search || '').trim().toLowerCase()
    const startDate = params.start_date
    const endDate = params.end_date
    const jenisProduksi = params.jenis_produksi
    const statusProduksi = params.status_produksi
    const statusAktif = params.status_aktif

    // 1. Filter by Active Status
    let filtered = this.productions.filter(p => {
      if (statusAktif !== undefined && statusAktif !== 'all') {
        return p.status_aktif === Number(statusAktif)
      }
      return p.status_aktif === 1 // default only active
    })

    // 2. Filter by Date Range
    if (startDate) {
      filtered = filtered.filter(p => (p.tanggal || '') >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(p => (p.tanggal || '') <= endDate)
    }

    // 3. Filter by Jenis Produksi (1 = Pesanan, 0 = Non Pesanan)
    if (jenisProduksi !== undefined && jenisProduksi !== 'all') {
      filtered = filtered.filter(p => p.jenis_produksi === Number(jenisProduksi))
    }

    // 4. Filter by Status Produksi (0 = Pending, 1 = Proses, 2 = Selesai)
    if (statusProduksi !== undefined && statusProduksi !== 'all') {
      filtered = filtered.filter(p => p.status_produksi === Number(statusProduksi))
    }

    // 5. Filter by Search Query (No Produksi, Keterangan)
    if (search) {
      filtered = filtered.filter(p => {
        const matchKode = (p.kode || '').toLowerCase().includes(search)
        const matchKet = (p.keterangan || '').toLowerCase().includes(search)
        return matchKode || matchKet
      })
    }

    // 6. Map to ProductionListItem ViewModel
    const listItems: ProductionListItem[] = filtered.map(p => {
      const items = this.productDetails.filter(d => d.produksi_id === p.id)
      const totals = calculateProductionTotals(items)

      const jenisLabel = p.jenis_produksi === 1 ? 'Pesanan' : 'Non Pesanan / Stok'
      const statusProdLabel =
        p.status_produksi === 2 ? 'Selesai' : p.status_produksi === 1 ? 'Proses' : 'Pending'
      const statusDocLabel = p.status === 1 ? 'Posted' : 'Draft'

      return {
        id: p.id,
        kode: p.kode || `PD-${p.id}`,
        tanggal: p.tanggal || '',
        jenis_produksi: p.jenis_produksi,
        jenis_label: jenisLabel,
        status_produksi: p.status_produksi ?? 0,
        status_produksi_label: statusProdLabel,
        status: p.status ?? 0,
        status_label: statusDocLabel,
        status_aktif: p.status_aktif,
        jumlah_jenis_produk: totals.distinctProducts,
        total_qty: totals.totalQty,
        keterangan: p.keterangan || '',
        so_id: p.so_id,
        customer_id: p.customer_id,
        is_posted: this.isProductionPosted(p.id)
      }
    })

    // 7. Sort (default descending by date and ID)
    const sortBy = params.sortBy || 'id'
    const sortOrder = params.sortOrder || 'desc'

    listItems.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'tanggal') {
        comparison = a.tanggal.localeCompare(b.tanggal)
      } else if (sortBy === 'kode') {
        comparison = a.kode.localeCompare(b.kode)
      } else if (sortBy === 'total_qty') {
        comparison = a.total_qty - b.total_qty
      } else {
        comparison = a.id - b.id
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    const total = listItems.length
    const startIndex = (page - 1) * limit
    const data = listItems.slice(startIndex, startIndex + limit)

    return {
      data,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  /**
   * Get single production order by ID with enriched items & material requirements preview
   */
  async getProductionById(id: number): Promise<ProductionWithItems | null> {
    assertPermission('production', 'read')

    // Coba ambil dari backend API terlebih dahulu
    try {
      const res = await apiClient<ProductionWithItems>(`/production/${id}`)
      if (res && res.data) {
        return res.data
      }
    } catch {
      // Fallback ke in-memory mock
    }

    const prod = this.productions.find(p => p.id === id)
    if (!prod) return null

    const allProducts = productService.getRawItems()
    const allMaterials = materialService.getRawItems()

    const rawDetails = this.productDetails.filter(d => d.produksi_id === id)

    // Enrich rows
    const items = await Promise.all(
      rawDetails.map(async d => {
        const product = allProducts.find(p => p.id === d.produk_id)
        const bom = d.produk_id ? await bomService.getTemplateByProductId(d.produk_id) : null

        return {
          rowId: `row-${d.id}`,
          detailId: d.id,
          produk_id: d.produk_id,
          kode_produk: product?.kode || `PROD-${d.produk_id}`,
          nama_produk: product?.nama || `Produk #${d.produk_id}`,
          stok: Number(product?.qty || 0),
          qty: Number(d.qty || 0),
          keterangan: d.keterangan || '',
          satuan_nama: product?.satuan_barang_nama || 'Pcs',
          has_bom: !!bom
        }
      })
    )

    const totals = calculateProductionTotals(items)

    // Calculate material requirements from BoM templates
    const productBomMap = new Map()
    for (const item of items) {
      if (item.produk_id && !productBomMap.has(item.produk_id)) {
        const bom = await bomService.getTemplateByProductId(item.produk_id)
        productBomMap.set(item.produk_id, bom)
      }
    }

    const materialRequirements = calculateProductionMaterialRequirements(
      items.map(i => ({ produk_id: i.produk_id || 0, qty: i.qty })),
      productBomMap,
      allMaterials.map(m => ({
        id: m.id,
        kode: m.kode || '',
        nama: m.nama || '',
        satuan_id: m.satuan_pakai_id || 1,
        satuan_nama: m.satuan_pakai_nama || 'Satuan',
        qty: Number(m.qty || 0)
      }))
    )

    const hasUnassignedBom = items.some(i => i.produk_id && !i.has_bom)

    return {
      ...prod,
      items,
      is_posted: this.isProductionPosted(prod.id),
      total_qty: totals.totalQty,
      jumlah_jenis_produk: totals.distinctProducts,
      material_requirements: materialRequirements,
      has_unassigned_bom: hasUnassignedBom
    }
  }

  /**
   * Generates auto production code: PD{month}{year}-{last_number}
   */
  generateProductionCode(dateStr?: string): string {
    const d = dateStr ? new Date(dateStr) : new Date()
    const targetMonth = d.getMonth() + 1
    const targetYear = parseInt(String(d.getFullYear()).slice(-2), 10)

    let maxSeq = 0
    for (const p of this.productions) {
      if (!p.kode) continue
      const parsed = parseProductionCode(p.kode)
      if (parsed && parsed.month === targetMonth && parsed.year === targetYear) {
        if (parsed.sequence > maxSeq) {
          maxSeq = parsed.sequence
        }
      }
    }

    return formatProductionCode(d, maxSeq + 1, 4)
  }

  /**
   * Check if code is unique
   */
  isCodeUnique(code: string, excludeId?: number): boolean {
    const normalized = code.trim().toLowerCase()
    return !this.productions.some(
      p => p.kode?.trim().toLowerCase() === normalized && p.id !== excludeId
    )
  }

  /**
   * Create production order atomically (Header + Details)
   */
  async createProduction(payload: ProductionCreatePayload): Promise<ProductionWithItems> {
    assertPermission('production', 'create')
    validateProductionPayload(payload)

    // Coba simpan ke API backend terlebih dahulu
    try {
      const res = await apiClient<any>('/production', {
        method: 'POST',
        body: JSON.stringify({
          kode: payload.kode,
          tanggal: payload.tanggal,
          jenis_produksi: payload.jenis_produksi,
          status_produksi: payload.status_produksi ?? 0,
          keterangan: payload.keterangan || null,
          items: payload.items.filter(it => it.produk_id && it.qty > 0)
        })
      })

      if (res && res.data?.id) {
        const full = await this.getProductionById(res.data.id)
        if (full) return full
      }
    } catch (err: any) {
      if (err?.code !== 'NETWORK_ERROR' && !err?.message?.includes('fetch')) {
        throw err
      }
      // Fallback ke in-memory mock untuk unit test lingkungan isolasi
    }

    const kode = payload.kode?.trim() || this.generateProductionCode(payload.tanggal)

    if (!this.isCodeUnique(kode)) {
      throw new Error(`Nomor produksi '${kode}' sudah digunakan. Silakan gunakan nomor lain.`)
    }

    const newProdId = this.nextProductionId++

    const newHeader: Produksi = {
      id: newProdId,
      kode,
      tanggal: payload.tanggal,
      jenis_produksi: payload.jenis_produksi,
      status_produksi: payload.status_produksi ?? 0,
      status: payload.status_produksi === 2 ? 1 : 0,
      keterangan: payload.keterangan || '',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      created_by: 1,
      updated_at: null,
      updated_by: null,
      so_id: null,
      customer_id: null,
      status_aktif: 1,
      biaya_produksi: 0,
      uuid: `uuid-prod-${newProdId}`
    }

    const newDetails: DetailProduksiProduk[] = payload.items
      .filter(item => item.produk_id && item.qty > 0)
      .map(item => ({
        id: this.nextProductDetailId++,
        produksi_id: newProdId,
        produk_id: item.produk_id,
        qty: item.qty,
        keterangan: item.keterangan || null
      }))

    // Save atomically in repository
    this.productions.unshift(newHeader)
    this.productDetails.push(...newDetails)

    // If created directly with status Selesai (2), post stock automatically
    if (newHeader.status_produksi === 2) {
      await this.postProduction(newProdId)
    }

    const created = await this.getProductionById(newProdId)
    if (!created) {
      throw new Error('Gagal memuat transaksi produksi yang baru dibuat.')
    }
    return created
  }

  /**
   * Update production order atomically (Header + Details)
   */
  async updateProduction(payload: ProductionUpdatePayload): Promise<ProductionWithItems> {
    assertPermission('production', 'update')
    validateProductionPayload(payload)

    // Coba perbarui via API backend terlebih dahulu
    try {
      const res = await apiClient<any>(`/production/${payload.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          kode: payload.kode,
          tanggal: payload.tanggal,
          jenis_produksi: payload.jenis_produksi,
          status_produksi: payload.status_produksi,
          keterangan: payload.keterangan || null,
          items: payload.items.filter(it => it.produk_id && it.qty > 0)
        })
      })

      if (res && (res.data?.id || res.data)) {
        const full = await this.getProductionById(res.data?.id || payload.id)
        if (full) return full
      }
    } catch (err: any) {
      const isMockItem = this.productions.some(p => p.id === payload.id)
      if (!isMockItem || (err?.code !== 'NETWORK_ERROR' && !err?.message?.includes('fetch'))) {
        throw err
      }
      // Fallback ke in-memory mock untuk unit test lingkungan isolasi
    }

    const existingIndex = this.productions.findIndex(p => p.id === payload.id)
    if (existingIndex === -1) {
      throw new Error(`Transaksi produksi dengan ID ${payload.id} tidak ditemukan.`)
    }

    const existing = this.productions[existingIndex]

    if (this.isProductionPosted(payload.id)) {
      throw new Error(
        'Transaksi produksi telah diposting dan selesai. Perubahan rincian produk diblokir untuk mencegah ketidakkonsistenan stok.'
      )
    }

    if (payload.kode && !this.isCodeUnique(payload.kode, payload.id)) {
      throw new Error(`Nomor produksi '${payload.kode}' sudah digunakan.`)
    }

    // Update Header
    const updatedHeader: Produksi = {
      ...existing,
      kode: payload.kode?.trim() || existing.kode,
      tanggal: payload.tanggal,
      jenis_produksi: payload.jenis_produksi,
      status_produksi: payload.status_produksi,
      keterangan: payload.keterangan || '',
      updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      updated_by: 1
    }

    // Replace details atomically
    this.productDetails = this.productDetails.filter(d => d.produksi_id !== payload.id)

    const newDetails: DetailProduksiProduk[] = payload.items
      .filter(item => item.produk_id && item.qty > 0)
      .map(item => ({
        id: this.nextProductDetailId++,
        produksi_id: payload.id,
        produk_id: item.produk_id,
        qty: item.qty,
        keterangan: item.keterangan || null
      }))

    this.productions[existingIndex] = updatedHeader
    this.productDetails.push(...newDetails)

    // If transitioned to Selesai (2), post stock
    if (updatedHeader.status_produksi === 2 && !this.isProductionPosted(payload.id)) {
      await this.postProduction(payload.id)
    }

    const updated = await this.getProductionById(payload.id)
    if (!updated) {
      throw new Error('Gagal memuat data transaksi produksi setelah diperbarui.')
    }
    return updated
  }

  /**
   * Delete or soft-delete production order
   */
  async deleteProduction(id: number): Promise<boolean> {
    assertPermission('production', 'delete')

    // Coba hapus via API backend terlebih dahulu
    try {
      const res = await apiClient<any>(`/production/${id}`, {
        method: 'DELETE'
      })
      if (res && res.data) {
        return true
      }
    } catch (err: any) {
      const isMockItem = this.productions.some(p => p.id === id)
      if (!isMockItem || (err?.code !== 'NETWORK_ERROR' && !err?.message?.includes('fetch'))) {
        throw err
      }
    }

    const prod = this.productions.find(p => p.id === id)
    if (!prod) {
      throw new Error(`Transaksi produksi dengan ID ${id} tidak ditemukan.`)
    }

    // If already posted, must cancel and reverse stock safely first
    if (this.isProductionPosted(id)) {
      await this.cancelProduction(id)
    } else {
      prod.status_aktif = 0
      prod.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19)
    }

    return true
  }

  /**
   * Post production order: increases finished goods stock and deducts raw materials based on BoM
   */
  async postProduction(id: number): Promise<ProductionPostingResult> {
    assertPermission('production', 'update')

    // Coba eksekusi penyelesaian via backend API terlebih dahulu
    try {
      const res = await apiClient<any>(`/production/${id}/complete`, {
        method: 'POST'
      })
      if (res && res.data) {
        this.postedProductionIds.add(id)
        return {
          productionId: id,
          kode: res.data.kode || '',
          posted: true,
          finishedGoodsAdded: 0,
          materialsDeducted: 0,
          message: res.data.message || 'Transaksi produksi berhasil diselesaikan dan stok telah diposting.'
        }
      }
    } catch (err: any) {
      const isMockItem = this.productions.some(p => p.id === id)
      if (!isMockItem || (err?.code !== 'NETWORK_ERROR' && !err?.message?.includes('fetch'))) {
        throw err
      }
      // Fallback ke in-memory mock jika network/API tidak tersedia
    }

    // 1. Idempotency Check
    if (this.postedProductionIds.has(id)) {
      return {
        productionId: id,
        kode: this.productions.find(p => p.id === id)?.kode || '',
        posted: true,
        finishedGoodsAdded: 0,
        materialsDeducted: 0,
        message: 'Transaksi produksi telah diposting sebelumnya (Idempotent).'
      }
    }

    const prod = this.productions.find(p => p.id === id)
    if (!prod) {
      throw new Error(`Transaksi produksi dengan ID ${id} tidak ditemukan.`)
    }

    const details = this.productDetails.filter(d => d.produksi_id === id)
    if (details.length === 0) {
      throw new Error('Tidak dapat memposting produksi tanpa rincian produk.')
    }

    let finishedGoodsCount = 0
    let materialsDeductedCount = 0

    const allProducts = productService.getRawItems()
    const allMaterials = materialService.getRawItems()

    // 2. Finished Goods Stock Addition (kartu_stok_produk + produk.qty)
    for (const item of details) {
      if (!item.produk_id || !item.qty || item.qty <= 0) continue

      // A. Increase product stock in productService
      const currentProduct = allProducts.find(p => p.id === item.produk_id)
      if (currentProduct) {
        currentProduct.qty = (currentProduct.qty || 0) + item.qty
      }

      // B. Insert into kartu_stok_produk
      this.productStockCards.push({
        id: this.nextStockCardId++,
        tanggal: prod.tanggal || new Date().toISOString().slice(0, 10),
        produk_id: item.produk_id,
        masuk: item.qty,
        keluar: 0,
        keterangan: `Produksi (${prod.kode}) pada tanggal ${prod.tanggal}`
      })

      finishedGoodsCount += item.qty

      // 3. Raw Materials Consumption from BoM (Trigger detail_bahan_produksi simulation)
      const bom = await bomService.getTemplateByProductId(item.produk_id)
      if (bom && bom.items && bom.items.length > 0) {
        for (const matRow of bom.items) {
          if (!matRow.bahan_id || !matRow.qty || matRow.qty <= 0) continue

          const consumedQty = matRow.qty * item.qty

          // Deduct from materialService
          const mat = allMaterials.find(m => m.id === matRow.bahan_id)
          if (mat) {
            const currentMatQty = Number(mat.qty || 0)
            mat.qty = Math.max(0, currentMatQty - consumedQty)
          }

          // Record detail_bahan_produksi
          this.materialDetails.push({
            id: this.nextMaterialDetailId++,
            produksi_id: prod.id,
            produk_id: item.produk_id,
            bahan_id: matRow.bahan_id,
            qty: consumedQty,
            satuan_id: matRow.satuan_id || 1
          })

          materialsDeductedCount += consumedQty
        }
      }
    }

    // 4. Update Header Status
    prod.status = 1 // Posted
    prod.status_produksi = 2 // Selesai
    prod.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19)

    // 5. Register in postedProductionIds Set
    this.postedProductionIds.add(id)

    return {
      productionId: id,
      kode: prod.kode || '',
      posted: true,
      finishedGoodsAdded: finishedGoodsCount,
      materialsDeducted: materialsDeductedCount,
      message: 'Transaksi produksi berhasil diposting ke kartu stok produk dan saldo persediaan.'
    }
  }

  /**
   * Cancel and reverse production order atomically
   */
  async cancelProduction(id: number): Promise<boolean> {
    assertPermission('production', 'update')

    const prod = this.productions.find(p => p.id === id)
    if (!prod) {
      throw new Error(`Transaksi produksi dengan ID ${id} tidak ditemukan.`)
    }

    if (this.reversedProductionIds.has(id)) {
      throw new Error(
        'Transaksi produksi ini sudah dibatalkan sebelumnya (Reversal telah dieksekusi).'
      )
    }

    // If posted, reverse stocks
    if (this.postedProductionIds.has(id)) {
      const details = this.productDetails.filter(d => d.produksi_id === id)
      const allProducts = productService.getRawItems()
      const allMaterials = materialService.getRawItems()

      // 1. Reverse finished goods stock
      for (const item of details) {
        if (!item.produk_id || !item.qty) continue

        const currentProduct = allProducts.find(p => p.id === item.produk_id)
        if (currentProduct) {
          currentProduct.qty = Math.max(0, (currentProduct.qty || 0) - item.qty)
        }

        // Reversal entry in kartu_stok_produk
        this.productStockCards.push({
          id: this.nextStockCardId++,
          tanggal: new Date().toISOString().slice(0, 10),
          produk_id: item.produk_id,
          masuk: 0,
          keluar: item.qty,
          keterangan: `Batal Produksi (${prod.kode})`
        })
      }

      // 2. Reverse raw materials
      const consumedMaterials = this.materialDetails.filter(m => m.produksi_id === id)
      for (const matRow of consumedMaterials) {
        if (!matRow.bahan_id || !matRow.qty) continue

        const mat = allMaterials.find(m => m.id === matRow.bahan_id)
        if (mat) {
          const currentMatQty = Number(mat.qty || 0)
          mat.qty = currentMatQty + matRow.qty
        }
      }

      this.postedProductionIds.delete(id)
      this.reversedProductionIds.add(id)
    }

    prod.status = 0
    prod.status_produksi = 0
    prod.status_aktif = 0
    prod.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19)

    return true
  }

  /**
   * Update workflow status: Pending (0) -> Proses (1) -> Selesai (2)
   */
  async updateProductionStatus(id: number, newStatus: number): Promise<ProductionWithItems> {
    assertPermission('production', 'update')

    const prod = this.productions.find(p => p.id === id)
    if (!prod) {
      throw new Error(`Transaksi produksi #${id} tidak ditemukan.`)
    }

    if (this.isProductionPosted(id) && newStatus !== 2) {
      throw new Error(
        'Transaksi yang telah Selesai dan diposting tidak dapat diubah kembali ke Pending atau Proses. Gunakan aksi Batalkan untuk melakukan pembalikan saldo (reversal).'
      )
    }

    if (newStatus === 2) {
      // Transition to Selesai triggers atomic stock posting
      await this.postProduction(id)
    } else {
      prod.status_produksi = newStatus
      prod.updated_at = new Date().toISOString().replace('T', ' ').slice(0, 19)
    }

    const updated = await this.getProductionById(id)
    if (!updated) {
      throw new Error('Gagal memuat status produksi.')
    }
    return updated
  }

  /**
   * Get selectable products for product picker
   */
  async getSelectableProducts(search?: string): Promise<SelectableProduct[]> {
    assertPermission('production', 'read')

    // 1. Coba ambil produk aktual via API backend secara dinamis
    try {
      const q = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}&limit=50` : '?limit=50'
      const res = await apiClient<SelectableProduct[]>(`/production/products${q}`)
      if (res && res.data && Array.isArray(res.data)) {
        return res.data
      }
    } catch {
      // Fallback ke mock jika offline atau saat test terisolasi
    }

    // 2. Fallback mock
    let products = productService.getRawItems()
    if (search && search.trim()) {
      const s = search.toLowerCase().trim()
      products = products.filter(
        p => (p.nama || '').toLowerCase().includes(s) || (p.kode || '').toLowerCase().includes(s)
      )
    }
    const activeTemplates = bomService.getRawTemplates().filter(t => t.status_aktif === 1)

    return products
      .filter(p => p.status === 1)
      .map(p => {
        const hasBom = activeTemplates.some(t => t.produk_id === p.id)
        return {
          id: p.id,
          kode: p.kode || `PROD-${p.id}`,
          nama: p.nama || `Produk #${p.id}`,
          qty: Number(p.qty || 0),
          satuan_nama: p.satuan_barang_nama || 'Pcs',
          kategori_nama: p.kategori_barang_nama || 'Lainnya',
          gudang_nama: p.gudang_nama || 'Gudang Utama',
          harga: Number(p.harga || 0),
          has_bom: hasBom
        }
      })
  }

  getProductionTypes(): Array<{ value: number; label: string }> {
    return [
      { value: 1, label: 'Pesanan' },
      { value: 0, label: 'Non Pesanan / Stok' }
    ]
  }

  getProductionStatuses(): Array<{ value: number; label: string }> {
    return [
      { value: 0, label: 'Pending' },
      { value: 1, label: 'Proses' },
      { value: 2, label: 'Selesai' }
    ]
  }

  /**
   * Mengambil informasi Sales Order sumber untuk transaksi produksi.
   */
  async getSourceSalesOrder(productionId: number): Promise<{
    has_source_so: boolean
    sales_order: any
    message?: string
  }> {
    assertPermission('production', 'read')
    try {
      const res = await apiClient<any>(`/production/${productionId}/source-sales-order`)
      if (res && res.data) {
        return res.data
      }
    } catch {
      // fallback
    }
    return {
      has_source_so: false,
      sales_order: null
    }
  }
}

export const productionService = new MockProductionService()
