/**
 * Domain types for HR Holiday Settings & Employee Exceptions (Setting Hari Libur & Pengecualian).
 * Strictly mapped from verified legacy MariaDB `hari_libur` and `pengecualian_hari_libur` schema.
 */

/**
 * Raw entity corresponding to MariaDB `hari_libur` table in `u1573701_smm(2).sql`.
 */
export interface LegacyHariLiburEntity {
  id: number
  tanggal: string // 'YYYY-MM-DD'
  keterangan: string
  uuid: string | null
}

/**
 * Raw entity corresponding to MariaDB `pengecualian_hari_libur` pivot table in `u1573701_smm(2).sql`.
 */
export interface LegacyPengecualianHariLiburEntity {
  id: number
  karyawan_id: number
  hari_libur_id: number
}

/**
 * Enriched exception employee information for UI popover/modal presentation.
 */
export interface HolidayExceptionEmployee {
  id: number
  kode: string
  nama: string
  jabatan: string
  statusKaryawan: string
  grupId: number | null
  grupNama: string | null
  grupColor: string | null
}

/**
 * Normalized UI ViewModel for a holiday record with its linked exceptions.
 */
export interface HolidayItem {
  id: number
  tanggal: string // 'YYYY-MM-DD'
  keterangan: string
  hari: string // 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
  uuid: string | null
  exceptionEmployeeIds: number[]
  exceptionEmployees?: HolidayExceptionEmployee[]
}

export interface HolidayFilterQuery {
  yearMonth: string // 'YYYY-MM'
  search?: string
}

export interface CreateHolidayDto {
  tanggal: string
  keterangan: string
  exceptionEmployeeIds: number[]
}

export interface UpdateHolidayDto {
  tanggal?: string
  keterangan?: string
  exceptionEmployeeIds?: number[]
}

export interface HolidayValidationError {
  tanggal?: string
  keterangan?: string
  exceptionEmployeeIds?: string
  general?: string
}

export interface HolidayValidationResult {
  isValid: boolean
  errors: HolidayValidationError
}

/**
 * Calendar representation for a single date cell in the monthly view.
 */
export interface CalendarDayCell {
  date: string // 'YYYY-MM-DD'
  dayNumber: number // 1 - 31
  isCurrentMonth: boolean
  isToday: boolean
  isSunday: boolean
  holidays: HolidayItem[]
}

/**
 * Downstream contract for Sprint 8 Task 11-14 (Presensi).
 */
export interface IPresensiHolidayResolver {
  getHolidaysByMonth(yearMonth: string): Promise<HolidayItem[]>
  getHolidayByDate(date: string): Promise<HolidayItem | undefined>
  isHoliday(date: string): Promise<boolean>
  isEmployeeExempted(employeeId: number, date: string): Promise<boolean>
}

