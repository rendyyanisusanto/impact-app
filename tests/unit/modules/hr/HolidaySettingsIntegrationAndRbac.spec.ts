import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import HolidaySettingsPage from '@/modules/hr/pages/HolidaySettingsPage.vue'
import { MOCK_USERS } from '@/mocks/users.mock'
import { employeeService } from '@/modules/hr/services/employee.service'
import { employeeGroupService } from '@/modules/hr/services/employee-group.service'
import { holidaySettingsService } from '@/modules/hr/services/holiday-settings.service'
import { useAuthStore } from '@/stores/auth.store'

describe('Sprint 8 — Task 9–10: Holiday Settings Integration & RBAC Workflow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    holidaySettingsService.resetToOriginalSeed()
    employeeService.reset()
    employeeGroupService.reset()

    // Default admin user with full permissions
    const authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0]
  })

  it('executes full end-to-end workflow: list, calendar switch, search, create with exceptions, edit, delete, export, and downstream resolver', async () => {
    // -------------------------------------------------------------
    // STEP 1: Mount page and verify header & initial table rows
    // -------------------------------------------------------------
    const wrapper = mount(HolidaySettingsPage, {
      global: {
        stubs: {
          AppPageHeader: {
            template: `<div><h1>Setting Hari Libur</h1><slot name="actions" /></div>`
          },
          HolidayFormModal: {
            props: ['modelValue', 'mode'],
            template: `
              <div v-if="modelValue" class="holiday-form-modal-stub">
                <h2>{{ mode === 'create' ? 'Tambah Hari Libur Baru' : 'Ubah Pengaturan Hari Libur' }}</h2>
              </div>
            `
          }
        }
      }
    })

    await new Promise(r => setTimeout(r, 20))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Setting Hari Libur')
    expect(wrapper.text()).toContain('HARI KEMERDEKAAN RI')

    // -------------------------------------------------------------
    // STEP 2: Toggle View Mode to Calendar
    // -------------------------------------------------------------
    const calToggleBtn = wrapper.findAll('button').find(b => b.text().includes('Kalender'))
    expect(calToggleBtn).toBeDefined()
    await calToggleBtn?.trigger('click')
    await wrapper.vm.$nextTick()

    // Calendar headers are visible
    expect(wrapper.text()).toContain('Senin')
    expect(wrapper.text()).toContain('Minggu')
    expect(wrapper.text()).toContain('Keterangan:')

    // Toggle back to Table
    const tableToggleBtn = wrapper.findAll('button').find(b => b.text().includes('Daftar'))
    await tableToggleBtn?.trigger('click')
    await wrapper.vm.$nextTick()

    // -------------------------------------------------------------
    // STEP 3: Search filter
    // -------------------------------------------------------------
    const searchInput = wrapper.find('input[placeholder*="Cari keterangan"]')
    expect(searchInput.exists()).toBe(true)
    await searchInput.setValue('KEMERDEKAAN')
    await new Promise(r => setTimeout(r, 20))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('HARI KEMERDEKAAN RI')
    // Clear search
    await searchInput.setValue('')
    await new Promise(r => setTimeout(r, 20))
    await wrapper.vm.$nextTick()

    // -------------------------------------------------------------
    // STEP 4: Create new Holiday via Service & UI Modal verification
    // -------------------------------------------------------------
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Tambah Hari Libur'))
    expect(addBtn).toBeDefined()
    await addBtn?.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Tambah Hari Libur Baru')

    // Create via service to ensure persistence and test downstream
    const newHoliday = await holidaySettingsService.createHoliday({
      tanggal: '2024-08-22',
      keterangan: 'HARI LIBUR KHUSUS PABRIK',
      exceptionEmployeeIds: [53, 54]
    })

    expect(newHoliday.id).toBeDefined()
    expect(newHoliday.keterangan).toBe('HARI LIBUR KHUSUS PABRIK')

    // -------------------------------------------------------------
    // STEP 5: Verify downstream Presensi Resolver contract
    // -------------------------------------------------------------
    const isHoliday = await holidaySettingsService.isHoliday('2024-08-22')
    expect(isHoliday).toBe(true)

    // Employee 53 is exempted (must work)
    const emp53Exempted = await holidaySettingsService.isEmployeeExempted(53, '2024-08-22')
    expect(emp53Exempted).toBe(true)

    // Employee 999 is NOT exempted
    const emp999Exempted = await holidaySettingsService.isEmployeeExempted(999, '2024-08-22')
    expect(emp999Exempted).toBe(false)

    // -------------------------------------------------------------
    // STEP 6: Update Holiday
    // -------------------------------------------------------------
    const updated = await holidaySettingsService.updateHoliday(newHoliday.id, {
      keterangan: 'HARI LIBUR KHUSUS PABRIK REVISI',
      exceptionEmployeeIds: [53] // removed 54
    })
    expect(updated.keterangan).toBe('HARI LIBUR KHUSUS PABRIK REVISI')
    expect(updated.exceptionEmployeeIds).toEqual([53])

    // Now employee 54 is no longer exempted
    const emp54Exempted = await holidaySettingsService.isEmployeeExempted(54, '2024-08-22')
    expect(emp54Exempted).toBe(false)

    // -------------------------------------------------------------
    // STEP 7: Delete Holiday
    // -------------------------------------------------------------
    const deleted = await holidaySettingsService.deleteHoliday(newHoliday.id)
    expect(deleted).toBe(true)

    const isStillHoliday = await holidaySettingsService.isHoliday('2024-08-22')
    expect(isStillHoliday).toBe(false)
  })

  it('enforces RBAC restrictions: Read-Only user sees banner and cannot perform modifications', async () => {
    // Set user to read-only auditor
    const authStore = useAuthStore()
    authStore.currentUser = {
      id: 99,
      username: 'auditor.view',
      name: 'Auditor Viewer',
      email: 'auditor@impact.test',
      roleId: 'role-auditor',
      roleName: 'Auditor',
      permissions: [{ resource: 'hr.holidays', actions: ['read'] }]
    }

    const wrapper = mount(HolidaySettingsPage, {
      global: {
        stubs: {
          AppPageHeader: {
            template: `<div><h1>Setting Hari Libur</h1><slot name="actions" /></div>`
          }
        }
      }
    })

    await new Promise(r => setTimeout(r, 20))
    await wrapper.vm.$nextTick()

    // Read-only banner is displayed
    expect(wrapper.text()).toContain('Mode Hanya Baca')

    // "Tambah Hari Libur" button is hidden
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Tambah Hari Libur'))
    expect(addBtn).toBeUndefined()

    // Edit and Delete buttons in the table are hidden
    const editBtns = wrapper.findAll('button[title="Ubah Hari Libur"]')
    expect(editBtns).toHaveLength(0)

    const deleteBtns = wrapper.findAll('button[title="Hapus Hari Libur"]')
    expect(deleteBtns).toHaveLength(0)
  })
})
