import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validatePin,
  validateCreateUserForm,
  validateUpdateUserForm
} from '@/modules/system/users/utils/user-validation'
import type { User, CreateUserPayload, UpdateUserPayload } from '@/modules/system/users/types/user.types'

describe('Sprint 9 — Task 5 & 9: User Validation & Security Tests', () => {
  let mockUsers: User[] = []

  beforeEach(() => {
    mockUsers = [
      {
        id: 1,
        username: 'administrator',
        email: 'admin@impactfurniture.co.id',
        firstName: 'Administrator',
        active: 1,
        employeeId: null,
        table: 'karyawan',
        groupId: 1,
        ipAddress: '127.0.0.1',
        pin: '101711',
        passwordHash: '$mock_hash_1',
        createdOn: '2023-01-01 08:00:00',
        lastLogin: '2026-11-01 08:00:00'
      },
      {
        id: 2,
        username: 'staff.penjualan',
        email: 'ahmad@impactfurniture.co.id',
        firstName: 'Ahmad Fauzi',
        active: 1,
        employeeId: 54,
        table: 'karyawan',
        groupId: 3,
        ipAddress: '192.168.1.10',
        pin: '123456',
        passwordHash: '$mock_hash_2',
        createdOn: '2023-01-15 09:30:00',
        lastLogin: null
      }
    ]
  })

  describe('Username Validation', () => {
    it('rejects empty or whitespace username', () => {
      expect(validateUsername('', mockUsers)).toBe('Username wajib diisi.')
      expect(validateUsername('   ', mockUsers)).toBe('Username wajib diisi.')
    })

    it('rejects username shorter than 3 characters', () => {
      expect(validateUsername('ab', mockUsers)).toBe('Username minimal 3 karakter.')
    })

    it('rejects username longer than 50 characters', () => {
      const longName = 'a'.repeat(51)
      expect(validateUsername(longName, mockUsers)).toBe('Username maksimal 50 karakter.')
    })

    it('rejects invalid characters in username', () => {
      expect(validateUsername('ahmad fauzi', mockUsers)).toContain('hanya boleh terdiri dari huruf')
      expect(validateUsername('user@test', mockUsers)).toContain('hanya boleh terdiri dari huruf')
      expect(validateUsername('user#1', mockUsers)).toContain('hanya boleh terdiri dari huruf')
    })

    it('accepts valid usernames with dots, hyphens, and underscores', () => {
      expect(validateUsername('ahmad.fauzi', mockUsers)).toBeNull()
      expect(validateUsername('staff-gudang', mockUsers)).toBeNull()
      expect(validateUsername('user_operator_01', mockUsers)).toBeNull()
    })

    it('rejects duplicate usernames case-insensitively', () => {
      expect(validateUsername('ADMINISTRATOR', mockUsers)).toContain('sudah digunakan')
      expect(validateUsername('staff.penjualan', mockUsers)).toContain('sudah digunakan')
    })

    it('allows keeping same username when editing own account', () => {
      expect(validateUsername('staff.penjualan', mockUsers, 2)).toBeNull()
    })

    it('prevents changing Superadmin root (ID 1) username', () => {
      expect(validateUsername('new.admin', mockUsers, 1)).toBe(
        'Username akun Superadmin root tidak dapat diubah.'
      )
      expect(validateUsername('administrator', mockUsers, 1)).toBeNull()
    })
  })

  describe('Email Validation', () => {
    it('rejects empty email', () => {
      expect(validateEmail('', mockUsers)).toBe('Email wajib diisi.')
    })

    it('rejects invalid email formats', () => {
      expect(validateEmail('not-an-email', mockUsers)).toContain('Format email tidak valid')
      expect(validateEmail('test@', mockUsers)).toContain('Format email tidak valid')
      expect(validateEmail('test@domain', mockUsers)).toContain('Format email tidak valid')
    })

    it('rejects duplicate emails case-insensitively', () => {
      expect(validateEmail('ADMIN@IMPACTFURNITURE.CO.ID', mockUsers)).toContain('sudah terdaftar')
      expect(validateEmail('ahmad@impactfurniture.co.id', mockUsers)).toContain('sudah terdaftar')
    })

    it('allows keeping same email when editing own account', () => {
      expect(validateEmail('ahmad@impactfurniture.co.id', mockUsers, 2)).toBeNull()
    })

    it('accepts valid unique emails', () => {
      expect(validateEmail('budi.santoso@impactfurniture.co.id', mockUsers)).toBeNull()
    })
  })

  describe('Password Validation', () => {
    it('requires password on create', () => {
      expect(validatePassword('', true)).toBe('Password wajib diisi.')
      expect(validatePassword(undefined, true)).toBe('Password wajib diisi.')
    })

    it('allows empty password on edit', () => {
      expect(validatePassword('', false)).toBeNull()
      expect(validatePassword(undefined, false)).toBeNull()
    })

    it('rejects password shorter than 6 characters', () => {
      expect(validatePassword('12345', true)).toBe('Password minimal 6 karakter.')
      expect(validatePassword('abc', false)).toBe('Password minimal 6 karakter.')
    })

    it('verifies confirmation match', () => {
      expect(validatePassword('secret123', true, 'different456')).toBe(
        'Konfirmasi password tidak cocok.'
      )
      expect(validatePassword('secret123', true, 'secret123')).toBeNull()
    })
  })

  describe('PIN Validation', () => {
    it('requires PIN on create', () => {
      expect(validatePin('', true)).toBe('PIN otorisasi transaksi wajib diisi.')
    })

    it('allows empty PIN on edit', () => {
      expect(validatePin('', false)).toBeNull()
    })

    it('rejects non-numeric characters in PIN', () => {
      expect(validatePin('12a4', true)).toBe('PIN hanya boleh berupa angka.')
      expect(validatePin('12-34', true)).toBe('PIN hanya boleh berupa angka.')
    })

    it('enforces PIN length between 4 and 8 digits', () => {
      expect(validatePin('123', true)).toBe('PIN harus terdiri dari 4 hingga 8 digit angka.')
      expect(validatePin('123456789', true)).toBe('PIN harus terdiri dari 4 hingga 8 digit angka.')
      expect(validatePin('101711', true)).toBeNull() // Legacy 6 digits
      expect(validatePin('1234', true)).toBeNull() // 4 digits
      expect(validatePin('12345678', true)).toBeNull() // 8 digits
    })
  })

  describe('Form DTO Validations', () => {
    it('validates complete valid CreateUserPayload', () => {
      const payload: CreateUserPayload = {
        employeeId: 53,
        firstName: 'Budi Santoso',
        username: 'staff.gudang',
        email: 'budi@impactfurniture.co.id',
        password: 'password123',
        passwordConfirm: 'password123',
        pin: '234567',
        groupId: 4,
        active: 1
      }
      const result = validateCreateUserForm(payload, mockUsers)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('accumulates validation errors for missing fields on create', () => {
      const payload: CreateUserPayload = {
        employeeId: null,
        firstName: '',
        username: '',
        email: 'invalid-email',
        password: '123',
        pin: '',
        groupId: 0
      }
      const result = validateCreateUserForm(payload, mockUsers)
      expect(result.isValid).toBe(false)
      const errorFields = result.errors.map(e => e.field)
      expect(errorFields).toContain('employeeId')
      expect(errorFields).toContain('firstName')
      expect(errorFields).toContain('username')
      expect(errorFields).toContain('email')
      expect(errorFields).toContain('password')
      expect(errorFields).toContain('pin')
      expect(errorFields).toContain('groupId')
    })

    it('enforces Superadmin protection in UpdateUserPayload', () => {
      const payload: UpdateUserPayload = {
        firstName: 'Root Administrator',
        username: 'administrator',
        email: 'admin@impactfurniture.co.id',
        groupId: 2, // Attempting to demote group
        active: 0 // Attempting to deactivate
      }
      const result = validateUpdateUserForm(1, payload, mockUsers)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.message.includes('tidak dapat dinonaktifkan'))).toBe(true)
      expect(result.errors.some(e => e.message.includes('tidak dapat diubah'))).toBe(true)
    })
  })
})
