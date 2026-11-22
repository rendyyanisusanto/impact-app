import type { DashboardDatePreset } from '../types/dashboard.types'

/**
 * Mendapatkan representasi tanggal hari ini dalam zona waktu Asia/Jakarta (WIB)
 */
export function getNowJakarta(): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 3600000 * 7)
}

export function formatDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const date = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${date}`
}

export function resolvePresetDates(preset: DashboardDatePreset): {
  startDate: string
  endDate: string
} {
  const now = getNowJakarta()
  const todayStr = formatDateISO(now)

  switch (preset) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr }

    case 'yesterday': {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = formatDateISO(yesterday)
      return { startDate: yesterdayStr, endDate: yesterdayStr }
    }

    case '7d': {
      const start7d = new Date(now)
      start7d.setDate(start7d.getDate() - 6)
      return { startDate: formatDateISO(start7d), endDate: todayStr }
    }

    case '30d': {
      const start30d = new Date(now)
      start30d.setDate(start30d.getDate() - 29)
      return { startDate: formatDateISO(start30d), endDate: todayStr }
    }

    case 'last_month': {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        startDate: formatDateISO(prevMonth),
        endDate: formatDateISO(lastDayPrevMonth)
      }
    }

    case 'this_year': {
      const startYear = new Date(now.getFullYear(), 0, 1)
      const endYear = new Date(now.getFullYear(), 11, 31)
      return {
        startDate: formatDateISO(startYear),
        endDate: formatDateISO(endYear)
      }
    }

    case 'month':
    case 'this_month':
    default: {
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return {
        startDate: formatDateISO(startMonth),
        endDate: formatDateISO(endMonth)
      }
    }
  }
}

const MONTH_NAMES_FULL_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function formatDateLabelId(dateStr?: string): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10)
    const monthIdx = parseInt(parts[1], 10) - 1
    const year = parts[0]
    return `${day} ${MONTH_NAMES_FULL_ID[monthIdx] || ''} ${year}`
  }
  return dateStr
}

export function formatDateTimeWib(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date()
  if (isNaN(d.getTime())) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(d) + ' WIB'
}
