/**
 * Domain types for HR Weekly Schedule Setting (Setting Jadwal Mingguan).
 * Strictly mapped from verified legacy MariaDB `jadwal` table schema.
 */

export type IndonesianDay = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu'

export type EnglishDay =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

/**
 * Raw entity corresponding exactly to MariaDB `jadwal` table in `u1573701_smm(2).sql`.
 */
export interface LegacyJadwalEntity {
  id: number
  hari: string
  day_id: number
  shift_in_start: string | null
  shift_in_end: string | null
  shift_out_start: string | null
  shift_out_end: string | null
  break_start_start: string | null
  break_start_end: string | null
  break_end_start: string | null
  break_end_end: string | null
}

export interface TimeRangeValue {
  start: string | null
  end: string | null
}

/**
 * Normalized UI ViewModel for a day's schedule row.
 */
export interface ScheduleDayItem {
  id: number
  dayId: number // 1: Minggu, 2: Senin, 3: Selasa, 4: Rabu, 5: Kamis, 6: Jumat, 7: Sabtu
  dayName: IndonesianDay
  order: number // 1: Senin, 2: Selasa, ..., 7: Minggu (UI display sequence)
  checkIn: TimeRangeValue // shift_in_start - shift_in_end
  checkOut: TimeRangeValue // shift_out_start - shift_out_end
  breakStart: TimeRangeValue // break_start_start - break_start_end
  breakEnd: TimeRangeValue // break_end_start - break_end_end
}

export type RangeKey = 'checkIn' | 'checkOut' | 'breakStart' | 'breakEnd'
export type TimePointKey = 'start' | 'end'

/**
 * Specific field identifier for precision targeting and error binding.
 */
export type ScheduleFieldPath =
  | 'checkIn.start'
  | 'checkIn.end'
  | 'checkOut.start'
  | 'checkOut.end'
  | 'breakStart.start'
  | 'breakStart.end'
  | 'breakEnd.start'
  | 'breakEnd.end'

export interface ScheduleDayValidationError {
  dayId: number
  dayName: IndonesianDay
  checkIn?: string
  checkOut?: string
  breakStart?: string
  breakEnd?: string
  crossRange?: string
  fieldErrors?: Partial<Record<ScheduleFieldPath, string>>
}

export interface ScheduleValidationResult {
  isValid: boolean
  totalErrors: number
  errors: Record<number, ScheduleDayValidationError>
  errorSummary: string[]
}

export interface WeeklyScheduleSaveResponse {
  success: boolean
  message: string
  updatedCount: number
  updatedAt: string
}

/**
 * Read-only contract interface for downstream Presensi (Sprint 8 Task 11–14).
 */
export interface IPresensiScheduleResolver {
  getWeeklySchedule(): Promise<ScheduleDayItem[]>
  getScheduleByDayId(dayId: number): Promise<ScheduleDayItem | undefined>
  getScheduleByDate(date: Date | string): Promise<ScheduleDayItem | undefined>
  isWithinCheckInRange(time: string, dayId: number): boolean
  isWithinCheckOutRange(time: string, dayId: number): boolean
}
