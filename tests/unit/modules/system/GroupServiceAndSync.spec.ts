import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { groupService } from '@/modules/system/groups/services/group.service'
import { createDefaultPermissions } from '@/modules/system/groups/utils/permission-registry'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'

describe('Sprint 9 — Task 1–2: Group Service, Persistence & Deletion Safety', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0] // Superadmin
    groupService.resetToInitialSeeds()
  })

  describe('Group Query & Retrieval', () => {
    it('1. retrieves seeded groups with dynamic user counts', async () => {
      const result = await groupService.getAll({ page: 1, pageSize: 20 })
      expect(result.items.length).toBeGreaterThanOrEqual(9)
      expect(result.totalItems).toBeGreaterThanOrEqual(9)

      const admin = result.items.find((g) => g.id === 1)
      expect(admin).toBeDefined()
      expect(admin?.userCount).toBe(1) // Superadmin assigned

      const driver = result.items.find((g) => g.id === 5)
      expect(driver).toBeDefined()
      expect(driver?.userCount).toBe(0) // No user assigned in initial seed
    })

    it('2. filters groups by search query across name and description', async () => {
      const byName = await groupService.getAll({ search: 'gudang' })
      expect(byName.items.some((g) => g.name.toLowerCase().includes('gudang'))).toBe(true)

      const byDesc = await groupService.getAll({ search: 'personalia' })
      expect(byDesc.items.some((g) => g.description.toLowerCase().includes('personalia'))).toBe(true)
    })

    it('3. sorts groups by name and userCount', async () => {
      const sortedAsc = await groupService.getAll({ sortBy: 'name', sortOrder: 'asc' })
      for (let i = 0; i < sortedAsc.items.length - 1; i++) {
        expect(sortedAsc.items[i].name.toLowerCase() <= sortedAsc.items[i + 1].name.toLowerCase()).toBe(true)
      }
    })

    it('4. loads single group with its permissions and dashboard widgets', async () => {
      const res = await groupService.getById(1)
      expect(res.group.name).toBe('admin')
      expect(res.dashboardIds).toContain(1)
      expect(res.dashboardIds).toContain(2)
      expect(res.dashboardIds).toContain(3)
      expect(res.permissions['4']?.r).toBe(true) // Purchase Order Read
    })

    it('5. returns full DetailViewModel for look_page', async () => {
      const detail = await groupService.getDetailViewModel(1)
      expect(detail.group.name).toBe('admin')
      expect(detail.assignedUserNames).toContain('Superadmin (superadmin)')
      expect(detail.dashboardWidgets).toHaveLength(3)
      expect(detail.menuCategories).toHaveLength(10)
      expect(detail.summary.activeCategoriesCount).toBe(10)
    })
  })

  describe('Group Mutation & Deletion Safety', () => {
    it('6. creates new group with atomic permission records', async () => {
      const perms = createDefaultPermissions()
      perms['4'] = { c: true, r: true, u: false, d: false } // PO create + read

      const created = await groupService.create({
        name: 'Supervisor PO',
        description: 'Role khusus mengelola PO',
        dashboardIds: [1],
        permissions: perms
      })

      expect(created.id).toBeGreaterThanOrEqual(10)
      expect(created.name).toBe('Supervisor PO')

      const retrieved = await groupService.getById(created.id)
      expect(retrieved.permissions['4'].c).toBe(true)
      expect(retrieved.permissions['4'].r).toBe(true)
      expect(retrieved.dashboardIds).toContain(1)
    })

    it('7. updates existing group details and permissions', async () => {
      const perms = createDefaultPermissions()
      perms['29'] = { c: true, r: true, u: true, d: true } // Bahan

      const updated = await groupService.update(2, {
        name: 'General Staff',
        description: 'Deskripsi diperbarui',
        dashboardIds: [2],
        permissions: perms
      })

      expect(updated.name).toBe('General Staff')
      expect(updated.description).toBe('Deskripsi diperbarui')

      const retrieved = await groupService.getById(2)
      expect(retrieved.group.name).toBe('General Staff')
      expect(retrieved.permissions['29'].c).toBe(true)
      expect(retrieved.dashboardIds).toContain(2)
    })

    it('8. strictly prevents deleting Superadmin group (ID: 1)', async () => {
      await expect(groupService.delete(1)).rejects.toThrow('SUPERADMIN')
    })

    it('9. blocks deletion of group with assigned users (legacy rule)', async () => {
      // Group ID 4 (Gudang) has user Budi Santoso assigned
      await expect(groupService.delete(4)).rejects.toThrow(
        'Tidak dapat menghapus group "Gudang" karena masih memiliki 1 user yang terkait'
      )
    })

    it('10. deletes group successfully when userCount is 0', async () => {
      // Group ID 5 (driver) has 0 assigned users
      const res = await groupService.delete(5)
      expect(res.success).toBe(true)
      expect(res.message).toBe('Data berhasil terhapus')

      await expect(groupService.getById(5)).rejects.toThrow('tidak ditemukan')
    })

    it('11. bulk delete blocks groups that still have users', async () => {
      // Try to bulk delete: 4 (has users) and 7 (Warehouse 2 - no users)
      const res = await groupService.bulkDelete([4, 7])
      expect(res.errorGroups).toContain('Gudang (1 user)')
      expect(res.message).toContain('Tidak dapat menghapus group yang masih memiliki user')
    })

    it('12. exports data to Excel and PDF without throwing', async () => {
      await expect(groupService.exportExcel()).resolves.toBeUndefined()
      await expect(groupService.exportPdf()).resolves.toBeUndefined()
    })
  })
})

