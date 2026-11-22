import { apiClient } from '@/shared/services/api-client'
import type { PaginatedResponse } from '@/shared/types/crud.types'
import type {
  MaterialMutation,
  MaterialMutationDetail,
  MaterialMutationViewDetail,
  MaterialMutationListItem,
  MaterialMutationDetailWithItems,
  MaterialMutationCreatePayload,
  MaterialMutationUpdatePayload,
  MaterialMutationFilterParams,
  MaterialMutationKpiSummary,
  SelectableMaterial
} from '../types/material-mutation.types'
import {
  INITIAL_MOCK_MATERIAL_MUTATIONS,
  INITIAL_MOCK_MATERIAL_MUTATION_DETAILS
} from '../mocks/material-mutations.mock'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { stockPostingService } from '@/modules/inventory/materials/services/stock-posting.service'
import { referenceService } from '@/shared/services/reference.service'
import { assertPermission } from '@/shared/services/service-guard'

export interface IMaterialMutationService {
  getMutations(params?: MaterialMutationFilterParams): Promise<PaginatedResponse<MaterialMutationListItem>>
  getKpi(params?: MaterialMutationFilterParams): Promise<MaterialMutationKpiSummary>
  getMutationById(id: number): Promise<MaterialMutationDetailWithItems | null>
  getSelectableMaterials(search?: string, gudangId?: number): Promise<SelectableMaterial[]>
  getNextMutationCode(dateStr?: string): Promise<string>
  createMutation(payload: MaterialMutationCreatePayload): Promise<MaterialMutation>
  updateMutation(id: number, payload: MaterialMutationUpdatePayload): Promise<MaterialMutation>
  postMutation(
    id: number,
    items?: Array<{ bahan_id: number; qty: number; satuan_beli_id?: number | null; keterangan?: string | null }>
  ): Promise<boolean | MaterialMutation>
  deleteMutation(id: number): Promise<boolean>
}

export class MockMaterialMutationService implements IMaterialMutationService {
  private mutations: MaterialMutation[] = []
  private mutationDetails: MaterialMutationDetail[] = []
  private nextMutationId = 10
  private nextDetailId = 100

  constructor() {
    this.reset()
  }

  reset(): void {
    this.mutations = JSON.parse(JSON.stringify(INITIAL_MOCK_MATERIAL_MUTATIONS))
    this.mutationDetails = JSON.parse(JSON.stringify(INITIAL_MOCK_MATERIAL_MUTATION_DETAILS))
    this.nextMutationId = 10
    this.nextDetailId = 100
  }

  getRawMutations(): MaterialMutation[] {
    return this.mutations
  }

  getRawDetails(): MaterialMutationDetail[] {
    return this.mutationDetails
  }

  /**
   * List mutations with search, date range, status filter, and pagination
   */
  async getMutations(
    params: MaterialMutationFilterParams = {}
  ): Promise<PaginatedResponse<MaterialMutationListItem>> {
    assertPermission('inventory:read')

    const page = params.page || 1
    const limit = params.limit || 10
    const search = (params.search || '').trim().toLowerCase()
    const status = params.status
    const startDate = params.startDate
    const endDate = params.endDate

    // Only active items
    let filtered = this.mutations.filter(m => m.status_aktif === 1)

    // Status filter
    if (status !== undefined && status !== 'all' && (status as any) !== '') {
      const numStatus = Number(status)
      filtered = filtered.filter(m => m.status === numStatus)
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(m => m.tanggal >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(m => m.tanggal <= endDate)
    }

    // Material list cache for computing totals and details
    const materials = materialService.getRawItems()

    // Map to list items with aggregated totals
    let listItems: MaterialMutationListItem[] = filtered.map(m => {
      const details = this.mutationDetails.filter(d => d.mutasi_bahan_id === m.id)
      const total_items = details.length
      const total_qty = details.reduce((sum, d) => sum + (d.qty || 0), 0)
      const total_nilai = details.reduce((sum, d) => {
        const mat = materials.find(x => x.id === d.bahan_id)
        return sum + (d.qty || 0) * (mat?.harga_satuan || 0)
      }, 0)

      return {
        id: m.id,
        kode: m.kode,
        tanggal: m.tanggal,
        keterangan: m.keterangan || '',
        status: m.status,
        status_aktif: m.status_aktif,
        total_items,
        total_qty,
        total_nilai,
        created_at: m.created_at,
        created_by: m.created_by,
        created_by_name: m.created_by === 1 ? 'Admin Logistik' : 'Operator'
      }
    })

    // Search filter across kode, keterangan, or creator name
    if (search) {
      listItems = listItems.filter(
        i =>
          i.kode.toLowerCase().includes(search) ||
          i.keterangan.toLowerCase().includes(search) ||
          (i.created_by_name && i.created_by_name.toLowerCase().includes(search))
      )
    }

    // Sort order
    const sortBy = params.sortBy || 'id'
    const sortOrder = params.sortOrder || 'desc'
    listItems.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'kode') comparison = a.kode.localeCompare(b.kode)
      else if (sortBy === 'tanggal') comparison = a.tanggal.localeCompare(b.tanggal)
      else if (sortBy === 'total_qty') comparison = a.total_qty - b.total_qty
      else if (sortBy === 'total_items') comparison = a.total_items - b.total_items
      else if (sortBy === 'status') comparison = a.status - b.status
      else comparison = a.id - b.id

      return sortOrder === 'asc' ? comparison : -comparison
    })

    const total = listItems.length
    const startIndex = (page - 1) * limit
    const paginatedData = listItems.slice(startIndex, startIndex + limit)

    return {
      data: paginatedData,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  }

  /**
   * Menghitung summary KPI pada mock dataset
   */
  async getKpi(params: MaterialMutationFilterParams = {}): Promise<MaterialMutationKpiSummary> {
    assertPermission('inventory:read')

    const search = (params.search || '').trim().toLowerCase()
    const startDate = params.startDate
    const endDate = params.endDate

    let filtered = this.mutations.filter(m => m.status_aktif === 1)

    if (startDate) {
      filtered = filtered.filter(m => m.tanggal >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(m => m.tanggal <= endDate)
    }
    if (search) {
      filtered = filtered.filter(
        m =>
          m.kode.toLowerCase().includes(search) ||
          (m.keterangan && m.keterangan.toLowerCase().includes(search))
      )
    }

    const materials = materialService.getRawItems()
    let totalPosted = 0
    let totalDraft = 0
    let totalQtyDimutasi = 0
    let totalNilaiDimutasi = 0
    const satuanMap = new Map<string, number>()

    for (const m of filtered) {
      const isPosted = m.status === 1
      if (isPosted) totalPosted++
      else totalDraft++

      if (isPosted) {
        const details = this.mutationDetails.filter(d => d.mutasi_bahan_id === m.id)
        for (const d of details) {
          const qty = d.qty || 0
          totalQtyDimutasi += qty
          const mat = materials.find(x => x.id === d.bahan_id)
          const harga = mat?.harga_satuan || 0
          totalNilaiDimutasi += qty * harga

          const satuan = mat?.satuan_nama || 'UNIT'
          const curr = satuanMap.get(satuan) || 0
          satuanMap.set(satuan, curr + qty)
        }
      }
    }

    const mutasiPerSatuan = Array.from(satuanMap.entries()).map(([satuan, total_qty]) => ({
      satuan,
      total_qty
    }))

    return {
      total_mutasi: filtered.length,
      total_posted: totalPosted,
      total_draft: totalDraft,
      total_qty_dimutasi: totalQtyDimutasi,
      total_nilai_dimutasi: totalNilaiDimutasi,
      mutasi_per_satuan: mutasiPerSatuan
    }
  }

  /**
   * Get single mutation with its view-ready items
   */
  async getMutationById(id: number): Promise<MaterialMutationDetailWithItems | null> {
    assertPermission('inventory:read')

    const mutation = this.mutations.find(m => m.id === id && m.status_aktif === 1)
    if (!mutation) return null

    const details = this.mutationDetails.filter(d => d.mutasi_bahan_id === id)
    const materials = materialService.getRawItems()
    const warehouses = await referenceService.getWarehouses()
    const units = await referenceService.getPurchaseUnits()

    const items: MaterialMutationViewDetail[] = details.map(d => {
      const mat = materials.find(x => x.id === d.bahan_id)
      const wh = warehouses.find(w => w.value === mat?.gudang_id)
      const u = units.find(unit => unit.value === d.satuan_beli_id || unit.value === mat?.satuan_beli_id)
      const harga = mat?.harga_satuan || 0
      const qty = d.qty || 0

      return {
        id: d.id,
        mutasi_bahan_id: d.mutasi_bahan_id,
        bahan_id: d.bahan_id,
        kode_bahan: mat?.kode || `MAT-${d.bahan_id}`,
        nama_bahan: mat?.nama || `Bahan #${d.bahan_id}`,
        gudang_id: mat?.gudang_id || null,
        nama_gudang: wh?.label || '-',
        satuan_id: d.satuan_beli_id || mat?.satuan_beli_id || null,
        nama_satuan: u?.label || 'Unit',
        qty,
        harga_satuan: harga,
        subtotal: qty * harga,
        keterangan_detail: d.keterangan || '-'
      }
    })

    const total_items = items.length
    const total_qty = items.reduce((sum, i) => sum + i.qty, 0)
    const total_nilai = items.reduce((sum, i) => sum + i.subtotal, 0)

    return {
      ...mutation,
      items,
      total_items,
      total_qty,
      total_nilai,
      created_by_name: mutation.created_by === 1 ? 'Admin Logistik' : 'Operator'
    }
  }

  /**
   * Generate next sequential code
   */
  async getNextMutationCode(_dateStr?: string): Promise<string> {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const prefix = `MB/${yy}${mm}-`

    const matching = this.mutations.map(m => m.kode).filter(k => k.startsWith(prefix))

    const nextSeq = matching.length + 1
    const seqStr = String(nextSeq).padStart(4, '0')
    return `${prefix}${seqStr}/1`
  }

  /**
   * Create new mutation with line items and atomic stock posting if status = 1
   */
  async createMutation(payload: MaterialMutationCreatePayload): Promise<MaterialMutation> {
    assertPermission('inventory:create')

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Minimal harus menambahkan satu bahan untuk mutasi.')
    }

    // Validate valid quantity
    for (const item of payload.items) {
      if (!item.bahan_id) {
        throw new Error('Ada baris bahan yang belum dipilih.')
      }
      if (!item.qty || item.qty <= 0) {
        throw new Error('Jumlah mutasi (qty) harus lebih besar dari 0.')
      }
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newId = this.nextMutationId++
    const kode = payload.kode?.trim() || (await this.getNextMutationCode())
    const status = payload.status !== undefined ? payload.status : 1 // default to 1 (Posted) or 0 (Draft)

    const newMutation: MaterialMutation = {
      id: newId,
      kode,
      tanggal: payload.tanggal || nowStr.substring(0, 10),
      keterangan: payload.keterangan || '',
      status,
      created_at: nowStr,
      created_by: 1,
      status_aktif: 1,
      uuid: `mut-uuid-${newId}`
    }

    const createdDetails: MaterialMutationDetail[] = payload.items.map(i => ({
      id: this.nextDetailId++,
      mutasi_bahan_id: newId,
      bahan_id: i.bahan_id,
      qty: i.qty,
      satuan_beli_id: i.satuan_beli_id || null,
      keterangan: i.keterangan || null
    }))

    this.mutations.unshift(newMutation)
    this.mutationDetails.push(...createdDetails)

    // Atomic Stock Posting if status = 1 (Selesai/Terverifikasi)
    if (status === 1) {
      await stockPostingService.postMaterialMutation({
        id: newId,
        kode: newMutation.kode,
        tanggal: newMutation.tanggal,
        created_by: newMutation.created_by,
        items: createdDetails.map(d => ({
          bahan_id: d.bahan_id,
          qty: d.qty,
          satuan_beli_id: d.satuan_beli_id
        }))
      })
    }

    return newMutation
  }

  /**
   * Update existing mutation and adjust stock posting atomically
   */
  async updateMutation(
    id: number,
    payload: MaterialMutationUpdatePayload
  ): Promise<MaterialMutation> {
    assertPermission('inventory:update')

    const mutationIndex = this.mutations.findIndex(m => m.id === id)
    if (mutationIndex === -1) {
      throw new Error(`Mutasi Bahan #${id} tidak ditemukan.`)
    }

    const existing = this.mutations[mutationIndex]
    const previousStatus = existing.status

    if (payload.items) {
      if (payload.items.length === 0) {
        throw new Error('Minimal harus ada satu bahan untuk mutasi.')
      }
      for (const item of payload.items) {
        if (!item.bahan_id) {
          throw new Error('Ada baris bahan yang belum dipilih.')
        }
        if (!item.qty || item.qty <= 0) {
          throw new Error('Jumlah mutasi (qty) harus lebih besar dari 0.')
        }
      }
    }

    // If previously posted, reverse first
    if (previousStatus === 1) {
      await stockPostingService.reverseMaterialMutation(id, existing.kode)
    }

    // Update fields
    if (payload.kode !== undefined) existing.kode = payload.kode.trim()
    if (payload.tanggal !== undefined) existing.tanggal = payload.tanggal
    if (payload.keterangan !== undefined) existing.keterangan = payload.keterangan
    if (payload.status !== undefined) existing.status = payload.status

    // Update details if supplied
    if (payload.items) {
      this.mutationDetails = this.mutationDetails.filter(d => d.mutasi_bahan_id !== id)
      const newDetails: MaterialMutationDetail[] = payload.items.map(i => ({
        id: this.nextDetailId++,
        mutasi_bahan_id: id,
        bahan_id: i.bahan_id,
        qty: i.qty,
        satuan_beli_id: i.satuan_beli_id || null,
        keterangan: i.keterangan || null
      }))
      this.mutationDetails.push(...newDetails)
    }

    // If new status is 1, apply stock posting
    if (existing.status === 1) {
      const currentDetails = this.mutationDetails.filter(d => d.mutasi_bahan_id === id)
      await stockPostingService.postMaterialMutation({
        id: existing.id,
        kode: existing.kode,
        tanggal: existing.tanggal,
        created_by: existing.created_by,
        items: currentDetails.map(d => ({
          bahan_id: d.bahan_id,
          qty: d.qty,
          satuan_beli_id: d.satuan_beli_id
        }))
      })
    }

    return existing
  }

  /**
   * Delete or soft-delete mutation with safe stock reversal
   */
  async deleteMutation(id: number): Promise<boolean> {
    assertPermission('inventory:delete')

    const mutationIndex = this.mutations.findIndex(m => m.id === id)
    if (mutationIndex === -1) return false

    const target = this.mutations[mutationIndex]

    // If it was posted, reverse stock
    if (target.status === 1) {
      await stockPostingService.reverseMaterialMutation(id, target.kode)
    }

    // Soft delete: set status_aktif = 0
    target.status_aktif = 0
    target.status = 0
    return true
  }

  /**
   * Post a draft mutation explicitly
   */
  async postMutation(id: number): Promise<boolean> {
    assertPermission('inventory:update')

    const mutation = this.mutations.find(m => m.id === id)
    if (!mutation) throw new Error(`Mutasi Bahan #${id} tidak ditemukan.`)
    if (mutation.status === 1) return true

    const details = this.mutationDetails.filter(d => d.mutasi_bahan_id === id)
    await stockPostingService.postMaterialMutation({
      id: mutation.id,
      kode: mutation.kode,
      tanggal: mutation.tanggal,
      created_by: mutation.created_by,
      items: details.map(d => ({
        bahan_id: d.bahan_id,
        qty: d.qty,
        satuan_beli_id: d.satuan_beli_id
      }))
    })

    mutation.status = 1
    return true
  }

  /**
   * Helper to get selectable materials with current stock balance and metadata
   */
  async getSelectableMaterials(search?: string, gudangId?: number): Promise<SelectableMaterial[]> {
    const rawMaterials = materialService.getRawItems()
    const warehouses = await referenceService.getWarehouses()
    const units = await referenceService.getPurchaseUnits()

    let filtered = rawMaterials.filter(m => m.status === 1)

    if (gudangId) {
      filtered = filtered.filter(m => m.gudang_id === Number(gudangId))
    }

    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(
        m =>
          (m.kode || '').toLowerCase().includes(q) ||
          (m.nama || '').toLowerCase().includes(q)
      )
    }

    return filtered.map(m => {
      const wh = warehouses.find(w => w.value === m.gudang_id)
      const u = units.find(unit => unit.value === m.satuan_pakai_id)
      return {
        id: m.id,
        kode: m.kode || `MAT-${m.id}`,
        nama: m.nama || `Bahan #${m.id}`,
        qty: m.qty || 0,
        gudang_id: m.gudang_id || null,
        gudang_nama: wh?.label || '-',
        satuan_id: m.satuan_pakai_id || null,
        satuan_pakai_id: m.satuan_pakai_id || null,
        satuan_nama: u?.label || 'Unit',
        harga_satuan: m.harga_satuan || 0
      }
    })
  }
}

/**
 * Service API Real yang terhubung langsung dengan backend Express / MariaDB
 */
export class MaterialMutationApiService implements IMaterialMutationService {
  private readonly baseUrl = '/inventory/material-mutations'

  async getMutations(
    params: MaterialMutationFilterParams = {}
  ): Promise<PaginatedResponse<MaterialMutationListItem>> {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search.trim())
    if (params.status !== undefined && (params.status as any) !== '' && params.status !== 'all') {
      query.append('status', String(params.status))
    }
    if (params.startDate) query.append('startDate', params.startDate)
    if (params.endDate) query.append('endDate', params.endDate)
    if (params.page) query.append('page', String(params.page))
    if (params.limit) query.append('limit', String(params.limit))
    if (params.sortBy) query.append('sortBy', params.sortBy)
    if (params.sortOrder) query.append('sortOrder', params.sortOrder)

    const endpoint = `${this.baseUrl}${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<MaterialMutationListItem[]>(endpoint, { method: 'GET' })

    const meta = res.meta || {
      page: params.page || 1,
      pageSize: params.limit || 10,
      totalItems: Array.isArray(res.data) ? res.data.length : 0,
      totalPages: 1
    }

    return {
      data: res.data || [],
      total: meta.totalItems,
      page: meta.page,
      pageSize: meta.pageSize,
      totalPages: meta.totalPages
    }
  }

  async getKpi(params: MaterialMutationFilterParams = {}): Promise<MaterialMutationKpiSummary> {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search.trim())
    if (params.status !== undefined && (params.status as any) !== '' && params.status !== 'all') {
      query.append('status', String(params.status))
    }
    if (params.startDate) query.append('startDate', params.startDate)
    if (params.endDate) query.append('endDate', params.endDate)

    const endpoint = `${this.baseUrl}/kpi${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<MaterialMutationKpiSummary>(endpoint, { method: 'GET' })
    return res.data
  }

  async getMutationById(id: number): Promise<MaterialMutationDetailWithItems | null> {
    const endpoint = `${this.baseUrl}/${id}`
    const res = await apiClient<MaterialMutationDetailWithItems>(endpoint, { method: 'GET' })
    return res.data
  }

  async getSelectableMaterials(search?: string, gudangId?: number): Promise<SelectableMaterial[]> {
    const query = new URLSearchParams()
    if (search) query.append('search', search.trim())
    if (gudangId) query.append('gudang_id', String(gudangId))

    const endpoint = `${this.baseUrl}/materials${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<SelectableMaterial[]>(endpoint, { method: 'GET' })
    return res.data || []
  }

  async getNextMutationCode(dateStr?: string): Promise<string> {
    const query = dateStr ? `?tanggal=${dateStr}` : ''
    const endpoint = `${this.baseUrl}/next-code${query}`
    const res = await apiClient<{ code: string }>(endpoint, { method: 'GET' })
    return res.data?.code || ''
  }

  async createMutation(payload: MaterialMutationCreatePayload): Promise<MaterialMutation> {
    const endpoint = this.baseUrl
    const res = await apiClient<MaterialMutation>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async updateMutation(
    id: number,
    payload: MaterialMutationUpdatePayload
  ): Promise<MaterialMutation> {
    const endpoint = `${this.baseUrl}/${id}`
    const res = await apiClient<MaterialMutation>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async postMutation(
    id: number,
    items?: Array<{ bahan_id: number; qty: number; satuan_beli_id?: number | null; keterangan?: string | null }>
  ): Promise<MaterialMutation> {
    const endpoint = `${this.baseUrl}/${id}/post`
    const res = await apiClient<MaterialMutation>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ items })
    })
    return res.data
  }

  async deleteMutation(id: number): Promise<boolean> {
    const endpoint = `${this.baseUrl}/${id}`
    const res = await apiClient<{ success: boolean }>(endpoint, {
      method: 'DELETE'
    })
    return !!res.data?.success
  }
}

export const mockMaterialMutationService = new MockMaterialMutationService()
export const materialMutationApiService = new MaterialMutationApiService()

export class MaterialMutationServiceAdapter implements IMaterialMutationService {
  private get activeService(): IMaterialMutationService {
    const isMock =
      import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockMaterialMutationService : materialMutationApiService
  }

  reset(): void {
    mockMaterialMutationService.reset()
  }

  getRawMutations(): MaterialMutation[] {
    return mockMaterialMutationService.getRawMutations()
  }

  getRawDetails(): MaterialMutationDetail[] {
    return mockMaterialMutationService.getRawDetails()
  }

  getMutations(params?: MaterialMutationFilterParams): Promise<PaginatedResponse<MaterialMutationListItem>> {
    return this.activeService.getMutations(params)
  }

  getKpi(params?: MaterialMutationFilterParams): Promise<MaterialMutationKpiSummary> {
    return this.activeService.getKpi(params)
  }

  getMutationById(id: number): Promise<MaterialMutationDetailWithItems | null> {
    return this.activeService.getMutationById(id)
  }

  getSelectableMaterials(search?: string, gudangId?: number): Promise<SelectableMaterial[]> {
    return this.activeService.getSelectableMaterials(search, gudangId)
  }

  getNextMutationCode(dateStr?: string): Promise<string> {
    return this.activeService.getNextMutationCode(dateStr)
  }

  createMutation(payload: MaterialMutationCreatePayload): Promise<MaterialMutation> {
    return this.activeService.createMutation(payload)
  }

  updateMutation(
    id: number,
    payload: MaterialMutationUpdatePayload
  ): Promise<MaterialMutation> {
    return this.activeService.updateMutation(id, payload)
  }

  postMutation(
    id: number,
    items?: Array<{ bahan_id: number; qty: number; satuan_beli_id?: number | null; keterangan?: string | null }>
  ): Promise<boolean | MaterialMutation> {
    return this.activeService.postMutation(id, items)
  }

  deleteMutation(id: number): Promise<boolean> {
    return this.activeService.deleteMutation(id)
  }
}

export const materialMutationService = new MaterialMutationServiceAdapter()
