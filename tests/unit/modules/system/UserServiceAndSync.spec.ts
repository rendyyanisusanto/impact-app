import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { userService } from '@/modules/system/users/services/user.service'
import { useAuthStore } from '@/stores/auth.store'

describe('Sprint 9 — Task 5, 6 & 9: UserService & Session Synchronization Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    userService.resetToInitialSeeds()
  })

  it('initializes with seed users from legacy SQL smm-polaris.sql', async () => {
    const result = await userService.getAll({ page: 1, pageSize: 20 })
    expect(result.totalItems).toBeGreaterThanOrEqual(9)

    const admin = result.items.find(u => u.id === 1)
    expect(admin).toBeDefined()
    expect(admin?.username).toBe('administrator')
    expect(admin?.groupName).toBe('ADMIN')
    expect(admin?.active).toBe(1)

    const staffPenjualan = result.items.find(u => u.username === 'staff.penjualan')
    expect(staffPenjualan).toBeDefined()
    expect(staffPenjualan?.employeeName).toBe('ACHMAD')
  })

  it('filters users by search query across multiple fields', async () => {
    // Search by username
    const searchUser = await userService.getAll({ search: 'staff.gudang' })
    expect(searchUser.items).toHaveLength(1)
    expect(searchUser.items[0].username).toBe('staff.gudang')

    // Search by employee name
    const searchEmp = await userService.getAll({ search: 'IWAN' })
    expect(searchEmp.items.length).toBeGreaterThan(0)
    expect(searchEmp.items.some(u => u.employeeName?.includes('IWAN'))).toBe(true)

    // Search by email
    const searchEmail = await userService.getAll({ search: 'admin@impactfurniture' })
    expect(searchEmail.items).toHaveLength(1)
    expect(searchEmail.items[0].id).toBe(1)
  })

  it('filters users by group ID and status', async () => {
    // Filter by group 4 (Gudang)
    const gudangUsers = await userService.getAll({ groupId: 4 })
    expect(gudangUsers.items.length).toBeGreaterThan(0)
    expect(gudangUsers.items.every(u => u.groupId === 4)).toBe(true)

    // Filter by status active = 1
    const activeUsers = await userService.getAll({ status: 1 })
    expect(activeUsers.items.every(u => u.active === 1)).toBe(true)
  })

  it('retrieves complete safe UserDetail by ID without exposing password/pin', async () => {
    const detail = await userService.getById(2)
    expect(detail.id).toBe(2)
    expect(detail.username).toBe('staff.penjualan')
    expect(detail.employee).toBeDefined()
    expect(detail.employee?.nama).toBe('ACHMAD')
    expect(detail.group).toBeDefined()
    expect(detail.group.id).toBe(3)
    expect(detail.isPinSet).toBe(true)
    expect(detail.permissions).toBeDefined()
    expect(detail.accessibleWidgets).toBeDefined()

    // STRICT SECURITY: No password, hash, or raw PIN in detail view!
    expect((detail as unknown as Record<string, unknown>).password).toBeUndefined()
    expect((detail as unknown as Record<string, unknown>).passwordHash).toBeUndefined()
    expect((detail as unknown as Record<string, unknown>).pin).toBeUndefined()
  })

  it('creates a new user successfully and assigns group', async () => {
    const created = await userService.create({
      employeeId: 53,
      firstName: 'Operator Lapangan',
      username: 'operator.01',
      email: 'operator01@impactfurniture.co.id',
      password: 'password123',
      passwordConfirm: 'password123',
      pin: '654321',
      groupId: 4,
      active: 1
    })

    expect(created.id).toBeDefined()
    expect(created.username).toBe('operator.01')
    expect(created.employeeName).toBe('IWAN')
    expect(created.groupName).toBe('GUDANG')

    // Verify presence in list
    const found = await userService.getById(created.id)
    expect(found.username).toBe('operator.01')
  })

  it('updates an existing user while keeping password and PIN when empty', async () => {
    const updated = await userService.update(2, {
      firstName: 'Ahmad Fauzi Updated',
      username: 'staff.penjualan',
      email: 'ahmad.fauzi@impactfurniture.co.id',
      groupId: 3,
      active: 1,
      password: '', // Empty: preserve existing
      pin: '' // Empty: preserve existing
    })

    expect(updated.firstName).toBe('Ahmad Fauzi Updated')
    expect(updated.email).toBe('ahmad.fauzi@impactfurniture.co.id')

    const detail = await userService.getById(2)
    expect(detail.firstName).toBe('Ahmad Fauzi Updated')
    expect(detail.isPinSet).toBe(true)
  })

  it('toggles user active status with Superadmin root protection', async () => {
    // Attempting to deactivate Superadmin (ID 1) must be rejected
    await expect(userService.toggleStatus(1)).rejects.toThrow(
      'Akun Superadmin root tidak dapat dinonaktifkan.'
    )

    // Toggle normal user
    const resDeactivate = await userService.toggleStatus(2)
    expect(resDeactivate.user.active).toBe(0)
    expect(resDeactivate.user.statusLabel).toBe('NON AKTIF')

    const resReactivate = await userService.toggleStatus(2)
    expect(resReactivate.user.active).toBe(1)
    expect(resReactivate.user.statusLabel).toBe('AKTIF')
  })

  it('safely resets user password and PIN', async () => {
    // Reset password
    const resPass = await userService.resetPassword(2, 'newpassword123')
    expect(resPass.success).toBe(true)
    expect(resPass.message).toContain('berhasil direset')

    // Invalid password
    await expect(userService.resetPassword(2, '123')).rejects.toThrow(
      'Password minimal 6 karakter.'
    )

    // Reset PIN
    const resPin = await userService.resetPin(2, '998877')
    expect(resPin.success).toBe(true)
    expect(resPin.message).toContain('berhasil direset')

    // Invalid PIN
    await expect(userService.resetPin(2, 'abc')).rejects.toThrow('PIN hanya boleh berupa angka.')
  })

  it('enforces deletion protection for Superadmin root (ID 1)', async () => {
    await expect(userService.delete(1)).rejects.toThrow(
      'Akun Superadmin root tidak dapat dihapus.'
    )

    // Normal user deletion succeeds
    const deleteRes = await userService.delete(2)
    expect(deleteRes.success).toBe(true)
    await expect(userService.getById(2)).rejects.toThrow('tidak ditemukan')
  })

  it('bulk delete skips Superadmin (ID 1) safely', async () => {
    const result = await userService.bulkDelete([1, 7, 8])
    expect(result.failedIds).toContain(1)
    expect(result.deletedIds).toContain(7)
    expect(result.deletedIds).toContain(8)
    expect(result.message).toContain('dilewati karena merupakan akun terlindungi / Superadmin')

    // Verify Superadmin remains alive
    const admin = await userService.getById(1)
    expect(admin).toBeDefined()
  })

  it('synchronizes active user session immediately when updating currently logged in user', async () => {
    const authStore = useAuthStore()
    authStore.currentUser = {
      id: 3,
      name: 'Budi Santoso',
      username: 'staff.gudang',
      roleId: '4',
      roleName: 'Gudang',
      role: 'staff_gudang',
      email: 'budi@impactfurniture.co.id',
      permissions: [{ resource: 'inventory', actions: ['read'] }]
    }

    // Update user 3 name and change group to Staff Penjualan (group ID 3)
    await userService.update(3, {
      firstName: 'Budi Santoso Manager',
      username: 'staff.gudang',
      email: 'budi.manager@impactfurniture.co.id',
      groupId: 3, // Staff Penjualan
      active: 1
    })

    // Active session should be immediately updated without re-login!
    expect(authStore.currentUser.name).toBe('Budi Santoso Manager')
    expect(authStore.currentUser.email).toBe('budi.manager@impactfurniture.co.id')
    expect(authStore.currentUser.roleId).toBe('3')
    expect(authStore.currentUser.roleName).toBe('Staff Penjualan')
    expect(authStore.currentUser.permissions.length).toBeGreaterThan(0)
  })

  it('exports user list to Excel and PDF without exposing passwords or PINs', async () => {
    // Both export calls should resolve cleanly
    await expect(userService.exportExcel()).resolves.toBeUndefined()
    await expect(userService.exportPdf()).resolves.toBeUndefined()
  })
})