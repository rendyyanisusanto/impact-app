import type {
  User,
  UserListItem,
  UserDetail,
  CreateUserPayload,
  UpdateUserPayload,
  UserFilterDto,
  UserPaginatedResult,
  UserStatus,
  EmployeeReference
} from '../types/user.types'
import type { SubmenuPermissionFlag } from '@/modules/system/groups/types/group.types'
import { apiGroupService } from '@/modules/system/groups/services/api-group.service'
import { employeeService } from '@/modules/hr/services/employee.service'
import { apiClient } from '@/shared/services/api-client'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'

interface RawUserResponse {
  id: number
  username: string
  email?: string | null
  firstName?: string | null
  first_name?: string | null
  lastName?: string | null
  last_name?: string | null
  company?: string | null
  phone?: string | null
  active: number
  createdOn?: string | null
  created_on?: number | null
  lastLogin?: string | null
  last_login?: number | null
  ipAddress?: string | null
  ip_address?: string | null
  employeeId?: number | null
  anggota_id?: number | null
  pin?: string | null
  groupId?: number
  groupName?: string
  groupDescription?: string
  groups?: { id: number; name: string; description: string }[]
}

function formatTimestamp(ts?: number | string | null): string | null {
  if (!ts) return null
  const num = Number(ts)
  if (isNaN(num)) return String(ts)
  const date = new Date(num > 1e11 ? num : num * 1000)
  return isNaN(date.getTime()) ? String(ts) : date.toISOString().replace('T', ' ').substring(0, 19)
}

export class ApiUserService {
  private cachedEmployees: EmployeeReference[] | null = null

  /**
   * Mengambil daftar referensi karyawan aktif langsung dari backend (tabel karyawan)
   */
  async getEmployees(): Promise<EmployeeReference[]> {
    try {
      const res = await apiClient<EmployeeReference[]>('/users/employees')
      this.cachedEmployees = res.data
      return res.data
    } catch {
      // Fallback ke mock jika backend tidak dapat dihubungi
      return employeeService.getAllEmployeesSync().map((e) => ({
        id: e.id,
        kode: e.kode ? String(e.kode) : null,
        nama: e.nama,
        email: e.email || null,
        status: e.status,
        jabatan_id: e.jabatan_id || null,
        jabatan_nama: e.jabatan_nama || null
      }))
    }
  }

  /**
   * Mengubah response backend menjadi UserListItem
   */
  private enrichUserListItem(raw: RawUserResponse): UserListItem {
    const rawGroups = raw.groups || []
    const primaryGroup = rawGroups[0] || { id: 0, name: '', description: '' }
    const groupId = Number(raw.groupId || primaryGroup.id || 0)
    const groupName = String(raw.groupName || primaryGroup.name || 'Tanpa Group').toUpperCase()
    const groupDescription = String(raw.groupDescription || primaryGroup.description || '-')

    let employeeCode: string | null = null
    let employeeName: string | null = null
    let employeePosition: string | null = null

    const employeeId = raw.employeeId || raw.anggota_id
    if (employeeId) {
      try {
        const emp =
          this.cachedEmployees?.find((e) => e.id === Number(employeeId)) ||
          employeeService.getAllEmployeesSync().find((e) => e.id === Number(employeeId))
        if (emp) {
          employeeCode = emp.kode ? String(emp.kode) : null
          employeeName = emp.nama
          employeePosition = emp.jabatan_nama || null
        }
      } catch {
        // Fallback jika employeeService belum siap
      }
    }

    const active: UserStatus = raw.active === 1 ? 1 : 0
    const statusLabel = active === 1 ? 'AKTIF' : 'NON AKTIF'

    return {
      id: raw.id,
      username: raw.username,
      email: raw.email || '',
      firstName: raw.firstName || raw.first_name || raw.username,
      employeeId: employeeId ? Number(employeeId) : null,
      employeeCode,
      employeeName,
      employeePosition,
      groupId,
      groupName,
      groupDescription,
      active,
      statusLabel,
      ipAddress: raw.ipAddress || raw.ip_address || '-',
      lastLogin: formatTimestamp(raw.lastLogin ?? raw.last_login),
      createdOn: formatTimestamp(raw.createdOn ?? raw.created_on) || '-'
    }
  }

  /**
   * Mengambil daftar user berpaginasi dari backend API
   */
  async getAll(filters: UserFilterDto = {}): Promise<UserPaginatedResult> {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.pageSize) params.append('pageSize', String(filters.pageSize))
    if (filters.search) params.append('search', filters.search)
    if (filters.groupId !== undefined && filters.groupId !== 'all') {
      params.append('groupId', String(filters.groupId))
    }
    if (filters.status !== undefined && filters.status !== 'all') {
      params.append('status', String(filters.status))
    }
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

    const query = params.toString() ? `?${params.toString()}` : ''
    const res = await apiClient<RawUserResponse[]>(`/users${query}`)

    const items = res.data.map((u) => this.enrichUserListItem(u))
    const meta = res.meta || {
      page: filters.page || 1,
      pageSize: filters.pageSize || 10,
      totalItems: items.length,
      totalPages: 1
    }

    return {
      items,
      totalItems: meta.totalItems,
      currentPage: meta.page,
      pageSize: meta.pageSize,
      totalPages: meta.totalPages
    }
  }

  /**
   * Mengambil detail lengkap user dari backend API
   */
  async getById(id: number): Promise<UserDetail> {
    const res = await apiClient<RawUserResponse>(`/users/${id}`)
    const listItem = this.enrichUserListItem(res.data)

    // Load employee detail
    let employeeDetail: UserDetail['employee'] = null
    if (listItem.employeeId) {
      try {
        const emp =
          this.cachedEmployees?.find((e) => e.id === Number(listItem.employeeId)) ||
          employeeService.getAllEmployeesSync().find((e) => e.id === Number(listItem.employeeId))
        if (emp) {
          employeeDetail = {
            id: emp.id,
            kode: emp.kode ? String(emp.kode) : '-',
            nama: emp.nama,
            jabatan: emp.jabatan_nama || '-',
            status: emp.status,
            statusLabel: emp.status === 1 ? 'AKTIF' : 'NON AKTIF',
            no_hp: 'no_hp' in emp ? String((emp as unknown as Record<string, unknown>).no_hp || '-') : '-',
            alamat: 'alamat' in emp ? String((emp as unknown as Record<string, unknown>).alamat || '-') : '-'
          }
        }
      } catch {
        // Fallback
      }
    }

    // Load group detail & permissions
    let groupPermissions: Record<string, SubmenuPermissionFlag> = {}
    let dashboardWidgets: (string | number)[] = []
    let groupInfo = {
      id: listItem.groupId,
      name: listItem.groupName,
      description: listItem.groupDescription
    }

    if (listItem.groupId) {
      try {
        const groupDetail = await apiGroupService.getById(listItem.groupId)
        groupPermissions = groupDetail.permissions
        dashboardWidgets = groupDetail.dashboardIds
        groupInfo = {
          id: groupDetail.group.id,
          name: groupDetail.group.name,
          description: groupDetail.group.description
        }
      } catch {
        // Fallback
      }
    }

    return {
      ...listItem,
      employee: employeeDetail,
      group: groupInfo,
      isPinSet: Boolean(res.data.pin && String(res.data.pin).trim().length > 0),
      accessibleWidgets: dashboardWidgets,
      permissions: groupPermissions
    }
  }

  /**
   * Membuat user baru di backend
   */
  async create(payload: CreateUserPayload): Promise<UserListItem> {
    const res = await apiClient<RawUserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify({
        username: payload.username,
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        active: payload.active !== undefined ? payload.active : 1,
        employeeId: payload.employeeId,
        groupId: payload.groupId,
        groupIds: [payload.groupId],
        pin: payload.pin
      })
    })

    return this.enrichUserListItem(res.data)
  }

  /**
   * Memperbarui user di backend
   */
  async update(id: number, payload: UpdateUserPayload): Promise<UserListItem> {
    const res = await apiClient<RawUserResponse>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        username: payload.username,
        email: payload.email,
        password: payload.password || undefined,
        firstName: payload.firstName,
        active: payload.active,
        employeeId: payload.employeeId,
        groupId: payload.groupId,
        groupIds: payload.groupId ? [payload.groupId] : undefined,
        pin: payload.pin || undefined
      })
    })

    return this.enrichUserListItem(res.data)
  }

  /**
   * Mengubah group user secara langsung
   */
  async changeGroup(id: number, groupId: number): Promise<UserListItem> {
    await apiClient(`/users/${id}/groups`, {
      method: 'PUT',
      body: JSON.stringify({
        groupIds: [Number(groupId)]
      })
    })

    const updated = await this.getById(id)
    return updated
  }

  /**
   * Toggle status aktif user
   */
  async toggleStatus(id: number): Promise<{ user: UserListItem; message: string }> {
    const current = await this.getById(id)
    const newStatus: UserStatus = current.active === 1 ? 0 : 1

    const res = await apiClient<RawUserResponse>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active: newStatus })
    })

    return {
      user: this.enrichUserListItem(res.data),
      message: res.message || `Status user berhasil diubah.`
    }
  }

  /**
   * Reset password user
   */
  async resetPassword(
    id: number,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiClient<{ success: boolean; message: string }>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password: newPassword })
    })

    return {
      success: true,
      message: res.message || 'Password berhasil direset.'
    }
  }

  /**
   * Reset PIN user
   */
  async resetPin(id: number, newPin: string): Promise<{ success: boolean; message: string }> {
    await apiClient(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ pin: newPin.trim() })
    })

    return {
      success: true,
      message: 'PIN otorisasi berhasil diperbarui.'
    }
  }

  /**
   * Menghapus user
   */
  async delete(id: number): Promise<{ success: boolean; message: string }> {
    const res = await apiClient<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE'
    })

    return {
      success: true,
      message: res.message || 'User berhasil dihapus.'
    }
  }

  /**
   * Bulk delete users
   */
  async bulkDelete(ids: number[]): Promise<{
    deletedIds: number[]
    failedIds: number[]
    message: string
  }> {
    const deletedIds: number[] = []
    const failedIds: number[] = []

    for (const id of ids) {
      try {
        await this.delete(id)
        deletedIds.push(id)
      } catch {
        failedIds.push(id)
      }
    }

    let message = `${deletedIds.length} user berhasil terhapus.`
    if (failedIds.length > 0) {
      message += ` (${failedIds.length} user gagal/dilewati).`
    }

    return {
      deletedIds,
      failedIds,
      message
    }
  }

  /**
   * Sinkronisasi sesi aktif jika sedang login
   */
  async syncActiveUserSession(_user: User): Promise<void> {
    // Session state is managed dynamically via backend cookies & JWT
  }

  /**
   * Export Excel
   */
  async exportExcel(filters: UserFilterDto = {}): Promise<void> {
    const result = await this.getAll({ ...filters, page: 1, pageSize: 10000 })
    const columns: ExportColumn<UserListItem>[] = [
      { key: 'id', label: 'ID User', width: 10 },
      { key: 'firstName', label: 'Nama Lengkap', width: 25 },
      { key: 'username', label: 'Username', width: 20 },
      { key: 'email', label: 'Email', width: 25 },
      {
        key: 'employeeName',
        label: 'Karyawan',
        width: 25,
        formatter: (_val, row) =>
          row.employeeCode ? `[${row.employeeCode}] ${row.employeeName}` : '-'
      },
      { key: 'groupName', label: 'Groups/Role', width: 20 },
      { key: 'statusLabel', label: 'Status Akun', width: 15 },
      { key: 'ipAddress', label: 'IP Address', width: 15 },
      { key: 'createdOn', label: 'Dibuat Pada', width: 20 },
      {
        key: 'lastLogin',
        label: 'Terakhir Login',
        width: 20,
        formatter: (val) => (val ? String(val) : 'Belum pernah')
      }
    ]

    await exportToExcel({
      filename: `Master_Data_User_${new Date().toISOString().substring(0, 10)}.xlsx`,
      title: 'Master Data User',
      columns: columns as unknown as ExportColumn<unknown>[],
      data: result.items
    })
  }

  /**
   * Export PDF
   */
  async exportPdf(filters: UserFilterDto = {}): Promise<void> {
    const result = await this.getAll({ ...filters, page: 1, pageSize: 10000 })
    const columns: ExportColumn<UserListItem>[] = [
      { key: 'id', label: 'ID' },
      { key: 'firstName', label: 'Nama Lengkap' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'groupName', label: 'Role' },
      { key: 'statusLabel', label: 'Status' },
      { key: 'lastLogin', label: 'Terakhir Login', formatter: (val) => (val ? String(val) : '-') }
    ]

    await exportToPdf({
      filename: `Master_Data_User_${new Date().toISOString().substring(0, 10)}.pdf`,
      title: 'Laporan Master Data User (Role Access)',
      columns: columns as unknown as ExportColumn<unknown>[],
      data: result.items
    })
  }
}

export const apiUserService = new ApiUserService()
