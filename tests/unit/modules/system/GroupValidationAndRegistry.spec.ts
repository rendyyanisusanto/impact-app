import { describe, it, expect } from 'vitest'
import {
  validateGroupForm
} from '@/modules/system/groups/utils/group-validation'
import {
  MENU_REGISTRY,
  DASHBOARD_WIDGETS,
  createDefaultPermissions,
  createSuperadminPermissions,
  calculatePermissionSummary,
  serializePermissionsToV2,
  findSubmenuById
} from '@/modules/system/groups/utils/permission-registry'
import type { Group, GroupFormDto } from '@/modules/system/groups/types/group.types'

describe('Sprint 9 — Task 1: Group Validation & Permission Registry', () => {
  const dummyGroups: Group[] = [
    { id: 1, name: 'admin', description: 'Super Administrator' },
    { id: 2, name: 'general', description: 'General User' },
    { id: 3, name: 'Gudang', description: 'Staff Gudang' }
  ]

  describe('Group Form Validation', () => {
    it('1. requires name and description', () => {
      const form: GroupFormDto = {
        name: '',
        description: '',
        dashboardIds: [],
        permissions: {}
      }
      const res = validateGroupForm(form, dummyGroups)
      expect(res.isValid).toBe(false)
      expect(res.errors.name).toContain('Nama Groups wajib diisi')
      expect(res.errors.description).toContain('Keterangan Groups wajib diisi')
    })

    it('2. enforces legacy character limits (max 20 for name, max 100 for description)', () => {
      const form: GroupFormDto = {
        name: 'This Name Is Way Too Long For The Field', // > 20
        description: 'A'.repeat(105), // > 100
        dashboardIds: [],
        permissions: {}
      }
      const res = validateGroupForm(form, dummyGroups)
      expect(res.isValid).toBe(false)
      expect(res.errors.name).toContain('maksimal 20 karakter')
      expect(res.errors.description).toContain('maksimal 100 karakter')
    })

    it('3. rejects duplicate group names (case-insensitive)', () => {
      const form: GroupFormDto = {
        name: 'GUDANG', // already exists as 'Gudang'
        description: 'Gudang baru',
        dashboardIds: [],
        permissions: {}
      }
      const res = validateGroupForm(form, dummyGroups)
      expect(res.isValid).toBe(false)
      expect(res.errors.name).toContain('sudah digunakan')
    })

    it('4. allows same name when editing existing group', () => {
      const form: GroupFormDto = {
        name: 'Gudang',
        description: 'Deskripsi diperbarui',
        dashboardIds: [],
        permissions: {}
      }
      // editing group id: 3
      const res = validateGroupForm(form, dummyGroups, 3)
      expect(res.isValid).toBe(true)
      expect(res.errors.name).toBeUndefined()
    })

    it('5. prevents renaming system default Superadmin group (ID: 1)', () => {
      const form: GroupFormDto = {
        name: 'Operator',
        description: 'Trying to rename admin',
        dashboardIds: [],
        permissions: {}
      }
      const res = validateGroupForm(form, dummyGroups, 1)
      expect(res.isValid).toBe(false)
      expect(res.errors.name).toContain('SUPERADMIN')
    })
  })

  describe('Menu Registry & Dashboard Widgets', () => {
    it('6. contains exactly 3 verified legacy dashboard widgets', () => {
      expect(DASHBOARD_WIDGETS).toHaveLength(3)
      const names = DASHBOARD_WIDGETS.map((w) => w.name)
      expect(names).toContain('All Top Spender')
      expect(names).toContain('All Stock Limit')
      expect(names).toContain('Get Recent Mutation')
    })

    it('7. contains all 10 application menu categories with proper submenus', () => {
      expect(MENU_REGISTRY).toHaveLength(10)
      const categoryNames = MENU_REGISTRY.map((c) => c.name)
      expect(categoryNames).toContain('Menu Pengadaan')
      expect(categoryNames).toContain('Menu Persediaan')
      expect(categoryNames).toContain('Menu Produksi')
      expect(categoryNames).toContain('Menu Penjualan')
      expect(categoryNames).toContain('Menu Pengiriman')
      expect(categoryNames).toContain('Menu Keuangan')
      expect(categoryNames).toContain('Menu Laporan')
      expect(categoryNames).toContain('Menu HR')
      expect(categoryNames).toContain('Menu Setting')
      expect(categoryNames).toContain('Menu System Setting')
    })

    it('8. restricts Laporan category to Read only (U and D unsupported)', () => {
      const laporanCat = MENU_REGISTRY.find((c) => c.id === 7)!
      expect(laporanCat).toBeDefined()
      for (const sub of laporanCat.submenus) {
        expect(sub.allowedActions.u).toBe(false)
        expect(sub.allowedActions.d).toBe(false)
        expect(sub.allowedActions.r).toBe(true)
      }
    })

    it('9. finds submenu by ID correctly', () => {
      const found = findSubmenuById(4) // Purchase Order
      expect(found).not.toBeNull()
      expect(found?.submenu.name).toBe('Purchase Order')
      expect(found?.submenu.resource).toBe('procurement.purchase-orders')
    })
  })

  describe('Permission Serialization & Metrics Summary', () => {
    it('10. creates default empty permissions with all flags false', () => {
      const defaultPerms = createDefaultPermissions()
      const totalKeys = Object.keys(defaultPerms).length
      expect(totalKeys).toBeGreaterThan(30)
      for (const p of Object.values(defaultPerms)) {
        expect(p.c).toBe(false)
        expect(p.r).toBe(false)
        expect(p.u).toBe(false)
        expect(p.d).toBe(false)
      }
    })

    it('11. creates superadmin permissions with all allowed actions true', () => {
      const superadminPerms = createSuperadminPermissions()
      for (const cat of MENU_REGISTRY) {
        for (const sub of cat.submenus) {
          const p = superadminPerms[String(sub.id)]
          expect(p.r).toBe(true)
          if (!sub.allowedActions.u) {
            expect(p.u).toBe(false)
          } else {
            expect(p.u).toBe(true)
          }
        }
      }
    })

    it('12. calculates permission summary metrics accurately', () => {
      const perms = createDefaultPermissions()
      // Grant Read & Create on Purchase Order (ID: 4)
      perms['4'] = { c: true, r: true, u: false, d: false }
      // Grant all on Bahan (ID: 29)
      perms['29'] = { c: true, r: true, u: true, d: true }

      const summary = calculatePermissionSummary(perms, [1, 2])
      expect(summary.activeCategoriesCount).toBe(2) // Pengadaan & Persediaan
      expect(summary.submenusWithReadCount).toBe(2)
      expect(summary.createCount).toBe(2)
      expect(summary.updateCount).toBe(1)
      expect(summary.deleteCount).toBe(1)
      expect(summary.dashboardWidgetsCount).toBe(2)
    })

    it('13. serializes permissions to V2 Permission[] format cleanly', () => {
      const perms = createDefaultPermissions()
      perms['4'] = { c: true, r: true, u: false, d: false } // PO -> create, read
      const v2Perms = serializePermissionsToV2(perms)

      expect(v2Perms).toHaveLength(1)
      expect(v2Perms[0].resource).toBe('procurement.purchase-orders')
      expect(v2Perms[0].actions).toEqual(['create', 'read'])
    })
  })
})

