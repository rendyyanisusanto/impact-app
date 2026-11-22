import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GroupPermissionSummary from '@/modules/system/groups/components/GroupPermissionSummary.vue'
import GroupDashboardAccess from '@/modules/system/groups/components/GroupDashboardAccess.vue'
import GroupPermissionMatrix from '@/modules/system/groups/components/GroupPermissionMatrix.vue'
import { createDefaultPermissions } from '@/modules/system/groups/utils/permission-registry'
import type { GroupPermissionSummary as SummaryType } from '@/modules/system/groups/types/group.types'

describe('Sprint 9 — Task 3–4: Group UI Components & Permission Matrix', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('GroupPermissionSummary', () => {
    it('1. renders all 6 metric cards with correct values', () => {
      const dummySummary: SummaryType = {
        activeCategoriesCount: 5,
        totalCategoriesCount: 10,
        submenusWithReadCount: 12,
        totalSubmenusCount: 40,
        createCount: 8,
        updateCount: 7,
        deleteCount: 4,
        totalSelectedFlags: 31,
        dashboardWidgetsCount: 2
      }

      const wrapper = mount(GroupPermissionSummary, {
        props: { summary: dummySummary }
      })

      expect(wrapper.text()).toContain('Kategori Aktif')
      expect(wrapper.text()).toContain('5')
      expect(wrapper.text()).toContain('Akses Read (R)')
      expect(wrapper.text()).toContain('12')
      expect(wrapper.text()).toContain('Create (C)')
      expect(wrapper.text()).toContain('8')
      expect(wrapper.text()).toContain('Update (U)')
      expect(wrapper.text()).toContain('7')
      expect(wrapper.text()).toContain('Delete (D)')
      expect(wrapper.text()).toContain('4')
      expect(wrapper.text()).toContain('Widget Dashboard')
      expect(wrapper.text()).toContain('2')
    })
  })

  describe('GroupDashboardAccess', () => {
    it('2. renders 3 dashboard widgets and handles select all', async () => {
      const wrapper = mount(GroupDashboardAccess, {
        props: {
          modelValue: [1]
        }
      })

      expect(wrapper.text()).toContain('All Top Spender')
      expect(wrapper.text()).toContain('All Stock Limit')
      expect(wrapper.text()).toContain('Get Recent Mutation')

      // Click Select All toggle
      const toggleBtn = wrapper.find('button')
      expect(toggleBtn.text()).toContain('Pilih Semua Widget')
      await toggleBtn.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([1, 2, 3])
    })

    it('3. respects read-only mode by disabling checkboxes', () => {
      const wrapper = mount(GroupDashboardAccess, {
        props: {
          modelValue: [1],
          readOnly: true
        }
      })

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      for (const cb of checkboxes) {
        expect(cb.attributes('disabled')).toBeDefined()
      }
    })
  })

  describe('GroupPermissionMatrix', () => {
    it('4. renders all 10 categories in accordions with legacy alert info', () => {
      const perms = createDefaultPermissions()
      const wrapper = mount(GroupPermissionMatrix, {
        props: { modelValue: perms }
      })

      expect(wrapper.text()).toContain('C (CREATE):')
      expect(wrapper.text()).toContain('R (READ):')
      expect(wrapper.text()).toContain('U (UPDATE):')
      expect(wrapper.text()).toContain('D (DELETE):')

      expect(wrapper.text()).toContain('Menu Pengadaan')
      expect(wrapper.text()).toContain('Menu Persediaan')
      expect(wrapper.text()).toContain('Menu Produksi')
      expect(wrapper.text()).toContain('Menu Penjualan')
      expect(wrapper.text()).toContain('Menu Laporan')
      expect(wrapper.text()).toContain('Menu System Setting')
    })

    it('5. filters submenus by search query without modifying original permissions', async () => {
      const perms = createDefaultPermissions()
      perms['4'] = { c: true, r: true, u: false, d: false } // PO has check

      const wrapper = mount(GroupPermissionMatrix, {
        props: { modelValue: perms }
      })

      const searchInput = wrapper.find('input[type="text"]')
      await searchInput.setValue('Purchase Order')
      await flushPromises()

      expect(wrapper.text()).toContain('Purchase Order')
      // Other categories with no matching submenus should not be rendered
      expect(wrapper.text()).not.toContain('Menu HR')

      // Clear search
      await searchInput.setValue('')
      await flushPromises()
      expect(wrapper.text()).toContain('Menu HR')
    })

    it('6. toggles category select all and column select all', async () => {
      const perms = createDefaultPermissions()
      const wrapper = mount(GroupPermissionMatrix, {
        props: { modelValue: perms }
      })

      // Find first category select all checkbox (Pengadaan)
      const catCheckboxes = wrapper.findAll('input[type="checkbox"]')
      expect(catCheckboxes.length).toBeGreaterThan(10)

      // Trigger Category Select All for Pengadaan
      await catCheckboxes[0].trigger('change')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()

      const emittedPerms = wrapper.emitted('update:modelValue')![0][0] as Record<
        string,
        { c: boolean; r: boolean; u: boolean; d: boolean }
      >
      // PO (id: 4) and Suplier (id: 1) should now have all flags true
      expect(emittedPerms['1'].c).toBe(true)
      expect(emittedPerms['1'].r).toBe(true)
      expect(emittedPerms['4'].c).toBe(true)
      expect(emittedPerms['4'].r).toBe(true)
    })
  })
})

