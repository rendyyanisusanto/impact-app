import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import ScheduleTimeInput from '@/modules/hr/components/ScheduleTimeInput.vue'
import WeeklyScheduleRow from '@/modules/hr/components/WeeklyScheduleRow.vue'
import WeeklyScheduleTable from '@/modules/hr/components/WeeklyScheduleTable.vue'
import ScheduleSettingsPage from '@/modules/hr/pages/ScheduleSettingsPage.vue'
import { scheduleSettingsService } from '@/modules/hr/services/schedule-settings.service'
import type { ScheduleDayItem } from '@/modules/hr/types/schedule-settings.types'
import {
  validateDaySchedule,
  validateRange,
  validateWeeklySchedule
} from '@/modules/hr/utils/schedule-validation'
import { MOCK_USERS } from '@/mocks/users.mock'
import { useAuthStore } from '@/stores/auth.store'

describe('Sprint 8 — Task 7: Schedule UI Components & Validation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    scheduleSettingsService.resetToOriginalSeed()
    const authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0]
  })

  it('1. validateRange rejects incomplete single ranges and invalid formats', () => {
    // Both empty: valid
    expect(validateRange({ start: null, end: null }, 'Jam Masuk').isValid).toBe(true)

    // Incomplete
    const incStart = validateRange({ start: '08:00', end: null }, 'Jam Masuk')
    expect(incStart.isValid).toBe(false)
    expect(incStart.error).toContain('belum lengkap')

    const incEnd = validateRange({ start: null, end: '10:00' }, 'Jam Masuk')
    expect(incEnd.isValid).toBe(false)
    expect(incEnd.error).toContain('belum lengkap')

    // Invalid time
    const invalidFormat = validateRange({ start: '88:00', end: '10:00' }, 'Jam Masuk')
    expect(invalidFormat.isValid).toBe(false)

    // Start > End
    const reversed = validateRange({ start: '11:00', end: '09:00' }, 'Jam Masuk')
    expect(reversed.isValid).toBe(false)
    expect(reversed.error).toContain('tidak boleh melebihi')
  })

  it('2. validateDaySchedule detects cross-range chronological conflicts', () => {
    const validDay: ScheduleDayItem = {
      id: 7,
      dayId: 2,
      dayName: 'Senin',
      order: 1,
      checkIn: { start: '08:00', end: '10:00' },
      checkOut: { start: '14:30', end: '16:00' },
      breakStart: { start: '10:01', end: '12:00' },
      breakEnd: { start: '13:00', end: '14:00' }
    }

    expect(validateDaySchedule(validDay)).toBeNull()

    // Conflict: Jam Pulang starts before Jam Masuk finishes
    const conflict1: ScheduleDayItem = JSON.parse(JSON.stringify(validDay))
    conflict1.breakStart = { start: null, end: null }
    conflict1.breakEnd = { start: null, end: null }
    conflict1.checkIn = { start: '17:00', end: '18:00' }
    conflict1.checkOut = { start: '08:00', end: '09:00' }
    const err1 = validateDaySchedule(conflict1)
    expect(err1).not.toBeNull()
    expect(err1?.crossRange).toContain('harus sebelum Jam Pulang')

    // Conflict: Break Start before Jam Masuk
    const conflict2: ScheduleDayItem = JSON.parse(JSON.stringify(validDay))
    conflict2.breakStart.start = '07:30'
    const err2 = validateDaySchedule(conflict2)
    expect(err2?.crossRange).toContain('tidak boleh sebelum Jam Masuk')

    // Conflict: Break End start before Break Start end
    const conflict3: ScheduleDayItem = JSON.parse(JSON.stringify(validDay))
    conflict3.breakEnd.start = '11:00' // While breakStart.end is 12:00
    const err3 = validateDaySchedule(conflict3)
    expect(err3?.crossRange).toContain('harus setelah Mulai Istirahat')
  })

  it('3. validateWeeklySchedule summarizes errors across 7 days', () => {
    const original = scheduleSettingsService.getWeeklyScheduleSync()
    const modified: ScheduleDayItem[] = JSON.parse(JSON.stringify(original))

    // Corrupt Monday and Friday
    modified[0].checkIn.start = '12:00'
    modified[0].checkIn.end = '09:00' // reversed
    modified[4].breakStart.start = '15:00' // after checkout

    const res = validateWeeklySchedule(modified)
    expect(res.isValid).toBe(false)
    expect(res.totalErrors).toBeGreaterThanOrEqual(1)
    expect(res.errors[2]).toBeDefined() // Monday
  })

  it('4. ScheduleTimeInput renders native time input with clock icon and emits updates', async () => {
    const wrapper = mount(ScheduleTimeInput, {
      props: {
        modelValue: '08:00',
        ariaLabel: 'Senin Jam Masuk'
      }
    })

    const input = wrapper.find('input[type="time"]')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('08:00')

    await input.setValue('08:30')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['08:30'])
  })

  it('5. WeeklyScheduleRow renders all 4 range groups (8 time inputs)', () => {
    const day = scheduleSettingsService.getWeeklyScheduleSync()[0]
    const wrapper = mount(WeeklyScheduleRow, {
      props: {
        item: day
      }
    })

    expect(wrapper.text()).toContain('Senin')
    const timeInputs = wrapper.findAll('input[type="time"]')
    expect(timeInputs).toHaveLength(8)
  })

  it('6. WeeklyScheduleTable renders 7 rows on desktop table (total 56 time inputs)', () => {
    const days = scheduleSettingsService.getWeeklyScheduleSync()
    const wrapper = mount(WeeklyScheduleTable, {
      props: {
        items: days
      }
    })

    const rows = wrapper.findAllComponents(WeeklyScheduleRow)
    expect(rows).toHaveLength(7)

    // Total 7 days * 8 inputs = 56 inputs
    const desktopTable = wrapper.find('table')
    const desktopInputs = desktopTable.findAll('input[type="time"]')
    expect(desktopInputs).toHaveLength(56)
  })

  it('7. ScheduleSettingsPage renders header, section title, and enables Save upon edit', async () => {
    const wrapper = mount(ScheduleSettingsPage, {
      global: {
        stubs: {
          AppPageHeader: {
            template: `<div><slot name="icon" /><h1>Master Data Jadwal</h1><slot name="actions" /></div>`
          }
        }
      }
    })

    await new Promise(r => setTimeout(r, 20))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Master Data Jadwal')
    expect(wrapper.text()).toContain('Setting Jadwal')

    // Find first time input and change it
    const firstInput = wrapper.find('input[type="time"]')
    await firstInput.setValue('07:30')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Perubahan Belum Disimpan')
  })
})
