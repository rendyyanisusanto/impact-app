import type { AuthUser, MockLoginInput } from '@/shared/types/auth.types'
import { mockAuthService, type AuthService } from '@/modules/auth/services/mock-auth.service'
import { apiAuthService } from '@/modules/auth/services/api-auth.service'
import type { ApiResponse } from '@/shared/types/api.types'

class AuthServiceAdapter implements AuthService {
  private get activeService(): AuthService {
    const isMock =
      import.meta.env.MODE === 'test' || String(import.meta.env.VITE_USE_MOCK) === 'true'
    return isMock ? mockAuthService : apiAuthService
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.activeService.getCurrentUser()
  }

  async login(input: MockLoginInput | string): Promise<AuthUser> {
    const loginInput: MockLoginInput = typeof input === 'string' ? { username: input } : input
    return this.activeService.login(loginInput)
  }

  async switchUser(userId: string | number): Promise<AuthUser> {
    return this.activeService.switchUser(userId)
  }

  async logout(): Promise<void> {
    return this.activeService.logout()
  }

  // Legacy wrappers for ApiResponse format compatibility
  async getCurrentUserResponse(): Promise<ApiResponse<AuthUser>> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('Unauthenticated')
    return { success: true, data: user }
  }
}

export const authService = new AuthServiceAdapter()
export type { AuthService }
