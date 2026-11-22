/**
 * Export helpers for HR Presensi (Excel and PDF)
 * Uses shared `exportToExcel` and `exportToPdf` utilities.
 */

import { exportToExcel } from '@/shared/utils/excel-export'
import { exportToPdf } from '@/shared/utils/pdf-export'
import type { AttendanceRecordViewModel } from '../types/attendance.types'
import type { ExportColumn } from '@/shared/types/crud.types'

export const ATTENDANCE_EXPORT_COLUMNS: ExportColumn<AttendanceRecordViewModel>[] = [
  { key: 'tanggalFormatted', label: 'Tanggal' },
  { key: 'kode', label: 'Kode' },
  { key: 'nama', label: 'Nama' },
  { key: 'grupNama', label: 'Grup' },
  { key: 'cin', label: 'Clock IN' },
  { key: 'cout', label: 'Clock Out' },
  { key: 'bstart', label: 'Break Start' },
  { key: 'bend', label: 'Break End' },
  {
    key: 'statuses',
    label: 'Status',
    formatter: (val: unknown) => (Array.isArray(val) ? val.join(' , ') : String(val ?? ''))
  },
  { key: 'keterangan', label: 'Keterangan' }
]

export function sanitizeReportFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
}

export function exportAttendanceReportExcel(
  records: AttendanceRecordViewModel[],
  reportTitle: string,
  filename = 'Presensi_Report'
): void {
  exportToExcel<AttendanceRecordViewModel>({
    filename: sanitizeReportFilename(filename),
    title: reportTitle,
    columns: ATTENDANCE_EXPORT_COLUMNS,
    data: records
  })
}

export function exportAttendanceReportPdf(
  records: AttendanceRecordViewModel[],
  reportTitle: string,
  filename = 'Presensi_Report'
): void {
  exportToPdf<AttendanceRecordViewModel>({
    filename: sanitizeReportFilename(filename),
    title: reportTitle,
    subtitle: 'Sistem Informasi Manajemen Presensi — PT Impact Furniture',
    columns: ATTENDANCE_EXPORT_COLUMNS,
    data: records,
    orientation: 'landscape'
  })
}
