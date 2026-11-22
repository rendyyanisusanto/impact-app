import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type { Jabatan, CreatePositionDto, UpdatePositionDto } from '../types/position.types'

export const INITIAL_MOCK_POSITIONS: Jabatan[] = [
  {
    id: 1,
    kode: 'JB-2305-8837',
    nama: 'Direktur',
    status: 1,
    color: '#000000',
    is_deleted: 1,
    created_at: '2023-02-06 13:31:10',
    created_by: 1,
    updated_at: '2023-12-23 13:30:45',
    updated_by: 1
  },
  {
    id: 2,
    kode: 'JB-2305-4740',
    nama: 'PENGIRIMAN',
    status: 1,
    color: '#3b82f6',
    is_deleted: 1,
    created_at: '2023-05-21 01:27:43',
    created_by: 1,
    updated_at: '2024-04-29 03:17:07',
    updated_by: 1
  },
  {
    id: 999,
    kode: 'JB-2305-4740',
    nama: 'SUPIR',
    status: 1,
    color: '#64748b',
    is_deleted: 0, // legacy deleted
    created_at: '2023-12-23 13:28:05',
    created_by: 1,
    updated_at: '2024-04-29 03:17:12',
    updated_by: 1
  },
  {
    id: 1000,
    kode: 'JB-2404-6698',
    nama: 'KERNET',
    status: 1,
    color: '#000000',
    is_deleted: 1,
    created_at: '2024-04-29 03:17:19',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 1001,
    kode: 'JB-2404-1137',
    nama: 'GUDANG',
    status: 1,
    color: '#10b981',
    is_deleted: 1,
    created_at: '2024-04-29 03:17:33',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 1002,
    kode: 'JB-2404-3469',
    nama: 'KURSI SUSUN',
    status: 1,
    color: '#8b5cf6',
    is_deleted: 1,
    created_at: '2024-04-29 03:17:44',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 1004,
    kode: 'JB-2404-3036',
    nama: 'MEJA DAN KAYU',
    status: 1,
    color: '#f59e0b',
    is_deleted: 1,
    created_at: '2024-04-29 03:18:05',
    created_by: 1,
    updated_at: null,
    updated_by: null
  }
]

export class PositionService implements CrudService<Jabatan, CreatePositionDto, UpdatePositionDto> {
  private items: Jabatan[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_POSITIONS))
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<Jabatan>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<Jabatan>> {
    // Only return non-deleted positions (is_deleted === 1)
    let result = this.items.filter(j => (j.is_deleted ?? 1) === 1)

    if (query?.search) {
      const term = query.search.toLowerCase()
      result = result.filter(
        j => j.kode?.toLowerCase().includes(term) || j.nama?.toLowerCase().includes(term)
      )
    }

    if (query?.status !== undefined && query.status !== 'all' && query.status !== '') {
      result = result.filter(j => String(j.status) === String(query.status))
    }

    if (query?.sortBy) {
      const field = query.sortBy as keyof Jabatan
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

  async getById(id: number): Promise<Jabatan> {
    const item = this.items.find(j => j.id === Number(id))
    if (!item || (item.is_deleted ?? 1) === 0) {
      throw new Error(`Jabatan dengan ID ${id} tidak ditemukan`)
    }
    return item
  }

  async create(dto: CreatePositionDto): Promise<Jabatan> {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(j => j.id)) + 1 : 1
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const newPosition: Jabatan = {
      id: nextId,
      kode: dto.kode || `JB-${Math.floor(1000 + Math.random() * 9000)}`,
      nama: dto.nama,
      color: dto.color || '#000000',
      status: dto.status ?? 1,
      is_deleted: 1,
      created_at: now,
      created_by: 1,
      updated_at: now,
      updated_by: 1
    }

    this.items.push(newPosition)
    return newPosition
  }

  async update(id: number, dto: UpdatePositionDto): Promise<Jabatan> {
    const index = this.items.findIndex(j => j.id === Number(id))
    if (index === -1) {
      throw new Error(`Jabatan dengan ID ${id} tidak ditemukan`)
    }

    const current = this.items[index]
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const updated: Jabatan = {
      ...current,
      ...(dto.kode !== undefined && { kode: dto.kode }),
      ...(dto.nama !== undefined && { nama: dto.nama }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.is_deleted !== undefined && { is_deleted: dto.is_deleted }),
      updated_at: now,
      updated_by: 1
    }

    this.items[index] = updated
    return updated
  }

  async delete(id: number): Promise<boolean> {
    const index = this.items.findIndex(j => j.id === Number(id))
    if (index === -1) {
      throw new Error(`Jabatan dengan ID ${id} tidak ditemukan`)
    }
    // Soft delete per legacy semantics: is_deleted = 0
    this.items[index].is_deleted = 0
    return true
  }

  async exportAll(query?: ListQuery): Promise<Jabatan[]> {
    const res = await this.getAll({ ...query, page: 1, pageSize: 100000 })
    return res.data
  }

  async importBatch(
    items: CreatePositionDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        if (!item.nama) {
          throw new Error(`Baris ${i + 1}: Nama Jabatan wajib diisi`)
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

export const mockPositionService = new PositionService()
export const apiPositionService = createApiCrudService<Jabatan, CreatePositionDto, UpdatePositionDto>('/master/jabatan')

export class PositionServiceAdapter implements CrudService<Jabatan, CreatePositionDto, UpdatePositionDto> {
  private get activeService(): CrudService<Jabatan, CreatePositionDto, UpdatePositionDto> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockPositionService : apiPositionService
  }

  reset(): void {
    mockPositionService.reset()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<Jabatan>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<Jabatan>> {
    const s = this.activeService as { getAll?: (q?: ListQuery) => Promise<PaginatedResponse<Jabatan>>; list: (q?: ListQuery) => Promise<PaginatedResponse<Jabatan>> }
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<Jabatan> {
    return this.activeService.getById(id)
  }

  create(payload: CreatePositionDto): Promise<Jabatan> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdatePositionDto): Promise<Jabatan> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  exportAll(query?: ListQuery): Promise<Jabatan[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreatePositionDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const positionService = new PositionServiceAdapter()
