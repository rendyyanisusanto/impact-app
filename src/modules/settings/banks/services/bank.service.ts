import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type { Bank, CreateBankDto, UpdateBankDto } from '../types/bank.types'

export const INITIAL_MOCK_BANKS: Bank[] = [
  { id: 1, bank: 'Danamon Among Kho', rekening: '012312312' },
  { id: 2, bank: 'Mandiri Among Kho', rekening: '23322123' },
  { id: 3, bank: 'BCA PT Impact', rekening: '3123128309' },
  { id: 4, bank: 'BCA Among Kho', rekening: '001239988' }
]

export class BankService implements CrudService<Bank, CreateBankDto, UpdateBankDto> {
  private items: Bank[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_BANKS))
  }

  getRawItems(): Bank[] {
    return this.items
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<Bank>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<Bank>> {
    let result = [...this.items]

    if (query?.search) {
      const term = query.search.toLowerCase()
      result = result.filter(
        b => b.bank?.toLowerCase().includes(term) || b.rekening?.toLowerCase().includes(term)
      )
    }

    if (query?.sortBy) {
      const field = query.sortBy as keyof Bank
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

  async getById(id: number): Promise<Bank> {
    const item = this.items.find(b => b.id === Number(id))
    if (!item) {
      throw new Error(`Bank dengan ID ${id} tidak ditemukan`)
    }
    return item
  }

  async create(dto: CreateBankDto): Promise<Bank> {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(b => b.id)) + 1 : 1

    const newBank: Bank = {
      id: nextId,
      bank: dto.bank.trim(),
      rekening: String(dto.rekening).trim()
    }

    this.items.push(newBank)
    return newBank
  }

  async update(id: number, dto: UpdateBankDto): Promise<Bank> {
    const index = this.items.findIndex(b => b.id === Number(id))
    if (index === -1) {
      throw new Error(`Bank dengan ID ${id} tidak ditemukan`)
    }

    const current = this.items[index]
    const updated: Bank = {
      ...current,
      ...(dto.bank !== undefined && { bank: dto.bank.trim() }),
      ...(dto.rekening !== undefined && { rekening: String(dto.rekening).trim() })
    }

    this.items[index] = updated
    return updated
  }

  async delete(id: number): Promise<boolean> {
    const index = this.items.findIndex(b => b.id === Number(id))
    if (index === -1) {
      throw new Error(`Bank dengan ID ${id} tidak ditemukan`)
    }
    this.items.splice(index, 1)
    return true
  }

  async exportAll(query?: ListQuery): Promise<Bank[]> {
    const res = await this.getAll({
      ...query,
      page: 1,
      pageSize: 100000
    })
    return res.data
  }

  async importBatch(
    items: CreateBankDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        if (!item.bank) {
          throw new Error(`Baris ${i + 1}: Nama Bank wajib diisi`)
        }
        if (!item.rekening) {
          throw new Error(`Baris ${i + 1}: Nomor Rekening wajib diisi`)
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

export const mockBankService = new BankService()
export const apiBankService = createApiCrudService<Bank, CreateBankDto, UpdateBankDto>('/master/banks')

export class BankServiceAdapter implements CrudService<Bank, CreateBankDto, UpdateBankDto> {
  private get activeService(): CrudService<Bank, CreateBankDto, UpdateBankDto> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockBankService : apiBankService
  }

  reset(): void {
    mockBankService.reset()
  }

  getRawItems(): Bank[] {
    return mockBankService.getRawItems()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<Bank>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<Bank>> {
    const s = this.activeService as { getAll?: (q?: ListQuery) => Promise<PaginatedResponse<Bank>>; list: (q?: ListQuery) => Promise<PaginatedResponse<Bank>> }
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<Bank> {
    return this.activeService.getById(id)
  }

  create(payload: CreateBankDto): Promise<Bank> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateBankDto): Promise<Bank> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  exportAll(query?: ListQuery): Promise<Bank[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateBankDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const bankService = new BankServiceAdapter()
