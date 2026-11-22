import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type {
  SatuanBeli,
  CreateSatuanBeliDto,
  UpdateSatuanBeliDto,
  SatuanPakai,
  CreateSatuanPakaiDto,
  UpdateSatuanPakaiDto,
  SatuanBarang,
  CreateSatuanBarangDto,
  UpdateSatuanBarangDto
} from '../types/unit.types'
import { referenceService } from '@/shared/services/reference.service'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { productService } from '@/modules/inventory/products/services/product.service'
import { assertPermission } from '@/shared/services/service-guard'

import {
  INITIAL_MOCK_SATUAN_BELI,
  INITIAL_MOCK_SATUAN_PAKAI,
  INITIAL_MOCK_SATUAN_BARANG
} from '@/mocks/references/master-seeds.mock'
export { INITIAL_MOCK_SATUAN_BELI, INITIAL_MOCK_SATUAN_PAKAI, INITIAL_MOCK_SATUAN_BARANG }

export class SatuanBeliService implements CrudService<
  SatuanBeli,
  CreateSatuanBeliDto,
  UpdateSatuanBeliDto
> {
  private items: SatuanBeli[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_SATUAN_BELI))
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<SatuanBeli>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<SatuanBeli>> {
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
      const field = query.sortBy as keyof SatuanBeli
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

  async getById(id: number): Promise<SatuanBeli> {
    const item = this.items.find(s => s.id === Number(id))
    if (!item) {
      throw new Error(`Satuan Beli dengan ID ${id} tidak ditemukan`)
    }
    return item
  }

  async create(dto: CreateSatuanBeliDto): Promise<SatuanBeli> {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(s => s.id)) + 1 : 1

    if (dto.default === 1) {
      // Unset previous defaults
      this.items.forEach(s => {
        s.default = 0
      })
    }

    const newItem: SatuanBeli = {
      id: nextId,
      kode: dto.kode || `SB-${nextId}`,
      nama: dto.nama,
      status: dto.status ?? 1,
      default: dto.default ?? 0
    }

    this.items.push(newItem)
    referenceService.setPurchaseUnit({
      id: newItem.id,
      nama: newItem.nama,
      status: newItem.status
    })
    return newItem
  }

  async update(id: number, dto: UpdateSatuanBeliDto): Promise<SatuanBeli> {
    assertPermission('settings.material-units', 'update')
    const index = this.items.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Satuan Beli dengan ID ${id} tidak ditemukan`)
    }

    if (dto.default === 1) {
      this.items.forEach(s => {
        s.default = 0
      })
    }

    const current = this.items[index]
    const updated: SatuanBeli = {
      ...current,
      ...(dto.kode !== undefined && { kode: dto.kode }),
      ...(dto.nama !== undefined && { nama: dto.nama }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.default !== undefined && { default: dto.default })
    }

    this.items[index] = updated
    referenceService.setPurchaseUnit({
      id: updated.id,
      nama: updated.nama,
      status: updated.status
    })
    return updated
  }

  async delete(id: number, options?: { force?: boolean }): Promise<boolean> {
    assertPermission('settings.material-units', 'delete')
    const index = this.items.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Satuan Beli dengan ID ${id} tidak ditemukan`)
    }

    if (!options?.force) {
      const isUsedByPakai = satuanPakaiService.isPurchaseUnitReferenced(Number(id))
      const isUsedByBahan = materialService.isPurchaseUnitReferenced(Number(id))
      if (isUsedByPakai || isUsedByBahan) {
        throw new Error(
          'Satuan Beli tidak dapat dihapus karena masih digunakan oleh satuan pakai atau data bahan.'
        )
      }
    }

    this.items.splice(index, 1)
    referenceService.removePurchaseUnit(Number(id))
    return true
  }

  async exportAll(query?: ListQuery): Promise<SatuanBeli[]> {
    assertPermission('settings.material-units', 'read')
    const res = await this.getAll({ ...query, page: 1, pageSize: 100000 })
    return res.data
  }

  async importBatch(
    items: CreateSatuanBeliDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    assertPermission('settings.material-units', 'create')
    const errors: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.nama || !item.nama.trim()) {
        errors.push(`Baris ${i + 1}: Nama Satuan Beli wajib diisi`)
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `Impor satuan beli dibatalkan karena kesalahan validasi:\n${errors.join('\n')}`
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

  getRawItems(): SatuanBeli[] {
    return this.items
  }
}

export class SatuanPakaiService implements CrudService<
  SatuanPakai,
  CreateSatuanPakaiDto,
  UpdateSatuanPakaiDto
> {
  private items: SatuanPakai[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_SATUAN_PAKAI))
  }

  private enrich(item: SatuanPakai): SatuanPakai {
    const beli = satuanBeliService['items'].find(b => b.id === item.satuan_beli_id)
    return {
      ...item,
      satuan_beli_nama: beli?.nama || '-'
    }
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<SatuanPakai>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<SatuanPakai>> {
    let result = [...this.items]

    if (query?.search) {
      const term = query.search.toLowerCase()
      result = result.filter(s => {
        const enriched = this.enrich(s)
        return (
          s.kode?.toLowerCase().includes(term) ||
          s.nama?.toLowerCase().includes(term) ||
          enriched.satuan_beli_nama?.toLowerCase().includes(term)
        )
      })
    }

    const filters = (query?.filters || {}) as Record<string, unknown>
    if (
      filters.satuan_beli_id !== undefined &&
      filters.satuan_beli_id !== 'all' &&
      filters.satuan_beli_id !== ''
    ) {
      result = result.filter(s => s.satuan_beli_id === Number(filters.satuan_beli_id))
    }

    if (query?.sortBy) {
      const field = query.sortBy as keyof SatuanPakai
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

  async getById(id: number): Promise<SatuanPakai> {
    const item = this.items.find(s => s.id === Number(id))
    if (!item) {
      throw new Error(`Satuan Pakai dengan ID ${id} tidak ditemukan`)
    }
    return this.enrich(item)
  }

  async create(dto: CreateSatuanPakaiDto): Promise<SatuanPakai> {
    const pembagi = Number(dto.pembagi ?? 1)
    if (pembagi <= 0 || isNaN(pembagi)) {
      throw new Error('Nilai pembagi harus lebih besar dari 0 (tidak boleh 0 atau negatif)')
    }

    const nextId = this.items.length > 0 ? Math.max(...this.items.map(s => s.id)) + 1 : 1

    const newItem: SatuanPakai = {
      id: nextId,
      kode: dto.kode || `SP-${nextId}`,
      nama: dto.nama,
      satuan_beli_id: dto.satuan_beli_id ? Number(dto.satuan_beli_id) : null,
      pembagi
    }

    this.items.push(newItem)
    referenceService.setUsageUnit({
      id: newItem.id,
      nama: newItem.nama,
      satuan_beli_id: newItem.satuan_beli_id ?? undefined
    })
    return this.enrich(newItem)
  }

  isPurchaseUnitReferenced(unitId: number): boolean {
    return this.items.some(s => s.satuan_beli_id === Number(unitId))
  }

  async update(id: number, dto: UpdateSatuanPakaiDto): Promise<SatuanPakai> {
    assertPermission('settings.material-units', 'update')
    const index = this.items.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Satuan Pakai dengan ID ${id} tidak ditemukan`)
    }

    if (dto.pembagi !== undefined) {
      const pembagi = Number(dto.pembagi)
      if (pembagi <= 0 || isNaN(pembagi)) {
        throw new Error('Nilai pembagi harus lebih besar dari 0 (tidak boleh 0 atau negatif)')
      }
    }

    const current = this.items[index]
    const updated: SatuanPakai = {
      ...current,
      ...(dto.kode !== undefined && { kode: dto.kode }),
      ...(dto.nama !== undefined && { nama: dto.nama }),
      ...(dto.satuan_beli_id !== undefined && {
        satuan_beli_id: dto.satuan_beli_id ? Number(dto.satuan_beli_id) : null
      }),
      ...(dto.pembagi !== undefined && { pembagi: Number(dto.pembagi) })
    }

    this.items[index] = updated
    referenceService.setUsageUnit({
      id: updated.id,
      nama: updated.nama,
      satuan_beli_id: updated.satuan_beli_id ?? undefined
    })
    return this.enrich(updated)
  }

  async delete(id: number, options?: { force?: boolean }): Promise<boolean> {
    assertPermission('settings.material-units', 'delete')
    const index = this.items.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Satuan Pakai dengan ID ${id} tidak ditemukan`)
    }

    if (!options?.force && materialService.isUsageUnitReferenced(Number(id))) {
      throw new Error('Satuan Pakai tidak dapat dihapus karena masih digunakan oleh data bahan.')
    }

    this.items.splice(index, 1)
    referenceService.removeUsageUnit(Number(id))
    return true
  }

  async exportAll(query?: ListQuery): Promise<SatuanPakai[]> {
    assertPermission('settings.material-units', 'read')
    const res = await this.getAll({ ...query, page: 1, pageSize: 100000 })
    return res.data
  }

  async importBatch(
    items: CreateSatuanPakaiDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    assertPermission('settings.material-units', 'create')
    const errors: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.nama || !item.nama.trim()) {
        errors.push(`Baris ${i + 1}: Nama Satuan Pakai wajib diisi`)
      }
      if (item.pembagi !== undefined && Number(item.pembagi) <= 0) {
        errors.push(`Baris ${i + 1}: Nilai pembagi harus lebih besar dari 0`)
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `Impor satuan pakai dibatalkan karena kesalahan validasi:\n${errors.join('\n')}`
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

  getRawItems(): SatuanPakai[] {
    return this.items
  }
}

export class SatuanBarangService implements CrudService<
  SatuanBarang,
  CreateSatuanBarangDto,
  UpdateSatuanBarangDto
> {
  private items: SatuanBarang[] = []

  constructor() {
    this.reset()
  }

  reset(): void {
    this.items = JSON.parse(JSON.stringify(INITIAL_MOCK_SATUAN_BARANG))
  }

  async list(query?: ListQuery): Promise<PaginatedResponse<SatuanBarang>> {
    return this.getAll(query)
  }

  async getAll(query?: ListQuery): Promise<PaginatedResponse<SatuanBarang>> {
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
      const field = query.sortBy as keyof SatuanBarang
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

  async getById(id: number): Promise<SatuanBarang> {
    const item = this.items.find(s => s.id === Number(id))
    if (!item) {
      throw new Error(`Satuan Produk dengan ID ${id} tidak ditemukan`)
    }
    return item
  }

  async create(dto: CreateSatuanBarangDto): Promise<SatuanBarang> {
    const nextId = this.items.length > 0 ? Math.max(...this.items.map(s => s.id)) + 1 : 1

    const newItem: SatuanBarang = {
      id: nextId,
      kode: dto.kode || `SB-${nextId}`,
      nama: dto.nama,
      status: dto.status ?? 1
    }

    this.items.push(newItem)
    referenceService.setProductUnit({
      id: newItem.id,
      nama: newItem.nama,
      status: newItem.status
    })
    return newItem
  }

  async update(id: number, dto: UpdateSatuanBarangDto): Promise<SatuanBarang> {
    assertPermission('settings.product-units', 'update')
    const index = this.items.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Satuan Produk dengan ID ${id} tidak ditemukan`)
    }

    const current = this.items[index]
    const updated: SatuanBarang = {
      ...current,
      ...(dto.kode !== undefined && { kode: dto.kode }),
      ...(dto.nama !== undefined && { nama: dto.nama }),
      ...(dto.status !== undefined && { status: dto.status })
    }

    this.items[index] = updated
    referenceService.setProductUnit({
      id: updated.id,
      nama: updated.nama,
      status: updated.status
    })
    return updated
  }

  async delete(id: number, options?: { force?: boolean }): Promise<boolean> {
    assertPermission('settings.product-units', 'delete')
    const index = this.items.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Satuan Produk dengan ID ${id} tidak ditemukan`)
    }

    if (!options?.force && productService.isUnitReferenced(Number(id))) {
      throw new Error('Satuan Barang tidak dapat dihapus karena masih digunakan oleh data produk.')
    }

    this.items.splice(index, 1)
    referenceService.removeProductUnit(Number(id))
    return true
  }

  async exportAll(query?: ListQuery): Promise<SatuanBarang[]> {
    assertPermission('settings.product-units', 'read')
    const res = await this.getAll({ ...query, page: 1, pageSize: 100000 })
    return res.data
  }

  async importBatch(
    items: CreateSatuanBarangDto[]
  ): Promise<{ importedCount: number; imported: number; failed: number; errors: string[] }> {
    assertPermission('settings.product-units', 'create')
    const errors: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.nama || !item.nama.trim()) {
        errors.push(`Baris ${i + 1}: Nama Satuan Produk wajib diisi`)
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `Impor satuan barang dibatalkan karena kesalahan validasi:\n${errors.join('\n')}`
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

  getRawItems(): SatuanBarang[] {
    return this.items
  }
}

import { createApiCrudService } from '@/shared/services/api-crud.service'

export const mockSatuanBeliService = new SatuanBeliService()
export const apiSatuanBeliService = createApiCrudService<SatuanBeli, CreateSatuanBeliDto, UpdateSatuanBeliDto>('/master/satuan-beli')

export class SatuanBeliServiceAdapter implements CrudService<SatuanBeli, CreateSatuanBeliDto, UpdateSatuanBeliDto> {
  private get activeService(): CrudService<SatuanBeli, CreateSatuanBeliDto, UpdateSatuanBeliDto> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockSatuanBeliService : apiSatuanBeliService
  }

  reset(): void {
    mockSatuanBeliService.reset()
  }

  get items(): SatuanBeli[] {
    return mockSatuanBeliService.getRawItems()
  }

  getRawItems(): SatuanBeli[] {
    return mockSatuanBeliService.getRawItems()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<SatuanBeli>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<SatuanBeli>> {
    const s = this.activeService as { getAll?: (q?: ListQuery) => Promise<PaginatedResponse<SatuanBeli>>; list: (q?: ListQuery) => Promise<PaginatedResponse<SatuanBeli>> }
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<SatuanBeli> {
    return this.activeService.getById(id)
  }

  create(payload: CreateSatuanBeliDto): Promise<SatuanBeli> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateSatuanBeliDto): Promise<SatuanBeli> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  exportAll(query?: ListQuery): Promise<SatuanBeli[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateSatuanBeliDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const mockSatuanPakaiService = new SatuanPakaiService()
export const apiSatuanPakaiService = createApiCrudService<SatuanPakai, CreateSatuanPakaiDto, UpdateSatuanPakaiDto>('/master/satuan-pakai')

export class SatuanPakaiServiceAdapter implements CrudService<SatuanPakai, CreateSatuanPakaiDto, UpdateSatuanPakaiDto> {
  private get activeService(): CrudService<SatuanPakai, CreateSatuanPakaiDto, UpdateSatuanPakaiDto> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockSatuanPakaiService : apiSatuanPakaiService
  }

  reset(): void {
    mockSatuanPakaiService.reset()
  }

  get items(): SatuanPakai[] {
    return mockSatuanPakaiService.getRawItems()
  }

  getRawItems(): SatuanPakai[] {
    return mockSatuanPakaiService.getRawItems()
  }

  isPurchaseUnitReferenced(purchaseUnitId: number): boolean {
    return mockSatuanPakaiService.isPurchaseUnitReferenced(purchaseUnitId)
  }

  list(query?: ListQuery): Promise<PaginatedResponse<SatuanPakai>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<SatuanPakai>> {
    const s = this.activeService as { getAll?: (q?: ListQuery) => Promise<PaginatedResponse<SatuanPakai>>; list: (q?: ListQuery) => Promise<PaginatedResponse<SatuanPakai>> }
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<SatuanPakai> {
    return this.activeService.getById(id)
  }

  create(payload: CreateSatuanPakaiDto): Promise<SatuanPakai> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateSatuanPakaiDto): Promise<SatuanPakai> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  exportAll(query?: ListQuery): Promise<SatuanPakai[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateSatuanPakaiDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const mockSatuanBarangService = new SatuanBarangService()
export const apiSatuanBarangService = createApiCrudService<SatuanBarang, CreateSatuanBarangDto, UpdateSatuanBarangDto>('/master/satuan-produk')

export class SatuanBarangServiceAdapter implements CrudService<SatuanBarang, CreateSatuanBarangDto, UpdateSatuanBarangDto> {
  private get activeService(): CrudService<SatuanBarang, CreateSatuanBarangDto, UpdateSatuanBarangDto> {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockSatuanBarangService : apiSatuanBarangService
  }

  reset(): void {
    mockSatuanBarangService.reset()
  }

  get items(): SatuanBarang[] {
    return mockSatuanBarangService.getRawItems()
  }

  getRawItems(): SatuanBarang[] {
    return mockSatuanBarangService.getRawItems()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<SatuanBarang>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<SatuanBarang>> {
    const s = this.activeService as { getAll?: (q?: ListQuery) => Promise<PaginatedResponse<SatuanBarang>>; list: (q?: ListQuery) => Promise<PaginatedResponse<SatuanBarang>> }
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<SatuanBarang> {
    return this.activeService.getById(id)
  }

  create(payload: CreateSatuanBarangDto): Promise<SatuanBarang> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateSatuanBarangDto): Promise<SatuanBarang> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  exportAll(query?: ListQuery): Promise<SatuanBarang[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateSatuanBarangDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const satuanBeliService = new SatuanBeliServiceAdapter()
export const satuanPakaiService = new SatuanPakaiServiceAdapter()
export const satuanBarangService = new SatuanBarangServiceAdapter()
