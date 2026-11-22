import type { Group, GroupFormDto } from '../types/group.types'

export interface GroupValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Validates group input fields according to legacy schema constraints and business rules
 */
export function validateGroupForm(
  form: GroupFormDto,
  existingGroups: Group[],
  currentGroupId?: number
): GroupValidationResult {
  const errors: Record<string, string> = {}

  const name = form.name?.trim() || ''
  const description = form.description?.trim() || ''

  // 1. Name validation
  if (!name) {
    errors.name = 'Nama Groups wajib diisi.'
  } else if (name.length < 2) {
    errors.name = 'Nama Groups minimal 2 karakter.'
  } else if (name.length > 20) {
    errors.name = 'Nama Groups maksimal 20 karakter sesuai skema database legacy.'
  } else {
    // Duplicate check
    const isDuplicate = existingGroups.some(
      (g) => g.id !== currentGroupId && g.name.trim().toLowerCase() === name.toLowerCase()
    )
    if (isDuplicate) {
      errors.name = `Nama Groups "${name}" sudah digunakan. Gunakan nama yang berbeda.`
    }
  }

  // 2. Description validation
  if (!description) {
    errors.description = 'Keterangan Groups wajib diisi.'
  } else if (description.length < 2) {
    errors.description = 'Keterangan minimal 2 karakter.'
  } else if (description.length > 100) {
    errors.description = 'Keterangan maksimal 100 karakter sesuai skema database legacy.'
  }

  // 3. Superadmin protection check
  if (currentGroupId === 1) {
    if (name.toLowerCase() !== 'admin' && name.toLowerCase() !== 'superadmin') {
      errors.name = 'Nama Groups default sistem (SUPERADMIN) tidak boleh diubah.'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

