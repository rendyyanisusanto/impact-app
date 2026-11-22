import type { AuthUser, MockLoginInput } from '@/shared/types/auth.types'
import { MOCK_USERS } from '@/mocks/users.mock'

export interface AuthService {
  login(input: MockLoginInput): Promise<AuthUser>
  logout(): Promise<void>
  getCurrentUser(): Promise<AuthUser | null>
  switchUser(userId: string | number): Promise<AuthUser>
}

// In-memory status & dynamic user registry for test/runtime synchronization
const disabledUsernames = new Set<string>()
const dynamicAuthUsers = new Map<string, AuthUser>()

export function registerDynamicAuthUser(user: AuthUser, active: boolean = true): void {
  const lower = user.username.toLowerCase()
  dynamicAuthUsers.set(lower, user)
  if (!active) {
    disabledUsernames.add(lower)
  } else {
    disabledUsernames.delete(lower)
  }
}

export function unregisterDynamicAuthUser(username: string): void {
  const lower = username.toLowerCase()
  dynamicAuthUsers.delete(lower)
  disabledUsernames.delete(lower)
}

export function setMockUserActiveStatus(username: string, active: boolean): void {
  const lower = username.toLowerCase()
  if (!active) {
    disabledUsernames.add(lower)
  } else {
    disabledUsernames.delete(lower)
  }
}

export function resetMockAuthRegistry(): void {
  disabledUsernames.clear()
  dynamicAuthUsers.clear()
}

class MockAuthService implements AuthService {
  // In-memory fallback and safe sessionStorage session (only stores mock user ID, never passwords/tokens)
  private inMemoryUserId: string | number | null = '1'
  private readonly storageKey = 'impact_mock_session_user_id'

  private getSessionUserId(): string | number | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const stored = window.sessionStorage.getItem(this.storageKey)
        if (stored !== null) return stored
      } catch {
        // Fallback to in-memory if sessionStorage is restricted
      }
    }
    return this.inMemoryUserId
  }

  private setSessionUserId(id: string | number | null): void {
    this.inMemoryUserId = id
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        if (id) {
          window.sessionStorage.setItem(this.storageKey, String(id))
        } else {
          window.sessionStorage.removeItem(this.storageKey)
        }
      } catch {
        // Fallback to in-memory
      }
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const currentId = this.getSessionUserId()
    if (!currentId) return null
    if (String(currentId) === 'user-rendy') {
      return {
        id: 'user-rendy',
        name: 'Rendy (Super Administrator)',
        username: 'rendy',
        roleId: 'role-superadmin',
        roleName: 'Super Administrator',
        role: 'superadmin',
        email: 'rendy@gmail.com',
        permissions: [{ resource: '*', actions: ['create', 'read', 'update', 'delete'] }]
      }
    }
    const user =
      MOCK_USERS.find(u => String(u.id) === String(currentId)) ||
      Array.from(dynamicAuthUsers.values()).find(u => String(u.id) === String(currentId))
    return user || null
  }

  async login(input: MockLoginInput): Promise<AuthUser> {
    const trimmedUsername = (input.username || '').trim().toLowerCase()

    if (!trimmedUsername) {
      throw new Error('Kredensial tidak valid. Username wajib diisi.')
    }

    if (disabledUsernames.has(trimmedUsername)) {
      throw new Error('Akun pengguna sedang dinonaktifkan. Silakan hubungi Administrator.')
    }

    let found = MOCK_USERS.find(u => u.username.toLowerCase() === trimmedUsername)
    if (!found) {
      found = dynamicAuthUsers.get(trimmedUsername)
    }
    if (!found && trimmedUsername === 'rendy') {
      found = {
        id: 'user-rendy',
        name: 'Rendy (Super Administrator)',
        username: 'rendy',
        roleId: 'role-superadmin',
        roleName: 'Super Administrator',
        role: 'superadmin',
        email: 'rendy@gmail.com',
        permissions: [{ resource: '*', actions: ['create', 'read', 'update', 'delete'] }]
      }
    }

    // Password validation simulation for invalid testing
    const password = input.password ?? ''
    const isExplicitlyWrongPass = password === 'wrongpass' || password === 'invalid_password'

    if (!found || isExplicitlyWrongPass) {
      throw new Error('Kredensial tidak valid. Username atau password tidak valid.')
    }

    this.setSessionUserId(found.id)
    return found
  }

  async switchUser(userId: string | number): Promise<AuthUser> {
    const found =
      MOCK_USERS.find(u => String(u.id) === String(userId)) ||
      Array.from(dynamicAuthUsers.values()).find(u => String(u.id) === String(userId))

    if (!found) {
      throw new Error('ID Pengguna tidak ditemukan dalam daftar mock.')
    }
    this.setSessionUserId(found.id)
    return found
  }

  async logout(): Promise<void> {
    this.setSessionUserId(null)
  }
}

export const mockAuthService = new MockAuthService()
