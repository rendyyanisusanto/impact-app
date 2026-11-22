import { apiClient } from '@/shared/services/api-client'
import type { PaginatedResponse } from '@/shared/types/crud.types'
import type {
  StockAdjustment,
  StockAdjustmentDetail,
  StockAdjustmentListItem,
  StockAdjustmentDetailWithItems,
  StockAdjustmentCreatePayload,
  StockAdjustmentUpdatePayload,
  StockAdjustmentFilterParams,
  StockAdjustmentKpiSummary,
  SelectableMaterial
} from '../types/stock-adjustment.types'
import {
  INITIAL_MOCK_STOCK_ADJUSTMENTS,
  INITIAL_MOCK_STOCK_ADJUSTMENT_DETAILS
} from '../mocks/stock-adjustments.mock'
import { materialService } from '@/modules/inventory/materials/services/material.service'
import { stockPostingService } from '@/modules/inventory/materials/services/stock-posting.service'
import { referenceService } from '@/shared/services/reference.service'
import { assertPermission } from '@/shared/services/service-guard'

export interface IStockAdjustmentService {
  getAdjustments(params?: StockAdjustmentFilterParams): Promise<PaginatedResponse<StockAdjustmentListItem>>
  getKpi(params?: StockAdjustmentFilterParams): Promise<StockAdjustmentKpiSummary>
  getAdjustmentById(id: number): Promise<StockAdjustmentDetailWithItems | null>
  getSelectableMaterials(search?: string, gudangId?: number): Promise<SelectableMaterial[]>
  getNextAdjustmentCode(dateStr?: string): Promise<string>
  createAdjustment(payload: StockAdjustmentCreatePayload): Promise<StockAdjustment>
  updateAdjustment(id: number, payload: StockAdjustmentUpdatePayload): Promise<StockAdjustment>
  postAdjustment(
    id: number,
    items?: Array<{ bahan_id: number; stok_awal: number; stok_akhir: number; keterangan?: string }>
  ): Promise<StockAdjustment>
  deleteAdjustment(id: number): Promise<boolean>
}

export class MockStockAdjustmentService implements IStockAdjustmentService {
  private adjustments: StockAdjustment[] = []
  private adjustmentDetails: StockAdjustmentDetail[] = []
  private nextAdjustmentId = 10
  private nextDetailId = 100

  constructor() {
    this.reset()
  }

  reset(): void {
    this.adjustments = JSON.parse(JSON.stringify(INITIAL_MOCK_STOCK_ADJUSTMENTS))
    this.adjustmentDetails = JSON.parse(JSON.stringify(INITIAL_MOCK_STOCK_ADJUSTMENT_DETAILS))
    this.nextAdjustmentId = 10
    this.nextDetailId = 100
  }

  getRawAdjustments(): StockAdjustment[] {
    return this.adjustments
  }

  getRawDetails(): StockAdjustmentDetail[] {
    return this.adjustmentDetails
  }

  async getAdjustments(
    params: StockAdjustmentFilterParams = {}
  ): Promise<PaginatedResponse<StockAdjustmentListItem>> {
    assertPermission('inventory:read')

    const page = params.page || 1
    const limit = params.limit || 10
    const search = (params.search || '').trim().toLowerCase()
    const status = params.status
    const startDate = params.startDate
    const endDate = params.endDate

    let filtered = this.adjustments.filter(a => a.status_aktif === 1)

    if (status !== undefined && status !== '' && status !== 'all') {
      const numStatus = Number(status)
      filtered = filtered.filter(a => a.status === numStatus)
    }

    if (startDate) {
      filtered = filtered.filter(a => a.tanggal >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(a => a.tanggal <= endDate)
    }

    if (search) {
      filtered = filtered.filter(
        a =>
          a.kode.toLowerCase().includes(search) ||
          (a.keterangan && a.keterangan.toLowerCase().includes(search))
      )
    }

    const materials = materialService.getRawItems()

    const listItems: StockAdjustmentListItem[] = filtered.map(a => {
      const details = this.adjustmentDetails.filter(d => d.penyesuaian_stok_id === a.id)
      let bertambah_count = 0
      let berkurang_count = 0
      let cocok_count = 0
      let net_selisih_qty = 0
      let total_nilai_selisih = 0

      for (const d of details) {
        const diff = d.stok_akhir - d.stok_awal
        if (diff > 0) bertambah_count++
        else if (diff < 0) berkurang_count++
        else cocok_count++

        net_selisih_qty += diff

        const mat = materials.find(m => m.id === d.bahan_id)
        const price = mat?.harga_satuan || 0
        total_nilai_selisih += diff * price
      }

      return {
        id: a.id,
        kode: a.kode,
        tanggal: a.tanggal,
        keterangan: a.keterangan || '',
        status: a.status,
        status_aktif: a.status_aktif,
        total_items: details.length,
        total_positif: bertambah_count,
        total_negatif: berkurang_count,
        net_selisih_qty,
        total_nilai_selisih,
        created_at: a.created_at,
        created_by: a.created_by,
        created_by_name: 'Administrator'
      }
    })

    const total = listItems.length
    const start = (page - 1) * limit
    const paged = listItems.slice(start, start + limit)

    return {
      data: paged,
      total,
      page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  }

  async getKpi(params: StockAdjustmentFilterParams = {}): Promise<StockAdjustmentKpiSummary> {
    const listRes = await this.getAdjustments({ ...params, page: 1, limit: 100000 })
    const all = listRes.data

    const total_penyesuaian = all.length
    const total_posted = all.filter(a => a.status === 1).length
    const total_draft = all.filter(a => a.status === 0).length
    const total_item_bertambah = all.reduce((sum, a) => sum + a.total_positif, 0)
    const total_item_berkurang = all.reduce((sum, a) => sum + a.total_negatif, 0)
    const total_item_cocok = all.reduce((sum, a) => sum + (a.total_items - a.total_positif - a.total_negatif), 0)
    const net_selisih_qty = all.reduce((sum, a) => sum + a.net_selisih_qty, 0)
    const total_nilai_selisih = all.reduce((sum, a) => sum + a.total_nilai_selisih, 0)

    return {
      total_penyesuaian,
      total_posted,
      total_draft,
      net_selisih_qty,
      total_item_bertambah,
      total_item_berkurang,
      total_item_cocok,
      total_nilai_selisih,
      selisih_per_satuan: []
    }
  }

  async getAdjustmentById(id: number): Promise<StockAdjustmentDetailWithItems | null> {
    assertPermission('inventory:read')

    const adj = this.adjustments.find(a => a.id === id && a.status_aktif === 1)
    if (!adj) return null

    const details = this.adjustmentDetails.filter(d => d.penyesuaian_stok_id === id)
    const materials = materialService.getRawItems()

    let bertambah_count = 0
    let berkurang_count = 0
    let cocok_count = 0
    let net_selisih_qty = 0
    let total_nilai_selisih = 0
    let total_nilai_positif = 0
    let total_nilai_negatif = 0

    const items = details.map(d => {
      const mat = materials.find(m => m.id === d.bahan_id)
      const diff = d.stok_akhir - d.stok_awal
      const price = mat?.harga_satuan || 0
      const nilai = diff * price

      if (diff > 0) {
        bertambah_count++
        total_nilai_positif += nilai
      } else if (diff < 0) {
        berkurang_count++
        total_nilai_negatif += Math.abs(nilai)
      } else {
        cocok_count++
      }

      net_selisih_qty += diff
      total_nilai_selisih += nilai

      const satuan_nama = referenceService.getSatuanPakaiName(mat?.satuan_pakai_id ?? null)
      const gudang_nama = referenceService.getGudangName(mat?.gudang_id ?? null)

      return {
        id: d.id,
        penyesuaian_stok_id: d.penyesuaian_stok_id,
        bahan_id: d.bahan_id,
        kode_bahan: mat?.kode || `MAT-${d.bahan_id}`,
        nama_bahan: mat?.nama || `Bahan #${d.bahan_id}`,
        satuan_id: mat?.satuan_pakai_id || null,
        nama_satuan: satuan_nama,
        gudang_id: mat?.gudang_id || null,
        nama_gudang: gudang_nama,
        harga_satuan: price,
        stok_awal: d.stok_awal,
        stok_akhir: d.stok_akhir,
        selisih: diff,
        nilai_selisih: nilai,
        keterangan_detail: d.keterangan || ''
      }
    })

    return {
      ...adj,
      total_items: items.length,
      total_positif: bertambah_count,
      total_negatif: berkurang_count,
      total_tanpa_selisih: cocok_count,
      net_selisih_qty,
      total_nilai_selisih,
      created_by_name: 'Administrator',
      items
    }
  }

  async getSelectableMaterials(search?: string, gudangId?: number): Promise<SelectableMaterial[]> {
    const rawMaterials = materialService.getRawItems()
    const warehouses = await referenceService.getWarehouses()
    const units = await referenceService.getUsageUnits()

    let filtered = rawMaterials.filter(m => m.status === 1)
    if (gudangId) {
      filtered = filtered.filter(m => m.gudang_id === Number(gudangId))
    }
    if (search) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(m => {
        const wh = warehouses.find(w => w.value === m.gudang_id)
        return (
          (m.kode || '').toLowerCase().includes(q) ||
          (m.nama || '').toLowerCase().includes(q) ||
          (wh?.label || '').toLowerCase().includes(q)
        )
      })
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
        satuan_pakai_id: m.satuan_pakai_id || null,
        satuan_nama: u?.label || 'Unit',
        harga_satuan: m.harga_satuan || 0,
        status: m.status ?? undefined
      }
    })
  }

  async getNextAdjustmentCode(dateStr?: string): Promise<string> {
    const date = dateStr ? new Date(dateStr) : new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const count = this.adjustments.length + 1
    return `PS/${year}/${month}/${count}`
  }

  async createAdjustment(payload: StockAdjustmentCreatePayload): Promise<StockAdjustment> {
    assertPermission('inventory:create')

    const newId = this.nextAdjustmentId++
    const dateStr = payload.tanggal || new Date().toISOString().slice(0, 10)
    const code = payload.kode || (await this.getNextAdjustmentCode(dateStr))
    const status = payload.status ?? 0
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19)

    const adjustment: StockAdjustment = {
      id: newId,
      kode: code,
      tanggal: dateStr,
      keterangan: payload.keterangan || '',
      status: status,
      status_aktif: 1,
      created_at: nowStr,
      created_by: 1,
      updated_at: null,
      updated_by: null,
      uuid: `mock-adj-${newId}-${Date.now()}`
    }

    this.adjustments.unshift(adjustment)

    for (const item of payload.items) {
      this.adjustmentDetails.push({
        id: this.nextDetailId++,
        penyesuaian_stok_id: newId,
        bahan_id: item.bahan_id,
        stok_awal: item.stok_awal,
        stok_akhir: item.stok_akhir,
        keterangan: item.keterangan || null
      })
    }

    if (status === 1) {
      await stockPostingService.postStockAdjustment({
        id: adjustment.id,
        kode: adjustment.kode,
        tanggal: adjustment.tanggal,
        created_by: 1,
        items: payload.items.map(i => ({
          bahan_id: i.bahan_id,
          stok_awal: i.stok_awal,
          stok_akhir: i.stok_akhir
        }))
      })
    }

    return adjustment
  }

  async updateAdjustment(
    id: number,
    payload: StockAdjustmentUpdatePayload
  ): Promise<StockAdjustment> {
    assertPermission('inventory:update')

    const adj = this.adjustments.find(a => a.id === id && a.status_aktif === 1)
    if (!adj) throw new Error(`Penyesuaian stok #${id} tidak ditemukan.`)
    if (adj.status === 1) {
      throw new Error('Dokumen yang telah berstatus Selesai (Posted) tidak dapat diedit langsung.')
    }

    if (payload.tanggal) adj.tanggal = payload.tanggal
    if (payload.keterangan !== undefined) adj.keterangan = payload.keterangan
    adj.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)

    if (payload.items) {
      this.adjustmentDetails = this.adjustmentDetails.filter(d => d.penyesuaian_stok_id !== id)
      for (const item of payload.items) {
        this.adjustmentDetails.push({
          id: this.nextDetailId++,
          penyesuaian_stok_id: id,
          bahan_id: item.bahan_id,
          stok_awal: item.stok_awal,
          stok_akhir: item.stok_akhir,
          keterangan: item.keterangan || null
        })
      }
    }

    return adj
  }

  async postAdjustment(
    id: number,
    items?: Array<{ bahan_id: number; stok_awal: number; stok_akhir: number; keterangan?: string }>
  ): Promise<StockAdjustment> {
    assertPermission('inventory:update')

    const adj = this.adjustments.find(a => a.id === id && a.status_aktif === 1)
    if (!adj) throw new Error(`Penyesuaian stok #${id} tidak ditemukan.`)
    if (adj.status === 1) return adj

    if (items && items.length > 0) {
      this.adjustmentDetails = this.adjustmentDetails.filter(d => d.penyesuaian_stok_id !== id)
      for (const item of items) {
        this.adjustmentDetails.push({
          id: this.nextDetailId++,
          penyesuaian_stok_id: id,
          bahan_id: item.bahan_id,
          stok_awal: item.stok_awal,
          stok_akhir: item.stok_akhir,
          keterangan: item.keterangan || null
        })
      }
    }

    const currentDetails = this.adjustmentDetails.filter(d => d.penyesuaian_stok_id === id)

    await stockPostingService.postStockAdjustment({
      id: adj.id,
      kode: adj.kode,
      tanggal: adj.tanggal,
      created_by: adj.created_by,
      items: currentDetails.map(d => ({
        bahan_id: d.bahan_id,
        stok_awal: d.stok_awal,
        stok_akhir: d.stok_akhir
      }))
    })

    adj.status = 1
    adj.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19)
    return adj
  }

  async deleteAdjustment(id: number): Promise<boolean> {
    assertPermission('inventory:delete')

    const adj = this.adjustments.find(a => a.id === id && a.status_aktif === 1)
    if (!adj) return false

    if (adj.status === 1) {
      // Reversal on delete for mock testing
      await stockPostingService.reverseStockAdjustment(adj.id, adj.kode)
    }

    adj.status_aktif = 0
    return true
  }
}

export class StockAdjustmentApiService implements IStockAdjustmentService {
  private readonly baseUrl = '/inventory/stock-adjustments'

  async getAdjustments(
    params: StockAdjustmentFilterParams = {}
  ): Promise<PaginatedResponse<StockAdjustmentListItem>> {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search.trim())
    if (params.status !== undefined && params.status !== '' && params.status !== 'all') {
      query.append('status', String(params.status))
    }
    if (params.startDate) query.append('startDate', params.startDate)
    if (params.endDate) query.append('endDate', params.endDate)
    if (params.page) query.append('page', String(params.page))
    if (params.limit) query.append('limit', String(params.limit))
    if (params.sortBy) query.append('sortBy', params.sortBy)
    if (params.sortOrder) query.append('sortOrder', params.sortOrder)

    const endpoint = `${this.baseUrl}${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<StockAdjustmentListItem[]>(endpoint, { method: 'GET' })

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

  async getKpi(params: StockAdjustmentFilterParams = {}): Promise<StockAdjustmentKpiSummary> {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search.trim())
    if (params.status !== undefined && params.status !== '' && params.status !== 'all') {
      query.append('status', String(params.status))
    }
    if (params.startDate) query.append('startDate', params.startDate)
    if (params.endDate) query.append('endDate', params.endDate)

    const endpoint = `${this.baseUrl}/kpi${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient<StockAdjustmentKpiSummary>(endpoint, { method: 'GET' })
    return res.data
  }

  async getAdjustmentById(id: number): Promise<StockAdjustmentDetailWithItems | null> {
    const endpoint = `${this.baseUrl}/${id}`
    const res = await apiClient<StockAdjustmentDetailWithItems>(endpoint, { method: 'GET' })
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

  async getNextAdjustmentCode(dateStr?: string): Promise<string> {
    const query = dateStr ? `?tanggal=${dateStr}` : ''
    const endpoint = `${this.baseUrl}/next-code${query}`
    const res = await apiClient<{ code: string }>(endpoint, { method: 'GET' })
    return res.data?.code || ''
  }

  async createAdjustment(payload: StockAdjustmentCreatePayload): Promise<StockAdjustment> {
    const endpoint = this.baseUrl
    const res = await apiClient<StockAdjustment>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async updateAdjustment(
    id: number,
    payload: StockAdjustmentUpdatePayload
  ): Promise<StockAdjustment> {
    const endpoint = `${this.baseUrl}/${id}`
    const res = await apiClient<StockAdjustment>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return res.data
  }

  async postAdjustment(
    id: number,
    items?: Array<{ bahan_id: number; stok_awal: number; stok_akhir: number; keterangan?: string }>
  ): Promise<StockAdjustment> {
    const endpoint = `${this.baseUrl}/${id}/post`
    const res = await apiClient<StockAdjustment>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ items })
    })
    return res.data
  }

  async deleteAdjustment(id: number): Promise<boolean> {
    const endpoint = `${this.baseUrl}/${id}`
    const res = await apiClient<{ success: boolean }>(endpoint, {
      method: 'DELETE'
    })
    return !!res.data?.success
  }
}

export const mockStockAdjustmentService = new MockStockAdjustmentService()
export const stockAdjustmentApiService = new StockAdjustmentApiService()

export class StockAdjustmentServiceAdapter implements IStockAdjustmentService {
  private get activeService(): IStockAdjustmentService {
    const isMock =
      import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockStockAdjustmentService : stockAdjustmentApiService
  }

  reset(): void {
    mockStockAdjustmentService.reset()
  }

  getRawAdjustments(): StockAdjustment[] {
    return mockStockAdjustmentService.getRawAdjustments()
  }

  getRawDetails(): StockAdjustmentDetail[] {
    return mockStockAdjustmentService.getRawDetails()
  }

  getAdjustments(params?: StockAdjustmentFilterParams): Promise<PaginatedResponse<StockAdjustmentListItem>> {
    return this.activeService.getAdjustments(params)
  }

  getKpi(params?: StockAdjustmentFilterParams): Promise<StockAdjustmentKpiSummary> {
    return this.activeService.getKpi(params)
  }

  getAdjustmentById(id: number): Promise<StockAdjustmentDetailWithItems | null> {
    return this.activeService.getAdjustmentById(id)
  }

  getSelectableMaterials(search?: string, gudangId?: number): Promise<SelectableMaterial[]> {
    return this.activeService.getSelectableMaterials(search, gudangId)
  }

  getNextAdjustmentCode(dateStr?: string): Promise<string> {
    return this.activeService.getNextAdjustmentCode(dateStr)
  }

  createAdjustment(payload: StockAdjustmentCreatePayload): Promise<StockAdjustment> {
    return this.activeService.createAdjustment(payload)
  }

  updateAdjustment(
    id: number,
    payload: StockAdjustmentUpdatePayload
  ): Promise<StockAdjustment> {
    return this.activeService.updateAdjustment(id, payload)
  }

  postAdjustment(
    id: number,
    items?: Array<{ bahan_id: number; stok_awal: number; stok_akhir: number; keterangan?: string }>
  ): Promise<StockAdjustment> {
    return this.activeService.postAdjustment(id, items)
  }

  deleteAdjustment(id: number): Promise<boolean> {
    return this.activeService.deleteAdjustment(id)
  }
}

export const stockAdjustmentService = new StockAdjustmentServiceAdapter()
