/**
 * Date manipulation, calendar projections, and Indonesian localization for Holiday settings.
 * Designed to strictly avoid timezone offset distortions when working with date-only strings.
 */

import type { CalendarDayCell, HolidayItem } from '../types/holiday-settings.types'

export const INDONESIAN_MONTH_NAMES = [
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
]

export const INDONESIAN_DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/**
 * Returns current month in 'YYYY-MM' format.
 */
export function getCurrentYearMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Returns today's date in 'YYYY-MM-DD' format.
 */
export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

/**
 * Resolves day of week in Indonesian for a given 'YYYY-MM-DD' date string.
 */
export function getDayNameIndonesian(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return ''
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const y = parseInt(yearStr, 10)
  const m = parseInt(monthStr, 10) - 1
  const d = parseInt(dayStr, 10)

  const dateObj = new Date(Date.UTC(y, m, d))
  const dayIdx = dateObj.getUTCDay() // 0 = Minggu, 1 = Senin, ...
  return INDONESIAN_DAY_NAMES[dayIdx] || ''
}

/**
 * Formats 'YYYY-MM-DD' to 'DD MMMM YYYY' in Indonesian (e.g. '17 Agustus 2024').
 */
export function formatDateIndonesian(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const y = parseInt(yearStr, 10)
  const m = parseInt(monthStr, 10) - 1
  const d = parseInt(dayStr, 10)

  const monthName = INDONESIAN_MONTH_NAMES[m] || monthStr
  return `${d} ${monthName} ${y}`
}

/**
 * Formats 'YYYY-MM-DD' to short 'DD/MM/YYYY'.
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  return `${dayStr.padStart(2, '0')}/${monthStr.padStart(2, '0')}/${yearStr}`
}

/**
 * Safely shifts month by delta (+1 or -1) handling December to January rollover.
 */
export function shiftMonth(yearMonth: string, delta: number): string {
  const [yStr, mStr] = yearMonth.split('-')
  let year = parseInt(yStr, 10)
  let month = parseInt(mStr, 10) + delta

  while (month > 12) {
    month -= 12
    year += 1
  }
  while (month < 1) {
    month += 12
    year -= 1
  }

  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Generates calendar cell grid for a given 'YYYY-MM' month (Monday to Sunday grid).
 */
export function generateCalendarGrid(
  yearMonth: string,
  holidays: HolidayItem[]
): CalendarDayCell[] {
  const [yStr, mStr] = yearMonth.split('-')
  const year = parseInt(yStr, 10)
  const monthIndex = parseInt(mStr, 10) - 1

  const todayStr = getTodayDateString()

  // First day of target month (UTC)
  const firstDay = new Date(Date.UTC(year, monthIndex, 1))
  // Days in target month
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0))
  const totalDaysInMonth = lastDay.getUTCDate()

  // Day of week for 1st of month: 0=Minggu, 1=Senin, ..., 6=Sabtu
  // Monday-based index: Senin=0, Selasa=1, ..., Minggu=6
  const rawFirstDayOfWeek = firstDay.getUTCDay()
  const mondayBasedOffset = (rawFirstDayOfWeek + 6) % 7

  const cells: CalendarDayCell[] = []

  // 1. Previous month trailing days
  const prevMonthLastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate()
  const prevYearMonth = shiftMonth(yearMonth, -1)
  for (let i = mondayBasedOffset - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const dateStr = `${prevYearMonth}-${String(dayNum).padStart(2, '0')}`
    const dayHolidays = holidays.filter(h => h.tanggal === dateStr)
    const isSun = getDayNameIndonesian(dateStr) === 'Minggu'

    cells.push({
      date: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSunday: isSun,
      holidays: dayHolidays
    })
  }

  // 2. Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`
    const dayHolidays = holidays.filter(h => h.tanggal === dateStr)
    const isSun = getDayNameIndonesian(dateStr) === 'Minggu'

    cells.push({
      date: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSunday: isSun,
      holidays: dayHolidays
    })
  }

  // 3. Next month leading days to complete full weeks (multiples of 7)
  const nextYearMonth = shiftMonth(yearMonth, 1)
  let nextDayNum = 1
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const dateStr = `${nextYearMonth}-${String(nextDayNum).padStart(2, '0')}`
    const dayHolidays = holidays.filter(h => h.tanggal === dateStr)
    const isSun = getDayNameIndonesian(dateStr) === 'Minggu'

    cells.push({
      date: dateStr,
      dayNumber: nextDayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSunday: isSun,
      holidays: dayHolidays
    })
    nextDayNum++
  }

  return cells
}
