/**
 * Schedule time manipulation, normalization, and comparison utilities.
 * Ensures consistent timezone-independent time math and schema conversions.
 */

import type {
  IndonesianDay,
  LegacyJadwalEntity,
  ScheduleDayItem
} from '../types/schedule-settings.types'

/**
 * Normalizes any time string (e.g. '08:00:00' or '8:00') into standard 'HH:mm'.
 * Returns null if input is null, undefined, or empty.
 */
export function normalizeTimeString(timeStr: string | null | undefined): string | null {
  if (!timeStr) return null
  const trimmed = timeStr.trim()
  if (!trimmed) return null

  // Match HH:mm or HH:mm:ss
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return trimmed // Fallback to raw if not matched so validator catches it

  const hours = match[1].padStart(2, '0')
  const minutes = match[2]
  return `${hours}:${minutes}`
}

/**
 * Validates whether string is a valid 24-hour time string in HH:mm format.
 */
export function isValidTimeString(timeStr: string | null | undefined): boolean {
  if (!timeStr) return true // Null/empty is valid if field is optional/off day
  const normalized = normalizeTimeString(timeStr)
  if (!normalized) return false

  const match = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  return Boolean(match)
}

/**
 * Converts a valid time string 'HH:mm' into total minutes since midnight (0 - 1439).
 * Returns null if time is null or invalid.
 */
export function parseTimeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null
  const normalized = normalizeTimeString(timeStr)
  if (!normalized) return null

  const match = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (!match) return null

  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  return hours * 60 + minutes
}

/**
 * Compares two time strings.
 * Returns < 0 if a < b, 0 if a == b, > 0 if a > b.
 * Returns null if either time cannot be parsed.
 */
export function compareTimes(
  timeA: string | null | undefined,
  timeB: string | null | undefined
): number | null {
  const minsA = parseTimeToMinutes(timeA)
  const minsB = parseTimeToMinutes(timeB)
  if (minsA === null || minsB === null) return null
  return minsA - minsB
}

/**
 * Checks if a given time is within a closed range [start, end].
 */
export function isTimeInRange(
  targetTime: string,
  rangeStart: string | null | undefined,
  rangeEnd: string | null | undefined
): boolean {
  const targetMins = parseTimeToMinutes(targetTime)
  const startMins = parseTimeToMinutes(rangeStart)
  const endMins = parseTimeToMinutes(rangeEnd)

  if (targetMins === null || startMins === null || endMins === null) return false

  if (startMins <= endMins) {
    return targetMins >= startMins && targetMins <= endMins
  } else {
    // Overnight range (e.g. 22:00 to 06:00)
    return targetMins >= startMins || targetMins <= endMins
  }
}

/**
 * Ordered list of days as required by legacy UI and business logic (Senin - Minggu).
 */
export const ORDERED_WEEKDAYS: {
  order: number
  dayId: number
  dayName: IndonesianDay
}[] = [
  { order: 1, dayId: 2, dayName: 'Senin' },
  { order: 2, dayId: 3, dayName: 'Selasa' },
  { order: 3, dayId: 4, dayName: 'Rabu' },
  { order: 4, dayId: 5, dayName: 'Kamis' },
  { order: 5, dayId: 6, dayName: 'Jumat' },
  { order: 6, dayId: 7, dayName: 'Sabtu' },
  { order: 7, dayId: 1, dayName: 'Minggu' }
]

/**
 * Maps a legacy MariaDB `jadwal` row to the clean UI ViewModel `ScheduleDayItem`.
 */
export function mapLegacyToViewModel(entity: LegacyJadwalEntity): ScheduleDayItem {
  const dayMeta = ORDERED_WEEKDAYS.find(d => d.dayId === entity.day_id) || {
    order: 1,
    dayId: entity.day_id,
    dayName: (entity.hari || 'Senin') as IndonesianDay
  }

  return {
    id: entity.id,
    dayId: entity.day_id,
    dayName: (entity.hari || dayMeta.dayName) as IndonesianDay,
    order: dayMeta.order,
    checkIn: {
      start: normalizeTimeString(entity.shift_in_start),
      end: normalizeTimeString(entity.shift_in_end)
    },
    checkOut: {
      start: normalizeTimeString(entity.shift_out_start),
      end: normalizeTimeString(entity.shift_out_end)
    },
    breakStart: {
      start: normalizeTimeString(entity.break_start_start),
      end: normalizeTimeString(entity.break_start_end)
    },
    breakEnd: {
      start: normalizeTimeString(entity.break_end_start),
      end: normalizeTimeString(entity.break_end_end)
    }
  }
}

/**
 * Maps a UI ViewModel `ScheduleDayItem` back to the raw MariaDB `LegacyJadwalEntity`.
 */
export function mapViewModelToLegacy(item: ScheduleDayItem): LegacyJadwalEntity {
  return {
    id: item.id,
    hari: item.dayName,
    day_id: item.dayId,
    shift_in_start: normalizeTimeString(item.checkIn.start),
    shift_in_end: normalizeTimeString(item.checkIn.end),
    shift_out_start: normalizeTimeString(item.checkOut.start),
    shift_out_end: normalizeTimeString(item.checkOut.end),
    break_start_start: normalizeTimeString(item.breakStart.start),
    break_start_end: normalizeTimeString(item.breakStart.end),
    break_end_start: normalizeTimeString(item.breakEnd.start),
    break_end_end: normalizeTimeString(item.breakEnd.end)
  }
}
