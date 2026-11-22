import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type {
  MasterDataCustomer,
  AdditionalCustomerData,
  CreateCustomerDto,
  UpdateCustomerDto
} from '../types/customer.types'
import { referenceService } from '@/shared/services/reference.service'

export const INITIAL_MOCK_CUSTOMERS: MasterDataCustomer[] = [
  {
    id: 1,
    kode: 'CUST-001',
    nama: 'Hotel Grand Pelangi',
    no_hp: '081122334455',
    email: 'purchasing@grandpelangi.com',
    province_id: 1, // Jawa Timur
    city_id: 103, // Kota Malang
    alamat: 'Jl. Ijen No. 12, Klojen, Malang',
    deskripsi: 'Hotel bintang 4 rekanan pengadaan sofa dan set kamar tidur',
    status: 1,
    created_at: '2026-01-05 10:00:00',
    created_by: 1,
    updated_at: '2026-02-10 14:00:00',
    updated_by: 1
  },
  {
    id: 2,
    kode: 'CUST-002',
    nama: 'PT Meja Bersama',
    no_hp: '081299887766',
    email: 'procurement@mejabersama.co.id',
    province_id: 4, // DKI Jakarta
    city_id: 402, // Kota Jakarta Selatan
    alamat: 'Gedung Artha Lt. 8, TB Simatupang, Jakarta Selatan',
    deskripsi: 'Perusahaan konsultan pengadaan interior perkantoran skala nasional',
    status: 1,
    created_at: '2026-01-08 11:30:00',
    created_by: 1,
    updated_at: '2026-01-08 11:30:00',
    updated_by: 1
  },
  {
    id: 3,
    kode: 'CUST-003',
    nama: 'Kantor Cabang Bank Artha',
    no_hp: '081377665544',
    email: 'umum.cabang@bankartha.co.id',
    province_id: 1, // Jawa Timur
    city_id: 101, // Kota Surabaya
    alamat: 'Jl. Darmo No. 80, Surabaya',
    deskripsi: 'Perbankan rekanan untuk teller modular dan kursi ergonomis',
    status: 1,
    created_at: '2026-01-15 09:20:00',
    created_by: 1,
    updated_at: '2026-01-15 09:20:00',
    updated_by: 1
  },
  {
    id: 4,
    kode: 'CUST-004',
    nama: 'CV Interior Estetika',
    no_hp: '081855443322',
    email: 'studio@interiorestetika.com',
    province_id: 5, // DI Yogyakarta
    city_id: 501, // Kota Yogyakarta
    alamat: 'Jl. Kaliurang KM 6, Sleman, Yogyakarta',
    deskripsi: 'Studio desain interior untuk custom cafe dan residensial',
    status: 1,
    created_at: '2026-01-22 15:45:00',
    created_by: 1,
    updated_at: '2026-02-28 16:30:00',
    updated_by: 1
  },
  {
    id: 5,
    kode: 'CUST-005',
    nama: 'Resto Kayu Manis',
    no_hp: '082211998877',
    email: 'admin@kayumanisresto.id',
    province_id: 3, // Jawa Barat
    city_id: 301, // Kota Bandung
    alamat: 'Jl. Riau No. 102, Bandung',
    deskripsi: 'Restoran tradisional pengadaan kursi cafe scandinavian dan meja solid',
    status: 1,
    created_at: '2026-02-05 13:00:00',
    created_by: 1,
    updated_at: '2026-02-05 13:00:00',
    updated_by: 1
  },
  {
    id: 6,
    kode: 'CUST-006',
    nama: 'PT Graha Cipta',
    no_hp: '081233445566',
    email: 'contact@grahacipta.co.id',
    province_id: 6, // Banten
    city_id: 602, // Tangerang Selatan
    alamat: 'BSD City Sektor 1.2, Tangerang Selatan',
    deskripsi: 'Developer properti cluster perumahan modern',
    status: 0, // Nonaktif
    created_at: '2026-02-18 10:15:00',
    created_by: 1,
    updated_at: '2026-03-01 11:20:00',
    updated_by: 1
  }
]

export const INITIAL_ADDITIONAL_CUSTOMER_DATA: AdditionalCustomerData[] = [
  { id: 1, customer_id: 1, name: 'NPWP', value: '01.998.887.6-652.000' },
  { id: 2, customer_id: 1, name: 'Termin Pembayaran', value: 'TOP 30 Hari' },
  { id: 3, customer_id: 2, name: 'NPWP', value: '02.345.678.9-012.000' },
  { id: 4, customer_id: 2, name: 'PIC Billing', value: 'Ibu Sarah (Finance)' },
  { id: 5, customer_id: 3, name: 'Instansi Induk', value: 'Bank Artha Kantor Pusat' }
]

export class MockCustomerService implements CrudService<
  MasterDataCustomer,
  CreateCustomerDto,
  UpdateCustomerDto
> {
  private customers: MasterDataCustomer[] = []
  private additionalData: AdditionalCustomerData[] = []
  private nextId = 200
  private nextAdditionalId = 200

  constructor() {
    this.reset()
  }

  reset(): void {
    this.customers = INITIAL_MOCK_CUSTOMERS.map(c => ({ ...c }))
    this.additionalData = INITIAL_ADDITIONAL_CUSTOMER_DATA.map(a => ({ ...a }))
  }

  private enrich(customer: MasterDataCustomer): MasterDataCustomer {
    const province_name = referenceService.getProvinceName(customer.province_id)
    const city_name = referenceService.getCityName(customer.city_id)
    const additional = this.additionalData.filter(a => a.customer_id === customer.id)
    return {
      ...customer,
      province_name,
      city_name,
      additional_data: additional.map(a => ({ ...a }))
    }
  }

  getRawItems(): MasterDataCustomer[] {
    return this.customers
  }

  async getAll(query: ListQuery = {}): Promise<PaginatedResponse<MasterDataCustomer>> {
    return this.list(query)
  }

  async list(query: ListQuery = {}): Promise<PaginatedResponse<MasterDataCustomer>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'desc',
      status
    } = query

    let filtered = [...this.customers]

    // Status filter
    if (status !== undefined && status !== '' && status !== 'all') {
      const statusNum = Number(status)
      filtered = filtered.filter(c => c.status === statusNum)
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(c => {
        const kode = (c.kode || '').toLowerCase()
        const nama = (c.nama || '').toLowerCase()
        const no_hp = (c.no_hp || '').toLowerCase()
        const email = (c.email || '').toLowerCase()
        const prov = referenceService.getProvinceName(c.province_id).toLowerCase()
        const city = referenceService.getCityName(c.city_id).toLowerCase()
        return (
          kode.includes(q) ||
          nama.includes(q) ||
          no_hp.includes(q) ||
          email.includes(q) ||
          prov.includes(q) ||
          city.includes(q)
        )
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let valA: unknown = a[sortBy as keyof MasterDataCustomer]
      let valB: unknown = b[sortBy as keyof MasterDataCustomer]

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
    const paginated = filtered.slice(offset, offset + pageSize).map(c => this.enrich(c))

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages
    }
  }

  async getById(id: number): Promise<MasterDataCustomer> {
    const found = this.customers.find(c => c.id === Number(id))
    if (!found) {
      throw new Error(`Customer dengan ID #${id} tidak ditemukan.`)
    }
    return this.enrich(found)
  }

  async create(payload: CreateCustomerDto): Promise<MasterDataCustomer> {
    const code =
      payload.kode === null
        ? null
        : payload.kode
          ? payload.kode.trim()
          : `CUST-${String(this.nextId + 1).padStart(3, '0')}`

    // Duplicate check on kode if present
    if (code) {
      const existing = this.customers.find(c => (c.kode || '').toLowerCase() === code.toLowerCase())
      if (existing) {
        throw new Error(`Customer dengan kode '${code}' sudah terdaftar.`)
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newId = ++this.nextId

    const newCustomer: MasterDataCustomer = {
      id: newId,
      kode: code,
      nama: payload.nama.trim(),
      no_hp: payload.no_hp ? payload.no_hp.trim() : null,
      alamat: payload.alamat ? payload.alamat.trim() : null,
      province_id: payload.province_id ? Number(payload.province_id) : null,
      city_id: payload.city_id ? Number(payload.city_id) : null,
      email: payload.email ? payload.email.trim() : null,
      deskripsi: payload.deskripsi ? payload.deskripsi.trim() : null,
      status: payload.status !== undefined ? Number(payload.status) : 1,
      created_at: now,
      created_by: 1,
      updated_at: now,
      updated_by: 1
    }

    this.customers.unshift(newCustomer)

    // Save additional customer data
    if (payload.additional_data && payload.additional_data.length > 0) {
      for (const item of payload.additional_data) {
        if (item.name && item.name.trim()) {
          this.additionalData.push({
            id: item.id || ++this.nextAdditionalId,
            customer_id: newId,
            name: item.name.trim(),
            value: (item.value || '').trim()
          })
        }
      }
    }

    return this.enrich(newCustomer)
  }

  async update(id: number, payload: UpdateCustomerDto): Promise<MasterDataCustomer> {
    const index = this.customers.findIndex(c => c.id === Number(id))
    if (index === -1) {
      throw new Error(`Customer dengan ID #${id} tidak ditemukan.`)
    }

    if (payload.kode) {
      const duplicate = this.customers.find(
        c =>
          c.id !== Number(id) && (c.kode || '').toLowerCase() === payload.kode!.trim().toLowerCase()
      )
      if (duplicate) {
        throw new Error(`Customer dengan kode '${payload.kode}' sudah digunakan customer lain.`)
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const existing = this.customers[index]

    const updated: MasterDataCustomer = {
      ...existing,
      kode:
        payload.kode !== undefined ? (payload.kode ? payload.kode.trim() : null) : existing.kode,
      nama: payload.nama !== undefined ? payload.nama.trim() : existing.nama,
      no_hp:
        payload.no_hp !== undefined
          ? payload.no_hp
            ? payload.no_hp.trim()
            : null
          : existing.no_hp,
      email:
        payload.email !== undefined
          ? payload.email
            ? payload.email.trim()
            : null
          : existing.email,
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

    this.customers[index] = updated

    // Update additional data
    if (payload.additional_data !== undefined) {
      this.additionalData = this.additionalData.filter(a => a.customer_id !== Number(id))
      for (const item of payload.additional_data) {
        if (item.name && item.name.trim()) {
          this.additionalData.push({
            id: item.id || ++this.nextAdditionalId,
            customer_id: Number(id),
            name: item.name.trim(),
            value: (item.value || '').trim()
          })
        }
      }
    }

    return this.enrich(updated)
  }

  async delete(id: number): Promise<void> {
    const index = this.customers.findIndex(c => c.id === Number(id))
    if (index === -1) {
      throw new Error(`Customer dengan ID #${id} tidak ditemukan.`)
    }

    // Cascade delete additional data
    this.additionalData = this.additionalData.filter(a => a.customer_id !== Number(id))
    this.customers.splice(index, 1)
  }

  async exportAll(query: ListQuery = {}): Promise<MasterDataCustomer[]> {
    const res = await this.list({ ...query, page: 1, pageSize: 999999 })
    return res.data
  }

  async importBatch(items: CreateCustomerDto[]): Promise<{ importedCount: number }> {
    for (const item of items) {
      if (item.kode) {
        const exists = this.customers.find(
          c => (c.kode || '').toLowerCase() === item.kode!.trim().toLowerCase()
        )
        if (exists) {
          throw new Error(`Impor dibatalkan: Kode '${item.kode}' sudah terdaftar dalam sistem.`)
        }
      }
    }

    for (const item of items) {
      await this.create(item)
    }

    return { importedCount: items.length }
  }

  async toggleStatus(id: number, status: number): Promise<MasterDataCustomer> {
    return this.update(id, { status })
  }
}

export const mockCustomerService = new MockCustomerService()

import { apiClient } from '@/shared/services/api-client'

export interface ICustomerService extends CrudService<MasterDataCustomer, CreateCustomerDto, UpdateCustomerDto> {
  reset?(): void
  getRawItems?(): MasterDataCustomer[]
  getAll?(query?: ListQuery): Promise<PaginatedResponse<MasterDataCustomer>>
  toggleStatus?(id: number, status: number): Promise<MasterDataCustomer>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformCustomer(item: any): MasterDataCustomer {
  const rawAdditional = item.additional_data || item.additionalData || []
  return {
    ...item,
    province_name: item.province?.name || referenceService.getProvinceName(item.province_id),
    city_name: item.city?.name || referenceService.getCityName(item.city_id),
    additional_data: Array.isArray(rawAdditional) ? rawAdditional : []
  }
}

export const apiCustomerService: ICustomerService = {
  async list(query?: ListQuery): Promise<PaginatedResponse<MasterDataCustomer>> {
    return this.getAll!(query)
  },

  async getAll(query?: ListQuery): Promise<PaginatedResponse<MasterDataCustomer>> {
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
    const res = await apiClient<any[]>(`/master/customers${queryString}`)

    const totalItems = res.meta?.totalItems ?? res.data.length
    const page = res.meta?.page ?? query?.page ?? 1
    const pageSize = res.meta?.pageSize ?? query?.pageSize ?? 10
    const totalPages = res.meta?.totalPages ?? (Math.ceil(totalItems / pageSize) || 1)

    return {
      data: res.data.map(transformCustomer),
      total: totalItems,
      page,
      pageSize,
      totalPages
    }
  },

  async getById(id: number): Promise<MasterDataCustomer> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/customers/${id}`)
    return transformCustomer(res.data)
  },

  async create(payload: CreateCustomerDto): Promise<MasterDataCustomer> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>('/master/customers', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return transformCustomer(res.data)
  },

  async update(id: number, payload: UpdateCustomerDto): Promise<MasterDataCustomer> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return transformCustomer(res.data)
  },

  async delete(id: number): Promise<boolean> {
    await apiClient<{ id: number }>(`/master/customers/${id}`, {
      method: 'DELETE'
    })
    return true
  },

  async toggleStatus(id: number, status: number): Promise<MasterDataCustomer> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/customers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
    return transformCustomer(res.data)
  },

  async exportAll(query?: ListQuery): Promise<MasterDataCustomer[]> {
    const res = await this.getAll!({ ...query, page: 1, pageSize: 100000 })
    return res.data
  },

  async importBatch(items: CreateCustomerDto[]) {
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

export class CustomerServiceAdapter implements ICustomerService {
  private get activeService(): ICustomerService {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockCustomerService : apiCustomerService
  }

  reset(): void {
    mockCustomerService.reset()
  }

  getRawItems(): MasterDataCustomer[] {
    return mockCustomerService.getRawItems()
  }

  list(query?: ListQuery): Promise<PaginatedResponse<MasterDataCustomer>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<MasterDataCustomer>> {
    const s = this.activeService
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<MasterDataCustomer> {
    return this.activeService.getById(id)
  }

  create(payload: CreateCustomerDto): Promise<MasterDataCustomer> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateCustomerDto): Promise<MasterDataCustomer> {
    return this.activeService.update(id, payload)
  }

  delete(id: number): Promise<void | boolean> {
    return this.activeService.delete(id)
  }

  toggleStatus(id: number, status: number): Promise<MasterDataCustomer> {
    if (this.activeService.toggleStatus) {
      return this.activeService.toggleStatus(id, status)
    }
    return this.update(id, { status })
  }

  exportAll(query?: ListQuery): Promise<MasterDataCustomer[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateCustomerDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0, imported: 0, failed: 0, errors: [] })
  }
}

export const customerService = new CustomerServiceAdapter()
