/**
 * Attendance Status Calculator
 * 100% faithful to legacy CodeIgniter `Presensi::status` implementation.
 */

import type { AttendanceStatusCode } from '../types/attendance.types'
import type { LegacyJadwalEntity } from '../types/schedule-settings.types'

export interface AttendanceTimeInputs {
  actualIn?: string | null // e.g. '07:49:08'
  actualOut?: string | null // e.g. '16:01:14'
  breakStart?: string | null // e.g. '11:31:11'
  breakEnd?: string | null // e.g. '12:38:14'
}

/**
 * Normalizes time string to HH:mm:ss for accurate string comparison
 */
export function normalizeTimeString(time?: string | null): string {
  if (!time || time.trim() === '' || time === '-') return ''
  const trimmed = time.trim()
  const parts = trimmed.split(':')
  if (parts.length === 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`
  }
  if (parts.length >= 3) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`
  }
  return trimmed
}

/**
 * Calculates legacy attendance statuses based on actual check logs and day's schedule.
 */
export function calculateAttendanceStatuses(
  data: AttendanceTimeInputs,
  schedule?: LegacyJadwalEntity | null
): AttendanceStatusCode[] {
  const statuses: AttendanceStatusCode[] = []

  const actIn = normalizeTimeString(data.actualIn)
  const actOut = normalizeTimeString(data.actualOut)
  const breakStart = normalizeTimeString(data.breakStart)
  const breakEnd = normalizeTimeString(data.breakEnd)

  const isAbsent = !actIn && !actOut && !breakStart && !breakEnd

  // Shift schedule thresholds
  const shiftIn = normalizeTimeString(schedule?.shift_in_start || '08:00:00')
  const shiftOut = normalizeTimeString(schedule?.shift_out_end || '16:00:00')
  const breakStartEnd = normalizeTimeString(schedule?.break_start_end || '12:00:00')
  const breakEndStart = normalizeTimeString(schedule?.break_end_start || '13:00:00')

  // Sign In evaluation
  if (actIn) {
    if (actIn > shiftIn) {
      statuses.push('LI') // Late In
    } else {
      statuses.push('EI') // Early In
    }
  } else if (!isAbsent) {
    statuses.push('NSI') // No Sign In
  }

  // Sign Out evaluation
  if (actOut) {
    if (actOut < shiftOut) {
      statuses.push('EO') // Early Out
    } else {
      statuses.push('LO') // Late Out
    }
  } else if (!isAbsent) {
    statuses.push('NSO') // No Sign Out
  }

  // Break Start evaluation
  if (breakStart) {
    if (breakStart < breakStartEnd) {
      statuses.push('EBO') // Early Break Out
    }
  } else if (!isAbsent) {
    statuses.push('NBO') // No Break Out
  }

  // Break End evaluation
  if (breakEnd) {
    if (breakEnd > breakEndStart) {
      statuses.push('LBI') // Late Break In
    }
  } else if (!isAbsent) {
    statuses.push('NBI') // No Break In
  }

  // Absent evaluation
  if (isAbsent) {
    statuses.push('ABSENT')
  }

  return statuses
}

