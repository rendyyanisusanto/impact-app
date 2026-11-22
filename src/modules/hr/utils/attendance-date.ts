/**
 * Date and Time utilities for HR Presensi module
 * Strictly date-only (YYYY-MM-DD) internally, preserving seconds for time without timezone shifts.
 */

export const MONTH_NAMES_INDONESIAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
] as const

/**
 * Formats YYYY-MM-DD to dd-MM-yyyy for display matching legacy screenshots
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`
  }
  return dateStr
}

/**
 * Returns today's date string in YYYY-MM-DD format (local time, no timezone shift)
 */
export function getLocalTodayDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns legacy day_id (1=Sunday, 2=Monday, ..., 7=Saturday) from YYYY-MM-DD
 */
export function getLegacyDayId(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const jsDay = d.getDay() // 0 = Sun, 1 = Mon ...
  return jsDay === 0 ? 1 : jsDay + 1
}

/**
 * Determines days in a given month accounting for leap years
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Generates array of YYYY-MM-DD date strings for a given month and year
 */
export function generateDatesForMonth(year: number, month: number): string[] {
  const totalDays = getDaysInMonth(year, month)
  const dates: string[] = []
  const monthStr = String(month).padStart(2, '0')
  for (let i = 1; i <= totalDays; i++) {
    const dayStr = String(i).padStart(2, '0')
    dates.push(`${year}-${monthStr}-${dayStr}`)
  }
  return dates
}

/**
 * Generates an inclusive array of YYYY-MM-DD date strings from start to end
 */
export function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = []
  const [sy, sm, sd] = startDateStr.split('-').map(Number)
  const [ey, em, ed] = endDateStr.split('-').map(Number)

  const current = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)

  while (current <= end) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    current.setDate(current.getDate() + 1)
  }

  return dates
}

/**
 * Subtracts N days from a date string (calendar days)
 */
export function subtractDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dateNum = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dateNum}`
}

