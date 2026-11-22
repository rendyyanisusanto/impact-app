import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type { Ppn, CreateTaxDto, UpdateTaxDto } from '../types/tax.types'

export const INITIAL_MOCK_PPN: Ppn[] = [
  {
    id: 1,
    kode: 'PPN-6277925',
    nama: 11,
    status: 1,
    is_active: 1,
    created_at: '2023-02-07 01:00:49',
    created_by: 1,
    updated_at: '2023-02-15 04:03:35',
    updated_by: 1
  },
  {
    id: 2,
    kode: 'PPN-8646330',
    nama: 10,
    status: 1,
    is_active: 0,
    created_at: '2023-02-15 04:03:25',
    created_by: 1,
    updated_at: null,
    updated_by: null
  },
  {
    id: 3,
    kode: 'PPN-1200000',
    nama: 12,
    status: 1,
    is_active: 0,
    created_at: '2024-01-01 00:00:00',
    created_by: 1,
    updated_at: null,
    updated_by: null
  }
]

export class TaxService implements CrudService<Ppn, CreateTaxDto, UpdateTaxDto> {
  private items: Ppn[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_PPN))
  }

  private enrich(item: Ppn): Ppn {
    return {
      ...item,
      percentage_formatted: `${item.nama ?? 0}%`
    }
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<Ppn>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<Ppn>> {
    let result = [...this.items]

    if (query?.search) {
      const term = query.search.toLowerCase()
      result = result.filter(
        t => t.kode?.toLowerCase().includes(term) || String(t.nama).includes(term)
      )
    }

    if (query?.status !== undefined && query.status !== 'all' && query.status !== '') {
      result = result.filter(t => String(t.status) === String(query.status))
    }

    if (query?.sortBy) {
      const field = query.sortBy as keyof Ppn
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
    const paged = result.slice(start, start + pageSize).map(item => this.enrich(item))

    return {
      data: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  async getById(id: number): Promise<Ppn> {
    const item = this.items.find(t => t.id === Number(id))
    if (!item) {
      throw new Error(`PPN dengan ID ${id} tidak ditemukan`)
    }
    return this.enrich(item)
  }

  async create(dto: CreateTaxDto): Promise<Ppn> {
    const nama = Math.round(Number(dto.nama))
    if (isNaN(nama) || nama < 0 || nama > 100) {
      throw new Error('Persentase PPN harus berupa bilangan bulat antara 0 hingga 100%')
    }

    if (dto.is_active === 1) {
      this.items.forEach(t => {
        t.is_active = 0
      })
    }

    const nextId = this.items.length > 0 ? Math.max(...this.items.map(t => t.id)) + 1 : 1
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const newTax: Ppn = {
      id: nextId,
      kode: dto.kode || `PPN-${Math.floor(1000000 + Math.random() * 9000000)}`,
      nama,
      status: dto.status ?? 1,
      is_active: dto.is_active ?? 0,
      created_at: now,
      created_by: 1,
      updated_at: now,
      updated_by: 1
    }

    this.items.push(newTax)
    return this.enrich(newTax)
  }

  async update(id: number, dto: UpdateTaxDto): Promise<Ppn> {
    const index = this.items.findIndex(t => t.id === Number(id))
    if (index === -1) {
      throw new Error(`PPN dengan ID ${id} tidak ditemukan`)
    }

    if (dto.nama !== undefined) {
      const nama = Math.round(Number(dto.nama))
      if (isNaN(nama) || nama < 0 || nama > 100) {
        throw new Error('Persentase PPN harus berupa bilangan bulat antara 0 hingga 100%')
      }
    }

    if (dto.is_active === 1) {
      this.items.forEach(t => {
        t.is_active = 0
      })
    }

    const current = this.items[index]
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    const updated: Ppn = {
      ...current,
      ...(dto.kode !== undefined && { kode: dto.kode }),
      ...(dto.nama !== undefined && { nama: Math.round(Number(dto.nama)) }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      updated_at: now,
      updated_by: 1
    }

    this.items[index] = updated
    return this.enrich(updated)
  }

  async delete(id: number): Promise<boolean> {
    const index = this.items.findIndex(t => t.id === Number(id))
    if (index === -1) {
      throw new Error(`PPN dengan ID ${id} tidak ditemukan`)
    }
    this.items.splice(index, 1)
    return true
  }

  async exportAll(query?: ListQuery): Promise<Ppn[]> {
    const res = await this.getAll({ ...query, page: 1, pageSize: 100000 })
    return res.data
  }

  async importBatch(
    items: CreateTaxDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        if (item.nama === undefined || item.nama === null) {
          throw new Error(`Baris ${i + 1}: Tarif PPN (%) wajib diisi`)
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

  getRawItems(): Ppn[] {
    return this.items
  }
}

import { createApiCrudService } from '@/shared/services/api-crud.service'
import { apiClient } from '@/shared/services/api-client'

export const mockTaxService = new TaxService()
export const apiTaxService = createApiCrudService<Ppn, CreateTaxDto, UpdateTaxDto>('/master/ppn', {
  transformItem: (item: Ppn) => ({
    ...item,
    percentage_formatted: `${item.nama ?? 0}%`
  })
})

export class TaxServiceAdapter implements CrudService<Ppn, CreateTaxDto, UpdateTaxDto> {
  private get activeService(): CrudService<Ppn, CreateTaxDto, UpdateTaxDto> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockTaxService : apiTaxService
  }

  reset(): void {
    mockTaxService.reset()
  }

  getRawItems(): Ppn[] {
    return mockTaxService.getRawItems()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<Ppn>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<Ppn>> {
    const s = this.activeService as { getAll?: (q?: ListQuery) => Promise<PaginatedResponse<Ppn>>; list: (q?: ListQuery) => Promise<PaginatedResponse<Ppn>> }
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<Ppn> {
    return this.activeService.getById(id)
  }

  create(payload: CreateTaxDto): Promise<Ppn> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateTaxDto): Promise<Ppn> {
    return this.activeService.update(id, payload)
  }

  async setActive(id: number): Promise<Ppn> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    if (isMock) {
      return mockTaxService.update(id, { is_active: 1 })
    }
    const res = await apiClient<Ppn>(`/master/ppn/${id}/active`, { method: 'PATCH' })
    return {
      ...res.data,
      percentage_formatted: `${res.data.nama ?? 0}%`
    }
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  exportAll(query?: ListQuery): Promise<Ppn[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateTaxDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const taxService = new TaxServiceAdapter()
