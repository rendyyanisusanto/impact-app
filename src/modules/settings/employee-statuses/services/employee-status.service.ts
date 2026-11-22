import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type {
  StatusKaryawan,
  CreateEmployeeStatusDto,
  UpdateEmployeeStatusDto
} from '../types/employee-status.types'

export const INITIAL_MOCK_EMPLOYEE_STATUSES: StatusKaryawan[] = [
  {
    id: 1,
    kode: 'SK2974',
    nama: 'Harian',
    color: '#000000',
    status: 1,
    created_at: '2023-05-17 10:49:17',
    created_by: 1
  },
  {
    id: 2,
    kode: 'SK690',
    nama: 'Borongan',
    color: '#03b300',
    status: 1,
    created_at: '2023-05-17 10:49:33',
    created_by: 1,
    updated_at: '2023-05-17 10:49:52',
    updated_by: 1
  },
  {
    id: 3,
    kode: 'SK100',
    nama: 'Bulanan (Tetap)',
    color: '#2563eb',
    status: 1,
    created_at: '2024-01-10 08:00:00',
    created_by: 1
  },
  {
    id: 4,
    kode: 'SK101',
    nama: 'Kontrak (PKWT)',
    color: '#f59e0b',
    status: 1,
    created_at: '2024-01-10 08:00:00',
    created_by: 1
  }
]

export class EmployeeStatusService implements CrudService<
  StatusKaryawan,
  CreateEmployeeStatusDto,
  UpdateEmployeeStatusDto
> {
  private items: StatusKaryawan[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_EMPLOYEE_STATUSES))
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<StatusKaryawan>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<StatusKaryawan>> {
    let result = [...this.items]

    if (query?.search) {
      const term = query.search.toLowerCase()
      result = result.filter(
        s => s.kode?.toLowerCase().includes(term) || s.nama?.toLowerCase().includes(term)
      )
    }

    if (query?.status !== undefined && query.status !== 'all' && query.status !== '') {
      result = result.filter(s => String(s.status) === String(query.status))
    }

    if (query?.sortBy) {
      const field = query.sortBy as keyof StatusKaryawan
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

  async getById(id: number): Promise<StatusKaryawan> {
    const item = this.items.find(s => s.id === Number(id))
    if (!item) {
      throw new Error(`Status Karyawan dengan ID ${id} tidak ditemukan`)
    }
    return item
  }

  async create(dto: CreateEmployeeStatusDto): Promise<StatusKaryawan> {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(s => s.id)) + 1 : 1
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const newStatus: StatusKaryawan = {
      id: nextId,
      kode: dto.kode || `SK${Math.floor(100 + Math.random() * 900)}`,
      nama: dto.nama,
      color: dto.color || '#000000',
      status: dto.status ?? 1,
      created_at: now,
      created_by: 1,
      updated_at: now,
      updated_by: 1
    }

    this.items.push(newStatus)
    return newStatus
  }

  async update(id: number, dto: UpdateEmployeeStatusDto): Promise<StatusKaryawan> {
    const index = this.items.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Status Karyawan dengan ID ${id} tidak ditemukan`)
    }

    const current = this.items[index]
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const updated: StatusKaryawan = {
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
    const index = this.items.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Status Karyawan dengan ID ${id} tidak ditemukan`)
    }
    this.items.splice(index, 1)
    return true
  }

  async exportAll(query?: ListQuery): Promise<StatusKaryawan[]> {
    const res = await this.getAll({ ...query, page: 1, pageSize: 100000 })
    return res.data
  }

  async importBatch(
    items: CreateEmployeeStatusDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        if (!item.nama) {
          throw new Error(`Baris ${i + 1}: Nama Status Karyawan wajib diisi`)
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

export const mockEmployeeStatusService = new EmployeeStatusService()
export const apiEmployeeStatusService = createApiCrudService<StatusKaryawan, CreateEmployeeStatusDto, UpdateEmployeeStatusDto>('/master/status-karyawan')

export class EmployeeStatusServiceAdapter implements CrudService<StatusKaryawan, CreateEmployeeStatusDto, UpdateEmployeeStatusDto> {
  private get activeService(): CrudService<StatusKaryawan, CreateEmployeeStatusDto, UpdateEmployeeStatusDto> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockEmployeeStatusService : apiEmployeeStatusService
  }

  reset(): void {
    mockEmployeeStatusService.reset()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<StatusKaryawan>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<StatusKaryawan>> {
    const s = this.activeService as { getAll?: (q?: ListQuery) => Promise<PaginatedResponse<StatusKaryawan>>; list: (q?: ListQuery) => Promise<PaginatedResponse<StatusKaryawan>> }
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<StatusKaryawan> {
    return this.activeService.getById(id)
  }

  create(payload: CreateEmployeeStatusDto): Promise<StatusKaryawan> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateEmployeeStatusDto): Promise<StatusKaryawan> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  exportAll(query?: ListQuery): Promise<StatusKaryawan[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateEmployeeStatusDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const employeeStatusService = new EmployeeStatusServiceAdapter()
