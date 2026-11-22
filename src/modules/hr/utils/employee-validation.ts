import type { EmployeeValidationErrors } from '../types/employee.types'

export type EmployeeValidationPayload = {
  id?: number
  kode?: string | null
  nik?: string | null
  nama?: string | null
  jk?: string | null
  no_hp?: string | null
  alamat?: string | null
  province_id?: number | null
  city_id?: number | null
  email?: string | null
  jabatan_id?: number | null
  tanggal_masuk?: string | null
  status?: number | null
  status_karyawan_id?: number | null
  uid_fingerprint?: number | null
  grup_karyawan_id?: number | null
  created_by?: number | null
  updated_by?: number | null
}

export function validateEmployee(
  dto: EmployeeValidationPayload,
  existingEmployees: {
    id: number
    kode?: string | null
    uid_fingerprint?: number | null
    nik?: string | null
  }[],
  currentId?: number
): { isValid: boolean; errors: EmployeeValidationErrors } {
  const errors: EmployeeValidationErrors = {}

  // 1. Kode validation
  if (!dto.kode || !String(dto.kode).trim()) {
    errors.kode = 'Kode Karyawan wajib diisi'
  } else {
    const trimmedKode = String(dto.kode).trim().toLowerCase()
    const duplicateKode = existingEmployees.find(
      e => e.id !== currentId && e.kode?.toLowerCase() === trimmedKode
    )
    if (duplicateKode) {
      errors.kode = `Kode Karyawan '${dto.kode}' sudah digunakan`
    }
  }

  // 2. UID Fingerprint validation
  if (
    dto.uid_fingerprint === undefined ||
    dto.uid_fingerprint === null ||
    Number.isNaN(dto.uid_fingerprint)
  ) {
    errors.uid_fingerprint = 'UID Fingerprint wajib diisi (angka integer)'
  } else if (!Number.isInteger(Number(dto.uid_fingerprint)) || Number(dto.uid_fingerprint) <= 0) {
    errors.uid_fingerprint = 'UID Fingerprint harus berupa bilangan bulat positif'
  } else {
    const duplicateUid = existingEmployees.find(
      e => e.id !== currentId && Number(e.uid_fingerprint) === Number(dto.uid_fingerprint)
    )
    if (duplicateUid) {
      errors.uid_fingerprint = `UID Fingerprint '${dto.uid_fingerprint}' sudah digunakan oleh karyawan lain`
    }
  }

  // 3. Nama validation
  if (!dto.nama || !String(dto.nama).trim()) {
    errors.nama = 'Nama Karyawan wajib diisi'
  } else if (String(dto.nama).trim().length < 2) {
    errors.nama = 'Nama Karyawan minimal 2 karakter'
  }

  // 4. Jabatan validation
  if (!dto.jabatan_id || Number(dto.jabatan_id) <= 0) {
    errors.jabatan_id = 'Jabatan wajib dipilih'
  }

  // 5. Status Karyawan validation
  if (!dto.status_karyawan_id || Number(dto.status_karyawan_id) <= 0) {
    errors.status_karyawan_id = 'Status Karyawan wajib dipilih'
  }

  // 6. Optional NIK duplicate check if provided
  if (dto.nik && String(dto.nik).trim()) {
    const trimmedNik = String(dto.nik).trim().toLowerCase()
    const duplicateNik = existingEmployees.find(
      e => e.id !== currentId && e.nik?.toLowerCase() === trimmedNik
    )
    if (duplicateNik) {
      errors.nik = `NIK '${dto.nik}' sudah terdaftar`
    }
  }

  // 7. Optional Email validation
  if (dto.email && String(dto.email).trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(dto.email).trim())) {
      errors.email = 'Format alamat email tidak valid'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
