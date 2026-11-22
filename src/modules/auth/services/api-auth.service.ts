import type { AuthUser, MockLoginInput } from '@/shared/types/auth.types'
import { mockAuthService, type AuthService } from './mock-auth.service'

class ApiAuthService implements AuthService {
  private readonly baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1') + '/auth'
  private readonly tokenKey = 'smm_access_token'

  getToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null
    try {
      return localStorage.getItem(this.tokenKey)
    } catch {
      return null
    }
  }

  setToken(token: string | null): void {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      if (token) {
        localStorage.setItem(this.tokenKey, token)
      } else {
        localStorage.removeItem(this.tokenKey)
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  async login(input: MockLoginInput | string): Promise<AuthUser> {
    const payload = typeof input === 'string' ? { username: input, password: '' } : input
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        username: payload.username,
        password: payload.password
      })
    })

    const body = await response.json()
    if (!response.ok || !body.success) {
      throw new Error(body.message || 'Kredensial login tidak valid. Username atau password salah.')
    }

    if (body.data?.token) {
      this.setToken(body.data.token)
    }

    return body.data.user
  }

  /**
   * Mengambil profil user dari sesi aktif.
   *
   * - 401/403 → sesi memang tidak valid: token dihapus, mengembalikan `null` (guest).
   * - Error sementara (jaringan putus, backend sedang restart, 5xx, 429) → TIDAK menghapus
   *   token agar sesi tidak hilang; dicoba ulang beberapa kali, lalu melempar error.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const maxAttempts = 3
    let lastError: unknown = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const headers: Record<string, string> = {}
        const token = this.getToken()
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(`${this.baseUrl}/me`, {
          method: 'GET',
          headers,
          credentials: 'include'
        })

        if (response.status === 401 || response.status === 403) {
          this.setToken(null)
          return null
        }

        if (!response.ok) {
          throw new Error(`Gagal memuat sesi (HTTP ${response.status})`)
        }

        const body = await response.json()
        if (!body.success || !body.data) return null
        return body.data
      } catch (err) {
        lastError = err
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 400 * attempt))
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Gagal memuat sesi pengguna.')
  }

  async logout(): Promise<void> {
    try {
      const headers: Record<string, string> = {}
      const token = this.getToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers,
        credentials: 'include'
      })
    } finally {
      this.setToken(null)
    }
  }

  async switchUser(userId: string | number): Promise<AuthUser> {
    return mockAuthService.switchUser(userId)
  }
}

export const apiAuthService = new ApiAuthService()

