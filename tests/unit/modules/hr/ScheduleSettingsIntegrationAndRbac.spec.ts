import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import ScheduleSettingsPage from '@/modules/hr/pages/ScheduleSettingsPage.vue'
import { MOCK_USERS } from '@/mocks/users.mock'
import { employeeGroupService } from '@/modules/hr/services/employee-group.service'
import { employeeService } from '@/modules/hr/services/employee.service'
import { scheduleSettingsService } from '@/modules/hr/services/schedule-settings.service'
import { useAuthStore } from '@/stores/auth.store'

describe('Sprint 8 — Task 8: HR Schedule Integration & 18-Step End-to-End Workflow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    scheduleSettingsService.resetToOriginalSeed()
    employeeService.reset()
    employeeGroupService.reset()

    const authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0]
  })

  it('executes comprehensive 18-step workflow covering editing, validation, persistence, RBAC, and cross-module safety', async () => {
    // -------------------------------------------------------------
    // STEP 1: Open Setting Jadwal page
    // -------------------------------------------------------------
    const wrapper = mount(ScheduleSettingsPage, {
      global: {
        stubs: {
          AppPageHeader: {
            template: `<div><h1>Master Data Jadwal</h1><slot name="actions" /></div>`
          }
        }
      }
    })

    await new Promise(r => setTimeout(r, 20))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Setting Jadwal')

    // -------------------------------------------------------------
    // STEP 2: Verify all 7 days appear in strict order (Senin to Minggu)
    // -------------------------------------------------------------
    const initialList = await scheduleSettingsService.getWeeklySchedule()
    expect(initialList).toHaveLength(7)
    expect(initialList.map(d => d.dayName)).toEqual([
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
      'Minggu'
    ])

    // -------------------------------------------------------------
    // STEP 3: Ubah Jam Masuk Senin
    // -------------------------------------------------------------
    const mondayInStartInput = wrapper.find('input#time-2-checkIn-start')
    expect(mondayInStartInput.exists()).toBe(true)
    await mondayInStartInput.setValue('07:30')

    // -------------------------------------------------------------
    // STEP 4: Ubah Jam Pulang Selasa
    // -------------------------------------------------------------
    const tuesdayOutEndInput = wrapper.find('input#time-3-checkOut-end')
    expect(tuesdayOutEndInput.exists()).toBe(true)
    await tuesdayOutEndInput.setValue('16:30')

    // -------------------------------------------------------------
    // STEP 5: Ubah Mulai Istirahat Jumat
    // -------------------------------------------------------------
    const fridayBreakEndInput = wrapper.find('input#time-6-breakStart-end')
    expect(fridayBreakEndInput.exists()).toBe(true)
    await fridayBreakEndInput.setValue('11:45')

    // -------------------------------------------------------------
    // STEP 6: Form becomes dirty and Save is enabled
    // -------------------------------------------------------------
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Perubahan Belum Disimpan')

    // -------------------------------------------------------------
    // STEP 7: Save all changes
    // -------------------------------------------------------------
    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Simpan Setting Jadwal'))!
    expect(saveBtn).toBeDefined()
    expect(saveBtn.attributes('disabled')).toBeUndefined()
    await saveBtn.trigger('click')
    await new Promise(r => setTimeout(r, 30))
    await wrapper.vm.$nextTick()

    // -------------------------------------------------------------
    // STEP 8: Verify success message and reset of dirty indicator
    // -------------------------------------------------------------
    expect(wrapper.text()).toContain('Setting jadwal mingguan berhasil disimpan')

    // -------------------------------------------------------------
    // STEP 9: Reload from repository and check saved values
    // -------------------------------------------------------------
    const reloaded = await scheduleSettingsService.getWeeklySchedule()
    const monday = reloaded.find(d => d.dayId === 2)!
    const tuesday = reloaded.find(d => d.dayId === 3)!
    const friday = reloaded.find(d => d.dayId === 6)!

    expect(monday.checkIn.start).toBe('07:30')
    expect(tuesday.checkOut.end).toBe('16:30')
    expect(friday.breakStart.end).toBe('11:45')

    // -------------------------------------------------------------
    // STEP 10: Input invalid time (start > end)
    // -------------------------------------------------------------
    await mondayInStartInput.setValue('11:00') // CheckIn start 11:00 > checkIn end 10:00
    await wrapper.vm.$nextTick()

    // -------------------------------------------------------------
    // STEP 11: Assert save is blocked / button disabled due to validation error
    // -------------------------------------------------------------
    expect(wrapper.text()).toContain('tidak boleh melebihi waktu selesai')
    const disabledSaveBtn = wrapper
      .findAll('button')
      .find(b => b.text().includes('Simpan Setting Jadwal'))!
    expect(disabledSaveBtn.attributes('disabled')).toBeDefined()

    // Fix back to valid value with a minor change
    await mondayInStartInput.setValue('07:45')
    await wrapper.vm.$nextTick()

    // -------------------------------------------------------------
    // STEP 12: Simulate save failure
    // -------------------------------------------------------------
    scheduleSettingsService.simulateFailureOnce = true

    // -------------------------------------------------------------
    // STEP 13: Trigger save, error shown, user draft retained
    // -------------------------------------------------------------
    const activeSaveBtn = wrapper
      .findAll('button')
      .find(b => b.text().includes('Simpan Setting Jadwal'))!
    await activeSaveBtn.trigger('click')
    await new Promise(r => setTimeout(r, 30))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Simulasi kegagalan server')
    // Monday input still keeps the user draft '07:45'
    expect((mondayInStartInput.element as HTMLInputElement).value).toBe('07:45')

    // -------------------------------------------------------------
    // STEP 14: Batalkan perubahan (Cancel Changes)
    // -------------------------------------------------------------
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Batalkan Perubahan'))!
    await cancelBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // -------------------------------------------------------------
    // STEP 15: Values revert back to last saved snapshot
    // -------------------------------------------------------------
    expect((mondayInStartInput.element as HTMLInputElement).value).toBe('07:30')

    // -------------------------------------------------------------
    // STEP 16: Read-only access test (viewer/auditor)
    // -------------------------------------------------------------
    const authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS.find(u => u.username === 'auditor') || null

    const readOnlyWrapper = mount(ScheduleSettingsPage, {
      global: {
        stubs: {
          AppPageHeader: {
            template: `<div><h1>Master Data Jadwal</h1><slot name="actions" /></div>`
          }
        }
      }
    })
    await new Promise(r => setTimeout(r, 20))
    await readOnlyWrapper.vm.$nextTick()

    expect(readOnlyWrapper.text()).toContain('Mode Hanya Baca')
    const readOnlyInputs = readOnlyWrapper.findAll('input[type="time"]')
    expect(readOnlyInputs[0].attributes('disabled')).toBeDefined()

    // -------------------------------------------------------------
    // STEP 17: Presensi integration contract validation
    // -------------------------------------------------------------
    // Wednesday (day_id 4)
    const wednesdaySchedule = await scheduleSettingsService.getScheduleByDayId(4)
    expect(wednesdaySchedule).toBeDefined()
    expect(wednesdaySchedule?.dayName).toBe('Rabu')
    expect(scheduleSettingsService.isWithinCheckInRange('08:45', 4)).toBe(true)

    // -------------------------------------------------------------
    // STEP 18: Ensure Employee & Group modules remain unharmed
    // -------------------------------------------------------------
    const employees = await employeeService.list({})
    expect(employees.data.length).toBeGreaterThan(0)
    const groups = await employeeGroupService.list()
    expect(groups.data.length).toBeGreaterThan(0)
  })
})
