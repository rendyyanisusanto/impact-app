import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type {
  MasterDataSuplier,
  AdditionalSupplierData,
  CreateSupplierDto,
  UpdateSupplierDto
} from '../types/supplier.types'
import { referenceService } from '@/shared/services/reference.service'

export const INITIAL_MOCK_SUPPLIERS: MasterDataSuplier[] = [
  {
    id: 1,
    kode: 'SUP-001',
    nama: 'CV Kayu Jati Perkasa',
    no_hp: '081234567890',
    email: 'info@kayujatiperkasa.co.id',
    province_id: 2, // Jawa Tengah
    city_id: 202, // Kab. Jepara
    alamat: 'Jl. Pemuda No. 45, Tahunan, Jepara',
    deskripsi: 'Suplier spesialis kayu jati log dan gergajian grade A',
    status: 1,
    created_at: '2026-01-10 08:30:00',
    created_by: 1,
    updated_at: '2026-02-15 11:20:00',
    updated_by: 1
  },
  {
    id: 2,
    kode: 'SUP-002',
    nama: 'PT Busa Mandiri Abadi',
    no_hp: '081388991122',
    email: 'sales@busamandiri.com',
    province_id: 2, // Jawa Tengah
    city_id: 201, // Kota Semarang
    alamat: 'Kawasan Industri Candi Blok C-8, Semarang',
    deskripsi: 'Penyedia busa density tinggi D-32 yellow dan busa rebonded',
    status: 1,
    created_at: '2026-01-12 09:15:00',
    created_by: 1,
    updated_at: '2026-01-12 09:15:00',
    updated_by: 1
  },
  {
    id: 3,
    kode: 'SUP-003',
    nama: 'Toko Besi & Engsel Jaya',
    no_hp: '082144556677',
    email: 'engseljaya@gmail.com',
    province_id: 2, // Jawa Tengah
    city_id: 204, // Kab. Kudus
    alamat: 'Jl. Sunan Kudus No. 112, Kudus',
    deskripsi: 'Distributor engsel sendok, rel laci hidrolik, dan handle lemari',
    status: 1,
    created_at: '2026-01-15 14:00:00',
    created_by: 1,
    updated_at: '2026-03-01 10:00:00',
    updated_by: 1
  },
  {
    id: 4,
    kode: 'SUP-004',
    nama: 'PT Cat Indah Lestari',
    no_hp: '085677889900',
    email: 'order@catindahlestari.co.id',
    province_id: 1, // Jawa Timur
    city_id: 101, // Kota Surabaya
    alamat: 'Jl. Rungkut Industri III No. 20, Surabaya',
    deskripsi: 'Penyedia bahan finishing NC, melamine gloss, dan thinner super',
    status: 1,
    created_at: '2026-01-20 10:30:00',
    created_by: 1,
    updated_at: '2026-01-20 10:30:00',
    updated_by: 1
  },
  {
    id: 5,
    kode: 'SUP-005',
    nama: 'CV Kain Upholstery Nusantara',
    no_hp: '081900112233',
    email: 'kain.nusantara@gmail.com',
    province_id: 3, // Jawa Barat
    city_id: 301, // Kota Bandung
    alamat: 'Jl. Otista No. 88, Bandung',
    deskripsi: 'Kain sofa woven, fabric suede, dan kulit sintetis oscar import',
    status: 0, // Nonaktif
    created_at: '2026-02-01 13:45:00',
    created_by: 1,
    updated_at: '2026-03-10 16:20:00',
    updated_by: 1
  }
]

export const INITIAL_ADDITIONAL_SUPPLIER_DATA: AdditionalSupplierData[] = [
  { id: 1, supplier_id: 1, name: 'Nama Bank', value: 'BCA KCP Jepara' },
  { id: 2, supplier_id: 1, name: 'No. Rekening', value: '018-2938-192' },
  { id: 3, supplier_id: 1, name: 'NPWP', value: '01.234.567.8-501.000' },
  { id: 4, supplier_id: 2, name: 'Nama Bank', value: 'Mandiri Semarang' },
  { id: 5, supplier_id: 2, name: 'No. Rekening', value: '135-00-1928374-1' },
  { id: 6, supplier_id: 3, name: 'PIC Toko', value: 'Pak Wijaya (0821-4455-6677)' }
]

export class MockSupplierService implements CrudService<
  MasterDataSuplier,
  CreateSupplierDto,
  UpdateSupplierDto
> {
  private suppliers: MasterDataSuplier[] = []
  private additionalData: AdditionalSupplierData[] = []
  private nextId = 100
  private nextAdditionalId = 100

  constructor() {
    this.reset()
  }

  reset(): void {
    this.suppliers = INITIAL_MOCK_SUPPLIERS.map(s => ({ ...s }))
    this.additionalData = INITIAL_ADDITIONAL_SUPPLIER_DATA.map(a => ({ ...a }))
  }

  private enrich(supplier: MasterDataSuplier): MasterDataSuplier {
    const province_name = referenceService.getProvinceName(supplier.province_id)
    const city_name = referenceService.getCityName(supplier.city_id)
    const additional = this.additionalData.filter(a => a.supplier_id === supplier.id)
    return {
      ...supplier,
      province_name,
      city_name,
      additional_data: additional.map(a => ({ ...a }))
    }
  }

  async list(query: ListQuery = {}): Promise<PaginatedResponse<MasterDataSuplier>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'desc',
      status
    } = query

    let filtered = [...this.suppliers]

    // Status filter
    if (status !== undefined && status !== '' && status !== 'all') {
      const statusNum = Number(status)
      filtered = filtered.filter(s => s.status === statusNum)
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(s => {
        const prov = referenceService.getProvinceName(s.province_id).toLowerCase()
        const city = referenceService.getCityName(s.city_id).toLowerCase()
        return (
          s.kode.toLowerCase().includes(q) ||
          s.nama.toLowerCase().includes(q) ||
          s.no_hp.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          prov.includes(q) ||
          city.includes(q)
        )
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let valA: unknown = a[sortBy as keyof MasterDataSuplier]
      let valB: unknown = b[sortBy as keyof MasterDataSuplier]

      if (sortBy === 'province_name') {
        valA = referenceService.getProvinceName(a.province_id)
        valB = referenceService.getProvinceName(b.province_id)
      } else if (sortBy === 'city_name') {
        valA = referenceService.getCityName(a.city_id)
        valB = referenceService.getCityName(b.city_id)
      }

      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      const modifier = sortOrder === 'asc' ? 1 : -1
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * modifier
      }
      return String(valA).localeCompare(String(valB)) * modifier
    })

    const total = filtered.length
    const totalPages = Math.ceil(total / pageSize) || 1
    const offset = (page - 1) * pageSize
    const paginated = filtered.slice(offset, offset + pageSize).map(s => this.enrich(s))

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages
    }
  }

  async getById(id: number): Promise<MasterDataSuplier> {
    const found = this.suppliers.find(s => s.id === Number(id))
    if (!found) {
      throw new Error(`Supplier dengan ID #${id} tidak ditemukan.`)
    }
    return this.enrich(found)
  }

  async create(payload: CreateSupplierDto): Promise<MasterDataSuplier> {
    // Unique kode check
    const existing = this.suppliers.find(
      s => s.kode.toLowerCase() === payload.kode.trim().toLowerCase()
    )
    if (existing) {
      throw new Error(`Supplier dengan kode '${payload.kode}' sudah terdaftar.`)
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newId = ++this.nextId

    const newSupplier: MasterDataSuplier = {
      id: newId,
      kode: payload.kode.trim(),
      nama: payload.nama.trim(),
      no_hp: payload.no_hp.trim(),
      email: payload.email.trim(),
      province_id: payload.province_id ? Number(payload.province_id) : null,
      city_id: payload.city_id ? Number(payload.city_id) : null,
      alamat: payload.alamat ? payload.alamat.trim() : null,
      deskripsi: payload.deskripsi ? payload.deskripsi.trim() : null,
      status: payload.status !== undefined ? Number(payload.status) : 1,
      created_at: now,
      created_by: 1, // Mock logged-in user ID
      updated_at: now,
      updated_by: 1
    }

    this.suppliers.unshift(newSupplier)

    // Save additional data
    if (payload.additional_data && payload.additional_data.length > 0) {
      for (const item of payload.additional_data) {
        if (item.name && item.name.trim()) {
          this.additionalData.push({
            id: item.id || ++this.nextAdditionalId,
            supplier_id: newId,
            name: item.name.trim(),
            value: (item.value || '').trim()
          })
        }
      }
    }

    return this.enrich(newSupplier)
  }

  async update(id: number, payload: UpdateSupplierDto): Promise<MasterDataSuplier> {
    const index = this.suppliers.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Supplier dengan ID #${id} tidak ditemukan.`)
    }

    if (payload.kode) {
      const duplicate = this.suppliers.find(
        s => s.id !== Number(id) && s.kode.toLowerCase() === payload.kode!.trim().toLowerCase()
      )
      if (duplicate) {
        throw new Error(
          `Supplier dengan kode '${payload.kode}' sudah digunakan oleh supplier lain.`
        )
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const existing = this.suppliers[index]

    const updated: MasterDataSuplier = {
      ...existing,
      kode: payload.kode ? payload.kode.trim() : existing.kode,
      nama: payload.nama ? payload.nama.trim() : existing.nama,
      no_hp: payload.no_hp ? payload.no_hp.trim() : existing.no_hp,
      email: payload.email ? payload.email.trim() : existing.email,
      province_id:
        payload.province_id !== undefined
          ? payload.province_id
            ? Number(payload.province_id)
            : null
          : existing.province_id,
      city_id:
        payload.city_id !== undefined
          ? payload.city_id
            ? Number(payload.city_id)
            : null
          : existing.city_id,
      alamat:
        payload.alamat !== undefined
          ? payload.alamat
            ? payload.alamat.trim()
            : null
          : existing.alamat,
      deskripsi:
        payload.deskripsi !== undefined
          ? payload.deskripsi
            ? payload.deskripsi.trim()
            : null
          : existing.deskripsi,
      status: payload.status !== undefined ? Number(payload.status) : existing.status,
      updated_at: now,
      updated_by: 1
    }

    this.suppliers[index] = updated

    // Update additional data (replace existing for this supplier)
    if (payload.additional_data !== undefined) {
      this.additionalData = this.additionalData.filter(a => a.supplier_id !== Number(id))
      for (const item of payload.additional_data) {
        if (item.name && item.name.trim()) {
          this.additionalData.push({
            id: item.id || ++this.nextAdditionalId,
            supplier_id: Number(id),
            name: item.name.trim(),
            value: (item.value || '').trim()
          })
        }
      }
    }

    return this.enrich(updated)
  }

  async delete(id: number): Promise<void> {
    const index = this.suppliers.findIndex(s => s.id === Number(id))
    if (index === -1) {
      throw new Error(`Supplier dengan ID #${id} tidak ditemukan.`)
    }

    // Cascade delete additional data
    this.additionalData = this.additionalData.filter(a => a.supplier_id !== Number(id))
    this.suppliers.splice(index, 1)
  }

  async exportAll(query: ListQuery = {}): Promise<MasterDataSuplier[]> {
    const res = await this.list({ ...query, page: 1, pageSize: 999999 })
    return res.data
  }

  async importBatch(items: CreateSupplierDto[]): Promise<{ importedCount: number }> {
    // Check for duplicates against existing repo
    for (const item of items) {
      const exists = this.suppliers.find(
        s => s.kode.toLowerCase() === item.kode.trim().toLowerCase()
      )
      if (exists) {
        throw new Error(`Impor dibatalkan: Kode '${item.kode}' sudah terdaftar dalam sistem.`)
      }
    }

    for (const item of items) {
      await this.create(item)
    }

    return { importedCount: items.length }
  }

  async toggleStatus(id: number, status: number): Promise<MasterDataSuplier> {
    return this.update(id, { status })
  }

  getRawItems(): MasterDataSuplier[] {
    return this.suppliers
  }
}

export const mockSupplierService = new MockSupplierService()

import { apiClient } from '@/shared/services/api-client'

export interface ISupplierService extends CrudService<MasterDataSuplier, CreateSupplierDto, UpdateSupplierDto> {
  reset?(): void
  getRawItems?(): MasterDataSuplier[]
  getAll?(query?: ListQuery): Promise<PaginatedResponse<MasterDataSuplier>>
  toggleStatus?(id: number, status: number): Promise<MasterDataSuplier>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformSupplier(item: any): MasterDataSuplier {
  const rawAdditional = item.additional_data || item.additionalData || []
  return {
    ...item,
    province_name: item.province?.name || referenceService.getProvinceName(item.province_id),
    city_name: item.city?.name || referenceService.getCityName(item.city_id),
    additional_data: Array.isArray(rawAdditional) ? rawAdditional : []
  }
}

export const apiSupplierService: ISupplierService = {
  async list(query?: ListQuery): Promise<PaginatedResponse<MasterDataSuplier>> {
    return this.getAll!(query)
  },

  async getAll(query?: ListQuery): Promise<PaginatedResponse<MasterDataSuplier>> {
    const params = new URLSearchParams()
    if (query?.page) params.append('page', String(query.page))
    if (query?.pageSize) params.append('pageSize', String(query.pageSize))
    if (query?.search) params.append('search', query.search)
    params.append('sortBy', query?.sortBy || 'id')
    params.append('sortOrder', query?.sortOrder || 'desc')
    if (query?.status !== undefined && query.status !== 'all' && query.status !== '') {
      params.append('status', String(query.status))
    }

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (
          !['page', 'pageSize', 'search', 'sortBy', 'sortOrder', 'status'].includes(key) &&
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
    const res = await apiClient<any[]>(`/master/suppliers${queryString}`)

    const totalItems = res.meta?.totalItems ?? res.data.length
    const page = res.meta?.page ?? query?.page ?? 1
    const pageSize = res.meta?.pageSize ?? query?.pageSize ?? 10
    const totalPages = res.meta?.totalPages ?? (Math.ceil(totalItems / pageSize) || 1)

    return {
      data: res.data.map(transformSupplier),
      total: totalItems,
      page,
      pageSize,
      totalPages
    }
  },

  async getById(id: number): Promise<MasterDataSuplier> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/suppliers/${id}`)
    return transformSupplier(res.data)
  },

  async create(payload: CreateSupplierDto): Promise<MasterDataSuplier> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>('/master/suppliers', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return transformSupplier(res.data)
  },

  async update(id: number, payload: UpdateSupplierDto): Promise<MasterDataSuplier> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return transformSupplier(res.data)
  },

  async delete(id: number): Promise<boolean> {
    await apiClient<{ id: number }>(`/master/suppliers/${id}`, {
      method: 'DELETE'
    })
    return true
  },

  async toggleStatus(id: number, status: number): Promise<MasterDataSuplier> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/suppliers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
    return transformSupplier(res.data)
  },

  async exportAll(query?: ListQuery): Promise<MasterDataSuplier[]> {
    const res = await this.getAll!({ ...query, page: 1, pageSize: 100000 })
    return res.data
  },

  async importBatch(items: CreateSupplierDto[]) {
    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < items.length; i++) {
      try {
        await this.create(items[i])
        imported++
      } catch (err: unknown) {
        failed++
        errors.push((err as Error).message || `Baris ${i + 1} gagal diimpor`)
      }
    }

    return { importedCount: imported, imported, failed, errors }
  }
}

export class SupplierServiceAdapter implements ISupplierService {
  private get activeService(): ISupplierService {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockSupplierService : apiSupplierService
  }

  reset(): void {
    mockSupplierService.reset()
  }

  getRawItems(): MasterDataSuplier[] {
    return mockSupplierService.getRawItems()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<MasterDataSuplier>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<MasterDataSuplier>> {
    const s = this.activeService
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<MasterDataSuplier> {
    return this.activeService.getById(id)
  }

  create(payload: CreateSupplierDto): Promise<MasterDataSuplier> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateSupplierDto): Promise<MasterDataSuplier> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  toggleStatus(id: number, status: number): Promise<MasterDataSuplier> {
    if (this.activeService.toggleStatus) {
      return this.activeService.toggleStatus(id, status)
    }
    return this.update(id, { status })
  }

  exportAll(query?: ListQuery): Promise<MasterDataSuplier[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateSupplierDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const supplierService = new SupplierServiceAdapter()
