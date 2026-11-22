import type { CrudService, ListQuery, PaginatedResponse } from '@/shared/types/crud.types'
import type {
  MasterDataBahan,
  KonversiSatuanBahan,
  CreateMaterialDto,
  UpdateMaterialDto
} from '../types/material.types'
import { referenceService } from '@/shared/services/reference.service'
import { assertPermission } from '@/shared/services/service-guard'
import { formatCurrency } from '@/shared/utils/formatters'
import { apiClient } from '@/shared/services/api-client'
import {
  MOCK_GUDANG,
  MOCK_SATUAN_PAKAI,
  MOCK_SATUAN_BELI
} from '@/mocks/references/master-references.mock'

export const INITIAL_MOCK_MATERIALS: MasterDataBahan[] = [
  {
    id: 1,
    kode: 'MAT-001',
    nama: 'Kayu Jati Solid Grade A',
    min_qty: 25,
    qty: 12,
    satuan_pakai_id: 1, // Batang
    satuan_beli_id: 1, // Kubik (m3)
    gudang_id: 1, // Gudang Kayu Utama
    harga_satuan: 450000.0,
    foto: 'kayu-jati-grade-a.jpg',
    deskripsi: 'Kayu jati perhutani TPK Blora oven MC 12%',
    status: 1,
    created_at: '2026-01-05 08:00:00',
    created_by: 1,
    updated_at: '2026-02-10 09:30:00',
    updated_by: 1
  },
  {
    id: 2,
    kode: 'MAT-002',
    nama: 'Busa Density 32 (Super Yellow)',
    min_qty: 20,
    qty: 8,
    satuan_pakai_id: 2, // Lembar
    satuan_beli_id: 5, // Dus / Karton
    gudang_id: 2, // Gudang Busa & Upholstery
    harga_satuan: 185000.0,
    foto: 'busa-d32-yellow.jpg',
    deskripsi: 'Busa sofa kenyal tebal 10cm ukuran 100x200cm',
    status: 1,
    created_at: '2026-01-10 11:15:00',
    created_by: 1,
    updated_at: '2026-01-10 11:15:00',
    updated_by: 1
  },
  {
    id: 3,
    kode: 'MAT-003',
    nama: 'Cat Finishing Melamine Gloss',
    min_qty: 15,
    qty: 5,
    satuan_pakai_id: 3, // Kaleng
    satuan_beli_id: 3, // Pail (20L)
    gudang_id: 3, // Gudang Finishing & Cat
    harga_satuan: 120000.0,
    foto: 'melamine-gloss.jpg',
    deskripsi: 'Top coat finishing kayu mengkilap anti gores',
    status: 1,
    created_at: '2026-01-12 14:00:00',
    created_by: 1,
    updated_at: '2026-02-15 16:00:00',
    updated_by: 1
  },
  {
    id: 4,
    kode: 'MAT-004',
    nama: 'Engsel Slow Motion Soft Close',
    min_qty: 50,
    qty: 18,
    satuan_pakai_id: 6, // Set
    satuan_beli_id: 5, // Dus / Karton
    gudang_id: 4, // Gudang Hardware & Fitting
    harga_satuan: 28000.0,
    foto: 'engsel-soft-close.jpg',
    deskripsi: 'Engsel sendok hidrolik lurus stainless 304',
    status: 1,
    created_at: '2026-01-18 10:20:00',
    created_by: 1,
    updated_at: '2026-01-18 10:20:00',
    updated_by: 1
  },
  {
    id: 5,
    kode: 'MAT-005',
    nama: 'Plywood 18mm Meranti',
    min_qty: 12,
    qty: 4,
    satuan_pakai_id: 2, // Lembar
    satuan_beli_id: 2, // Palet
    gudang_id: 5, // Gudang Panel & Lembaran
    harga_satuan: 235000.0,
    foto: 'plywood-18mm.jpg',
    deskripsi: 'Triplek multipleks meranti utuh grade furniture',
    status: 1,
    created_at: '2026-01-25 09:00:00',
    created_by: 1,
    updated_at: '2026-01-25 09:00:00',
    updated_by: 1
  },
  {
    id: 6,
    kode: 'MAT-006',
    nama: 'Sekrup Gipsum 1.5 Inch',
    min_qty: 100,
    qty: 120,
    satuan_pakai_id: 4, // Pcs
    satuan_beli_id: 5, // Dus / Karton
    gudang_id: 4, // Gudang Hardware & Fitting
    harga_satuan: 450.0,
    foto: 'sekrup-1-5.jpg',
    deskripsi: 'Sekrup hitam ulir tajam anti karat',
    status: 1,
    created_at: '2026-02-01 13:30:00',
    created_by: 1,
    updated_at: '2026-02-01 13:30:00',
    updated_by: 1
  },
  {
    id: 7,
    kode: 'MAT-007',
    nama: 'Amplas Roll Grid 180',
    min_qty: 10,
    qty: 2,
    satuan_pakai_id: 5, // Meter
    satuan_beli_id: 6, // Roll
    gudang_id: 3, // Gudang Finishing & Cat
    harga_satuan: 15000.0,
    foto: 'amplas-roll.jpg',
    deskripsi: 'Kertas gosok amplas roll khusus kayu keras',
    status: 0, // Nonaktif
    created_at: '2026-02-10 15:00:00',
    created_by: 1,
    updated_at: '2026-03-01 10:00:00',
    updated_by: 1
  }
]

export const INITIAL_KONVERSI_SATUAN: KonversiSatuanBahan[] = [
  { id: 1, bahan_id: 1, satuan_id: 1, nilai: 25, default: 1 }, // 1 Kubik = 25 Batang
  { id: 2, bahan_id: 2, satuan_id: 5, nilai: 10, default: 1 }, // 1 Dus = 10 Lembar
  { id: 3, bahan_id: 3, satuan_id: 3, nilai: 5, default: 1 }, // 1 Pail = 5 Kaleng (4L)
  { id: 4, bahan_id: 4, satuan_id: 5, nilai: 50, default: 1 }, // 1 Dus = 50 Set
  { id: 5, bahan_id: 5, satuan_id: 2, nilai: 50, default: 1 }, // 1 Palet = 50 Lembar
  { id: 6, bahan_id: 6, satuan_id: 5, nilai: 1000, default: 1 } // 1 Dus = 1000 Pcs
]

export class MockMaterialService implements CrudService<
  MasterDataBahan,
  CreateMaterialDto,
  UpdateMaterialDto
> {
  private materials: MasterDataBahan[] = []
  private konversiList: KonversiSatuanBahan[] = []
  private nextId = 300
  private nextKonversiId = 300

  constructor() {
    this.reset()
  }

  reset(): void {
    this.materials = INITIAL_MOCK_MATERIALS.map(m => ({ ...m }))
    this.konversiList = INITIAL_KONVERSI_SATUAN.map(k => ({ ...k }))
  }

  getRawItems(): MasterDataBahan[] {
    return this.materials
  }

  getRawKonversi(): KonversiSatuanBahan[] {
    return this.konversiList
  }

  isWarehouseReferenced(gudangId: number): boolean {
    return this.materials.some(m => m.gudang_id === Number(gudangId))
  }

  isPurchaseUnitReferenced(unitId: number): boolean {
    return (
      this.materials.some(m => m.satuan_beli_id === Number(unitId)) ||
      this.konversiList.some(k => k.satuan_id === Number(unitId))
    )
  }

  isUsageUnitReferenced(unitId: number): boolean {
    return this.materials.some(m => m.satuan_pakai_id === Number(unitId))
  }

  async getLookups(): Promise<MaterialLookups> {
    return {
      buyUnits: MOCK_SATUAN_BELI.map(u => ({ id: u.id, kode: null, nama: u.nama, default: 0 })),
      usageUnits: MOCK_SATUAN_PAKAI.map(u => ({ id: u.id, nama: u.nama, pembagi: 1, satuanBeliId: null })),
      warehouses: MOCK_GUDANG.map(w => ({ id: w.id, kode: null, nama: w.nama, color: null }))
    }
  }

  private enrich(material: MasterDataBahan): MasterDataBahan {
    const satuan_pakai_nama = referenceService.getSatuanPakaiName(material.satuan_pakai_id)
    const satuan_beli_nama = referenceService.getSatuanBeliName(material.satuan_beli_id)
    const gudang_nama = referenceService.getGudangName(material.gudang_id)
    const harga_satuan_formatted =
      material.harga_satuan !== null ? formatCurrency(material.harga_satuan) : '-'

    const konversi = this.konversiList
      .filter(k => k.bahan_id === material.id)
      .map(k => ({
        ...k,
        satuan_nama: referenceService.getSatuanBeliName(k.satuan_id)
      }))

    return {
      ...material,
      satuan_pakai_nama,
      satuan_beli_nama,
      gudang_nama,
      harga_satuan_formatted,
      konversi_satuan: konversi
    }
  }

  async list(query: ListQuery = {}): Promise<PaginatedResponse<MasterDataBahan>> {
    assertPermission('inventory.materials', 'read')
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'desc',
      status
    } = query

    let filtered = [...this.materials]

    if (status !== undefined && status !== '' && status !== 'all') {
      const statusNum = Number(status)
      filtered = filtered.filter(m => m.status === statusNum)
    }

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(m => {
        const kode = (m.kode || '').toLowerCase()
        const nama = (m.nama || '').toLowerCase()
        const gudang = referenceService.getGudangName(m.gudang_id).toLowerCase()
        const sp = referenceService.getSatuanPakaiName(m.satuan_pakai_id).toLowerCase()
        const sb = referenceService.getSatuanBeliName(m.satuan_beli_id).toLowerCase()
        return (
          kode.includes(q) ||
          nama.includes(q) ||
          gudang.includes(q) ||
          sp.includes(q) ||
          sb.includes(q)
        )
      })
    }

    filtered.sort((a, b) => {
      let valA: unknown = a[sortBy as keyof MasterDataBahan]
      let valB: unknown = b[sortBy as keyof MasterDataBahan]

      if (sortBy === 'gudang_nama') {
        valA = referenceService.getGudangName(a.gudang_id)
        valB = referenceService.getGudangName(b.gudang_id)
      } else if (sortBy === 'satuan_pakai_nama') {
        valA = referenceService.getSatuanPakaiName(a.satuan_pakai_id)
        valB = referenceService.getSatuanPakaiName(b.satuan_pakai_id)
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
    const paginated = filtered.slice(offset, offset + pageSize).map(m => this.enrich(m))

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages
    }
  }

  async getById(id: number): Promise<MasterDataBahan> {
    const found = this.materials.find(m => m.id === Number(id))
    if (!found) {
      throw new Error(`Bahan dengan ID #${id} tidak ditemukan.`)
    }
    return this.enrich(found)
  }

  async create(payload: CreateMaterialDto): Promise<MasterDataBahan> {
    const code = payload.kode
      ? payload.kode.trim()
      : `MAT-${String(this.nextId + 1).padStart(3, '0')}`

    if (code) {
      const existing = this.materials.find(m => (m.kode || '').toLowerCase() === code.toLowerCase())
      if (existing) {
        throw new Error(`Bahan dengan kode '${code}' sudah terdaftar.`)
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newId = ++this.nextId

    const newMaterial: MasterDataBahan = {
      id: newId,
      kode: code,
      nama: payload.nama.trim(),
      min_qty:
        payload.min_qty !== undefined && payload.min_qty !== null ? Number(payload.min_qty) : 0,
      qty: payload.qty !== undefined && payload.qty !== null ? Number(payload.qty) : 0,
      satuan_pakai_id: payload.satuan_pakai_id ? Number(payload.satuan_pakai_id) : null,
      satuan_beli_id: payload.satuan_beli_id ? Number(payload.satuan_beli_id) : null,
      gudang_id: payload.gudang_id ? Number(payload.gudang_id) : null,
      harga_satuan:
        payload.harga_satuan !== undefined && payload.harga_satuan !== null
          ? Number(payload.harga_satuan)
          : null,
      foto: payload.foto ? payload.foto.trim() : null,
      deskripsi: payload.deskripsi ? payload.deskripsi.trim() : null,
      status: payload.status !== undefined ? Number(payload.status) : 1,
      created_at: now,
      created_by: 1,
      updated_at: now,
      updated_by: 1
    }

    this.materials.unshift(newMaterial)

    // Save konversi satuan
    if (payload.konversi_satuan && payload.konversi_satuan.length > 0) {
      for (const item of payload.konversi_satuan) {
        if (item.satuan_id && item.nilai > 0) {
          this.konversiList.push({
            id: ++this.nextKonversiId,
            bahan_id: newId,
            satuan_id: Number(item.satuan_id),
            nilai: Number(item.nilai),
            default: item.default ? 1 : 0
          })
        }
      }
    }

    return this.enrich(newMaterial)
  }

  async update(id: number, payload: UpdateMaterialDto): Promise<MasterDataBahan> {
    const index = this.materials.findIndex(m => m.id === Number(id))
    if (index === -1) {
      throw new Error(`Bahan dengan ID #${id} tidak ditemukan.`)
    }

    if (payload.kode) {
      const duplicate = this.materials.find(
        m =>
          m.id !== Number(id) && (m.kode || '').toLowerCase() === payload.kode!.trim().toLowerCase()
      )
      if (duplicate) {
        throw new Error(`Bahan dengan kode '${payload.kode}' sudah digunakan bahan lain.`)
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const existing = this.materials[index]

    const updated: MasterDataBahan = {
      ...existing,
      kode:
        payload.kode !== undefined ? (payload.kode ? payload.kode.trim() : null) : existing.kode,
      nama: payload.nama !== undefined ? payload.nama.trim() : existing.nama,
      min_qty:
        payload.min_qty !== undefined && payload.min_qty !== null
          ? Number(payload.min_qty)
          : existing.min_qty,
      // Note: qty is kept safe as per Sprint 3 rules (stock mutation in Sprint 5)
      qty: payload.qty !== undefined && payload.qty !== null ? Number(payload.qty) : existing.qty,
      satuan_pakai_id:
        payload.satuan_pakai_id !== undefined
          ? payload.satuan_pakai_id
            ? Number(payload.satuan_pakai_id)
            : null
          : existing.satuan_pakai_id,
      satuan_beli_id:
        payload.satuan_beli_id !== undefined
          ? payload.satuan_beli_id
            ? Number(payload.satuan_beli_id)
            : null
          : existing.satuan_beli_id,
      gudang_id:
        payload.gudang_id !== undefined
          ? payload.gudang_id
            ? Number(payload.gudang_id)
            : null
          : existing.gudang_id,
      harga_satuan:
        payload.harga_satuan !== undefined
          ? payload.harga_satuan !== null
            ? Number(payload.harga_satuan)
            : null
          : existing.harga_satuan,
      foto:
        payload.foto !== undefined ? (payload.foto ? payload.foto.trim() : null) : existing.foto,
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

    this.materials[index] = updated

    // Update konversi satuan
    if (payload.konversi_satuan !== undefined) {
      this.konversiList = this.konversiList.filter(k => k.bahan_id !== Number(id))
      for (const item of payload.konversi_satuan) {
        if (item.satuan_id && item.nilai > 0) {
          this.konversiList.push({
            id: ++this.nextKonversiId,
            bahan_id: Number(id),
            satuan_id: Number(item.satuan_id),
            nilai: Number(item.nilai),
            default: item.default ? 1 : 0
          })
        }
      }
    }

    return this.enrich(updated)
  }

  async delete(id: number): Promise<void> {
    assertPermission('inventory.materials', 'delete')
    const index = this.materials.findIndex(m => m.id === Number(id))
    if (index === -1) {
      throw new Error(`Bahan dengan ID #${id} tidak ditemukan.`)
    }

    // Cascade delete konversi satuan
    this.konversiList = this.konversiList.filter(k => k.bahan_id !== Number(id))
    this.materials.splice(index, 1)
  }

  async exportAll(query: ListQuery = {}): Promise<MasterDataBahan[]> {
    assertPermission('inventory.materials', 'read')
    const res = await this.list({ ...query, page: 1, pageSize: 999999 })
    return res.data
  }

  async importBatch(items: CreateMaterialDto[]): Promise<{ importedCount: number }> {
    assertPermission('inventory.materials', 'create')
    for (const item of items) {
      if (item.kode) {
        const exists = this.materials.find(
          m => (m.kode || '').toLowerCase() === item.kode!.trim().toLowerCase()
        )
        if (exists) {
          throw new Error(`Impor dibatalkan: Kode '${item.kode}' sudah terdaftar dalam sistem.`)
        }
      }
    }

    const snapshotMaterials = JSON.stringify(this.materials)
    const snapshotKonversi = JSON.stringify(this.konversiList)
    try {
      for (const item of items) {
        await this.create(item)
      }
      return { importedCount: items.length }
    } catch (err: unknown) {
      this.materials = JSON.parse(snapshotMaterials)
      this.konversiList = JSON.parse(snapshotKonversi)
      throw err
    }
  }
}

export const mockMaterialService = new MockMaterialService()

export interface MaterialLookups {
  buyUnits: Array<{ id: number; kode?: string | null; nama: string | null; default?: number | null }>
  usageUnits: Array<{ id: number; nama: string | null; pembagi?: string | number | null; satuanBeliId?: number | null }>
  warehouses: Array<{ id: number; kode?: string | null; nama: string | null; color?: string | null }>
}

export interface IMaterialService extends CrudService<MasterDataBahan, CreateMaterialDto, UpdateMaterialDto> {
  reset?(): void
  getRawItems?(): MasterDataBahan[]
  getRawKonversi?(): KonversiSatuanBahan[]
  isWarehouseReferenced?(gudangId: number): boolean
  isPurchaseUnitReferenced?(unitId: number): boolean
  isUsageUnitReferenced?(unitId: number): boolean
  getAll?(query?: ListQuery): Promise<PaginatedResponse<MasterDataBahan>>
  toggleStatus?(id: number, status: number): Promise<MasterDataBahan>
  uploadPhoto?(id: number, file: File): Promise<MasterDataBahan>
  deletePhoto?(id: number): Promise<MasterDataBahan>
  previewConversion?(input: { from_unit_id: number; to_unit_id: number; qty: number; bahan_id?: number }): Promise<Record<string, unknown>>
  getLookups?(): Promise<MaterialLookups>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformMaterial(raw: any): MasterDataBahan {
  const harga_satuan = raw.harga_satuan !== null && raw.harga_satuan !== undefined ? Number(raw.harga_satuan) : null
  const harga_satuan_formatted = harga_satuan !== null ? formatCurrency(harga_satuan) : '-'

  return {
    ...raw,
    harga_satuan,
    harga_satuan_formatted,
    min_qty: raw.min_qty !== null && raw.min_qty !== undefined ? Number(raw.min_qty) : null,
    qty: raw.qty !== null && raw.qty !== undefined ? Number(raw.qty) : null,
    satuan_pakai_id: raw.satuan_pakai_id !== null && raw.satuan_pakai_id !== undefined ? Number(raw.satuan_pakai_id) : null,
    satuan_beli_id: raw.satuan_beli_id !== null && raw.satuan_beli_id !== undefined ? Number(raw.satuan_beli_id) : null,
    gudang_id: raw.gudang_id !== null && raw.gudang_id !== undefined ? Number(raw.gudang_id) : null,
    status: raw.status !== null && raw.status !== undefined ? Number(raw.status) : 1,
    satuan_pakai_nama: raw.satuan_pakai_nama || referenceService.getSatuanPakaiName(raw.satuan_pakai_id),
    satuan_beli_nama: raw.satuan_beli_nama || referenceService.getSatuanBeliName(raw.satuan_beli_id),
    gudang_nama: raw.gudang_nama || referenceService.getGudangName(raw.gudang_id),
    konversi_satuan: Array.isArray(raw.konversi_satuan)
      ? raw.konversi_satuan.map((k: KonversiSatuanBahan) => ({
          ...k,
          satuan_nama: k.satuan_nama || referenceService.getSatuanBeliName(k.satuan_id)
        }))
      : []
  }
}

export const apiMaterialService: IMaterialService = {
  async list(query?: ListQuery): Promise<PaginatedResponse<MasterDataBahan>> {
    return this.getAll!(query)
  },

  async getAll(query?: ListQuery): Promise<PaginatedResponse<MasterDataBahan>> {
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
    const res = await apiClient<any[]>(`/master/materials${queryString}`)

    const totalItems = res.meta?.totalItems ?? res.data?.length ?? 0
    const page = res.meta?.page ?? query?.page ?? 1
    const pageSize = res.meta?.pageSize ?? query?.pageSize ?? 10
    const totalPages = res.meta?.totalPages ?? (Math.ceil(totalItems / pageSize) || 1)

    return {
      data: (res.data || []).map(transformMaterial),
      total: totalItems,
      page,
      pageSize,
      totalPages
    }
  },

  async getById(id: number): Promise<MasterDataBahan> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/materials/${id}`)
    return transformMaterial(res.data)
  },

  async create(payload: CreateMaterialDto): Promise<MasterDataBahan> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>('/master/materials', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return transformMaterial(res.data)
  },

  async update(id: number, payload: UpdateMaterialDto): Promise<MasterDataBahan> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return transformMaterial(res.data)
  },

  async delete(id: number): Promise<void> {
    await apiClient<{ id: number }>(`/master/materials/${id}`, {
      method: 'DELETE'
    })
  },

  async toggleStatus(id: number, status: number): Promise<MasterDataBahan> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/materials/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
    return transformMaterial(res.data)
  },

  async uploadPhoto(id: number, file: File): Promise<MasterDataBahan> {
    const formData = new FormData()
    formData.append('file', file)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/materials/${id}/photo`, {
      method: 'POST',
      body: formData
    })
    return transformMaterial(res.data)
  },

  async deletePhoto(id: number): Promise<MasterDataBahan> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>(`/master/materials/${id}/photo`, {
      method: 'DELETE'
    })
    return transformMaterial(res.data)
  },

  async previewConversion(input: { from_unit_id: number; to_unit_id: number; qty: number; bahan_id?: number }): Promise<Record<string, unknown>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient<any>('/master/materials/conversion-preview', {
      method: 'POST',
      body: JSON.stringify(input)
    })
    return res.data as Record<string, unknown>
  },

  async getLookups(): Promise<MaterialLookups> {
    const res = await apiClient<MaterialLookups>('/master/materials/lookups/all')
    return res.data
  },

  async exportAll(query?: ListQuery): Promise<MasterDataBahan[]> {
    const res = await this.getAll!({ ...query, page: 1, pageSize: 100000 })
    return res.data
  },

  async importBatch(items: CreateMaterialDto[]) {
    let imported = 0
    for (const item of items) {
      await this.create(item)
      imported++
    }
    return { importedCount: imported }
  }
}

export class MaterialServiceAdapter implements IMaterialService {
  private get activeService(): IMaterialService {
    const isMock = import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockMaterialService : apiMaterialService
  }

  reset(): void {
    mockMaterialService.reset()
  }

  getRawItems(): MasterDataBahan[] {
    return mockMaterialService.getRawItems()
  }

  getRawKonversi(): KonversiSatuanBahan[] {
    return mockMaterialService.getRawKonversi()
  }

  isWarehouseReferenced(gudangId: number): boolean {
    return mockMaterialService.isWarehouseReferenced(gudangId)
  }

  isPurchaseUnitReferenced(unitId: number): boolean {
    return mockMaterialService.isPurchaseUnitReferenced(unitId)
  }

  isUsageUnitReferenced(unitId: number): boolean {
    return mockMaterialService.isUsageUnitReferenced(unitId)
  }

  list(query?: ListQuery): Promise<PaginatedResponse<MasterDataBahan>> {
    return this.activeService.list(query)
  }

  getAll(query?: ListQuery): Promise<PaginatedResponse<MasterDataBahan>> {
    const s = this.activeService
    return s.getAll ? s.getAll(query) : s.list(query)
  }

  getById(id: number): Promise<MasterDataBahan> {
    return this.activeService.getById(id)
  }

  create(payload: CreateMaterialDto): Promise<MasterDataBahan> {
    return this.activeService.create(payload)
  }

  update(id: number, payload: UpdateMaterialDto): Promise<MasterDataBahan> {
    return this.activeService.update(id, payload)
  }

  async delete(id: number): Promise<void> {
    await this.activeService.delete(id)
  }

  toggleStatus(id: number, status: number): Promise<MasterDataBahan> {
    if (this.activeService.toggleStatus) {
      return this.activeService.toggleStatus(id, status)
    }
    return this.update(id, { status })
  }

  uploadPhoto(id: number, file: File): Promise<MasterDataBahan> {
    if (this.activeService.uploadPhoto) {
      return this.activeService.uploadPhoto(id, file)
    }
    return this.getById(id)
  }

  deletePhoto(id: number): Promise<MasterDataBahan> {
    if (this.activeService.deletePhoto) {
      return this.activeService.deletePhoto(id)
    }
    return this.getById(id)
  }

  previewConversion(input: { from_unit_id: number; to_unit_id: number; qty: number; bahan_id?: number }): Promise<Record<string, unknown>> {
    if (this.activeService.previewConversion) {
      return this.activeService.previewConversion(input)
    }
    return Promise.resolve({ outputQty: input.qty, multiplier: 1, method: 'direct' })
  }

  getLookups(): Promise<MaterialLookups> {
    if (this.activeService.getLookups) {
      return this.activeService.getLookups()
    }
    return mockMaterialService.getLookups()
  }

  exportAll(query?: ListQuery): Promise<MasterDataBahan[]> {
    return this.activeService.exportAll ? this.activeService.exportAll(query) : Promise.resolve([])
  }

  importBatch(items: CreateMaterialDto[]) {
    return this.activeService.importBatch
      ? this.activeService.importBatch(items)
      : Promise.resolve({ importedCount: 0 })
  }
}

export const materialService = new MaterialServiceAdapter()
