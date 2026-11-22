import { beforeEach, describe, expect, it } from 'vitest'
import {
  formatDateIndonesian,
  formatDateShort,
  generateCalendarGrid,
  getCurrentYearMonth,
  getDayNameIndonesian,
  getTodayDateString,
  shiftMonth
} from '@/modules/hr/utils/holiday-date'
import { validateHolidayForm } from '@/modules/hr/utils/holiday-validation'
import { holidaySettingsService } from '@/modules/hr/services/holiday-settings.service'
import { employeeService } from '@/modules/hr/services/employee.service'

describe('Sprint 8 — Task 9–10: Holiday Foundation, Date Math, Validation & Service CRUD', () => {
  beforeEach(() => {
    holidaySettingsService.resetToOriginalSeed()
    employeeService.reset()
  })

  describe('1. Date Utilities & Calendar Projection (holiday-date.ts)', () => {
    it('generates valid current year-month and today date format', () => {
      const ym = getCurrentYearMonth()
      expect(ym).toMatch(/^\d{4}-\d{2}$/)

      const today = getTodayDateString()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('correctly maps Indonesian day names without timezone drift', () => {
      // 2024-08-17 is Saturday (Sabtu)
      expect(getDayNameIndonesian('2024-08-17')).toBe('Sabtu')
      // 2024-08-18 is Sunday (Minggu)
      expect(getDayNameIndonesian('2024-08-18')).toBe('Minggu')
      // 2024-08-19 is Monday (Senin)
      expect(getDayNameIndonesian('2024-08-19')).toBe('Senin')
      // Invalid input fallback
      expect(getDayNameIndonesian('')).toBe('')
    })

    it('formats dates in Indonesian long and short formats', () => {
      expect(formatDateIndonesian('2024-08-17')).toBe('17 Agustus 2024')
      expect(formatDateIndonesian('2024-12-25')).toBe('25 Desember 2024')
      expect(formatDateShort('2024-08-17')).toBe('17/08/2024')
    })

    it('shifts months correctly across year boundaries', () => {
      expect(shiftMonth('2024-08', 1)).toBe('2024-09')
      expect(shiftMonth('2024-08', -1)).toBe('2024-07')
      expect(shiftMonth('2024-12', 1)).toBe('2025-01')
      expect(shiftMonth('2025-01', -1)).toBe('2024-12')
    })

    it('generates Monday-to-Sunday 7-column calendar grid with correct leading and trailing days', () => {
      const holidays = holidaySettingsService.getHolidaysSync()
      const grid = generateCalendarGrid('2024-08', holidays)

      // Grid length must be a multiple of 7 and at least 35 days
      expect(grid.length % 7).toBe(0)
      expect(grid.length).toBeGreaterThanOrEqual(35)

      // August 2024 starts on Thursday, so Monday-Wednesday are from July
      const firstCell = grid[0]
      expect(firstCell.isCurrentMonth).toBe(false)
      expect(firstCell.date.startsWith('2024-07')).toBe(true)

      // Finds August 17th
      const cell17 = grid.find(c => c.date === '2024-08-17')
      expect(cell17).toBeDefined()
      expect(cell17?.isCurrentMonth).toBe(true)
      expect(cell17?.holidays.length).toBe(1)
      expect(cell17?.holidays[0].keterangan).toBe('HARI KEMERDEKAAN RI')

      // Sunday column check: every 7th cell (index 6, 13, 20, ...) is Sunday
      for (let i = 6; i < grid.length; i += 7) {
        expect(grid[i].isSunday).toBe(true)
      }
    })
  })

  describe('2. Holiday Form Validation (holiday-validation.ts)', () => {
    it('validates required date, format, and description', () => {
      const res1 = validateHolidayForm({ tanggal: '', keterangan: '' })
      expect(res1.isValid).toBe(false)
      expect(res1.errors.tanggal).toBe('Tanggal hari libur wajib diisi')
      expect(res1.errors.keterangan).toBe('Keterangan hari libur wajib diisi')

      const res2 = validateHolidayForm({ tanggal: 'invalid-date', keterangan: 'A' })
      expect(res2.isValid).toBe(false)
      expect(res2.errors.tanggal).toBe('Format tanggal tidak valid (YYYY-MM-DD)')
      expect(res2.errors.keterangan).toBe('Keterangan hari libur minimal 2 karakter')
    })

    it('rejects duplicate holiday on identical date and description', () => {
      const existing = holidaySettingsService.getHolidaysSync()
      const res = validateHolidayForm(
        { tanggal: '2024-08-17', keterangan: 'hari kemerdekaan ri' },
        existing
      )
      expect(res.isValid).toBe(false)
      expect(res.errors.tanggal).toContain('sudah terdaftar')
    })

    it('allows edit of existing holiday without false duplicate trigger on self', () => {
      const existing = holidaySettingsService.getHolidaysSync()
      const aug17 = existing.find(h => h.tanggal === '2024-08-17')
      const res = validateHolidayForm(
        { tanggal: '2024-08-17', keterangan: 'HARI KEMERDEKAAN RI' },
        existing,
        aug17?.id
      )
      expect(res.isValid).toBe(true)
    })
  })

  describe('3. Holiday Service & In-Memory Persistence (holiday-settings.service.ts)', () => {
    it('loads verified legacy SQL seeds for August 2024 with pivot exceptions', async () => {
      const augHolidays = await holidaySettingsService.getHolidaysByMonth('2024-08')
      expect(augHolidays.length).toBe(5)

      // Verified August 17th has 3 legacy exceptions: IDs 53, 54, 63
      const independence = augHolidays.find(h => h.tanggal === '2024-08-17')
      expect(independence).toBeDefined()
      expect(independence?.exceptionEmployeeIds).toEqual([53, 54, 63])
      expect(independence?.exceptionEmployees?.length).toBe(3)
    })

    it('filters holidays by search query matching description, date, or exempted employee', async () => {
      const searchDesc = await holidaySettingsService.getHolidaysByMonth('2024-08', 'kemerdekaan')
      expect(searchDesc.length).toBe(1)
      expect(searchDesc[0].tanggal).toBe('2024-08-17')

      const searchDate = await holidaySettingsService.getHolidaysByMonth('2024-08', '2024-08-25')
      expect(searchDate.length).toBe(1)
      expect(searchDate[0].keterangan).toBe('MINGGU')

      // Search by employee name in exceptions
      const searchEmp = await holidaySettingsService.getHolidaysByMonth('2024-08', 'iwan')
      expect(searchEmp.length).toBeGreaterThanOrEqual(1)
    })

    it('creates a new holiday and links employee exceptions in pivot storage', async () => {
      const created = await holidaySettingsService.createHoliday({
        tanggal: '2024-08-20',
        keterangan: 'HARI LIBUR TEST SPRINT 8',
        exceptionEmployeeIds: [53, 55]
      })

      expect(created.id).toBeGreaterThanOrEqual(200)
      expect(created.tanggal).toBe('2024-08-20')
      expect(created.hari).toBe('Selasa')
      expect(created.exceptionEmployeeIds).toEqual([53, 55])

      // Re-fetch to ensure persistence
      const fetched = await holidaySettingsService.getHolidayById(created.id)
      expect(fetched).toBeDefined()
      expect(fetched?.keterangan).toBe('HARI LIBUR TEST SPRINT 8')
      expect(fetched?.exceptionEmployeeIds).toEqual([53, 55])
    })

    it('updates a holiday and synchronizes pivot exceptions', async () => {
      const updated = await holidaySettingsService.updateHoliday(6, {
        keterangan: 'HARI KEMERDEKAAN RI KE-79 REVISI',
        exceptionEmployeeIds: [53, 55, 56]
      })

      expect(updated.keterangan).toBe('HARI KEMERDEKAAN RI KE-79 REVISI')
      expect(updated.exceptionEmployeeIds).toEqual([53, 55, 56])

      const refetched = await holidaySettingsService.getHolidayById(6)
      expect(refetched?.exceptionEmployeeIds).toEqual([53, 55, 56])
    })

    it('deletes a holiday and cascades pivot exceptions without deleting employees', async () => {
      const beforeEmps = employeeService.getAllEmployeesSync().length
      const success = await holidaySettingsService.deleteHoliday(2) // 2024-08-04 MINGGU
      expect(success).toBe(true)

      const notFound = await holidaySettingsService.getHolidayById(2)
      expect(notFound).toBeUndefined()

      // Employees must remain completely untouched
      const afterEmps = employeeService.getAllEmployeesSync().length
      expect(afterEmps).toBe(beforeEmps)
    })

    it('fulfills the downstream IPresensiHolidayResolver contract', async () => {
      // 2024-08-17 is a holiday
      const isAug17Holiday = await holidaySettingsService.isHoliday('2024-08-17')
      expect(isAug17Holiday).toBe(true)

      // 2024-08-19 is a regular Monday (not a holiday)
      const isAug19Holiday = await holidaySettingsService.isHoliday('2024-08-19')
      expect(isAug19Holiday).toBe(false)

      // Employee 53 is exempted on 2024-08-17 (remains scheduled to work)
      const is53Exempted = await holidaySettingsService.isEmployeeExempted(53, '2024-08-17')
      expect(is53Exempted).toBe(true)

      // Employee 999 is NOT exempted on 2024-08-17
      const is999Exempted = await holidaySettingsService.isEmployeeExempted(999, '2024-08-17')
      expect(is999Exempted).toBe(false)
    })
  })
})
