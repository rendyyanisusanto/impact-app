import type {
  CreateEmployeeGroupDto,
  EmployeeGroupValidationErrors
} from '../types/employee-group.types'

export type EmployeeGroupValidationPayload = Omit<Partial<CreateEmployeeGroupDto>, 'kode'> & {
  id?: number
  kode?: string | null
  nama?: string | null
  color?: string | null
  status_aktif?: number | null
}

export function validateEmployeeGroup(
  dto: EmployeeGroupValidationPayload,
  existingGroups: { id: number; kode?: string | null; nama?: string }[],
  currentId?: number
): { isValid: boolean; errors: EmployeeGroupValidationErrors } {
  const errors: EmployeeGroupValidationErrors = {}

  // 1. Kode validation
  if (!dto.kode || !String(dto.kode).trim()) {
    errors.kode = 'Kode Grup wajib diisi'
  } else {
    const trimmedKode = String(dto.kode).trim().toLowerCase()
    const duplicate = existingGroups.find(
      g => g.id !== currentId && g.kode?.toLowerCase() === trimmedKode
    )
    if (duplicate) {
      errors.kode = `Kode Grup '${dto.kode}' sudah digunakan`
    }
  }

  // 2. Nama validation
  if (!dto.nama || !String(dto.nama).trim()) {
    errors.nama = 'Nama Grup wajib diisi'
  } else if (String(dto.nama).trim().length < 2) {
    errors.nama = 'Nama Grup minimal 2 karakter'
  }

  // 3. Status validation
  if (dto.status_aktif === undefined || dto.status_aktif === null) {
    errors.status_aktif = 'Status Aktif wajib dipilih'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
