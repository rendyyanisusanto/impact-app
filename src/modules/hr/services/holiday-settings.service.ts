/**
 * Service for HR Holiday Settings & Employee Exceptions (Setting Hari Libur & Pengecualian Karyawan).
 * Implements in-memory persistence and the IPresensiHolidayResolver contract.
 */

import type {
  CreateHolidayDto,
  HolidayExceptionEmployee,
  HolidayItem,
  IPresensiHolidayResolver,
  LegacyHariLiburEntity,
  LegacyPengecualianHariLiburEntity,
  UpdateHolidayDto
} from '../types/holiday-settings.types'
import { getDayNameIndonesian } from '../utils/holiday-date'
import { validateHolidayForm } from '../utils/holiday-validation'
import { employeeService } from './employee.service'

/**
 * Verified seeds from legacy MariaDB `hari_libur` in `u1573701_smm(2).sql`.
 * Includes 2024 seeds from SQL dump plus standard 2026 calendar holidays for current app period.
 */
export const VERIFIED_LEGACY_HOLIDAYS_SEEDS: LegacyHariLiburEntity[] = [
  // August 2024 (from SQL dump)
  { id: 2, tanggal: '2024-08-04', keterangan: 'MINGGU', uuid: null },
  { id: 3, tanggal: '2024-08-11', keterangan: 'MINGGU', uuid: null },
  { id: 4, tanggal: '2024-08-18', keterangan: 'MINGGU', uuid: null },
  { id: 5, tanggal: '2024-08-25', keterangan: 'MINGGU', uuid: null },
  { id: 6, tanggal: '2024-08-17', keterangan: 'HARI KEMERDEKAAN RI', uuid: null },

  // December 2024 (from SQL dump)
  { id: 37, tanggal: '2024-12-29', keterangan: 'MINGGU', uuid: '25d4b0c4-23e4-4027-9c68-46b7b03c2139' },
  { id: 50, tanggal: '2024-12-25', keterangan: 'HARI RAYA NATAL', uuid: 'c7c446a6-4ab8-4860-bdd6-ae568dc64db3' },

  // July 2026 (current application test month)
  { id: 101, tanggal: '2026-07-05', keterangan: 'MINGGU', uuid: null },
  { id: 102, tanggal: '2026-07-12', keterangan: 'MINGGU', uuid: null },
  { id: 103, tanggal: '2026-07-19', keterangan: 'MINGGU', uuid: null },
  { id: 104, tanggal: '2026-07-26', keterangan: 'MINGGU', uuid: null },
  { id: 105, tanggal: '2026-07-17', keterangan: 'TAHUN BARU ISLAM 1448 H', uuid: null },

  // August 2026
  { id: 106, tanggal: '2026-08-02', keterangan: 'MINGGU', uuid: null },
  { id: 107, tanggal: '2026-08-09', keterangan: 'MINGGU', uuid: null },
  { id: 108, tanggal: '2026-08-16', keterangan: 'MINGGU', uuid: null },
  { id: 109, tanggal: '2026-08-17', keterangan: 'HARI KEMERDEKAAN RI KE-81', uuid: null },
  { id: 110, tanggal: '2026-08-23', keterangan: 'MINGGU', uuid: null },
  { id: 111, tanggal: '2026-08-30', keterangan: 'MINGGU', uuid: null }
]

/**
 * Verified seeds from legacy MariaDB `pengecualian_hari_libur` in `u1573701_smm(2).sql`.
 */
export const VERIFIED_LEGACY_EXCEPTIONS_SEEDS: LegacyPengecualianHariLiburEntity[] = [
  // Exceptions for August 17 2024 (id: 6)
  { id: 1, karyawan_id: 53, hari_libur_id: 6 },
  { id: 2, karyawan_id: 54, hari_libur_id: 6 },
  { id: 3, karyawan_id: 63, hari_libur_id: 6 },

  // Exceptions for December 29 2024 (id: 37)
  { id: 4, karyawan_id: 53, hari_libur_id: 37 },
  { id: 5, karyawan_id: 54, hari_libur_id: 37 },
  { id: 6, karyawan_id: 63, hari_libur_id: 37 },

  // Exceptions for July 17 2026 (id: 105)
  { id: 7, karyawan_id: 53, hari_libur_id: 105 },
  { id: 8, karyawan_id: 54, hari_libur_id: 105 }
]

export class HolidaySettingsService implements IPresensiHolidayResolver {
  private static instance: HolidaySettingsService
  private holidays: LegacyHariLiburEntity[] = []
  private exceptions: LegacyPengecualianHariLiburEntity[] = []
  private nextHolidayId = 200
  private nextExceptionId = 500
  public delayMs = 0

  private constructor() {
    this.resetToOriginalSeed()
  }

  public static getInstance(): HolidaySettingsService {
    if (!HolidaySettingsService.instance) {
      HolidaySettingsService.instance = new HolidaySettingsService()
    }
    return HolidaySettingsService.instance
  }

  public resetToOriginalSeed(): void {
    this.holidays = JSON.parse(JSON.stringify(VERIFIED_LEGACY_HOLIDAYS_SEEDS))
    this.exceptions = JSON.parse(JSON.stringify(VERIFIED_LEGACY_EXCEPTIONS_SEEDS))
    this.nextHolidayId = 200
    this.nextExceptionId = 500
  }

  private async sleep(): Promise<void> {
    if (this.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.delayMs))
    }
  }

  /**
   * Resolves enriched employee details for an array of employee IDs.
   */
  private enrichExceptions(employeeIds: number[]): HolidayExceptionEmployee[] {
    const allEmployees = employeeService.getAllEmployeesSync()
    const enriched: HolidayExceptionEmployee[] = []

    for (const empId of employeeIds) {
      const emp = allEmployees.find((e) => e.id === empId)
      if (emp) {
        enriched.push({
          id: emp.id,
          kode: emp.kode || String(emp.id),
          nama: emp.nama,
          jabatan: emp.jabatan_nama || '-',
          statusKaryawan: emp.status_karyawan_nama || '-',
          grupId: emp.grup_karyawan_id,
          grupNama: emp.grup_karyawan_nama || null,
          grupColor: emp.grup_karyawan_color || null
        })
      } else {
        // Unknown legacy reference fallback
        enriched.push({
          id: empId,
          kode: String(empId),
          nama: `Karyawan #${empId} (Legacy)`,
          jabatan: '-',
          statusKaryawan: '-',
          grupId: null,
          grupNama: null,
          grupColor: null
        })
      }
    }

    return enriched
  }

  /**
   * Retrieves holidays filtered by month ('YYYY-MM') and optional search term.
   */
  public async getHolidaysByMonth(
    yearMonth: string,
    search?: string
  ): Promise<HolidayItem[]> {
    await this.sleep()

    // 1. Filter by year-month prefix
    const matched = this.holidays.filter((h) => h.tanggal.startsWith(yearMonth))

    // 2. Map and enrich with exception records
    let items: HolidayItem[] = matched.map((h) => {
      const linkedExceptions = this.exceptions
        .filter((e) => e.hari_libur_id === h.id)
        .map((e) => e.karyawan_id)

      return {
        id: h.id,
        tanggal: h.tanggal,
        keterangan: h.keterangan,
        hari: getDayNameIndonesian(h.tanggal),
        uuid: h.uuid,
        exceptionEmployeeIds: linkedExceptions,
        exceptionEmployees: this.enrichExceptions(linkedExceptions)
      }
    })

    // 3. Search query filter
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase()
      items = items.filter(
        (item) =>
          item.keterangan.toLowerCase().includes(q) ||
          item.tanggal.includes(q) ||
          item.hari.toLowerCase().includes(q) ||
          item.exceptionEmployees?.some((e) => e.nama.toLowerCase().includes(q) || e.kode.toLowerCase().includes(q))
      )
    }

    // Sort ascending by date
    return items.sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  }

  /**
   * Retrieves single holiday by ID with enriched exceptions.
   */
  public async getHolidayById(id: number): Promise<HolidayItem | undefined> {
    await this.sleep()
    const found = this.holidays.find((h) => h.id === id)
    if (!found) return undefined

    const linkedExceptions = this.exceptions
      .filter((e) => e.hari_libur_id === found.id)
      .map((e) => e.karyawan_id)

    return {
      id: found.id,
      tanggal: found.tanggal,
      keterangan: found.keterangan,
      hari: getDayNameIndonesian(found.tanggal),
      uuid: found.uuid,
      exceptionEmployeeIds: linkedExceptions,
      exceptionEmployees: this.enrichExceptions(linkedExceptions)
    }
  }

  /**
   * Creates a new holiday and its linked employee exceptions.
   */
  public async createHoliday(dto: CreateHolidayDto): Promise<HolidayItem> {
    await this.sleep()

    // Validate
    const validation = validateHolidayForm(dto, this.getHolidaysSync())
    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0]
      throw new Error(firstErr || 'Data hari libur tidak valid')
    }

    const newId = this.nextHolidayId++
    const newEntity: LegacyHariLiburEntity = {
      id: newId,
      tanggal: dto.tanggal,
      keterangan: dto.keterangan.trim(),
      uuid: null
    }

    this.holidays.push(newEntity)

    // Insert linked exceptions (deduplicated)
    const uniqueEmployeeIds = Array.from(new Set(dto.exceptionEmployeeIds || []))
    for (const empId of uniqueEmployeeIds) {
      this.exceptions.push({
        id: this.nextExceptionId++,
        karyawan_id: empId,
        hari_libur_id: newId
      })
    }

    const created = await this.getHolidayById(newId)
    return created!
  }

  /**
   * Updates an existing holiday and synchronizes its employee exceptions.
   */
  public async updateHoliday(id: number, dto: UpdateHolidayDto): Promise<HolidayItem> {
    await this.sleep()

    const index = this.holidays.findIndex((h) => h.id === id)
    if (index === -1) {
      throw new Error(`Hari libur dengan ID #${id} tidak ditemukan`)
    }

    // Validate
    const current = this.holidays[index]
    const merged: CreateHolidayDto = {
      tanggal: dto.tanggal ?? current.tanggal,
      keterangan: dto.keterangan ?? current.keterangan,
      exceptionEmployeeIds: dto.exceptionEmployeeIds ?? []
    }

    const validation = validateHolidayForm(merged, this.getHolidaysSync(), id)
    if (!validation.isValid) {
      const firstErr = Object.values(validation.errors)[0]
      throw new Error(firstErr || 'Data perubahan hari libur tidak valid')
    }

    // Update entity
    this.holidays[index].tanggal = merged.tanggal
    this.holidays[index].keterangan = merged.keterangan

    // Synchronize exceptions: remove old and insert updated
    if (dto.exceptionEmployeeIds !== undefined) {
      this.exceptions = this.exceptions.filter((e) => e.hari_libur_id !== id)
      const uniqueEmployeeIds = Array.from(new Set(dto.exceptionEmployeeIds))
      for (const empId of uniqueEmployeeIds) {
        this.exceptions.push({
          id: this.nextExceptionId++,
          karyawan_id: empId,
          hari_libur_id: id
        })
      }
    }

    const updated = await this.getHolidayById(id)
    return updated!
  }

  /**
   * Deletes a holiday and unlinks its exceptions without deleting employee records.
   */
  public async deleteHoliday(id: number): Promise<boolean> {
    await this.sleep()

    const index = this.holidays.findIndex((h) => h.id === id)
    if (index === -1) {
      throw new Error(`Hari libur dengan ID #${id} tidak ditemukan`)
    }

    // Remove holiday
    this.holidays.splice(index, 1)

    // Remove pivot exceptions
    this.exceptions = this.exceptions.filter((e) => e.hari_libur_id !== id)

    return true
  }

  /**
   * Synchronous helper for validation checks.
   */
  public getHolidaysSync(): HolidayItem[] {
    return this.holidays.map((h) => ({
      id: h.id,
      tanggal: h.tanggal,
      keterangan: h.keterangan,
      hari: getDayNameIndonesian(h.tanggal),
      uuid: h.uuid,
      exceptionEmployeeIds: this.exceptions
        .filter((e) => e.hari_libur_id === h.id)
        .map((e) => e.karyawan_id)
    }))
  }

  /**
   * Downstream Presensi Contract: Resolves holiday by exact date.
   */
  public async getHolidayByDate(date: string): Promise<HolidayItem | undefined> {
    await this.sleep()
    const found = this.holidays.find((h) => h.tanggal === date)
    if (!found) return undefined
    return this.getHolidayById(found.id)
  }

  /**
   * Downstream Presensi Contract: Checks if a date is registered as a holiday.
   */
  public async isHoliday(date: string): Promise<boolean> {
    const found = await this.getHolidayByDate(date)
    return Boolean(found)
  }

  /**
   * Downstream Presensi Contract: Evaluates if an employee is exempted from a holiday on a given date.
   */
  public async isEmployeeExempted(employeeId: number, date: string): Promise<boolean> {
    const holiday = await this.getHolidayByDate(date)
    if (!holiday) return false
    return holiday.exceptionEmployeeIds.includes(employeeId)
  }
}

export const holidaySettingsService = HolidaySettingsService.getInstance()
