import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type {
  KategoriBahan,
  CreateMaterialCategoryDto,
  UpdateMaterialCategoryDto
} from '../types/material-category.types'

import { INITIAL_MOCK_MATERIAL_CATEGORIES } from '@/mocks/references/master-seeds.mock'
export { INITIAL_MOCK_MATERIAL_CATEGORIES }

export class MaterialCategoryService implements CrudService<
  KategoriBahan,
  CreateMaterialCategoryDto,
  UpdateMaterialCategoryDto
> {
  private items: KategoriBahan[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_MATERIAL_CATEGORIES))
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<KategoriBahan>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<KategoriBahan>> {
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
      const field = query.sortBy as keyof KategoriBahan
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

  async getById(id: number): Promise<KategoriBahan> {
    const item = this.items.find(c => c.id === Number(id))
    if (!item) {
      throw new Error(`Kategori Bahan dengan ID ${id} tidak ditemukan`)
    }
    return item
  }

  async create(dto: CreateMaterialCategoryDto): Promise<KategoriBahan> {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(c => c.id)) + 1 : 1
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const newCategory: KategoriBahan = {
      id: nextId,
      kode: dto.kode || `KB-${Math.floor(100 + Math.random() * 900)}`,
      nama: dto.nama,
      color: dto.color || '#2980b9',
      status: dto.status ?? 1,
      created_at: now,
      created_by: 1,
      updated_at: now,
      updated_by: 1
    }

    this.items.push(newCategory)
    return newCategory
  }

  async update(id: number, dto: UpdateMaterialCategoryDto): Promise<KategoriBahan> {
    const index = this.items.findIndex(c => c.id === Number(id))
    if (index === -1) {
      throw new Error(`Kategori Bahan dengan ID ${id} tidak ditemukan`)
    }

    const current = this.items[index]
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const updated: KategoriBahan = {
      ...current,
      ...(dto.kode !== undefined && { kode: dto.kode }),
      ...(dto.nama !== undefined && { nama: dto.nama }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.status !== undefined && { status: dto.status }),
      updated_at: now,
      updated_by: 1
    }

    this.items[index] = updated
    return updated
  }

  async delete(id: number): Promise<boolean> {
    const index = this.items.findIndex(c => c.id === Number(id))
    if (index === -1) {
      throw new Error(`Kategori Bahan dengan ID ${id} tidak ditemukan`)
    }
    this.items.splice(index, 1)
    return true
  }

  async exportAll(query?: ListQuery): Promise<KategoriBahan[]> {
    const res = await this.getAll({
      ...query,
      page: 1,
      pageSize: 100000
    })
    return res.data
  }

  async importBatch(
    items: CreateMaterialCategoryDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        if (!item.nama) {
          throw new Error(`Baris ${i + 1}: Nama Kategori wajib diisi`)
        }
        await this.create(item)
        imported++
      } catch (err: unknown) {
        failed++
        errors.push((err as Error).message || `Baris ${i + 1} gagal diimpor`)
      }
    }

    return { importedCount: imported, imported, failed, errors }
  }
}

import { createApiCrudService } from '@/shared/services/api-crud.service'

export const mockMaterialCategoryService = new MaterialCategoryService()
export const apiMaterialCategoryService = createApiCrudService<KategoriBahan, CreateMaterialCategoryDto, UpdateMaterialCategoryDto>('/master/kategori-bahan')

export class MaterialCategoryServiceAdapter implements CrudService<KategoriBahan, CreateMaterialCategoryDto, UpdateMaterialCategoryDto> {
  private get activeService(): CrudService<KategoriBahan, CreateMaterialCategoryDto, UpdateMaterialCategoryDto> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockMaterialCategoryService : apiMaterialCategoryService
  }

  reset(): void {
    mockMaterialCategoryService.reset()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<KategoriBahan>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<KategoriBahan>> {
    const s = this.activeService as { getAll?: (q?: ListQuery) => Promise<PaginatedResponse<KategoriBahan>>; list: (q?: ListQuery) => Promise<PaginatedResponse<KategoriBahan>> }
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<KategoriBahan> {
    return this.activeService.getById(id)
  }

  create(payload: CreateMaterialCategoryDto): Promise<KategoriBahan> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateMaterialCategoryDto): Promise<KategoriBahan> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  exportAll(query?: ListQuery): Promise<KategoriBahan[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateMaterialCategoryDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const materialCategoryService = new MaterialCategoryServiceAdapter()
