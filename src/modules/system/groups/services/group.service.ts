import type {
  Group,
  GroupFormDto,
  GroupFilterDto,
  GroupPaginatedResult,
  SubmenuPermissionFlag,
  GroupDetailViewModel,
  LegacyGroupDetailEntity,
  LegacyGroupDashboardEntity,
  LegacyUserGroupEntity
} from '../types/group.types'
import {
  MENU_REGISTRY,
  DASHBOARD_WIDGETS,
  createDefaultPermissions,
  createSuperadminPermissions,
  calculatePermissionSummary,
  serializePermissionsToV2
} from '../utils/permission-registry'
import { validateGroupForm } from '../utils/group-validation'
import { useAuthStore } from '@/stores/auth.store'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'

// Initial seed data from legacy SQL u1573701_smm.sql & V2 mock users
const INITIAL_GROUPS: Group[] = [
  {
    id: 1,
    name: 'admin',
    description: 'Administrator (Superadmin Sistem)',
    createdAt: '2023-01-01 08:00:00',
    createdBy: 'System',
    updatedAt: '2023-01-01 08:00:00',
    updatedBy: 'System'
  },
  {
    id: 2,
    name: 'general',
    description: 'General User (Pengguna Umum)',
    createdAt: '2023-01-01 08:00:00',
    createdBy: 'admin',
    updatedAt: '2023-01-01 08:00:00',
    updatedBy: 'admin'
  },
  {
    id: 3,
    name: 'Staff Penjualan',
    description: 'Divisi Penjualan & Pemrosesan Sales Order',
    createdAt: '2023-01-15 09:30:00',
    createdBy: 'admin',
    updatedAt: '2023-01-15 09:30:00',
    updatedBy: 'admin'
  },
  {
    id: 4,
    name: 'Gudang',
    description: 'Khusus administrasi gudang dan logistik',
    createdAt: '2023-01-10 10:00:00',
    createdBy: 'admin',
    updatedAt: '2023-01-10 10:00:00',
    updatedBy: 'admin'
  },
  {
    id: 5,
    name: 'driver',
    description: 'Driver pengiriman barang',
    createdAt: '2023-01-12 11:00:00',
    createdBy: 'admin',
    updatedAt: '2023-01-12 11:00:00',
    updatedBy: 'admin'
  },
  {
    id: 6,
    name: 'Co Admin',
    description: 'untuk asisten admin / Auditor internal',
    createdAt: '2023-01-18 14:00:00',
    createdBy: 'admin',
    updatedAt: '2023-01-18 14:00:00',
    updatedBy: 'admin'
  },
  {
    id: 7,
    name: 'Warehouse 2',
    description: 'Khusus admin warehouse cabang 2',
    createdAt: '2023-01-20 15:00:00',
    createdBy: 'admin',
    updatedAt: '2023-01-20 15:00:00',
    updatedBy: 'admin'
  },
  {
    id: 8,
    name: 'Produksi',
    description: 'Divisi Produksi (Ningsih)',
    createdAt: '2023-02-01 09:00:00',
    createdBy: 'admin',
    updatedAt: '2023-02-01 09:00:00',
    updatedBy: 'admin'
  },
  {
    id: 9,
    name: 'Staff HR',
    description: 'Staff HR & Personalia Kehadiran',
    createdAt: '2023-02-10 09:00:00',
    createdBy: 'admin',
    updatedAt: '2023-02-10 09:00:00',
    updatedBy: 'admin'
  }
]

// Users mapped to groups
const INITIAL_USERS_GROUPS: LegacyUserGroupEntity[] = [
  { id: 1, user_id: '1', group_id: 1 }, // Superadmin -> admin
  { id: 2, user_id: '2', group_id: 3 }, // Ahmad Fauzi -> Staff Penjualan
  { id: 3, user_id: '3', group_id: 4 }, // Budi Santoso -> Gudang
  { id: 4, user_id: '4', group_id: 6 }, // Dewi Lestari -> Co Admin
  { id: 5, user_id: '5', group_id: 9 } // Siti Rahmawati -> Staff HR
]

class GroupService {
  private groups: Group[] = []
  private groupsDetail: LegacyGroupDetailEntity[] = []
  private groupsDashboard: LegacyGroupDashboardEntity[] = []
  private usersGroups: LegacyUserGroupEntity[] = []
  private nextGroupId = 10
  private nextDetailId = 500
  private nextDashboardId = 100

  constructor() {
    this.resetToInitialSeeds()
  }

  /**
   * Resets in-memory storage to initial seeds
   */
  public resetToInitialSeeds(): void {
    this.groups = JSON.parse(JSON.stringify(INITIAL_GROUPS))
    this.usersGroups = JSON.parse(JSON.stringify(INITIAL_USERS_GROUPS))
    this.groupsDetail = []
    this.groupsDashboard = []
    this.nextGroupId = 10
    this.nextDetailId = 500
    this.nextDashboardId = 100

    // Seed Superadmin with full rights
    const superadminPerms = createSuperadminPermissions()
    for (const [subId, p] of Object.entries(superadminPerms)) {
      this.groupsDetail.push({
        id: this.nextDetailId++,
        groups_id: 1,
        submenu_id: subId,
        c: p.c ? 1 : 0,
        r: p.r ? 1 : 0,
        u: p.u ? 1 : 0,
        d: p.d ? 1 : 0
      })
    }
    // Seed Superadmin dashboard widgets
    for (const widget of DASHBOARD_WIDGETS) {
      this.groupsDashboard.push({
        id: this.nextDashboardId++,
        group_id: 1,
        dashboard_id: widget.id,
        column: 6
      })
    }

    // Seed Staff Penjualan (group_id = 3)
    const salesSubmenus = [9, 10, 101, 102, 11, 103] // Customers, SO, Payments, Other Income
    for (const subId of salesSubmenus) {
      this.groupsDetail.push({
        id: this.nextDetailId++,
        groups_id: 3,
        submenu_id: subId,
        c: 1,
        r: 1,
        u: 1,
        d: 1
      })
    }
    this.groupsDashboard.push({
      id: this.nextDashboardId++,
      group_id: 3,
      dashboard_id: 1, // All Top Spender
      column: 6
    })

    // Seed Gudang (group_id = 4)
    const gudangSubmenus = [29, 30, 31, 34, 12] // Bahan, Produk, Stock Adj, Mutasi, Surat Jalan
    for (const subId of gudangSubmenus) {
      this.groupsDetail.push({
        id: this.nextDetailId++,
        groups_id: 4,
        submenu_id: subId,
        c: 1,
        r: 1,
        u: 1,
        d: 1
      })
    }
    this.groupsDashboard.push({
      id: this.nextDashboardId++,
      group_id: 4,
      dashboard_id: 2, // All Stock Limit
      column: 6
    })

    // Seed Staff HR (group_id = 9)
    const hrSubmenus = [26, 326, 33, 340, 27] // Karyawan, Grup, Jadwal, Libur, Presensi
    for (const subId of hrSubmenus) {
      this.groupsDetail.push({
        id: this.nextDetailId++,
        groups_id: 9,
        submenu_id: subId,
        c: 1,
        r: 1,
        u: 1,
        d: 1
      })
    }
  }

  /**
   * Helper to count users assigned to a group
   */
  public getUserCount(groupId: number): number {
    return this.usersGroups.filter((ug) => ug.group_id === groupId).length
  }

  /**
   * Helper to get all groups synchronously (for quick in-memory lookups)
   */
  public getAllSync(): Group[] {
    return this.groups.map((g) => ({
      ...g,
      userCount: this.getUserCount(g.id)
    }))
  }

  /**
   * Helper to get list of assigned user names
   */
  public getAssignedUserNames(groupId: number): string[] {
    const userNamesMap: Record<string, string> = {
      '1': 'Superadmin (superadmin)',
      '2': 'Ahmad Fauzi (staff.penjualan)',
      '3': 'Budi Santoso (staff.gudang)',
      '4': 'Dewi Lestari (auditor)',
      '5': 'Siti Rahmawati (staff.hr)'
    }
    return this.usersGroups
      .filter((ug) => ug.group_id === groupId)
      .map((ug) => userNamesMap[String(ug.user_id)] || `User ID #${ug.user_id}`)
  }

  /**
   * Get all groups with filtering, search, sorting and pagination
   */
  public async getAll(filters: GroupFilterDto = {}): Promise<GroupPaginatedResult> {
    const search = filters.search?.trim().toLowerCase() || ''
    const page = Math.max(1, filters.page || 1)
    const pageSize = Math.max(1, filters.pageSize || 10)
    const sortBy = filters.sortBy || 'id'
    const sortOrder = filters.sortOrder || 'desc'

    // Compute user count on-the-fly
    let items = this.groups.map((g) => ({
      ...g,
      userCount: this.getUserCount(g.id)
    }))

    // Search filter
    if (search) {
      items = items.filter(
        (g) =>
          g.name.toLowerCase().includes(search) ||
          g.description.toLowerCase().includes(search)
      )
    }

    // Sort
    items.sort((a, b) => {
      let valA: string | number = a[sortBy] ?? ''
      let valB: string | number = b[sortBy] ?? ''
      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    const totalItems = items.length
    const totalPages = Math.ceil(totalItems / pageSize) || 1
    const startIndex = (page - 1) * pageSize
    const paginatedItems = items.slice(startIndex, startIndex + pageSize)

    return {
      items: paginatedItems,
      totalItems,
      page,
      pageSize,
      totalPages
    }
  }

  /**
   * Get group by ID with its permission map and dashboard access IDs
   */
  public async getById(id: number): Promise<{
    group: Group
    permissions: Record<string, SubmenuPermissionFlag>
    dashboardIds: (number | string)[]
  }> {
    const group = this.groups.find((g) => g.id === Number(id))
    if (!group) {
      throw new Error(`Group dengan ID ${id} tidak ditemukan.`)
    }

    // Default all permissions to false
    const permissions = createDefaultPermissions()

    // Populate saved permissions from groupsDetail
    const details = this.groupsDetail.filter((d) => d.groups_id === Number(id))
    for (const d of details) {
      const subIdStr = String(d.submenu_id)
      if (permissions[subIdStr]) {
        permissions[subIdStr] = {
          c: d.c === 1,
          r: d.r === 1,
          u: d.u === 1,
          d: d.d === 1
        }
      }
    }

    // Populate dashboard widget access
    const dashboardIds = this.groupsDashboard
      .filter((gd) => gd.group_id === Number(id))
      .map((gd) => gd.dashboard_id)

    return {
      group: {
        ...group,
        userCount: this.getUserCount(group.id)
      },
      permissions,
      dashboardIds
    }
  }

  /**
   * Get detail ViewModel for read-only look_page
   */
  public async getDetailViewModel(id: number): Promise<GroupDetailViewModel> {
    const { group, permissions, dashboardIds } = await this.getById(id)
    const assignedUserNames = this.getAssignedUserNames(group.id)

    const selectedWidgets = DASHBOARD_WIDGETS.filter((w) =>
      dashboardIds.some((did) => String(did) === String(w.id))
    )

    const menuCategories = MENU_REGISTRY.map((cat) => ({
      id: cat.id,
      name: cat.name,
      submenus: cat.submenus.map((sub) => {
        const p = permissions[String(sub.id)] || { c: false, r: false, u: false, d: false }
        return {
          id: sub.id,
          name: sub.name,
          resource: sub.resource,
          c: p.c,
          r: p.r,
          u: p.u,
          d: p.d,
          allowedActions: sub.allowedActions
        }
      })
    }))

    const summary = calculatePermissionSummary(permissions, dashboardIds)

    return {
      group,
      assignedUserNames,
      dashboardWidgets: selectedWidgets,
      menuCategories,
      summary
    }
  }

  /**
   * Create new group and its permissions atomically
   */
  public async create(dto: GroupFormDto): Promise<Group> {
    const validation = validateGroupForm(dto, this.groups)
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      throw new Error(firstError || 'Data Group tidak valid.')
    }

    const authStore = useAuthStore()
    const currentUserName = authStore.user?.username || 'admin'
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    const newGroup: Group = {
      id: this.nextGroupId++,
      name: dto.name.trim(),
      description: dto.description.trim(),
      userCount: 0,
      createdAt: now,
      createdBy: currentUserName,
      updatedAt: now,
      updatedBy: currentUserName
    }

    this.groups.push(newGroup)

    // Persist permissions in groups_detail
    for (const [submenuId, p] of Object.entries(dto.permissions)) {
      this.groupsDetail.push({
        id: this.nextDetailId++,
        groups_id: newGroup.id,
        submenu_id: submenuId,
        c: p.c ? 1 : 0,
        r: p.r ? 1 : 0,
        u: p.u ? 1 : 0,
        d: p.d ? 1 : 0
      })
    }

    // Persist dashboard widgets
    for (const dashId of dto.dashboardIds) {
      this.groupsDashboard.push({
        id: this.nextDashboardId++,
        group_id: newGroup.id,
        dashboard_id: dashId,
        column: 6
      })
    }

    return newGroup
  }

  /**
   * Update existing group and its permissions atomically
   */
  public async update(id: number, dto: GroupFormDto): Promise<Group> {
    const groupIndex = this.groups.findIndex((g) => g.id === Number(id))
    if (groupIndex === -1) {
      throw new Error(`Group dengan ID ${id} tidak ditemukan.`)
    }

    const validation = validateGroupForm(dto, this.groups, Number(id))
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]
      throw new Error(firstError || 'Data Group tidak valid.')
    }

    const authStore = useAuthStore()
    const currentUserName = authStore.user?.username || 'admin'
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

    const targetGroup = this.groups[groupIndex]
    targetGroup.name = dto.name.trim()
    targetGroup.description = dto.description.trim()
    targetGroup.updatedAt = now
    targetGroup.updatedBy = currentUserName

    // Delete existing detail records for this group & re-insert
    this.groupsDetail = this.groupsDetail.filter((d) => d.groups_id !== Number(id))
    for (const [submenuId, p] of Object.entries(dto.permissions)) {
      this.groupsDetail.push({
        id: this.nextDetailId++,
        groups_id: Number(id),
        submenu_id: submenuId,
        c: p.c ? 1 : 0,
        r: p.r ? 1 : 0,
        u: p.u ? 1 : 0,
        d: p.d ? 1 : 0
      })
    }

    // Delete existing dashboard records for this group & re-insert
    this.groupsDashboard = this.groupsDashboard.filter((gd) => gd.group_id !== Number(id))
    for (const dashId of dto.dashboardIds) {
      this.groupsDashboard.push({
        id: this.nextDashboardId++,
        group_id: Number(id),
        dashboard_id: dashId,
        column: 6
      })
    }

    // Propagate permission changes dynamically to active user session if applicable!
    this.syncActiveUserSession(Number(id), dto.permissions)

    return targetGroup
  }

  /**
   * Delete group with strict safety rules:
   * 1. Cannot delete Superadmin group (ID: 1)
   * 2. Cannot delete group that still has assigned users (Legacy error message!)
   */
  public async delete(id: number): Promise<{ success: boolean; message: string }> {
    const numId = Number(id)
    if (numId === 1) {
      throw new Error('Group SUPERADMIN dilindungi sistem dan tidak dapat dihapus.')
    }

    const group = this.groups.find((g) => g.id === numId)
    if (!group) {
      throw new Error(`Group dengan ID ${id} tidak ditemukan.`)
    }

    const userCount = this.getUserCount(numId)
    if (userCount > 0) {
      // Exact legacy CI3 error message from Groups.php line 307
      throw new Error(
        `Tidak dapat menghapus group "${group.name}" karena masih memiliki ${userCount} user yang terkait`
      )
    }

    // Delete related permissions and dashboard records
    this.groupsDetail = this.groupsDetail.filter((d) => d.groups_id !== numId)
    this.groupsDashboard = this.groupsDashboard.filter((gd) => gd.group_id !== numId)
    this.groups = this.groups.filter((g) => g.id !== numId)

    return {
      success: true,
      message: 'Data berhasil terhapus'
    }
  }

  /**
   * Bulk delete groups with safety validation
   */
  public async bulkDelete(ids: number[]): Promise<{
    deletedIds: number[]
    errorGroups: string[]
    message: string
  }> {
    const errorGroups: string[] = []
    const deletedIds: number[] = []

    for (const id of ids) {
      const numId = Number(id)
      if (numId === 1) {
        errorGroups.push('admin (Superadmin dilindungi)')
        continue
      }

      const group = this.groups.find((g) => g.id === numId)
      if (!group) continue

      const userCount = this.getUserCount(numId)
      if (userCount > 0) {
        errorGroups.push(`${group.name} (${userCount} user)`)
      } else {
        this.groupsDetail = this.groupsDetail.filter((d) => d.groups_id !== numId)
        this.groupsDashboard = this.groupsDashboard.filter((gd) => gd.group_id !== numId)
        this.groups = this.groups.filter((g) => g.id !== numId)
        deletedIds.push(numId)
      }
    }

    if (errorGroups.length > 0) {
      // Legacy CI3 bulk delete message from line 272
      const msg = `Tidak dapat menghapus group yang masih memiliki user: ${errorGroups.join(', ')}`
      return {
        deletedIds,
        errorGroups,
        message: msg
      }
    }

    return {
      deletedIds,
      errorGroups: [],
      message: 'Data berhasil terhapus'
    }
  }

  /**
   * Seamlessly propagates updated group permissions to current active user session
   * without forcing logout/login!
   */
  private syncActiveUserSession(
    groupId: number,
    permissions: Record<string, SubmenuPermissionFlag>
  ) {
    try {
      const authStore = useAuthStore()
      const currentUser = authStore.user
      if (!currentUser) return

      // Determine if active user belongs to this group
      const userGroup = this.usersGroups.find(
        (ug) => String(ug.user_id) === String(currentUser.id) && ug.group_id === groupId
      )

      if (userGroup) {
        // Serialize new permissions into V2 format
        const serialized = serializePermissionsToV2(permissions)
        // If not superadmin wildcard, update permissions array
        if (currentUser.role !== 'superadmin') {
          currentUser.permissions = serialized
        }
      }
    } catch {
      // Silently continue if store is not initialized in non-Vue environments
    }
  }

  /**
   * Export to Excel
   */
  public async exportExcel(filters: GroupFilterDto = {}): Promise<void> {
    const { items } = await this.getAll({ ...filters, page: 1, pageSize: 9999 })
    const columns: ExportColumn<Group>[] = [
      { label: 'No', key: 'id', width: 8, formatter: (_val, _item) => String(1) },
      { label: 'Nama Groups', key: 'name', width: 25 },
      { label: 'Keterangan', key: 'description', width: 40 },
      { label: 'Jumlah User', key: 'userCount', width: 15, formatter: (val) => String(val || 0) },
      { label: 'Dibuat Pada', key: 'createdAt', width: 20 },
      { label: 'Dibuat Oleh', key: 'createdBy', width: 15 }
    ]

    exportToExcel<Group>({
      filename: `Master_Data_Groups_${new Date().toISOString().substring(0, 10)}`,
      title: 'Master Data Groups (Role Access)',
      columns,
      data: items
    })
  }

  /**
   * Export to PDF
   */
  public async exportPdf(filters: GroupFilterDto = {}): Promise<void> {
    const { items } = await this.getAll({ ...filters, page: 1, pageSize: 9999 })
    const columns: ExportColumn<Group>[] = [
      { label: 'No', key: 'id', width: 8, formatter: (_val, _item) => String(1) },
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

import { apiGroupService } from './api-group.service'

class GroupServiceAdapter {
  private get activeService() {
    const isMock =
      import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockGroupService : apiGroupService
  }

  public getAll(filters?: GroupFilterDto): Promise<GroupPaginatedResult> {
    return this.activeService.getAll(filters)
  }

  public getById(id: number): Promise<{
    group: Group
    permissions: Record<string, SubmenuPermissionFlag>
    dashboardIds: (number | string)[]
  }> {
    return this.activeService.getById(id)
  }

  public getDetailViewModel(id: number): Promise<GroupDetailViewModel> {
    return this.activeService.getDetailViewModel(id)
  }

  public create(dto: GroupFormDto): Promise<Group> {
    return this.activeService.create(dto)
  }

  public update(id: number, dto: GroupFormDto): Promise<Group> {
    return this.activeService.update(id, dto)
  }

  public delete(id: number): Promise<{ success: boolean; message: string }> {
    return this.activeService.delete(id)
  }

  public bulkDelete(ids: number[]): Promise<{
    deletedIds: number[]
    errorGroups: string[]
    message: string
  }> {
    return this.activeService.bulkDelete(ids)
  }

  public exportExcel(filters?: GroupFilterDto): Promise<void> {
    return this.activeService.exportExcel(filters)
  }

  public exportPdf(filters?: GroupFilterDto): Promise<void> {
    return this.activeService.exportPdf(filters)
  }

  public resetToInitialSeeds(): void {
    mockGroupService.resetToInitialSeeds()
  }

  public getAllSync(): Group[] {
    return mockGroupService.getAllSync()
  }

  public getUserCount(groupId: number): number {
    return mockGroupService.getUserCount(groupId)
  }

  public getAssignedUserNames(groupId: number): string[] {
    return mockGroupService.getAssignedUserNames(groupId)
  }
}

export const mockGroupService = new GroupService()
export const groupService = new GroupServiceAdapter()
