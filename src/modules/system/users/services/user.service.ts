import type {
  User,
  UserListItem,
  UserDetail,
  CreateUserPayload,
  UpdateUserPayload,
  UserFilterDto,
  UserPaginatedResult,
  EmployeeReference
} from '../types/user.types'
import {
  validateCreateUserForm,
  validateUpdateUserForm,
  validatePassword,
  validatePin
} from '../utils/user-validation'
import { groupService } from '@/modules/system/groups/services/group.service'
import { employeeService } from '@/modules/hr/services/employee.service'
import { serializePermissionsToV2 } from '@/modules/system/groups/utils/permission-registry'
import { useAuthStore } from '@/stores/auth.store'
import type { RoleType } from '@/shared/types/auth.types'
import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { ExportColumn } from '@/shared/types/crud.types'
import {
  registerDynamicAuthUser,
  unregisterDynamicAuthUser,
  setMockUserActiveStatus,
  resetMockAuthRegistry
} from '@/modules/auth/services/mock-auth.service'

// Initial seed data from legacy SQL smm-polaris.sql & V2 mock users
const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'administrator',
    email: 'admin@impactfurniture.co.id',
    firstName: 'Administrator',
    active: 1,
    employeeId: null,
    table: 'karyawan',
    groupId: 1, // admin
    ipAddress: '127.0.0.1',
    pin: '101711',
    passwordHash: '$2y$10$dxrlMRQtUt9vRv6IiSXLkegTZQtnpumaSX2dZRHtAkwgIBUrB1/Si',
    createdOn: '2023-01-01 08:00:00',
    lastLogin: '2026-11-01 08:30:15'
  },
  {
    id: 2,
    username: 'staff.penjualan',
    email: 'ahmad@impactfurniture.co.id',
    firstName: 'Ahmad Fauzi',
    active: 1,
    employeeId: 54, // ACHMAD
    table: 'karyawan',
    groupId: 3, // Staff Penjualan
    ipAddress: '192.168.1.10',
    pin: '123456',
    passwordHash: '$2y$10$Hojls1F0e38bTgB9Gyn8Cer.L.3Ak0T3rx5MyDvE3teoxXmawwGFG',
    createdOn: '2023-01-15 09:30:00',
    lastLogin: '2026-10-31 16:45:00'
  },
  {
    id: 3,
    username: 'staff.gudang',
    email: 'budi@impactfurniture.co.id',
    firstName: 'Budi Santoso',
    active: 1,
    employeeId: 53, // IWAN
    table: 'karyawan',
    groupId: 4, // Gudang
    ipAddress: '192.168.1.11',
    pin: '234567',
    passwordHash: '$2y$10$Zexem4W9luDl6kK6lUJfTet.gqskrcQqkFbK9osLRfEVYgp3wRJuq',
    createdOn: '2023-01-10 10:00:00',
    lastLogin: '2026-10-30 14:20:00'
  },
  {
    id: 4,
    username: 'auditor',
    email: 'dewi@impactfurniture.co.id',
    firstName: 'Dewi Lestari',
    active: 1,
    employeeId: 55, // Ningsih / Auditor
    table: 'karyawan',
    groupId: 6, // Co Admin
    ipAddress: '192.168.1.12',
    pin: '345678',
    passwordHash: '$2y$10$ISDX16pxB0WIsoBR0J.Rzen3jglMRES0cNNav7iIYI3SuP84C6o/C',
    createdOn: '2023-02-01 11:00:00',
    lastLogin: '2026-10-29 09:15:00'
  },
  {
    id: 5,
    username: 'staff.hr',
    email: 'hr@impactfurniture.co.id',
    firstName: 'Siti Rahmawati',
    active: 1,
    employeeId: 56, // HR Specialist
    table: 'karyawan',
    groupId: 9, // Staff HR
    ipAddress: '192.168.1.13',
    pin: '456789',
    passwordHash: '$2y$10$lKVNmY09DlwxyINsmHuZNu9aYTLoCYO51AOMDpSdTfXp/E/Ht08hq',
    createdOn: '2023-02-10 09:00:00',
    lastLogin: '2026-10-31 11:00:00'
  },
  {
    id: 7,
    username: 'ahm',
    email: 'ahmad@impact.com',
    firstName: 'AHM',
    active: 1,
    employeeId: 54, // ACHMAD
    table: 'karyawan',
    groupId: 4, // Gudang
    ipAddress: '::1',
    pin: '567890',
    passwordHash: '$2y$10$Hojls1F0e38bTgB9Gyn8Cer.L.3Ak0T3rx5MyDvE3teoxXmawwGFG',
    createdOn: '2023-08-25 15:03:43',
    lastLogin: '2023-08-26 07:51:51'
  },
  {
    id: 8,
    username: 'rendy',
    email: 'rendy@gmail.com',
    firstName: 'Rendy',
    active: 1,
    employeeId: 53, // IWAN
    table: 'karyawan',
    groupId: 4, // Gudang
    ipAddress: '112.215.237.81',
    pin: '678901',
    passwordHash: '$2y$10$Zexem4W9luDl6kK6lUJfTet.gqskrcQqkFbK9osLRfEVYgp3wRJuq',
    createdOn: '2023-10-22 09:44:31',
    lastLogin: '2023-10-22 09:44:40'
  },
  {
    id: 10,
    username: 'ahmet',
    email: 'ahmad123@impact.com',
    firstName: 'Ahmad Driver',
    active: 1,
    employeeId: 54, // ACHMAD
    table: 'karyawan',
    groupId: 5, // Warehouse 1
    ipAddress: '180.248.26.63',
    pin: '789012',
    passwordHash: '$2y$10$ISDX16pxB0WIsoBR0J.Rzen3jglMRES0cNNav7iIYI3SuP84C6o/C',
    createdOn: '2023-11-12 03:33:28',
    lastLogin: '2023-11-28 01:05:21'
  },
  {
    id: 11,
    username: 'sambo',
    email: 'sambo@gmail.com',
    firstName: 'Ramadhani Samboga, S.Pd',
    active: 1,
    employeeId: 57,
    table: 'karyawan',
    groupId: 5, // Warehouse 1
    ipAddress: '::1',
    pin: '890123',
    passwordHash: '$2y$10$lKVNmY09DlwxyINsmHuZNu9aYTLoCYO51AOMDpSdTfXp/E/Ht08hq',
    createdOn: '2023-12-24 07:13:59',
    lastLogin: null
  },
  {
    id: 12,
    username: 'rys',
    email: 'rendyyanisusanto@gmail.com',
    firstName: 'Rendy Yani Susanto',
    active: 1,
    employeeId: 53,
    table: 'karyawan',
    groupId: 6, // Co Admin
    ipAddress: '::1',
    pin: '901234',
    passwordHash: '$2y$10$K5ENW0NTKXMQMh.IpDWv4u1jw6CCdo/KCLu8CxSbJltq4JD0lOUwe',
    createdOn: '2024-01-25 14:41:06',
    lastLogin: '2024-01-31 06:44:23'
  }
]

class UserService {
  private users: User[] = []
  private nextUserId = 20

  constructor() {
    this.resetToInitialSeeds()
  }

  /**
   * Resets in-memory user list to initial seeds
   */
  public resetToInitialSeeds(): void {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS))
    this.syncAllToMockAuth()
  }

  private getGroupName(groupId: number): string {
    try {
      const g = groupService.getAllSync().find(x => x.id === groupId)
      if (g) return g.name
    } catch {
      // Fallback
    }
    return 'User'
  }

  private syncAllToMockAuth(): void {
    resetMockAuthRegistry()
    for (const u of this.users) {
      registerDynamicAuthUser(
        {
          id: u.id,
          name: u.firstName,
          username: u.username,
          email: u.email,
          roleId: String(u.groupId),
          roleName: this.getGroupName(u.groupId),
          permissions: []
        },
        u.active === 1
      )
    }
  }

  /**
   * Resolves safe UserListItem from internal User entity
   */
  private enrichUserListItem(user: User): UserListItem {
    // Resolve employee
    let employeeCode: string | null = null
    let employeeName: string | null = null
    let employeePosition: string | null = null

    if (user.employeeId) {
      const emp = employeeService.getAllEmployeesSync().find(e => e.id === user.employeeId)
      if (emp) {
        employeeCode = emp.kode ? String(emp.kode) : null
        employeeName = emp.nama
        employeePosition = emp.jabatan_nama || null
      }
    }

    // Resolve group from groupService
    let groupName = 'Tanpa Group'
    let groupDescription = '-'
    try {
      const groupsSync = groupService.getAllSync()
      const g = groupsSync.find((gr: { id: number; name: string; description: string }) => gr.id === user.groupId)
      if (g) {
        groupName = g.name
        groupDescription = g.description
      }
    } catch {
      // Fallback
    }

    // If still fallback, map known IDs
    if (groupName === 'Tanpa Group') {
      const fallbackGroups: Record<number, { name: string; desc: string }> = {
        1: { name: 'admin', desc: 'Administrator (Superadmin Sistem)' },
        2: { name: 'general', desc: 'General User (Pengguna Umum)' },
        3: { name: 'Staff Penjualan', desc: 'Divisi Penjualan & Pemrosesan Sales Order' },
        4: { name: 'Gudang', desc: 'Khusus administrasi gudang dan logistik' },
        5: { name: 'Warehouse 1', desc: 'Admin warehouse cabang 1' },
        6: { name: 'Co Admin', desc: 'Co-Administrator Sistem' },
        7: { name: 'Warehouse 2', desc: 'Khusus admin warehouse cabang 2' },
        8: { name: 'Produksi', desc: 'Divisi Produksi (Ningsih)' },
        9: { name: 'Staff HR', desc: 'Staff HR & Personalia Kehadiran' }
      }
      if (fallbackGroups[user.groupId]) {
        groupName = fallbackGroups[user.groupId].name
        groupDescription = fallbackGroups[user.groupId].desc
      }
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      employeeId: user.employeeId,
      employeeCode,
      employeeName,
      employeePosition,
      groupId: user.groupId,
      groupName: groupName.toUpperCase(),
      groupDescription,
      active: user.active,
      statusLabel: user.active === 1 ? 'AKTIF' : 'NON AKTIF',
      ipAddress: user.ipAddress || '-',
      lastLogin: user.lastLogin,
      createdOn: user.createdOn
    }
  }

  /**
   * Retrieves paginated, filtered, and sorted user list
   */
  public async getAll(filters: UserFilterDto = {}): Promise<UserPaginatedResult> {
    const page = Math.max(1, filters.page || 1)
    const pageSize = Math.max(1, filters.pageSize || 10)
    const search = (filters.search || '').trim().toLowerCase()
    const groupId = filters.groupId
    const status = filters.status

    let enriched = this.users.map(u => this.enrichUserListItem(u))

    // Filter search: username, email, firstName, employeeCode, employeeName
    if (search) {
      enriched = enriched.filter(u => {
        return (
          u.username.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.firstName.toLowerCase().includes(search) ||
          (u.employeeCode && u.employeeCode.toLowerCase().includes(search)) ||
          (u.employeeName && u.employeeName.toLowerCase().includes(search)) ||
          u.groupName.toLowerCase().includes(search)
        )
      })
    }

    // Filter group
    if (groupId !== undefined && groupId !== 'all') {
      enriched = enriched.filter(u => u.groupId === Number(groupId))
    }

    // Filter status
    if (status !== undefined && status !== 'all') {
      enriched = enriched.filter(u => u.active === Number(status))
    }

    // Sorting
    const sortBy = filters.sortBy || 'id'
    const sortOrder = filters.sortOrder === 'desc' ? -1 : 1

    enriched.sort((a, b) => {
      let valA: string | number = a.id
      let valB: string | number = b.id

      if (sortBy === 'username') {
        valA = a.username.toLowerCase()
        valB = b.username.toLowerCase()
      } else if (sortBy === 'firstName') {
        valA = a.firstName.toLowerCase()
        valB = b.firstName.toLowerCase()
      } else if (sortBy === 'email') {
        valA = a.email.toLowerCase()
        valB = b.email.toLowerCase()
      } else if (sortBy === 'groupName') {
        valA = a.groupName.toLowerCase()
        valB = b.groupName.toLowerCase()
      } else if (sortBy === 'active') {
        valA = a.active
        valB = b.active
      }

      if (valA < valB) return -1 * sortOrder
      if (valA > valB) return 1 * sortOrder
      return 0
    })

    const totalItems = enriched.length
    const totalPages = Math.ceil(totalItems / pageSize) || 1
    const startIndex = (page - 1) * pageSize
    const items = enriched.slice(startIndex, startIndex + pageSize)

    return {
      items,
      totalItems,
      totalPages,
      currentPage: page,
      pageSize
    }
  }

  /**
   * Retrieves complete safe UserDetail by ID
   */
  public async getById(id: number): Promise<UserDetail> {
    const user = this.users.find(u => u.id === Number(id))
    if (!user) {
      throw new Error(`User dengan ID ${id} tidak ditemukan.`)
    }

    const listItem = this.enrichUserListItem(user)

    // Load detailed employee
    let employeeDetail: UserDetail['employee'] = null
    if (user.employeeId) {
      const emp = employeeService.getAllEmployeesSync().find(e => e.id === user.employeeId)
      if (emp) {
        employeeDetail = {
          id: emp.id,
          kode: emp.kode ? String(emp.kode) : '-',
          nama: emp.nama,
          jabatan: emp.jabatan_nama || '-',
          status: emp.status,
          statusLabel: emp.status === 1 ? 'AKTIF' : 'NON AKTIF',
          no_hp: emp.no_hp || '-',
          alamat: emp.alamat || '-'
        }
      }
    }

    // Load group detail & permissions
    const groupDetail = await groupService.getById(user.groupId)

    return {
      ...listItem,
      employee: employeeDetail,
      group: {
        id: groupDetail.group.id,
        name: groupDetail.group.name,
        description: groupDetail.group.description
      },
      isPinSet: Boolean(user.pin && user.pin.trim().length > 0),
      accessibleWidgets: groupDetail.dashboardIds,
      permissions: groupDetail.permissions
    }
  }

  /**
   * Creates a new user
   */
  public async create(payload: CreateUserPayload): Promise<UserListItem> {
    const validation = validateCreateUserForm(payload, this.users)
    if (!validation.isValid) {
      throw new Error(validation.errors[0]?.message || 'Data input user tidak valid.')
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newUser: User = {
      id: this.nextUserId++,
      username: payload.username.trim(),
      email: payload.email.trim().toLowerCase(),
      firstName: payload.firstName.trim(),
      active: payload.active !== undefined ? payload.active : 1,
      employeeId: payload.employeeId ? Number(payload.employeeId) : null,
      table: 'karyawan',
      groupId: Number(payload.groupId),
      ipAddress: '127.0.0.1',
      pin: payload.pin.trim(),
      passwordHash: `$mock_hash_${Date.now()}`,
      createdOn: now,
      lastLogin: null
    }

    this.users.unshift(newUser)

    registerDynamicAuthUser(
      {
        id: newUser.id,
        name: newUser.firstName,
        username: newUser.username,
        email: newUser.email,
        roleId: String(newUser.groupId),
        roleName: this.getGroupName(newUser.groupId),
        permissions: []
      },
      newUser.active === 1
    )

    return this.enrichUserListItem(newUser)
  }

  /**
   * Updates an existing user
   */
  public async update(id: number, payload: UpdateUserPayload): Promise<UserListItem> {
    const userIndex = this.users.findIndex(u => u.id === Number(id))
    if (userIndex === -1) {
      throw new Error(`User dengan ID ${id} tidak ditemukan.`)
    }

    const validation = validateUpdateUserForm(Number(id), payload, this.users)
    if (!validation.isValid) {
      throw new Error(validation.errors[0]?.message || 'Data update user tidak valid.')
    }

    const user = this.users[userIndex]
    user.firstName = payload.firstName.trim()
    user.username = payload.username.trim()
    user.email = payload.email.trim().toLowerCase()
    user.groupId = Number(payload.groupId)

    if (payload.employeeId !== undefined) {
      user.employeeId = payload.employeeId ? Number(payload.employeeId) : null
    }

    if (payload.active !== undefined) {
      // Superadmin protection
      if (user.id === 1 && payload.active === 0) {
        throw new Error('Akun Superadmin root tidak dapat dinonaktifkan.')
      }
      user.active = payload.active
    }

    if (payload.password && payload.password.trim()) {
      user.passwordHash = `$mock_hash_updated_${Date.now()}`
    }

    if (payload.pin && payload.pin.trim()) {
      user.pin = payload.pin.trim()
    }

    // Synchronize active session if editing current logged-in user
    this.syncActiveUserSession(user)

    registerDynamicAuthUser(
      {
        id: user.id,
        name: user.firstName,
        username: user.username,
        email: user.email,
        roleId: String(user.groupId),
        roleName: this.getGroupName(user.groupId),
        permissions: []
      },
      user.active === 1
    )

    return this.enrichUserListItem(user)
  }

  /**
   * Quick change group
   */
  public async changeGroup(id: number, groupId: number): Promise<UserListItem> {
    const user = this.users.find(u => u.id === Number(id))
    if (!user) {
      throw new Error(`User dengan ID ${id} tidak ditemukan.`)
    }

    // Superadmin protection
    if (user.id === 1 && groupId !== 1) {
      throw new Error('Group akun Superadmin root tidak dapat diubah.')
    }

    user.groupId = Number(groupId)
    this.syncActiveUserSession(user)

    return this.enrichUserListItem(user)
  }

  /**
   * Toggles user active status (1 <-> 0)
   */
  public async toggleStatus(id: number): Promise<{ user: UserListItem; message: string }> {
    const user = this.users.find(u => u.id === Number(id))
    if (!user) {
      throw new Error(`User dengan ID ${id} tidak ditemukan.`)
    }

    // Protect Superadmin root (ID 1)
    if (user.id === 1) {
      throw new Error('Akun Superadmin root tidak dapat dinonaktifkan.')
    }

    // Protect current logged-in user
    try {
      const authStore = useAuthStore()
      if (authStore.currentUser && String(authStore.currentUser.id) === String(user.id)) {
        throw new Error('Tidak dapat menonaktifkan akun yang sedang Anda gunakan.')
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('Tidak dapat menonaktifkan')) {
        throw e
      }
    }

    const newStatus: 1 | 0 = user.active === 1 ? 0 : 1
    user.active = newStatus
    setMockUserActiveStatus(user.username, newStatus === 1)

    const label = newStatus === 1 ? 'diaktifkan' : 'dinonaktifkan'
    return {
      user: this.enrichUserListItem(user),
      message: `User "${user.username}" berhasil ${label}.`
    }
  }

  /**
   * Safely resets user password
   */
  public async resetPassword(
    id: number,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const user = this.users.find(u => u.id === Number(id))
    if (!user) {
      throw new Error(`User dengan ID ${id} tidak ditemukan.`)
    }

    const err = validatePassword(newPassword, true)
    if (err) {
      throw new Error(err)
    }

    user.passwordHash = `$mock_hash_reset_${Date.now()}`
    return {
      success: true,
      message: `Password user "${user.username}" berhasil direset.`
    }
  }

  /**
   * Safely resets user PIN
   */
  public async resetPin(
    id: number,
    newPin: string
  ): Promise<{ success: boolean; message: string }> {
    const user = this.users.find(u => u.id === Number(id))
    if (!user) {
      throw new Error(`User dengan ID ${id} tidak ditemukan.`)
    }

    const err = validatePin(newPin, true)
    if (err) {
      throw new Error(err)
    }

    user.pin = newPin.trim()
    return {
      success: true,
      message: `PIN otorisasi user "${user.username}" berhasil direset.`
    }
  }

  /**
   * Deletes a single user
   */
  public async delete(id: number): Promise<{ success: boolean; message: string }> {
    const userIndex = this.users.findIndex(u => u.id === Number(id))
    if (userIndex === -1) {
      throw new Error(`User dengan ID ${id} tidak ditemukan.`)
    }

    const user = this.users[userIndex]

    // Superadmin protection
    if (user.id === 1) {
      throw new Error('Akun Superadmin root tidak dapat dihapus.')
    }

    // Active session self-delete protection
    try {
      const authStore = useAuthStore()
      if (authStore.currentUser && String(authStore.currentUser.id) === String(user.id)) {
        throw new Error('Tidak dapat menghapus akun yang sedang Anda gunakan.')
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('Tidak dapat menghapus')) {
        throw e
      }
    }

    this.users.splice(userIndex, 1)
    unregisterDynamicAuthUser(user.username)

    return {
      success: true,
      message: `Data user "${user.username}" berhasil terhapus.`
    }
  }

  /**
   * Bulk deletes users
   */
  public async bulkDelete(ids: number[]): Promise<{
    deletedIds: number[]
    failedIds: number[]
    message: string
  }> {
    const deletedIds: number[] = []
    const failedIds: number[] = []
    let currentAuthId: string | null = null

    try {
      const authStore = useAuthStore()
      if (authStore.currentUser) {
        currentAuthId = String(authStore.currentUser.id)
      }
    } catch {
      // Ignored in headless tests
    }

    for (const id of ids) {
      const numId = Number(id)
      const user = this.users.find(u => u.id === numId)

      // Superadmin or self-delete protected
      if (!user || numId === 1 || (currentAuthId && String(numId) === currentAuthId)) {
        failedIds.push(numId)
        continue
      }

      const idx = this.users.findIndex(u => u.id === numId)
      if (idx !== -1) {
        unregisterDynamicAuthUser(user.username)
        this.users.splice(idx, 1)
        deletedIds.push(numId)
      }
    }

    let message = `${deletedIds.length} user berhasil terhapus.`
    if (failedIds.length > 0) {
      message += ` (${failedIds.length} user dilewati karena merupakan akun terlindungi / Superadmin).`
    }

    return {
      deletedIds,
      failedIds,
      message
    }
  }

  /**
   * Synchronizes active session if the edited user is currently logged in
   */
  public async syncActiveUserSession(user: User): Promise<void> {
    try {
      const authStore = useAuthStore()
      if (!authStore.currentUser) return

      const isCurrent =
        String(authStore.currentUser.id) === String(user.id) ||
        authStore.currentUser.username.toLowerCase() === user.username.toLowerCase()

      if (isCurrent) {
        const groupDetail = await groupService.getById(user.groupId)
        const v2Permissions = serializePermissionsToV2(groupDetail.permissions)

        authStore.currentUser = {
          ...authStore.currentUser,
          name: user.firstName,
          username: user.username,
          email: user.email,
          roleId: String(groupDetail.group.id),
          roleName: groupDetail.group.name,
          role: groupDetail.group.name.toLowerCase() as unknown as RoleType,
          permissions: v2Permissions
        }
      }
    } catch {
      // Isolated in non-pinia / unit test environments
    }
  }

  /**
   * Safe export to Excel (STRICTLY NO PASSWORDS OR PINS)
   */
  public async exportExcel(filters: UserFilterDto = {}): Promise<void> {
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
        formatter: (_val, row) => (row.employeeCode ? `[${row.employeeCode}] ${row.employeeName}` : '-')
      },
      { key: 'groupName', label: 'Groups/Role', width: 20 },
      { key: 'statusLabel', label: 'Status Akun', width: 15 },
      { key: 'ipAddress', label: 'IP Address', width: 15 },
      { key: 'createdOn', label: 'Dibuat Pada', width: 20 },
      { key: 'lastLogin', label: 'Terakhir Login', width: 20, formatter: val => (val ? String(val) : 'Belum pernah') }
    ]

    await exportToExcel({
      filename: `Master_Data_User_${new Date().toISOString().substring(0, 10)}.xlsx`,
      title: 'Master Data User',
      columns: columns as unknown as ExportColumn<unknown>[],
      data: result.items
    })
  }

  /**
   * Safe export to PDF (STRICTLY NO PASSWORDS OR PINS)
   */
  public async exportPdf(filters: UserFilterDto = {}): Promise<void> {
    const result = await this.getAll({ ...filters, page: 1, pageSize: 10000 })
    const columns: ExportColumn<UserListItem>[] = [
      { key: 'id', label: 'ID' },
      { key: 'firstName', label: 'Nama Lengkap' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'groupName', label: 'Role' },
      { key: 'statusLabel', label: 'Status' },
      { key: 'lastLogin', label: 'Terakhir Login', formatter: val => (val ? String(val) : '-') }
    ]

    await exportToPdf({
      filename: `Master_Data_User_${new Date().toISOString().substring(0, 10)}.pdf`,
      title: 'Laporan Master Data User (Role Access)',
      columns: columns as unknown as ExportColumn<unknown>[],
      data: result.items
    })
  }

  public async getEmployees(): Promise<EmployeeReference[]> {
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

import { apiUserService } from './api-user.service'

class UserServiceAdapter {
  private get activeService() {
    const isMock =
      import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockUserService : apiUserService
  }

  public getEmployees(): Promise<EmployeeReference[]> {
    return this.activeService.getEmployees()
  }

  public getAll(filters?: UserFilterDto): Promise<UserPaginatedResult> {
    return this.activeService.getAll(filters)
  }

  public getById(id: number): Promise<UserDetail> {
    return this.activeService.getById(id)
  }

  public create(payload: CreateUserPayload): Promise<UserListItem> {
    return this.activeService.create(payload)
  }

  public update(id: number, payload: UpdateUserPayload): Promise<UserListItem> {
    return this.activeService.update(id, payload)
  }

  public changeGroup(id: number, groupId: number): Promise<UserListItem> {
    return this.activeService.changeGroup(id, groupId)
  }

  public toggleStatus(id: number): Promise<{ user: UserListItem; message: string }> {
    return this.activeService.toggleStatus(id)
  }

  public resetPassword(
    id: number,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    return this.activeService.resetPassword(id, newPassword)
  }

  public resetPin(id: number, newPin: string): Promise<{ success: boolean; message: string }> {
    return this.activeService.resetPin(id, newPin)
  }

  public delete(id: number): Promise<{ success: boolean; message: string }> {
    return this.activeService.delete(id)
  }

  public bulkDelete(ids: number[]): Promise<{
    deletedIds: number[]
    failedIds: number[]
    message: string
  }> {
    return this.activeService.bulkDelete(ids)
  }

  public syncActiveUserSession(user: User): Promise<void> {
    return this.activeService.syncActiveUserSession
      ? this.activeService.syncActiveUserSession(user)
      : Promise.resolve()
  }

  public exportExcel(filters?: UserFilterDto): Promise<void> {
    return this.activeService.exportExcel(filters)
  }

  public exportPdf(filters?: UserFilterDto): Promise<void> {
    return this.activeService.exportPdf(filters)
  }

  public resetToInitialSeeds(): void {
    mockUserService.resetToInitialSeeds()
  }
}

export const mockUserService = new UserService()
export const userService = new UserServiceAdapter()
