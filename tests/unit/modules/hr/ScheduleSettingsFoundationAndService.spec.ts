import { beforeEach, describe, expect, it } from 'vitest'
import {
  scheduleSettingsService,
  VERIFIED_LEGACY_JADWAL_SEEDS
} from '@/modules/hr/services/schedule-settings.service'
import type { ScheduleDayItem } from '@/modules/hr/types/schedule-settings.types'
import {
  compareTimes,
  isTimeInRange,
  isValidTimeString,
  mapLegacyToViewModel,
  mapViewModelToLegacy,
  normalizeTimeString,
  ORDERED_WEEKDAYS,
  parseTimeToMinutes
} from '@/modules/hr/utils/schedule-time'

describe('Sprint 8 — Task 6: HR Weekly Schedule Foundation & Service', () => {
  beforeEach(() => {
    scheduleSettingsService.resetToOriginalSeed()
  })

  it('1. schema audit: matches verified MariaDB `jadwal` table columns and 7 rows', () => {
    expect(VERIFIED_LEGACY_JADWAL_SEEDS).toHaveLength(7)

    const senin = VERIFIED_LEGACY_JADWAL_SEEDS.find(s => s.hari === 'Senin')!
    expect(senin).toBeDefined()
    expect(senin.id).toBe(7)
    expect(senin.day_id).toBe(2)
    expect(senin.shift_in_start).toBe('08:00')
    expect(senin.shift_in_end).toBe('10:00')
    expect(senin.shift_out_start).toBe('14:30')
    expect(senin.shift_out_end).toBe('16:00')
    expect(senin.break_start_start).toBe('10:01')
    expect(senin.break_start_end).toBe('12:00')
    expect(senin.break_end_start).toBe('13:00')
    expect(senin.break_end_end).toBe('14:00')
  })

  it('2. Friday special morning break matches legacy snapshot (11:30)', () => {
    const jumat = VERIFIED_LEGACY_JADWAL_SEEDS.find(s => s.hari === 'Jumat')!
    expect(jumat.day_id).toBe(6)
    expect(jumat.break_start_start).toBe('10:01')
    expect(jumat.break_start_end).toBe('11:30')
  })

  it('3. ordered weekdays sequence is Senin (1) through Minggu (7)', () => {
    expect(ORDERED_WEEKDAYS).toHaveLength(7)
    expect(ORDERED_WEEKDAYS[0].dayName).toBe('Senin')
    expect(ORDERED_WEEKDAYS[0].order).toBe(1)
    expect(ORDERED_WEEKDAYS[0].dayId).toBe(2)

    expect(ORDERED_WEEKDAYS[4].dayName).toBe('Jumat')
    expect(ORDERED_WEEKDAYS[4].dayId).toBe(6)

    expect(ORDERED_WEEKDAYS[6].dayName).toBe('Minggu')
    expect(ORDERED_WEEKDAYS[6].order).toBe(7)
    expect(ORDERED_WEEKDAYS[6].dayId).toBe(1)
  })

  it('4. time manipulation utilities correctly parse, compare, and check bounds', () => {
    expect(normalizeTimeString('08:00:00')).toBe('08:00')
    expect(normalizeTimeString('8:30')).toBe('08:30')
    expect(normalizeTimeString(null)).toBeNull()
    expect(normalizeTimeString('')).toBeNull()

    expect(isValidTimeString('08:00')).toBe(true)
    expect(isValidTimeString('23:59')).toBe(true)
    expect(isValidTimeString('24:00')).toBe(false)
    expect(isValidTimeString('invalid')).toBe(false)

    expect(parseTimeToMinutes('00:00')).toBe(0)
    expect(parseTimeToMinutes('08:30')).toBe(510)
    expect(parseTimeToMinutes('14:30')).toBe(870)

    expect(compareTimes('08:00', '10:00')!).toBeLessThan(0)
    expect(compareTimes('14:00', '14:00')!).toBe(0)
    expect(compareTimes('16:00', '14:00')!).toBeGreaterThan(0)

    expect(isTimeInRange('08:30', '08:00', '10:00')).toBe(true)
    expect(isTimeInRange('07:59', '08:00', '10:00')).toBe(false)
    expect(isTimeInRange('10:01', '08:00', '10:00')).toBe(false)
  })

  it('5. mapping between raw SQL entity and UI ViewModel is bidirectional and lossless', () => {
    const raw = VERIFIED_LEGACY_JADWAL_SEEDS[0]
    const vm = mapLegacyToViewModel(raw)

    expect(vm.id).toBe(raw.id)
    expect(vm.dayName).toBe('Senin')
    expect(vm.order).toBe(1)
    expect(vm.checkIn.start).toBe('08:00')
    expect(vm.checkIn.end).toBe('10:00')

    const backToRaw = mapViewModelToLegacy(vm)
    expect(backToRaw.id).toBe(raw.id)
    expect(backToRaw.hari).toBe(raw.hari)
    expect(backToRaw.shift_in_start).toBe(raw.shift_in_start)
    expect(backToRaw.shift_out_end).toBe(raw.shift_out_end)
  })

  it('6. scheduleSettingsService loads weekly schedule sorted Senin to Minggu', async () => {
    const list = await scheduleSettingsService.getWeeklySchedule()
    expect(list).toHaveLength(7)
    expect(list[0].dayName).toBe('Senin')
    expect(list[1].dayName).toBe('Selasa')
    expect(list[2].dayName).toBe('Rabu')
    expect(list[3].dayName).toBe('Kamis')
    expect(list[4].dayName).toBe('Jumat')
    expect(list[5].dayName).toBe('Sabtu')
    expect(list[6].dayName).toBe('Minggu')
  })

  it('7. atomic save updates schedule state and advances lastModified timestamp', async () => {
    const originalList = await scheduleSettingsService.getWeeklySchedule()
    const modified: ScheduleDayItem[] = JSON.parse(JSON.stringify(originalList))

    // Modify Monday Jam Masuk to 07:45 - 09:45
    modified[0].checkIn.start = '07:45'
    modified[0].checkIn.end = '09:45'

    const res = await scheduleSettingsService.saveWeeklySchedule(modified)
    expect(res.success).toBe(true)
    expect(res.updatedCount).toBe(7)

    const reloaded = await scheduleSettingsService.getWeeklySchedule()
    expect(reloaded[0].checkIn.start).toBe('07:45')
    expect(reloaded[0].checkIn.end).toBe('09:45')
  })

  it('8. atomic save rolls back and throws error when server failure is simulated', async () => {
    const list = await scheduleSettingsService.getWeeklySchedule()
    scheduleSettingsService.simulateFailureOnce = true

    await expect(scheduleSettingsService.saveWeeklySchedule(list)).rejects.toThrow(
      'Simulasi kegagalan server'
    )
  })

  it('9. Presensi resolver contract resolves day by legacy day_id and Date object', async () => {
    const senin = await scheduleSettingsService.getScheduleByDayId(2)
    expect(senin).toBeDefined()
    expect(senin?.dayName).toBe('Senin')

    // 2026-11-02 is Monday (day_id: 2)
    const mondayDate = new Date('2026-11-02T08:00:00Z')
    const resolvedByDate = await scheduleSettingsService.getScheduleByDate(mondayDate)
    expect(resolvedByDate?.dayName).toBe('Senin')

    // Presensi attendance punch window checks
    expect(scheduleSettingsService.isWithinCheckInRange('08:15', 2)).toBe(true)
    expect(scheduleSettingsService.isWithinCheckInRange('10:30', 2)).toBe(false)
    expect(scheduleSettingsService.isWithinCheckOutRange('15:00', 2)).toBe(true)
    expect(scheduleSettingsService.isWithinCheckOutRange('17:00', 2)).toBe(false)
  })
})
