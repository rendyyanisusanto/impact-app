import { describe, it, expect } from 'vitest'
import {
  calculateAttendanceStatuses,
  normalizeTimeString
} from '@/modules/hr/utils/attendance-status'
import {
  formatDisplayDate,
  getDaysInMonth,
  generateDatesForMonth,
  generateDateRange,
  getLegacyDayId,
  MONTH_NAMES_INDONESIAN
} from '@/modules/hr/utils/attendance-date'
import { ATTENDANCE_STATUS_MAP } from '@/modules/hr/types/attendance.types'
import type { LegacyJadwalEntity } from '@/modules/hr/types/schedule-settings.types'

describe('Sprint 8 — Task 11: Presensi Status Rules & Date Utilities', () => {
  const dummySchedule: LegacyJadwalEntity = {
    id: 1,
    hari: 'Senin',
    day_id: 2,
    shift_in_start: '08:00:00',
    shift_in_end: '10:00:00',
    shift_out_start: '14:30:00',
    shift_out_end: '16:00:00',
    break_start_start: '10:01:00',
    break_start_end: '12:00:00',
    break_end_start: '13:00:00',
    break_end_end: '14:00:00'
  }

  describe('11.2 Status Code Calculations', () => {
    it('1. returns ABSENT when all clock logs are empty', () => {
      const statuses = calculateAttendanceStatuses(
        { actualIn: null, actualOut: null, breakStart: null, breakEnd: null },
        dummySchedule
      )
      expect(statuses).toEqual(['ABSENT'])
    })

    it('2. returns EI (Early In) when clock in is before or on shift_in_start', () => {
      const statuses = calculateAttendanceStatuses(
        { actualIn: '07:49:08', actualOut: '16:05:00', breakStart: '12:05:00', breakEnd: '12:50:00' },
        dummySchedule
      )
      expect(statuses).toContain('EI')
      expect(statuses).not.toContain('LI')
      expect(statuses).toContain('LO')
    })

    it('3. returns LI (Late In) when clock in is after shift_in_start', () => {
      const statuses = calculateAttendanceStatuses(
        { actualIn: '08:01:42', actualOut: '16:01:09', breakStart: '12:00:00', breakEnd: '12:55:00' },
        dummySchedule
      )
      expect(statuses).toContain('LI')
      expect(statuses).not.toContain('EI')
    })

    it('4. returns NSI (No Sign In) when in is missing but other logs exist', () => {
      const statuses = calculateAttendanceStatuses(
        { actualIn: null, actualOut: '16:05:00', breakStart: '12:00:00', breakEnd: '12:50:00' },
        dummySchedule
      )
      expect(statuses).toContain('NSI')
      expect(statuses).not.toContain('ABSENT')
    })

    it('5. returns EO (Early Out) when clock out is before shift_out_end', () => {
      const statuses = calculateAttendanceStatuses(
        { actualIn: '07:55:00', actualOut: '15:45:00', breakStart: '12:00:00', breakEnd: '12:50:00' },
        dummySchedule
      )
      expect(statuses).toContain('EO')
      expect(statuses).not.toContain('LO')
    })

    it('6. returns LO (Late Out) when clock out is on or after shift_out_end', () => {
      const statuses = calculateAttendanceStatuses(
        { actualIn: '07:55:00', actualOut: '16:02:00', breakStart: '12:00:00', breakEnd: '12:50:00' },
        dummySchedule
      )
      expect(statuses).toContain('LO')
      expect(statuses).not.toContain('EO')
    })

    it('7. returns NSO (No Sign Out) when out is missing but in is present', () => {
      const statuses = calculateAttendanceStatuses(
        { actualIn: '07:52:08', actualOut: null, breakStart: '12:00:39', breakEnd: '12:43:38' },
        dummySchedule
      )
      expect(statuses).toContain('EI')
      expect(statuses).toContain('NSO')
    })

    it('8. returns EBO (Early Break Out) when break start is before break_start_end', () => {
      const statuses = calculateAttendanceStatuses(
        { actualIn: '07:57:04', actualOut: '17:50:55', breakStart: '11:30:23', breakEnd: '12:55:07' },
        dummySchedule
      )
      expect(statuses).toContain('EBO')
      expect(statuses).toContain('EI')
      expect(statuses).toContain('LO')
    })

    it('9. returns LBI (Late Break In) when break end is after break_end_start', () => {
      const statuses = calculateAttendanceStatuses(
        { actualIn: '08:01:42', actualOut: '16:01:09', breakStart: '11:31:49', breakEnd: '13:01:28' },
        dummySchedule
      )
      expect(statuses).toContain('LI')
      expect(statuses).toContain('LO')
      expect(statuses).toContain('EBO')
      expect(statuses).toContain('LBI')
    })

    it('10. returns NBO and NBI when breaks are missing but day attendance is present', () => {
      const statuses = calculateAttendanceStatuses(
        { actualIn: '07:57:10', actualOut: '17:57:41', breakStart: null, breakEnd: null },
        dummySchedule
      )
      expect(statuses).toEqual(['EI', 'LO', 'NBO', 'NBI'])
    })

    it('11. verifies metadata mapping for all status codes', () => {
      expect(ATTENDANCE_STATUS_MAP.EI.variant).toBe('primary')
      expect(ATTENDANCE_STATUS_MAP.LO.variant).toBe('primary')
      expect(ATTENDANCE_STATUS_MAP.LI.variant).toBe('danger')
      expect(ATTENDANCE_STATUS_MAP.ABSENT.variant).toBe('danger')
      expect(ATTENDANCE_STATUS_MAP.NSO.variant).toBe('danger')
      expect(ATTENDANCE_STATUS_MAP.NSI.variant).toBe('danger')
    })
  })

  describe('11.4 Date and Time Calculations', () => {
    it('12. normalizes time string with or without seconds', () => {
      expect(normalizeTimeString('8:00')).toBe('08:00:00')
      expect(normalizeTimeString('08:05:22')).toBe('08:05:22')
      expect(normalizeTimeString('-')).toBe('')
      expect(normalizeTimeString(null)).toBe('')
    })

    it('13. formats date for Indonesian display dd-MM-yyyy without timezone shift', () => {
      expect(formatDisplayDate('2026-11-01')).toBe('01-11-2026')
      expect(formatDisplayDate('2026-10-30')).toBe('30-10-2026')
    })

    it('14. calculates correct days in month including leap years', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29) // Leap year
      expect(getDaysInMonth(2026, 2)).toBe(28) // Non-leap year
      expect(getDaysInMonth(2026, 4)).toBe(30) // April
      expect(getDaysInMonth(2026, 11)).toBe(30) // November
      expect(getDaysInMonth(2026, 10)).toBe(31) // October
    })

    it('15. generates exact list of dates for a given month', () => {
      const novDates = generateDatesForMonth(2026, 11)
      expect(novDates).toHaveLength(30)
      expect(novDates[0]).toBe('2026-11-01')
      expect(novDates[29]).toBe('2026-11-30')
    })

    it('16. generates inclusive date range', () => {
      const range = generateDateRange('2026-10-30', '2026-11-01')
      expect(range).toEqual(['2026-10-30', '2026-10-31', '2026-11-01'])
    })

    it('17. maps dates to legacy day_id accurately', () => {
      // 2026-11-01 is a Sunday -> day_id 1
      expect(getLegacyDayId('2026-11-01')).toBe(1)
      // 2026-11-02 is a Monday -> day_id 2
      expect(getLegacyDayId('2026-11-02')).toBe(2)
      // 2026-11-07 is a Saturday -> day_id 7
      expect(getLegacyDayId('2026-11-07')).toBe(7)
    })

    it('18. verifies Indonesian month names list', () => {
      expect(MONTH_NAMES_INDONESIAN).toHaveLength(12)
      expect(MONTH_NAMES_INDONESIAN[0]).toBe('Januari')
      expect(MONTH_NAMES_INDONESIAN[10]).toBe('November')
    })
  })
})
