import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type { Gudang, CreateWarehouseDto, UpdateWarehouseDto } from '../types/warehouse.types'
import { referenceService } from '@/shared/services/reference.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { productService } from '@/modules/inventory/products/services/product.service'
import { assertPermission } from '@/shared/services/service-guard'

import { INITIAL_MOCK_WAREHOUSES } from '@/mocks/references/master-seeds.mock'
export { INITIAL_MOCK_WAREHOUSES }

export class WarehouseService implements CrudService<
  Gudang,
  CreateWarehouseDto,
  UpdateWarehouseDto
> {
  private items: Gudang[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_WAREHOUSES))
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<Gudang>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<Gudang>> {
    let result = [...this.items]

    if (query?.search) {
      const term = query.search.toLowerCase()
      result = result.filter(
        w =>
          w.kode?.toLowerCase().includes(term) ||
          w.nama?.toLowerCase().includes(term) ||
          w.alamat?.toLowerCase().includes(term)
      )
    }

    if (query?.status !== undefined && query.status !== 'all' && query.status !== '') {
      result = result.filter(w => String(w.status) === String(query.status))
    }

    if (query?.sortBy) {
      const field = query.sortBy as keyof Gudang
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
    const paged = result.slice(start, start + pageSize)

    return {
      data: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async getById(id: number): Promise<Gudang> {
    const item = this.items.find(w => w.id === Number(id))
    if (!item) {
      throw new Error(`Gudang dengan ID ${id} tidak ditemukan`)
    }
    return item
  }

  async create(dto: CreateWarehouseDto): Promise<Gudang> {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(w => w.id)) + 1 : 1000
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const newWarehouse: Gudang = {
      id: nextId,
      kode: dto.kode || `GD-${Math.floor(1000 + Math.random() * 9000)}`,
      nama: dto.nama,
      status: dto.status ?? 1,
      color: dto.color || '#000000',
      alamat: dto.alamat || '',
      created_at: now,
      created_by: 1,
      updated_at: now,
      updated_by: 1
    }

    this.items.unshift(newWarehouse)
    // Synchronize to reference service
    referenceService.setWarehouse({
      id: newWarehouse.id,
      nama: newWarehouse.nama,
      color: newWarehouse.color,
      status: newWarehouse.status
    })

    return newWarehouse
  }

  async update(id: number, dto: UpdateWarehouseDto): Promise<Gudang> {
    assertPermission('settings.warehouses', 'update')
    const index = this.items.findIndex(w => w.id === Number(id))
    if (index === -1) {
      throw new Error(`Gudang dengan ID ${id} tidak ditemukan`)
    }

    const current = this.items[index]
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const updated: Gudang = {
      ...current,
      ...(dto.kode !== undefined && { kode: dto.kode }),
      ...(dto.nama !== undefined && { nama: dto.nama }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.alamat !== undefined && { alamat: dto.alamat }),
      updated_at: now,
      updated_by: 1
    }

    this.items[index] = updated
    referenceService.setWarehouse({
      id: updated.id,
      nama: updated.nama,
      color: updated.color,
      status: updated.status
    })
    return updated
  }

  async delete(id: number, options?: { force?: boolean }): Promise<boolean> {
    assertPermission('settings.warehouses', 'delete')
    const index = this.items.findIndex(w => w.id === Number(id))
    if (index === -1) {
      throw new Error(`Gudang dengan ID ${id} tidak ditemukan`)
    }

    if (!options?.force) {
      const isUsedByBahan = materialService.isWarehouseReferenced(Number(id))
      const isUsedByProduk = productService.isWarehouseReferenced(Number(id))
      if (isUsedByBahan || isUsedByProduk) {
        throw new Error(
          'Gudang tidak dapat dihapus karena masih digunakan oleh data bahan atau produk.'
        )
      }
    }

    this.items.splice(index, 1)
    referenceService.removeWarehouse(Number(id))
    return true
  }

  async exportAll(query?: ListQuery): Promise<Gudang[]> {
    assertPermission('settings.warehouses', 'read')
    const res = await this.getAll({
      ...query,
      page: 1,
      pageSize: 100000
    })
    return res.data
  }

  getRawItems(): Gudang[] {
    return this.items
  }

  async importBatch(
    items: CreateWarehouseDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    assertPermission('settings.warehouses', 'create')
    const errors: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.nama || !item.nama.trim()) {
        errors.push(`Baris ${i + 1}: Nama Gudang wajib diisi`)
      }
    }

    if (errors.length > 0) {
      throw new Error(`Impor gudang dibatalkan karena kesalahan validasi:\n${errors.join('\n')}`)
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

export const mockWarehouseService = new WarehouseService()
export const apiWarehouseService = createApiCrudService<Gudang, CreateWarehouseDto, UpdateWarehouseDto>('/master/gudang')

export class WarehouseServiceAdapter implements CrudService<Gudang, CreateWarehouseDto, UpdateWarehouseDto> {
  private get activeService(): CrudService<Gudang, CreateWarehouseDto, UpdateWarehouseDto> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockWarehouseService : apiWarehouseService
  }

  reset(): void {
    mockWarehouseService.reset()
  }

  getRawItems(): Gudang[] {
    return mockWarehouseService.getRawItems()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<Gudang>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<Gudang>> {
    const s = this.activeService as { getAll?: (q?: ListQuery) => Promise<PaginatedResponse<Gudang>>; list: (q?: ListQuery) => Promise<PaginatedResponse<Gudang>> }
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<Gudang> {
    return this.activeService.getById(id)
  }

  create(payload: CreateWarehouseDto): Promise<Gudang> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateWarehouseDto): Promise<Gudang> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  exportAll(query?: ListQuery): Promise<Gudang[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateWarehouseDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const warehouseService = new WarehouseServiceAdapter()
