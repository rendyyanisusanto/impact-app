/**
 * Boundary, Range, and Cross-Range validation rules for HR Weekly Schedule.
 */

import type {
  ScheduleDayItem,
  ScheduleDayValidationError,
  ScheduleValidationResult,
  TimeRangeValue
} from '../types/schedule-settings.types'
import { compareTimes, isValidTimeString, parseTimeToMinutes } from './schedule-time'

/**
 * Validates a single time range (e.g. Jam Masuk, Jam Pulang).
 */
export function validateRange(
  range: TimeRangeValue,
  rangeLabel: string
): { isValid: boolean; error?: string } {
  const hasStart = Boolean(range.start && range.start.trim() !== '')
  const hasEnd = Boolean(range.end && range.end.trim() !== '')

  // Both empty is acceptable (unconfigured or off day)
  if (!hasStart && !hasEnd) {
    return { isValid: true }
  }

  // Partial input is invalid
  if (hasStart && !hasEnd) {
    return {
      isValid: false,
      error: `Rentang ${rangeLabel} belum lengkap (waktu selesai belum diisi)`
    }
  }

  if (!hasStart && hasEnd) {
    return {
      isValid: false,
      error: `Rentang ${rangeLabel} belum lengkap (waktu mulai belum diisi)`
    }
  }

  // Format validation
  if (!isValidTimeString(range.start)) {
    return { isValid: false, error: `Format waktu mulai ${rangeLabel} tidak valid (HH:mm)` }
  }

  if (!isValidTimeString(range.end)) {
    return { isValid: false, error: `Format waktu selesai ${rangeLabel} tidak valid (HH:mm)` }
  }

  // Order check: start should be before or equal to end within same period
  const diff = compareTimes(range.start, range.end)
  if (diff !== null && diff > 0) {
    return {
      isValid: false,
      error: `Waktu mulai ${rangeLabel} (${range.start}) tidak boleh melebihi waktu selesai (${range.end})`
    }
  }

  return { isValid: true }
}

/**
 * Validates an entire single day's schedule row.
 */
export function validateDaySchedule(item: ScheduleDayItem): ScheduleDayValidationError | null {
  const errors: ScheduleDayValidationError = {
    dayId: item.dayId,
    dayName: item.dayName,
    fieldErrors: {}
  }

  let hasAnyError = false

  // 1. Validate each of the 4 ranges
  const checkInRes = validateRange(item.checkIn, 'Jam Masuk')
  if (!checkInRes.isValid && checkInRes.error) {
    errors.checkIn = checkInRes.error
    errors.fieldErrors!['checkIn.start'] = checkInRes.error
    errors.fieldErrors!['checkIn.end'] = checkInRes.error
    hasAnyError = true
  }

  const checkOutRes = validateRange(item.checkOut, 'Jam Pulang')
  if (!checkOutRes.isValid && checkOutRes.error) {
    errors.checkOut = checkOutRes.error
    errors.fieldErrors!['checkOut.start'] = checkOutRes.error
    errors.fieldErrors!['checkOut.end'] = checkOutRes.error
    hasAnyError = true
  }

  const breakStartRes = validateRange(item.breakStart, 'Mulai Istirahat')
  if (!breakStartRes.isValid && breakStartRes.error) {
    errors.breakStart = breakStartRes.error
    errors.fieldErrors!['breakStart.start'] = breakStartRes.error
    errors.fieldErrors!['breakStart.end'] = breakStartRes.error
    hasAnyError = true
  }

  const breakEndRes = validateRange(item.breakEnd, 'Selesai Istirahat')
  if (!breakEndRes.isValid && breakEndRes.error) {
    errors.breakEnd = breakEndRes.error
    errors.fieldErrors!['breakEnd.start'] = breakEndRes.error
    errors.fieldErrors!['breakEnd.end'] = breakEndRes.error
    hasAnyError = true
  }

  // 2. Cross-range chronological validation (only if ranges are internally valid)
  if (!hasAnyError) {
    const hasCheckIn = Boolean(item.checkIn.start && item.checkIn.end)
    const hasCheckOut = Boolean(item.checkOut.start && item.checkOut.end)
    const hasBreakStart = Boolean(item.breakStart.start && item.breakStart.end)
    const hasBreakEnd = Boolean(item.breakEnd.start && item.breakEnd.end)

    // Jam Masuk vs Jam Pulang
    if (hasCheckIn && hasCheckOut) {
      const inStart = parseTimeToMinutes(item.checkIn.start)!
      const outEnd = parseTimeToMinutes(item.checkOut.end)!
      if (inStart >= outEnd) {
        const msg = `Jam Masuk (${item.checkIn.start}) harus sebelum Jam Pulang (${item.checkOut.end})`
        errors.crossRange = msg
        errors.fieldErrors!['checkOut.end'] = msg
        hasAnyError = true
      }
    }

    // Jam Masuk vs Mulai Istirahat
    if (hasCheckIn && hasBreakStart) {
      const inStart = parseTimeToMinutes(item.checkIn.start)!
      const brkStart = parseTimeToMinutes(item.breakStart.start)!
      if (inStart > brkStart) {
        const msg = `Mulai Istirahat (${item.breakStart.start}) tidak boleh sebelum Jam Masuk (${item.checkIn.start})`
        errors.crossRange = msg
        errors.fieldErrors!['breakStart.start'] = msg
        hasAnyError = true
      }
    }

    // Mulai Istirahat vs Selesai Istirahat
    if (hasBreakStart && hasBreakEnd) {
      const brkStartEnd = parseTimeToMinutes(item.breakStart.end)!
      const brkEndStart = parseTimeToMinutes(item.breakEnd.start)!
      if (brkStartEnd > brkEndStart) {
        const msg = `Selesai Istirahat (${item.breakEnd.start}) harus setelah Mulai Istirahat (${item.breakStart.end})`
        errors.crossRange = msg
        errors.fieldErrors!['breakEnd.start'] = msg
        hasAnyError = true
      }
    }

    // Selesai Istirahat vs Jam Pulang
    if (hasBreakEnd && hasCheckOut) {
      const brkEnd = parseTimeToMinutes(item.breakEnd.end)!
      const outStart = parseTimeToMinutes(item.checkOut.start)!
      if (brkEnd > outStart) {
        const msg = `Jam Pulang (${item.checkOut.start}) tidak boleh mendahului Selesai Istirahat (${item.breakEnd.end})`
        errors.crossRange = msg
        errors.fieldErrors!['checkOut.start'] = msg
        hasAnyError = true
      }
    }
  }

  return hasAnyError ? errors : null
}

/**
 * Validates the full 7-day weekly schedule array.
 */
export function validateWeeklySchedule(schedules: ScheduleDayItem[]): ScheduleValidationResult {
  const errorMap: Record<number, ScheduleDayValidationError> = {}
  const summary: string[] = []

  for (const day of schedules) {
    const err = validateDaySchedule(day)
    if (err) {
      errorMap[day.dayId] = err
      const dayIssues: string[] = []
      if (err.checkIn) dayIssues.push(err.checkIn)
      if (err.checkOut) dayIssues.push(err.checkOut)
      if (err.breakStart) dayIssues.push(err.breakStart)
      if (err.breakEnd) dayIssues.push(err.breakEnd)
      if (err.crossRange) dayIssues.push(err.crossRange)

      summary.push(`${day.dayName}: ${dayIssues.join('; ')}`)
    }
  }

  const totalErrors = Object.keys(errorMap).length

  return {
    isValid: totalErrors === 0,
    totalErrors,
    errors: errorMap,
    errorSummary: summary
  }
}
