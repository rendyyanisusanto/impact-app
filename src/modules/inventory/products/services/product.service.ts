import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type { Produk, ProdukFoto, CreateProductDto, UpdateProductDto } from '../types/product.types'
import { formatCurrency } from '@/shared/utils/formatters'
import { referenceService } from '@/shared/services/reference.service'
import { assertPermission } from '@/shared/services/service-guard'
import { apiClient, getAuthToken } from '@/shared/services/api-client'

// Predefined lookups matching database schema
export const MOCK_PRODUCT_CATEGORIES = [
  { id: 1, kode: 'SB-3', nama: 'Lainnya', color: '#8e44ad', status: 1 },
  { id: 2, kode: 'SB-2', nama: 'Meja', color: '#c0392b', status: 1 },
  { id: 3, kode: 'SB-1', nama: 'Kursi', color: '#811818', status: 1 },
  { id: 4, kode: 'GD/7263129', nama: 'Kursi Coba', color: '#d31212', status: 0 }
]

export const MOCK_PRODUCT_UNITS = [
  { id: 1, kode: 'PCS', nama: 'Pcs', status: 1 },
  { id: 2, kode: 'SET', nama: 'Set', status: 1 },
  { id: 3, kode: 'UNIT', nama: 'Unit', status: 1 },
  { id: 4, kode: 'DUS', nama: 'Dus', status: 1 }
]

export const MOCK_PRODUCT_WAREHOUSES = [
  { id: 1000, kode: 'GD-7745', nama: 'Gudang Utama', status: 1, color: '#000000', alamat: 'Pogot' },
  { id: 1001, kode: 'GD-7755', nama: 'Gudang Bambe', status: 0, color: '#000000', alamat: 'Bambe' }
]

export const INITIAL_MOCK_PRODUCTS: Produk[] = [
  {
    id: 43,
    kode: 'IC - 74',
    nama: 'IC - 74 Kursi Kantor Mesh',
    qty: 24,
    min_qty: 10,
    satuan_barang_id: 1,
    harga: 200000,
    kategori_barang_id: 1,
    gudang_id: 1000,
    status: 1,
    keterangan: 'Kursi kantor mesh ergonomis roda nylon',
    uuid: 'uuid-prod-43',
    foto: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=300&auto=format&fit=crop&q=60',
    created_at: '2024-02-07 01:53:16',
    created_by: 1,
    updated_at: '2025-09-22 02:37:22',
    updated_by: 1
  },
  {
    id: 44,
    kode: 'AK - C4',
    nama: 'Kursi Tunggu Bandara 4 Dudukan',
    qty: 4,
    min_qty: 5, // low stock!
    satuan_barang_id: 1,
    harga: 1900000,
    kategori_barang_id: 3,
    gudang_id: 1000,
    status: 1,
    keterangan: 'Kursi tunggu chrome stainless steel heavy duty',
    uuid: 'uuid-prod-44',
    foto: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=300&auto=format&fit=crop&q=60',
    created_at: '2024-03-25 04:31:31',
    created_by: 1,
    updated_at: '2026-04-07 04:28:47',
    updated_by: 1
  },
  {
    id: 45,
    kode: 'ATOZ-2-010-0130-24',
    nama: 'ATOZ Kursi Pimpinan Kulit Sintetis',
    qty: 15,
    min_qty: 5,
    satuan_barang_id: 1,
    harga: 1429010,
    kategori_barang_id: 2,
    gudang_id: 1000,
    status: 1,
    keterangan: 'Kursi direktur busa royal density tinggi tilt lock',
    uuid: 'uuid-prod-45',
    foto: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&auto=format&fit=crop&q=60',
    created_at: '2024-03-25 04:31:31',
    created_by: 1,
    updated_at: '2025-08-15 03:41:43',
    updated_by: 1
  },
  {
    id: 46,
    kode: 'ATOZ-2-010-0186-24',
    nama: 'ATOZ Kursi Staff 2-010-0186-24',
    qty: 2,
    min_qty: 8, // low stock!
    satuan_barang_id: 1,
    harga: 552118,
    kategori_barang_id: 3,
    gudang_id: 1000,
    status: 1,
    keterangan: 'Kursi staff hidrolis kain oscar hitam',
    uuid: 'uuid-prod-46',
    foto: '',
    created_at: '2024-03-25 04:31:31',
    created_by: 1,
    updated_at: '2025-08-15 03:41:43',
    updated_by: 1
  },
  {
    id: 55,
    kode: 'MBS - CUSTOM',
    nama: 'Meja Belajar Custom HPL Serat Kayu',
    qty: 8,
    min_qty: 3,
    satuan_barang_id: 2,
    harga: 1300000,
    kategori_barang_id: 2,
    gudang_id: 1000,
    status: 1,
    keterangan: 'Meja belajar anak rangka hollow 3x3 fin duco',
    uuid: 'uuid-prod-55',
    foto: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=300&auto=format&fit=crop&q=60',
    created_at: '2024-03-25 04:35:19',
    created_by: 1,
    updated_at: '2025-08-20 03:26:51',
    updated_by: 1
  },
  {
    id: 60,
    kode: 'IT - 301 A',
    nama: 'Meja Rapat HPL Kaki Lipat Modesty 120x60x75',
    qty: 12,
    min_qty: 6,
    satuan_barang_id: 1,
    harga: 1250000,
    kategori_barang_id: 2,
    gudang_id: 1000,
    status: 1,
    keterangan: 'Meja meeting lipat training kantor roda lockable',
    uuid: 'uuid-prod-60',
    foto: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=300&auto=format&fit=crop&q=60',
    created_at: '2024-04-29 06:31:17',
    created_by: 1,
    updated_at: '2026-05-11 02:56:32',
    updated_by: 1
  },
  {
    id: 62,
    kode: 'IT - 301 C',
    nama: 'Meja Rapat HPL Kaki Lipat Modesty 180x60x75',
    qty: 59,
    min_qty: 10,
    satuan_barang_id: 1,
    harga: 1750000,
    kategori_barang_id: 2,
    gudang_id: 1000,
    status: 1,
    keterangan: 'Meja serbaguna konferensi top table 25mm edging PVC',
    uuid: 'uuid-prod-62',
    foto: '',
    created_at: '2024-04-29 06:31:17',
    created_by: 1,
    updated_at: '2026-04-22 03:27:35',
    updated_by: 1
  }
]

export const INITIAL_MOCK_PRODUK_FOTO: ProdukFoto[] = [
  {
    id: 1,
    produk_id: 43,
    foto: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    produk_id: 43,
    foto: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 3,
    produk_id: 44,
    foto: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=500&auto=format&fit=crop&q=80'
  }
]

export interface ProductLookups {
  categories: Array<{ id: number; kode?: string | null; nama: string | null; color?: string | null; status?: number | null }>
  units: Array<{ id: number; kode?: string | null; nama: string | null; status?: number | null }>
  warehouses: Array<{ id: number; kode?: string | null; nama: string | null; color?: string | null; alamat?: string | null; status?: number | null }>
}

export function resolvePhotoUrl(filename: string | null | undefined): string | null {
  if (!filename || !filename.trim()) return null
  if (
    filename.startsWith('http://') ||
    filename.startsWith('https://') ||
    filename.startsWith('data:') ||
    filename.startsWith('blob:')
  ) {
    return filename
  }
  const token = getAuthToken()
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : ''
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  return `${apiBase}/master/products/photos/${encodeURIComponent(filename)}${tokenParam}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformProduct(raw: any): Produk {
  const harga = raw.harga !== null && raw.harga !== undefined ? Math.round(Number(raw.harga)) : null
  const harga_formatted = harga !== null ? formatCurrency(harga) : '-'
  const qty = raw.qty !== null && raw.qty !== undefined ? Number(raw.qty) : 0
  const min_qty = raw.min_qty !== null && raw.min_qty !== undefined ? Number(raw.min_qty) : 0

  const kategori_barang_nama =
    raw.kategori?.nama ||
    raw.kategori_barang_nama ||
    referenceService.getProductCategoryName(raw.kategori_barang_id) ||
    MOCK_PRODUCT_CATEGORIES.find(c => c.id === raw.kategori_barang_id)?.nama ||
    '-'

  const satuan_barang_nama =
    raw.satuan?.nama ||
    raw.satuan_barang_nama ||
    referenceService.getProductUnitName(raw.satuan_barang_id) ||
    MOCK_PRODUCT_UNITS.find(u => u.id === raw.satuan_barang_id)?.nama ||
    '-'

  const gudang_nama =
    raw.gudang?.nama ||
    raw.gudang_nama ||
    referenceService.getWarehouseName(raw.gudang_id) ||
    MOCK_PRODUCT_WAREHOUSES.find(g => g.id === raw.gudang_id)?.nama ||
    '-'

  const rawFotos = Array.isArray(raw.photos)
    ? raw.photos
    : Array.isArray(raw.fotos)
      ? raw.fotos
      : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fotos: ProdukFoto[] = rawFotos.map((f: any) => ({
    id: f.id,
    produk_id: f.produk_id || raw.id,
    foto: resolvePhotoUrl(f.foto) || f.foto
  }))

  const resolvedMainPhoto = resolvePhotoUrl(raw.foto) || raw.foto || null

  return {
    ...raw,
    harga,
    harga_formatted,
    qty,
    min_qty,
    is_low_stock: qty <= min_qty,
    kategori_barang_nama,
    satuan_barang_nama,
    gudang_nama,
    foto: resolvedMainPhoto,
    fotos
  }
}

export interface IProductService extends CrudService<Produk, CreateProductDto, UpdateProductDto> {
  reset?(): void
  getRawItems?(): Produk[]
  isWarehouseReferenced?(gudangId: number): boolean
  isCategoryReferenced?(categoryId: number): boolean
  isUnitReferenced?(unitId: number): boolean
  adjustStock?(id: number, delta: number): void
  getAll?(query?: ListQuery): Promise<PaginatedResponse<Produk>>
  toggleStatus?(id: number, status: number): Promise<Produk>
  uploadPhoto?(id: number, file: File): Promise<Produk>
  deletePhoto?(id: number): Promise<Produk>
  uploadAdditionalPhoto?(id: number, file: File): Promise<ProdukFoto>
  deleteAdditionalPhoto?(photoId: number): Promise<void>
  getLookups?(): Promise<ProductLookups>
}

export class MockProductService implements IProductService {
  private products: Produk[] = []
  private productFotos: ProdukFoto[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.products = JSON.parse(JSON.stringify(INITIAL_MOCK_PRODUCTS))
    this.productFotos = JSON.parse(JSON.stringify(INITIAL_MOCK_PRODUK_FOTO))
  }

  getRawItems(): Produk[] {
    return this.products
  }

  isWarehouseReferenced(gudangId: number): boolean {
    return this.products.some(p => p.gudang_id === Number(gudangId))
  }

  isCategoryReferenced(categoryId: number): boolean {
    return this.products.some(p => p.kategori_barang_id === Number(categoryId))
  }

  isUnitReferenced(unitId: number): boolean {
    return this.products.some(p => p.satuan_barang_id === Number(unitId))
  }

  private enrich(item: Produk): Produk {
    const unit_nama = referenceService.getProductUnitName(item.satuan_barang_id)
    const cat_nama = referenceService.getProductCategoryName(item.kategori_barang_id)
    const gd_nama = referenceService.getWarehouseName(item.gudang_id)
    const fotos = this.productFotos.filter(f => f.produk_id === item.id)

    return {
      ...item,
      satuan_barang_nama:
        unit_nama !== '-'
          ? unit_nama
          : MOCK_PRODUCT_UNITS.find(u => u.id === item.satuan_barang_id)?.nama || '-',
      kategori_barang_nama:
        cat_nama !== '-'
          ? cat_nama
          : MOCK_PRODUCT_CATEGORIES.find(c => c.id === item.kategori_barang_id)?.nama || '-',
      gudang_nama:
        gd_nama !== '-'
          ? gd_nama
          : MOCK_PRODUCT_WAREHOUSES.find(g => g.id === item.gudang_id)?.nama || '-',
      harga_formatted: formatCurrency(item.harga ?? 0),
      is_low_stock: (item.qty ?? 0) <= (item.min_qty ?? 0),
      fotos
    }
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<Produk>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<Produk>> {
    assertPermission('inventory.products', 'read')
    let result = [...this.products]

    if (query?.search) {
      const term = query.search.toLowerCase()
      result = result.filter(p => {
        const enriched = this.enrich(p)
        return (
          p.kode?.toLowerCase().includes(term) ||
          p.nama?.toLowerCase().includes(term) ||
          p.keterangan?.toLowerCase().includes(term) ||
          enriched.kategori_barang_nama?.toLowerCase().includes(term) ||
          enriched.gudang_nama?.toLowerCase().includes(term)
        )
      })
    }

    if (query?.status !== undefined && query.status !== 'all' && query.status !== '') {
      result = result.filter(p => String(p.status) === String(query.status))
    }

    const filters = (query?.filters || {}) as Record<string, unknown>
    if (
      filters.gudang_id !== undefined &&
      filters.gudang_id !== 'all' &&
      filters.gudang_id !== ''
    ) {
      result = result.filter(p => p.gudang_id === Number(filters.gudang_id))
    }

    if (
      filters.kategori_barang_id !== undefined &&
      filters.kategori_barang_id !== 'all' &&
      filters.kategori_barang_id !== ''
    ) {
      result = result.filter(p => p.kategori_barang_id === Number(filters.kategori_barang_id))
    }

    if (query?.sortBy) {
      const field = query.sortBy as keyof Produk
      const order = query.sortOrder === 'desc' ? -1 : 1
      result.sort((a, b) => {
        const valA = a[field] ?? ''
        const valB = b[field] ?? ''
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * order
        }
        return String(valA).localeCompare(String(valB)) * order
      })
    } else {
      result.sort((a, b) => b.id - a.id)
    }

    const total = result.length
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const start = (page - 1) * pageSize
    const paged = result.slice(start, start + pageSize).map(item => this.enrich(item))

    return {
      data: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async getById(id: number): Promise<Produk> {
    assertPermission('inventory.products', 'read')
    const item = this.products.find(p => p.id === Number(id))
    if (!item) {
      throw new Error(`Produk dengan ID ${id} tidak ditemukan`)
    }
    return this.enrich(item)
  }

  async create(dto: CreateProductDto): Promise<Produk> {
    assertPermission('inventory.products', 'create')
    const nextId = this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const newProduct: Produk = {
      id: nextId,
      kode: dto.kode || `PRD-${String(nextId).padStart(4, '0')}`,
      nama: dto.nama,
      qty: dto.qty ?? 0,
      min_qty: dto.min_qty ?? 0,
      satuan_barang_id: dto.satuan_barang_id ?? 1,
      harga: dto.harga ?? 0,
      kategori_barang_id: dto.kategori_barang_id ?? 1,
      gudang_id: dto.gudang_id ?? 1000,
      status: dto.status ?? 1,
      keterangan: dto.keterangan || null,
      uuid: `uuid-prod-${nextId}`,
      foto: dto.foto || null,
      created_at: now,
      created_by: 1,
      updated_at: now,
      updated_by: 1
    }

    this.products.unshift(newProduct)

    if (dto.additional_fotos && dto.additional_fotos.length > 0) {
      dto.additional_fotos.forEach(fotoUrl => {
        const nextFotoId =
          this.productFotos.length > 0 ? Math.max(...this.productFotos.map(f => f.id)) + 1 : 1
        this.productFotos.push({
          id: nextFotoId,
          produk_id: nextId,
          foto: fotoUrl
        })
      })
    }

    return this.enrich(newProduct)
  }

  async update(id: number, dto: UpdateProductDto): Promise<Produk> {
    assertPermission('inventory.products', 'update')
    const index = this.products.findIndex(p => p.id === Number(id))
    if (index === -1) {
      throw new Error(`Produk dengan ID ${id} tidak ditemukan`)
    }

    const current = this.products[index]
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const updated: Produk = {
      ...current,
      ...(dto.kode !== undefined && { kode: dto.kode }),
      ...(dto.nama !== undefined && { nama: dto.nama }),
      ...(dto.qty !== undefined && { qty: dto.qty }),
      ...(dto.min_qty !== undefined && { min_qty: dto.min_qty }),
      ...(dto.satuan_barang_id !== undefined && { satuan_barang_id: dto.satuan_barang_id }),
      ...(dto.harga !== undefined && { harga: dto.harga }),
      ...(dto.kategori_barang_id !== undefined && { kategori_barang_id: dto.kategori_barang_id }),
      ...(dto.gudang_id !== undefined && { gudang_id: dto.gudang_id }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.keterangan !== undefined && { keterangan: dto.keterangan }),
      ...(dto.foto !== undefined && { foto: dto.foto }),
      updated_at: now,
      updated_by: 1
    }

    this.products[index] = updated

    if (dto.additional_fotos !== undefined) {
      this.productFotos = this.productFotos.filter(f => f.produk_id !== Number(id))
      dto.additional_fotos.forEach(fotoUrl => {
        const nextFotoId =
          this.productFotos.length > 0 ? Math.max(...this.productFotos.map(f => f.id)) + 1 : 1
        this.productFotos.push({
          id: nextFotoId,
          produk_id: Number(id),
          foto: fotoUrl
        })
      })
    }

    return this.enrich(updated)
  }

  adjustStock(id: number, delta: number): void {
    const item = this.products.find(p => p.id === Number(id))
    if (item) {
      item.qty = Math.max(0, (item.qty ?? 0) + delta)
    }
  }

  async delete(id: number): Promise<boolean> {
    assertPermission('inventory.products', 'delete')
    const index = this.products.findIndex(p => p.id === Number(id))
    if (index === -1) {
      throw new Error(`Produk dengan ID ${id} tidak ditemukan`)
    }
    this.products.splice(index, 1)
    // Cascade delete to produk_foto
    this.productFotos = this.productFotos.filter(f => f.produk_id !== Number(id))
    return true
  }

  async toggleStatus(id: number, status: number): Promise<Produk> {
    return this.update(id, { status })
  }

  async uploadPhoto(id: number, file: File): Promise<Produk> {
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onload = ev => resolve(String(ev.target?.result || ''))
      reader.readAsDataURL(file)
    })
    return this.update(id, { foto: dataUrl })
  }

  async deletePhoto(id: number): Promise<Produk> {
    return this.update(id, { foto: '' })
  }

  async uploadAdditionalPhoto(id: number, file: File): Promise<ProdukFoto> {
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onload = ev => resolve(String(ev.target?.result || ''))
      reader.readAsDataURL(file)
    })
    const nextFotoId =
      this.productFotos.length > 0 ? Math.max(...this.productFotos.map(f => f.id)) + 1 : 1
    const newFoto: ProdukFoto = { id: nextFotoId, produk_id: id, foto: dataUrl }
    this.productFotos.push(newFoto)
    return newFoto
  }

  async deleteAdditionalPhoto(photoId: number): Promise<void> {
    this.productFotos = this.productFotos.filter(f => f.id !== photoId)
  }

  async getLookups(): Promise<ProductLookups> {
    return {
      categories: MOCK_PRODUCT_CATEGORIES,
      units: MOCK_PRODUCT_UNITS,
      warehouses: MOCK_PRODUCT_WAREHOUSES
    }
  }

  async exportAll(query?: ListQuery): Promise<Produk[]> {
    assertPermission('inventory.products', 'read')
    const res = await this.getAll({
      ...query,
      page: 1,
      pageSize: 100000
    })
    return res.data
  }

  async importBatch(
    items: CreateProductDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    assertPermission('inventory.products', 'create')

    const validationErrors: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.nama || !item.nama.trim()) {
        validationErrors.push(`Baris ${i + 1}: Nama produk wajib diisi`)
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(
        `Impor produk dibatalkan karena kesalahan validasi:\n${validationErrors.join('\n')}`
      )
    }

    const snapshotProducts = JSON.stringify(this.products)
    const snapshotFotos = JSON.stringify(this.productFotos)
    let imported = 0

    try {
      for (const item of items) {
        await this.create(item)
        imported++
      }
      return { importedCount: imported, imported, failed: 0, errors: [] }
    } catch (err: unknown) {
      this.products = JSON.parse(snapshotProducts)
      this.productFotos = JSON.parse(snapshotFotos)
      throw err
    }
  }
}

export const mockProductService = new MockProductService()

export const apiProductService: IProductService = {
  async list(query?: ListQuery): Promise<PaginatedResponse<Produk>> {
    return this.getAll!(query)
  },

  async getAll(query?: ListQuery): Promise<PaginatedResponse<Produk>> {
    const params = new URLSearchParams()
    if (query?.page) params.append('page', String(query.page))
    if (query?.pageSize) params.append('pageSize', String(query.pageSize))
    if (query?.search) params.append('search', query.search)
    params.append('sortBy', query?.sortBy || 'created_at')
    params.append('sortOrder', query?.sortOrder || 'desc')
    if (query?.status !== undefined && query.status !== 'all' && query.status !== '') {
      params.append('status', String(query.status))
    }

    const filters = (query?.filters || {}) as Record<string, unknown>
    if (
      filters.gudang_id !== undefined &&
      filters.gudang_id !== 'all' &&
      filters.gudang_id !== ''
    ) {
      params.append('warehouseId', String(filters.gudang_id))
    }

    if (
      filters.kategori_barang_id !== undefined &&
      filters.kategori_barang_id !== 'all' &&
      filters.kategori_barang_id !== ''
    ) {
      params.append('categoryId', String(filters.kategori_barang_id))
    }

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (
          !['page', 'pageSize', 'search', 'sortBy', 'sortOrder', 'status', 'filters'].includes(key) &&
          value !== undefined &&
          value !== null &&
          value !== ''
        ) {
          params.append(key, String(value))
        }
      }
    }

    const queryString = params.toString() ? `?${params.toString()}` : ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any[]>(`/master/products${queryString}`)

    const totalItems = res.meta?.totalItems ?? res.data?.length ?? 0
    const page = res.meta?.page ?? query?.page ?? 1
    const pageSize = res.meta?.pageSize ?? query?.pageSize ?? 10
    const totalPages = res.meta?.totalPages ?? (Math.ceil(totalItems / pageSize) || 1)

    return {
      data: (res.data || []).map(transformProduct),
      total: totalItems,
      page,
      pageSize,
      totalPages
    }
  },

  async getById(id: number): Promise<Produk> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/products/${id}`)
    return transformProduct(res.data)
  },

  async create(payload: CreateProductDto): Promise<Produk> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>('/master/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return transformProduct(res.data)
  },

  async update(id: number, payload: UpdateProductDto): Promise<Produk> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return transformProduct(res.data)
  },

  async delete(id: number): Promise<boolean> {
    await apiClient<{ id: number }>(`/master/products/${id}`, {
      method: 'DELETE'
    })
    return true
  },

  async toggleStatus(id: number, status: number): Promise<Produk> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
    return transformProduct(res.data)
  },

  async uploadPhoto(id: number, file: File): Promise<Produk> {
    const formData = new FormData()
    formData.append('file', file)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/products/${id}/photo`, {
      method: 'POST',
      body: formData
    })
    return transformProduct(res.data)
  },

  async deletePhoto(id: number): Promise<Produk> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/products/${id}/photo`, {
      method: 'DELETE'
    })
    return transformProduct(res.data)
  },

  async uploadAdditionalPhoto(id: number, file: File): Promise<ProdukFoto> {
    const formData = new FormData()
    formData.append('file', file)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/products/${id}/photos`, {
      method: 'POST',
      body: formData
    })
    return {
      id: res.data.id,
      produk_id: res.data.produk_id,
      foto: resolvePhotoUrl(res.data.foto) || res.data.foto
    }
  },

  async deleteAdditionalPhoto(photoId: number): Promise<void> {
    await apiClient<{ id: number }>(`/master/products/photos/${photoId}`, {
      method: 'DELETE'
    })
  },

  async getLookups(): Promise<ProductLookups> {
    const res = await apiClient<ProductLookups>('/master/products/lookups/all')
    return res.data
  },

  async exportAll(query?: ListQuery): Promise<Produk[]> {
    const res = await this.getAll!({ ...query, page: 1, pageSize: 100000 })
    return res.data
  },

  async importBatch(items: CreateProductDto[]) {
    let imported = 0
    for (const item of items) {
      await this.create(item)
      imported++
    }
    return { importedCount: imported, imported, failed: 0, errors: [] }
  }
}

export class ProductServiceAdapter implements IProductService {
  private get activeService(): IProductService {
    const isMock =
      import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockProductService : apiProductService
  }

  reset(): void {
    mockProductService.reset()
  }

  getRawItems(): Produk[] {
    return mockProductService.getRawItems()
  }

  isWarehouseReferenced(gudangId: number): boolean {
    return mockProductService.isWarehouseReferenced(gudangId)
  }

  isCategoryReferenced(categoryId: number): boolean {
    return mockProductService.isCategoryReferenced(categoryId)
  }

  isUnitReferenced(unitId: number): boolean {
    return mockProductService.isUnitReferenced(unitId)
  }

  adjustStock(id: number, delta: number): void {
    mockProductService.adjustStock(id, delta)
  }

  list(query?: ListQuery): Promise<PaginatedResponse<Produk>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<Produk>> {
    const s = this.activeService
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<Produk> {
    return this.activeService.getById(id)
  }

  create(payload: CreateProductDto): Promise<Produk> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateProductDto): Promise<Produk> {
    return this.activeService.update(id, payload)
  }

  async delete(id: number): Promise<boolean> {
    const res = await this.activeService.delete(id)
    return res !== false
  }

  toggleStatus(id: number, status: number): Promise<Produk> {
    if (this.activeService.toggleStatus) {
      return this.activeService.toggleStatus(id, status)
    }
    return this.update(id, { status })
  }

  uploadPhoto(id: number, file: File): Promise<Produk> {
    if (this.activeService.uploadPhoto) {
      return this.activeService.uploadPhoto(id, file)
    }
    return this.getById(id)
  }

  deletePhoto(id: number): Promise<Produk> {
    if (this.activeService.deletePhoto) {
      return this.activeService.deletePhoto(id)
    }
    return this.getById(id)
  }

  uploadAdditionalPhoto(id: number, file: File): Promise<ProdukFoto> {
    if (this.activeService.uploadAdditionalPhoto) {
      return this.activeService.uploadAdditionalPhoto(id, file)
    }
    return Promise.resolve({ id: 0, produk_id: id, foto: '' })
  }

  deleteAdditionalPhoto(photoId: number): Promise<void> {
    if (this.activeService.deleteAdditionalPhoto) {
      return this.activeService.deleteAdditionalPhoto(photoId)
    }
    return Promise.resolve()
  }

  getLookups(): Promise<ProductLookups> {
    if (this.activeService.getLookups) {
      return this.activeService.getLookups()
    }
    return mockProductService.getLookups()
  }

  exportAll(query?: ListQuery): Promise<Produk[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateProductDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

// Default exported singleton matching other modules
export const productService = new ProductServiceAdapter()
// Legacy alias class for compatibility with tests that instantiate `new ProductService()`
export const ProductService = MockProductService
