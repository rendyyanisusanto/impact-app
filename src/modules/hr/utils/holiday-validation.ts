/**
 * Form validation rules for Holiday creation and modification.
 */

import type {
  CreateHolidayDto,
  HolidayItem,
  HolidayValidationResult
} from '../types/holiday-settings.types'

export function validateHolidayForm(
  dto: Partial<CreateHolidayDto>,
  existingHolidays: HolidayItem[] = [],
  excludeId?: number
): HolidayValidationResult {
  const errors: HolidayValidationResult['errors'] = {}

  // 1. Date validation
  if (!dto.tanggal || dto.tanggal.trim() === '') {
    errors.tanggal = 'Tanggal hari libur wajib diisi'
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.tanggal)) {
    errors.tanggal = 'Format tanggal tidak valid (YYYY-MM-DD)'
  } else {
    // Check duplicate date with identical description
    const isDuplicate = existingHolidays.some(
      h =>
        h.id !== excludeId &&
        h.tanggal === dto.tanggal &&
        h.keterangan.trim().toLowerCase() === (dto.keterangan || '').trim().toLowerCase()
    )
    if (isDuplicate) {
      errors.tanggal = `Hari libur pada tanggal ini dengan keterangan "${dto.keterangan}" sudah terdaftar`
    }
  }

  // 2. Description validation
  if (!dto.keterangan || dto.keterangan.trim() === '') {
    errors.keterangan = 'Keterangan hari libur wajib diisi'
  } else if (dto.keterangan.trim().length < 2) {
    errors.keterangan = 'Keterangan hari libur minimal 2 karakter'
  } else if (dto.keterangan.length > 255) {
    errors.keterangan = 'Keterangan hari libur maksimal 255 karakter'
  }

  // 3. Exception list validation
  if (dto.exceptionEmployeeIds && !Array.isArray(dto.exceptionEmployeeIds)) {
    errors.exceptionEmployeeIds = 'Daftar pengecualian karyawan tidak valid'
  }

  const isValid = Object.keys(errors).length === 0

  return {
    isValid,
    errors
  }
}
