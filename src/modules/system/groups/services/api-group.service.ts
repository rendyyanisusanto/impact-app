import type {
  Group,
  GroupFormDto,
  GroupFilterDto,
  GroupPaginatedResult,
  SubmenuPermissionFlag,
  GroupDetailViewModel
} from '../types/group.types'
import {
  DASHBOARD_WIDGETS,
  calculatePermissionSummary
} from '../utils/permission-registry'
import { apiClient } from '@/shared/services/api-client'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'

export class ApiGroupService {
  /**
   * Mengambil daftar group berpaginasi dari backend API
   */
  async getAll(filters: GroupFilterDto = {}): Promise<GroupPaginatedResult> {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize))
    if (filters.search) params.append('search', filters.search)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

    const query = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient<Group[]>(`/groups${query}`)

    const meta = res.meta || {
      page: filters.page || 1,
      pageSize: filters.pageSize || 10,
      totalItems: res.data.length,
      totalPages: 1
    }

    return {
      items: res.data,
      totalItems: meta.totalItems,
      page: meta.page,
      pageSize: meta.pageSize,
      totalPages: meta.totalPages
    }
  }

  /**
   * Mengambil detail group berdasarkan ID
   */
  async getById(id: number): Promise<{
    group: Group
    permissions: Record<string, SubmenuPermissionFlag>
    dashboardIds: (number | string)[]
    assignedUserNames?: string[]
  }> {
    const res = await apiClient<{
      group: Group
      permissions: Record<string, SubmenuPermissionFlag>
      dashboardIds: number[]
      assignedUserNames: string[]
    }>(`/groups/${id}`)

    return res.data
  }

  /**
   * Mengambil struktur matriks izin menu/submenu dari backend
   */
  async getPermissionMatrix(): Promise<{
    menus: {
      id: number
      menu: string
      submenus: {
        id: number
        menu_id: number
        submenu: string
        link: string
        alias: string
        allowedActions: { c: boolean; r: boolean; u: boolean; d: boolean }
      }[]
    }[]
  }> {
    const res = await apiClient<{
      menus: {
        id: number
        menu: string
        submenus: {
          id: number
          menu_id: number
          submenu: string
          link: string
          alias: string
          allowedActions: { c: boolean; r: boolean; u: boolean; d: boolean }
        }[]
      }[]
    }>('/groups/permission-matrix')

    return res.data
  }

  /**
   * Mengambil detail ViewModel untuk halaman Look / Detail
   */
  async getDetailViewModel(id: number): Promise<GroupDetailViewModel> {
    const detail = await this.getById(id)
    const matrix = await this.getPermissionMatrix()

    const selectedWidgets = DASHBOARD_WIDGETS.filter((w) =>
      detail.dashboardIds.some((did) => String(did) === String(w.id))
    )

    const menuCategories = matrix.menus.map((m) => ({
      id: m.id,
      name: m.menu,
      submenus: m.submenus.map((s) => {
        const p = detail.permissions[String(s.id)] || {
          c: false,
          r: false,
          u: false,
          d: false
        }
        return {
          id: s.id,
          name: s.submenu,
          resource: s.link || `submenu.${s.id}`,
          c: p.c,
          r: p.r,
          u: p.u,
          d: p.d,
          allowedActions: s.allowedActions
        }
      })
    }))

    const summary = calculatePermissionSummary(detail.permissions, detail.dashboardIds)

    return {
      group: detail.group,
      assignedUserNames: detail.assignedUserNames || [],
      dashboardWidgets: selectedWidgets,
      menuCategories,
      summary
    }
  }

  /**
   * Membuat group baru di backend
   */
  async create(dto: GroupFormDto): Promise<Group> {
    const res = await apiClient<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(dto)
    })
    return res.data
  }

  /**
   * Mengupdate group di backend
   */
  async update(id: number, dto: GroupFormDto): Promise<Group> {
    const res = await apiClient<Group>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    })
    return res.data
  }

  /**
   * Menghapus group di backend
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const res = await apiClient<{ success: boolean; message: string }>(`/groups/${id}`, {
      method: 'DELETE'
    })
    return {
      success: true,
      message: res.message || 'Data berhasil terhapus'
    }
  }

  /**
   * Bulk delete groups
   */
  async bulkDelete(ids: number[]): Promise<{
    deletedIds: number[]
    errorGroups: string[]
    message: string
  }> {
    const deletedIds: number[] = []
    const errorGroups: string[] = []

    for (const id of ids) {
      try {
        await this.delete(id)
        deletedIds.push(id)
      } catch (err) {
        errorGroups.push(err instanceof Error ? err.message : `Group ID ${id}`)
      }
    }

    let message = `${deletedIds.length} group berhasil terhapus.`
    if (errorGroups.length > 0) {
      message = `Gagal menghapus beberapa group: ${errorGroups.join(', ')}`
    }

    return {
      deletedIds,
      errorGroups,
      message
    }
  }

  /**
   * Export ke Excel
   */
  async exportExcel(filters: GroupFilterDto = {}): Promise<void> {
    const { items } = await this.getAll({ ...filters, page: 1, pageSize: 9999 })
    const columns: ExportColumn<Group>[] = [
      { label: 'No', key: 'id', width: 8, formatter: (_val, row) => String(row.id) },
      { label: 'Nama Groups', key: 'name', width: 25 },
      { label: 'Keterangan', key: 'description', width: 40 },
      { label: 'Jumlah User', key: 'userCount', width: 15, formatter: (val) => String(val || 0) }
    ]

    exportToExcel<Group>({
      filename: `Master_Data_Groups_${new Date().toISOString().substring(0, 10)}`,
      title: 'Master Data Groups (Role Access)',
      columns,
      data: items
    })
  }

  /**
   * Export ke PDF
   */
  async exportPdf(filters: GroupFilterDto = {}): Promise<void> {
    const { items } = await this.getAll({ ...filters, page: 1, pageSize: 9999 })
    const columns: ExportColumn<Group>[] = [
      { label: 'No', key: 'id', width: 8, formatter: (_val, row) => String(row.id) },
      { label: 'Nama Groups', key: 'name', width: 25 },
      { label: 'Keterangan', key: 'description', width: 40 },
      { label: 'Jumlah User', key: 'userCount', width: 15, formatter: (val) => String(val || 0) }
    ]

    exportToPdf<Group>({
      filename: `Master_Data_Groups_${new Date().toISOString().substring(0, 10)}`,
      title: 'Master Data Groups (Role Access)',
      subtitle: `Total ${items.length} Groups Terdaftar • Dicetak pada ${new Date().toLocaleDateString('id-ID')}`,
      columns,
      data: items
    })
  }
}

export const apiGroupService = new ApiGroupService()
