/**
 * Utility functions for formatting Indonesian Rupiah currency, numbers, and dates.
 */

export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatNumber(value: number): string {
  if (isNaN(value)) return '0'
  return new Intl.NumberFormat('id-ID').format(value)
}

const MONTH_NAMES_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des'
]

export function formatDateShort(isoDate: string): string {
  if (!isoDate) return ''
  const parts = isoDate.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }
  return isoDate
}

export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '-'
  return formatDateShort(isoDate)
}

export function formatDateLabel(isoDate: string): string {
  if (!isoDate) return ''
  const parts = isoDate.split('-')
  if (parts.length === 3) {
    const [, month, day] = parts
    const monthIndex = parseInt(month, 10) - 1
    const monthName = MONTH_NAMES_ID[monthIndex] || month
    return `${parseInt(day, 10)} ${monthName}`
  }
  return isoDate
}
