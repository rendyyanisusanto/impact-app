import type { CreateUserPayload, UpdateUserPayload, UserValidationError, User } from '../types/user.types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/

/**
 * Validates username string
 */
export function validateUsername(
  username: string,
  existingUsers: User[],
  currentUserId?: number
): string | null {
  const trimmed = username.trim()
  if (!trimmed) {
    return 'Username wajib diisi.'
  }
  if (trimmed.length < 3) {
    return 'Username minimal 3 karakter.'
  }
  if (trimmed.length > 50) {
    return 'Username maksimal 50 karakter.'
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return 'Username hanya boleh terdiri dari huruf, angka, titik (.), minus (-), atau underscore (_).'
  }

  // Duplicate check (case-insensitive)
  const isDuplicate = existingUsers.some(
    u => u.username.toLowerCase() === trimmed.toLowerCase() && u.id !== currentUserId
  )
  if (isDuplicate) {
    return `Username "${trimmed}" sudah digunakan oleh akun lain.`
  }

  // Superadmin username protection: ID 1 cannot change username from administrator/superadmin
  if (currentUserId === 1) {
    const rootUser = existingUsers.find(u => u.id === 1)
    if (rootUser && trimmed.toLowerCase() !== rootUser.username.toLowerCase()) {
      return 'Username akun Superadmin root tidak dapat diubah.'
    }
  }

  return null
}

/**
 * Validates email string
 */
export function validateEmail(
  email: string,
  existingUsers: User[],
  currentUserId?: number
): string | null {
  const trimmed = email.trim()
  if (!trimmed) {
    return 'Email wajib diisi.'
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Format email tidak valid (contoh: user@impactfurniture.co.id).'
  }

  // Duplicate check (case-insensitive)
  const isDuplicate = existingUsers.some(
    u => u.email.toLowerCase() === trimmed.toLowerCase() && u.id !== currentUserId
  )
  if (isDuplicate) {
    return `Email "${trimmed}" sudah terdaftar pada akun lain.`
  }

  return null
}

/**
 * Validates password
 */
export function validatePassword(
  password?: string,
  isRequired: boolean = true,
  passwordConfirm?: string
): string | null {
  if (!password || !password.trim()) {
    if (isRequired) {
      return 'Password wajib diisi.'
    }
    return null // Optional on edit
  }

  if (password.length < 6) {
    return 'Password minimal 6 karakter.'
  }

  if (passwordConfirm !== undefined && password !== passwordConfirm) {
    return 'Konfirmasi password tidak cocok.'
  }

  return null
}

/**
 * Validates PIN (Legacy standard 4-8 digits)
 */
export function validatePin(pin?: string, isRequired: boolean = true): string | null {
  if (!pin || !pin.trim()) {
    if (isRequired) {
      return 'PIN otorisasi transaksi wajib diisi.'
    }
    return null // Optional on edit
  }

  const trimmed = pin.trim()
  if (!/^\d+$/.test(trimmed)) {
    return 'PIN hanya boleh berupa angka.'
  }

  if (trimmed.length < 4 || trimmed.length > 8) {
    return 'PIN harus terdiri dari 4 hingga 8 digit angka.'
  }

  return null
}

/**
 * Validates full creation form payload
 */
export function validateCreateUserForm(
  payload: CreateUserPayload,
  existingUsers: User[]
): { isValid: boolean; errors: UserValidationError[] } {
  const errors: UserValidationError[] = []

  // Employee
  if (!payload.employeeId) {
    errors.push({ field: 'employeeId', message: 'Karyawan wajib dipilih.' })
  }

  // Nama Lengkap (First Name)
  if (!payload.firstName || !payload.firstName.trim()) {
    errors.push({ field: 'firstName', message: 'Nama Lengkap wajib diisi.' })
  } else if (payload.firstName.trim().length < 2) {
    errors.push({ field: 'firstName', message: 'Nama Lengkap minimal 2 karakter.' })
  }

  // Username
  const usernameError = validateUsername(payload.username, existingUsers)
  if (usernameError) {
    errors.push({ field: 'username', message: usernameError })
  }

  // Email
  const emailError = validateEmail(payload.email, existingUsers)
  if (emailError) {
    errors.push({ field: 'email', message: emailError })
  }

  // Password
  const passwordError = validatePassword(payload.password, true, payload.passwordConfirm)
  if (passwordError) {
    errors.push({ field: 'password', message: passwordError })
  }

  // PIN
  const pinError = validatePin(payload.pin, true)
  if (pinError) {
    errors.push({ field: 'pin', message: pinError })
  }

  // Groups
  if (!payload.groupId) {
    errors.push({ field: 'groupId', message: 'Groups/Role wajib dipilih.' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates update form payload
 */
export function validateUpdateUserForm(
  id: number,
  payload: UpdateUserPayload,
  existingUsers: User[]
): { isValid: boolean; errors: UserValidationError[] } {
  const errors: UserValidationError[] = []

  // Nama Lengkap
  if (!payload.firstName || !payload.firstName.trim()) {
    errors.push({ field: 'firstName', message: 'Nama Lengkap wajib diisi.' })
  } else if (payload.firstName.trim().length < 2) {
    errors.push({ field: 'firstName', message: 'Nama Lengkap minimal 2 karakter.' })
  }

  // Username
  const usernameError = validateUsername(payload.username, existingUsers, id)
  if (usernameError) {
    errors.push({ field: 'username', message: usernameError })
  }

  // Email
  const emailError = validateEmail(payload.email, existingUsers, id)
  if (emailError) {
    errors.push({ field: 'email', message: emailError })
  }

  // Optional Password on edit
  if (payload.password) {
    const passwordError = validatePassword(payload.password, false)
    if (passwordError) {
      errors.push({ field: 'password', message: passwordError })
    }
  }

  // Optional PIN on edit
  if (payload.pin) {
    const pinError = validatePin(payload.pin, false)
    if (pinError) {
      errors.push({ field: 'pin', message: pinError })
    }
  }

  // Groups
  if (!payload.groupId) {
    errors.push({ field: 'groupId', message: 'Groups/Role wajib dipilih.' })
  }

  // Superadmin Protection: Cannot deactivate or demote group of root Superadmin (ID 1)
  if (id === 1) {
    if (payload.active === 0) {
      errors.push({ field: 'active', message: 'Akun Superadmin root tidak dapat dinonaktifkan.' })
    }
    if (payload.groupId !== 1) {
      errors.push({ field: 'groupId', message: 'Group akun Superadmin root tidak dapat diubah.' })
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
