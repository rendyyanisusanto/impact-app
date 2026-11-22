import type { PaginatedResponse } from '@/shared/types/crud.types'
import type {
  TemplateProduk,
  DetailTemplateProduk,
  BomTemplateViewDetail,
  BomListItem,
  BomTemplateWithItems,
  BomCreatePayload,
  BomUpdatePayload,
  BomFilterParams,
  MaterialRequirementSimulation
} from '../types/bom.types'
import { INITIAL_MOCK_BOM_TEMPLATES, INITIAL_MOCK_BOM_DETAILS } from '../mocks/bom.mock'
import { productService } from '@/modules/inventory/products/services/product.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { referenceService } from '@/shared/services/reference.service'
import { assertPermission } from '@/shared/services/service-guard'
import { calculateMaterialRequirements, roundToDecimal } from '../utils/bom-calculations'

export class MockBomService {
  private templates: TemplateProduk[] = []
  private details: DetailTemplateProduk[] = []
  private nextTemplateId = 100
  private nextDetailId = 500

  constructor() {
    this.reset()
  }

  reset(): void {
    this.templates = JSON.parse(JSON.stringify(INITIAL_MOCK_BOM_TEMPLATES))
    this.details = JSON.parse(JSON.stringify(INITIAL_MOCK_BOM_DETAILS))
    this.nextTemplateId = 100
    this.nextDetailId = 500
  }

  getRawTemplates(): TemplateProduk[] {
    return this.templates
  }

  getRawDetails(): DetailTemplateProduk[] {
    return this.details
  }

  /**
   * List templates with pagination, search, and product filter
   */
  async getTemplates(params: BomFilterParams = {}): Promise<PaginatedResponse<BomListItem>> {
    assertPermission('production', 'read')

    const page = params.page || 1
    const limit = params.limit || 10
    const search = (params.search || '').trim().toLowerCase()
    const produkId = params.produk_id
    const statusAktif = params.status_aktif

    const products = productService.getRawItems()
    const materials = materialService.getRawItems()

    // 1. Filter by active status
    let filtered = this.templates.filter(t => {
      if (statusAktif !== undefined && statusAktif !== 'all') {
        return t.status_aktif === Number(statusAktif)
      }
      return t.status_aktif === 1 // default only active
    })

    // 2. Filter by Product ID
    if (produkId !== undefined && produkId !== 'all') {
      filtered = filtered.filter(t => t.produk_id === Number(produkId))
    }

    // 3. Filter by Search Query
    if (search) {
      filtered = filtered.filter(t => {
        const prod = products.find(p => p.id === t.produk_id)
        const matchKode = (t.kode || '').toLowerCase().includes(search)
        const matchNama = (t.nama || '').toLowerCase().includes(search)
        const matchProdNama = prod?.nama ? prod.nama.toLowerCase().includes(search) : false
        const matchProdKode = prod?.kode ? prod.kode.toLowerCase().includes(search) : false
        return matchKode || matchNama || matchProdNama || matchProdKode
      })
    }

    // 4. Map to BomListItem with ViewModel calculations
    const listItems: BomListItem[] = filtered.map(t => {
      const prod = products.find(p => p.id === t.produk_id)
      const templateDetails = this.details.filter(d => d.template_produk_id === t.id)

      let totalBiaya = 0
      for (const d of templateDetails) {
        const mat = materials.find(m => m.id === d.bahan_id)
        const harga = Number(mat?.harga_satuan || 0)
        const qty = d.qty || 0
        totalBiaya += qty * harga
      }

      return {
        id: t.id,
        kode: t.kode || `TPL-${t.id}`,
        nama: t.nama || '-',
        produk_id: t.produk_id || 0,
        kode_produk: prod?.kode || '-',
        nama_produk: prod?.nama || `Produk #${t.produk_id}`,
        kategori_produk: prod ? `Kategori #${prod.kategori_barang_id}` : '-',
        total_items: templateDetails.length,
        total_estimasi_biaya: roundToDecimal(totalBiaya, 2),
        status_aktif: t.status_aktif ?? 1
      }
    })

    // 5. Sorting
    const sortBy = params.sortBy || 'id'
    const sortOrder = params.sortOrder || 'desc'
    listItems.sort((a, b) => {
      const valA = (a as unknown as Record<string, unknown>)[sortBy]
      const valB = (b as unknown as Record<string, unknown>)[sortBy]
      if (valA === valB) return 0
      if (valA === undefined || valA === null) return 1
      if (valB === undefined || valB === null) return -1
      const res = valA > valB ? 1 : -1
      return sortOrder === 'asc' ? res : -res
    })

    // 6. Pagination
    const total = listItems.length
    const totalPages = Math.ceil(total / limit) || 1
    const start = (page - 1) * limit
    const paginatedData = listItems.slice(start, start + limit)

    return {
      data: paginatedData,
      total,
      page,
      pageSize: limit,
      totalPages
    }
  }

  /**
   * Get single template by ID with enriched items
   */
  async getTemplateById(id: number): Promise<BomTemplateWithItems | null> {
    assertPermission('production', 'read')

    const template = this.templates.find(t => t.id === id)
    if (!template) return null

    const products = productService.getRawItems()
    const materials = materialService.getRawItems()
    const prod = products.find(p => p.id === template.produk_id)

    const rawDetails = this.details.filter(d => d.template_produk_id === id)
    const items: BomTemplateViewDetail[] = rawDetails.map(d => {
      const mat = materials.find(m => m.id === d.bahan_id)
      const qty = d.qty || 0
      const hargaSatuan = Number(mat?.harga_satuan || 0)
      const estimasiBiaya = roundToDecimal(qty * hargaSatuan, 2)
      const namaSatuan = referenceService.getUsageUnitName(d.satuan_id) || 'Unit'

      return {
        id: d.id,
        template_produk_id: d.template_produk_id || template.id,
        produk_id: d.produk_id || template.produk_id || 0,
        bahan_id: d.bahan_id || 0,
        kode_bahan: mat?.kode || `MAT-${d.bahan_id}`,
        nama_bahan: mat?.nama || `Bahan #${d.bahan_id}`,
        satuan_id: d.satuan_id || 0,
        nama_satuan: namaSatuan,
        qty,
        harga_satuan: hargaSatuan,
        estimasi_biaya: estimasiBiaya,
        stok_tersedia: Number(mat?.qty || 0)
      }
    })

    const totalEstimasiBiaya = items.reduce((sum, i) => sum + i.estimasi_biaya, 0)

    return {
      ...template,
      kode: template.kode || `TPL-${template.id}`,
      nama: template.nama || '-',
      produk_id: template.produk_id || 0,
      kode_produk: prod?.kode || '-',
      nama_produk: prod?.nama || `Produk #${template.produk_id}`,
      kategori_produk: prod ? `Kategori #${prod.kategori_barang_id}` : '-',
      satuan_produk: prod ? referenceService.getProductUnitName(prod.satuan_barang_id) : 'Pcs',
      items,
      total_items: items.length,
      total_estimasi_biaya: roundToDecimal(totalEstimasiBiaya, 2)
    }
  }

  /**
   * Get active template for a specific product ID
   */
  async getTemplateByProductId(productId: number): Promise<BomTemplateWithItems | null> {
    assertPermission('production', 'read')
    const template = this.templates.find(t => t.produk_id === productId && t.status_aktif === 1)
    if (!template) return null
    return this.getTemplateById(template.id)
  }

  /**
   * Generate next auto sequence code: TPL-{year}{month}-{seq}
   */
  async generateTemplateCode(): Promise<string> {
    const now = new Date()
    const year = String(now.getFullYear())
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const prefix = `TPL-${year}${month}-`

    const matching = this.templates.map(t => t.kode || '').filter(k => k.startsWith(prefix))
    const nextSeq = String(matching.length + 1).padStart(3, '0')
    return `${prefix}${nextSeq}`
  }

  /**
   * Alias for generateTemplateCode
   */
  async generateNextCode(): Promise<string> {
    return this.generateTemplateCode()
  }

  /**
   * Create new BoM template
   * NOTE: BoM is purely recipe master data; does NOT mutate stock balances!
   */
  async createTemplate(payload: BomCreatePayload): Promise<TemplateProduk> {
    assertPermission('production', 'create')

    if (!payload.produk_id) {
      throw new Error('Produk furniture harus dipilih.')
    }

    if (!payload.nama || payload.nama.trim() === '') {
      throw new Error('Nama template produk tidak boleh kosong.')
    }

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Minimal harus menambahkan satu bahan baku ke dalam komposisi produk.')
    }

    // Check duplicate bahan_id in the same template
    const bahanIdSet = new Set<number>()
    for (const item of payload.items) {
      if (!item.bahan_id) {
        throw new Error('Ada baris bahan yang belum dipilih.')
      }
      if (bahanIdSet.has(item.bahan_id)) {
        throw new Error('Bahan baku tidak boleh duplikat dalam satu template produk.')
      }
      bahanIdSet.add(item.bahan_id)

      if (item.qty <= 0) {
        throw new Error('Kuantitas kebutuhan bahan harus bernilai lebih dari 0.')
      }
    }

    const kode =
      payload.kode && payload.kode.trim() ? payload.kode.trim() : await this.generateTemplateCode()

    const newTemplate: TemplateProduk = {
      id: ++this.nextTemplateId,
      kode,
      nama: payload.nama.trim(),
      produk_id: payload.produk_id,
      status_aktif: payload.status_aktif ?? 1
    }

    this.templates.unshift(newTemplate)

    // Save details atomically
    for (const item of payload.items) {
      const newDetail: DetailTemplateProduk = {
        id: ++this.nextDetailId,
        template_produk_id: newTemplate.id,
        produk_id: newTemplate.produk_id,
        bahan_id: item.bahan_id,
        satuan_id: item.satuan_id,
        qty: item.qty
      }
      this.details.push(newDetail)
    }

    return newTemplate
  }

  /**
   * Update existing BoM template
   * NOTE: BoM is purely recipe master data; does NOT mutate stock balances!
   */
  async updateTemplate(id: number, payload: BomUpdatePayload): Promise<TemplateProduk> {
    assertPermission('production', 'update')

    const index = this.templates.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error(`Template produk dengan ID ${id} tidak ditemukan.`)
    }

    const existing = this.templates[index]

    if (payload.nama !== undefined && payload.nama.trim() === '') {
      throw new Error('Nama template produk tidak boleh kosong.')
    }

    if (payload.items !== undefined) {
      if (payload.items.length === 0) {
        throw new Error('Minimal harus menambahkan satu bahan baku ke dalam komposisi produk.')
      }

      const bahanIdSet = new Set<number>()
      for (const item of payload.items) {
        if (!item.bahan_id) {
          throw new Error('Ada baris bahan yang belum dipilih.')
        }
        if (bahanIdSet.has(item.bahan_id)) {
          throw new Error('Bahan baku tidak boleh duplikat dalam satu template produk.')
        }
        bahanIdSet.add(item.bahan_id)

        if (item.qty <= 0) {
          throw new Error('Kuantitas kebutuhan bahan harus bernilai lebih dari 0.')
        }
      }
    }

    // Update header
    const updated: TemplateProduk = {
      ...existing,
      kode: payload.kode !== undefined ? payload.kode.trim() : existing.kode,
      nama: payload.nama !== undefined ? payload.nama.trim() : existing.nama,
      produk_id: payload.produk_id !== undefined ? payload.produk_id : existing.produk_id,
      status_aktif:
        payload.status_aktif !== undefined ? payload.status_aktif : existing.status_aktif
    }

    this.templates[index] = updated

    // Replace details atomically if provided
    if (payload.items !== undefined) {
      this.details = this.details.filter(d => d.template_produk_id !== id)
      for (const item of payload.items) {
        this.details.push({
          id: ++this.nextDetailId,
          template_produk_id: id,
          produk_id: updated.produk_id,
          bahan_id: item.bahan_id,
          satuan_id: item.satuan_id,
          qty: item.qty
        })
      }
    }

    return updated
  }

  /**
   * Delete / Deactivate template safely
   * NOTE: Does NOT mutate stock balances!
   */
  async deleteTemplate(id: number): Promise<void> {
    assertPermission('production', 'delete')

    const index = this.templates.findIndex(t => t.id === id)
    if (index === -1) {
      throw new Error(`Template produk dengan ID ${id} tidak ditemukan.`)
    }

    // Soft delete: mark status_aktif = 0
    this.templates[index].status_aktif = 0
  }

  /**
   * Duplicate existing template
   * Clones material composition under a new unique template code
   */
  async duplicateTemplate(
    sourceTemplateId: number,
    targetProdukId?: number,
    customNama?: string
  ): Promise<TemplateProduk> {
    assertPermission('production', 'create')

    const source = await this.getTemplateById(sourceTemplateId)
    if (!source) {
      throw new Error(`Template sumber dengan ID ${sourceTemplateId} tidak ditemukan.`)
    }

    const newKode = await this.generateTemplateCode()
    const newNama = customNama?.trim() || `${source.nama} (Salinan)`
    const newProdukId = targetProdukId || source.produk_id

    const duplicated = await this.createTemplate({
      kode: newKode,
      nama: newNama,
      produk_id: newProdukId,
      status_aktif: 1,
      items: source.items.map(item => ({
        bahan_id: item.bahan_id,
        satuan_id: item.satuan_id,
        qty: item.qty
      }))
    })

    return duplicated
  }

  /**
   * Simulate material requirements for production target
   * Read-only simulation preview, NO stock deduction!
   */
  async simulateRequirements(
    templateId: number,
    targetProduksi: number
  ): Promise<MaterialRequirementSimulation> {
    assertPermission('production', 'read')

    const template = await this.getTemplateById(templateId)
    if (!template) {
      throw new Error(`Template produk dengan ID ${templateId} tidak ditemukan.`)
    }

    return calculateMaterialRequirements(
      template.id,
      template.kode,
      template.produk_id,
      template.nama_produk,
      template.items,
      targetProduksi
    )
  }

  /**
   * Get selectable products for dropdown
   */
  async getSelectableProducts(): Promise<
    Array<{
      id: number
      kode: string
      nama: string
      satuan_id: number
      satuan_nama: string
      harga: number
      kategori_nama: string
    }>
  > {
    const products = productService.getRawItems()
    return products
      .filter(p => p.status === 1)
      .map(p => ({
        id: p.id,
        kode: p.kode || '',
        nama: p.nama || '',
        satuan_id: p.satuan_barang_id || 1,
        satuan_nama: referenceService.getProductUnitName(p.satuan_barang_id) || 'Pcs',
        harga: Number(p.harga || 0),
        kategori_nama: `Kategori #${p.kategori_barang_id}`
      }))
  }

  /**
   * Get selectable materials for picker modal
   */
  async getSelectableMaterials(): Promise<
    Array<{
      id: number
      kode: string
      nama: string
      satuan_id: number
      satuan_nama: string
      qty: number
      harga_satuan: number
      gudang_nama: string
    }>
  > {
    const materials = materialService.getRawItems()
    return materials
      .filter(m => m.status === 1)
      .map(m => ({
        id: m.id,
        kode: m.kode || '',
        nama: m.nama || '',
        satuan_id: m.satuan_pakai_id || 1,
        satuan_nama: referenceService.getUsageUnitName(m.satuan_pakai_id) || 'Unit',
        qty: Number(m.qty || 0),
        harga_satuan: Number(m.harga_satuan || 0),
        gudang_nama: referenceService.getWarehouseName(m.gudang_id) || 'Gudang Utama'
      }))
  }
}

export const bomService = new MockBomService()
