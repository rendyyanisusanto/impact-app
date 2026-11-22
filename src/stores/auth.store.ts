import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser, MockLoginInput, PermissionAction } from '@/shared/types/auth.types'
import { authService } from '@/shared/services/auth.service'
import {
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions
} from '@/shared/utils/permissions'
import { MOCK_USERS } from '@/mocks/users.mock'

const USER_STORAGE_KEY = 'smm_user'

function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function setStoredUser(user: AuthUser | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export const useAuthStore = defineStore('auth', () => {
  const isMock = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.MODE === 'test'
  const storedUser = !isMock ? getStoredUser() : null
  const currentUser = ref<AuthUser | null>(isMock ? MOCK_USERS[0] : storedUser)
  const isAuthenticated = ref(isMock || Boolean(storedUser))
  const isLoading = ref(false)
  const isInitialized = ref(isMock)
  const error = ref<string | null>(null)

  // Backward compatibility: alias `user` to `currentUser`
  const user = computed({
    get: () => currentUser.value,
    set: val => {
      currentUser.value = val
    }
  })

  const isSuperadmin = computed(() => {
    if (!currentUser.value) return false
    return (
      currentUser.value.role === 'superadmin' ||
      currentUser.value.roleId === 'role-superadmin' ||
      currentUser.value.permissions.some(p => p.resource === '*')
    )
  })

  const userRole = computed(() => currentUser.value?.roleName || currentUser.value?.role || 'Guest')

  const userPermissions = computed(() => currentUser.value?.permissions ?? [])

  function hasPermission(permission: string, action?: PermissionAction): boolean {
    if (isSuperadmin.value) return true
    return checkPermission(currentUser.value, permission, action)
  }

  function hasAnyPermission(permissions: string[]): boolean {
    if (isSuperadmin.value) return true
    return checkAnyPermission(currentUser.value, permissions)
  }

  function hasAllPermissions(permissions: string[]): boolean {
    if (isSuperadmin.value) return true
    return checkAllPermissions(currentUser.value, permissions)
  }

  function clearError() {
    error.value = null
  }

  async function initializeAuth() {
    isLoading.value = true
    try {
      const user = await authService.getCurrentUser()
      if (user) {
        currentUser.value = user
        isAuthenticated.value = true
        if (!isMock) setStoredUser(user)
      } else {
        currentUser.value = null
        isAuthenticated.value = false
        if (!isMock) setStoredUser(null)
      }
    } catch {
      // Error sementara (backend restart / jaringan): jangan menghapus sesi yang sudah ada.
      // Token tetap tersimpan sehingga sesi pulih otomatis saat halaman dimuat ulang.
      if (!currentUser.value) {
        isAuthenticated.value = false
      }
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  async function login(usernameOrInput: string | MockLoginInput, password?: string) {
    if (isLoading.value) {
      throw new Error('Proses login sedang berjalan. Harap tunggu.')
    }
    isLoading.value = true
    error.value = null
    try {
      const input: MockLoginInput =
        typeof usernameOrInput === 'string'
          ? { username: usernameOrInput, password }
          : usernameOrInput
      const user = await authService.login(input)
      currentUser.value = user
      isAuthenticated.value = true
      if (!isMock) setStoredUser(user)
      return user
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Kredensial login tidak valid'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    try {
      await authService.logout()
      currentUser.value = null
      isAuthenticated.value = false
      error.value = null
      if (!isMock) setStoredUser(null)
    } finally {
      isLoading.value = false
    }
  }

  async function switchUser(userId: string | number) {
    isLoading.value = true
    try {
      const user = await authService.switchUser(userId)
      currentUser.value = user
      isAuthenticated.value = true
      error.value = null
      return user
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentUser,
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    userRole,
    isSuperadmin,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    clearError,
    initializeAuth,
    login,
    logout,
    switchUser
  }
})
