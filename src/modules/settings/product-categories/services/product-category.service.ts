import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type {
  KategoriBarang,
  CreateProductCategoryDto,
  UpdateProductCategoryDto
} from '../types/product-category.types'
import { referenceService } from '@/shared/services/reference.service'
import { productService } from '@/modules/inventory/products/services/product.service'
import { assertPermission } from '@/shared/services/service-guard'

import { INITIAL_MOCK_PRODUCT_CATEGORIES } from '@/mocks/references/master-seeds.mock'
export { INITIAL_MOCK_PRODUCT_CATEGORIES }

export class ProductCategoryService implements CrudService<
  KategoriBarang,
  CreateProductCategoryDto,
  UpdateProductCategoryDto
> {
  private items: KategoriBarang[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_PRODUCT_CATEGORIES))
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<KategoriBarang>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<KategoriBarang>> {
    let result = [...this.items]

    if (query?.search) {
      const term = query.search.toLowerCase()
      result = result.filter(
        c => c.kode?.toLowerCase().includes(term) || c.nama?.toLowerCase().includes(term)
      )
    }

    if (query?.status !== undefined && query.status !== 'all' && query.status !== '') {
      result = result.filter(c => String(c.status) === String(query.status))
    }

    if (query?.sortBy) {
      const field = query.sortBy as keyof KategoriBarang
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
      result.sort((a, b) => a.id - b.id)
    }

    const total = result.length
    const page = query?.page ?? 1
    const pageSize = query?.pageSize ?? 10
    const start = (page - 1) * pageSize
    const paged = result.slice(start, start + pageSize)

    return {
      data: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async getById(id: number): Promise<KategoriBarang> {
    const item = this.items.find(c => c.id === Number(id))
    if (!item) {
      throw new Error(`Kategori Barang dengan ID ${id} tidak ditemukan`)
    }
    return item
  }

  async create(dto: CreateProductCategoryDto): Promise<KategoriBarang> {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(c => c.id)) + 1 : 1
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const newCategory: KategoriBarang = {
      id: nextId,
      kode: dto.kode || `SB-${nextId}`,
      nama: dto.nama,
      color: dto.color || '#8e44ad',
      status: dto.status ?? 1,
      created_at: now,
      created_by: 1,
      updated_at: now,
      updated_by: 1
    }

    this.items.push(newCategory)
    referenceService.setProductCategory({
      id: newCategory.id,
      nama: newCategory.nama,
      color: newCategory.color,
      status: newCategory.status
    })
    return newCategory
  }

  async update(id: number, dto: UpdateProductCategoryDto): Promise<KategoriBarang> {
    assertPermission('settings.product-categories', 'update')
    const index = this.items.findIndex(c => c.id === Number(id))
    if (index === -1) {
      throw new Error(`Kategori Barang dengan ID ${id} tidak ditemukan`)
    }

    const current = this.items[index]
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const updated: KategoriBarang = {
      ...current,
      ...(dto.kode !== undefined && { kode: dto.kode }),
      ...(dto.nama !== undefined && { nama: dto.nama }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.status !== undefined && { status: dto.status }),
      updated_at: now,
      updated_by: 1
    }

    this.items[index] = updated
    referenceService.setProductCategory({
      id: updated.id,
      nama: updated.nama,
      color: updated.color,
      status: updated.status
    })
    return updated
  }

  async delete(id: number, options?: { force?: boolean }): Promise<boolean> {
    assertPermission('settings.product-categories', 'delete')
    const index = this.items.findIndex(c => c.id === Number(id))
    if (index === -1) {
      throw new Error(`Kategori Barang dengan ID ${id} tidak ditemukan`)
    }

    if (!options?.force && productService.isCategoryReferenced(Number(id))) {
      throw new Error(
        'Kategori Produk tidak dapat dihapus karena masih digunakan oleh data produk.'
      )
    }

    this.items.splice(index, 1)
    referenceService.removeProductCategory(Number(id))
    return true
  }

  async exportAll(query?: ListQuery): Promise<KategoriBarang[]> {
    assertPermission('settings.product-categories', 'read')
    const res = await this.getAll({
      ...query,
      page: 1,
      pageSize: 100000
    })
    return res.data
  }

  async importBatch(
    items: CreateProductCategoryDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    assertPermission('settings.product-categories', 'create')
    const errors: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.nama || !item.nama.trim()) {
        errors.push(`Baris ${i + 1}: Nama Kategori Produk wajib diisi`)
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `Impor kategori produk dibatalkan karena kesalahan validasi:\n${errors.join('\n')}`
      )
    }

    const snapshot = JSON.stringify(this.items)
    let imported = 0
    try {
      for (const item of items) {
        await this.create(item)
        imported++
      }
      return { importedCount: imported, imported, failed: 0, errors: [] }
    } catch (err: unknown) {
      this.items = JSON.parse(snapshot)
      throw err
    }
  }
}

import { createApiCrudService } from '@/shared/services/api-crud.service'

export const mockProductCategoryService = new ProductCategoryService()
export const apiProductCategoryService = createApiCrudService<KategoriBarang, CreateProductCategoryDto, UpdateProductCategoryDto>('/master/kategori-barang')

export class ProductCategoryServiceAdapter implements CrudService<KategoriBarang, CreateProductCategoryDto, UpdateProductCategoryDto> {
  private get activeService(): CrudService<KategoriBarang, CreateProductCategoryDto, UpdateProductCategoryDto> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockProductCategoryService : apiProductCategoryService
  }

  reset(): void {
    mockProductCategoryService.reset()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<KategoriBarang>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<KategoriBarang>> {
    const s = this.activeService as { getAll?: (q?: ListQuery) => Promise<PaginatedResponse<KategoriBarang>>; list: (q?: ListQuery) => Promise<PaginatedResponse<KategoriBarang>> }
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<KategoriBarang> {
    return this.activeService.getById(id)
  }

  create(payload: CreateProductCategoryDto): Promise<KategoriBarang> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateProductCategoryDto): Promise<KategoriBarang> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  exportAll(query?: ListQuery): Promise<KategoriBarang[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateProductCategoryDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const productCategoryService = new ProductCategoryServiceAdapter()
