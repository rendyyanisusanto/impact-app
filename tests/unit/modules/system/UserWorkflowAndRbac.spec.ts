import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import UserListPage from '@/modules/system/users/pages/UserListPage.vue'
import UserCreatePage from '@/modules/system/users/pages/UserCreatePage.vue'
import UserEditPage from '@/modules/system/users/pages/UserEditPage.vue'
import UserDetailPage from '@/modules/system/users/pages/UserDetailPage.vue'
import { userService } from '@/modules/system/users/services/user.service'
import { useAuthStore } from '@/stores/auth.store'
import { mockAuthService } from '@/modules/auth/services/mock-auth.service'
import { routes } from '@/app/router/routes'

describe('Sprint 9 — Task 5–9: Master Data User End-to-End Workflow & Security Integration', () => {
  let router: ReturnType<typeof createRouter>

  const testRoutes = [
    { path: '/system/users', name: 'system-users', component: UserListPage },
    { path: '/system/users/create', name: 'system-users-create', component: UserCreatePage },
    { path: '/system/users/:id', name: 'system-users-detail', component: UserDetailPage },
    { path: '/system/users/:id/edit', name: 'system-users-edit', component: UserEditPage }
  ]

  beforeEach(async () => {
    setActivePinia(createPinia())
    userService.resetToInitialSeeds()

    router = createRouter({
      history: createWebHistory(),
      routes: testRoutes
    })

    const authStore = useAuthStore()
    authStore.currentUser = {
      id: 1,
      name: 'Superadmin',
      username: 'administrator',
      roleId: '1',
      roleName: 'admin',
      role: 'superadmin',
      email: 'admin@impactfurniture.co.id',
      permissions: [{ resource: '*', actions: ['create', 'read', 'update', 'delete'] }]
    }

    await router.push('/system/users')
    await router.isReady()
  })

  it('executes complete 17-step user management workflow covering CRUD, preview, security, RBAC, and login enforcement', async () => {
    // -------------------------------------------------------------
    // Step 1: Render UserListPage and verify initial seed users
    // -------------------------------------------------------------
    const listWrapper = mount(UserListPage, {
      global: {
        plugins: [router]
      }
    })

    await flushPromises()
    expect(listWrapper.text()).toContain('Master Data User')
    expect(listWrapper.text()).toContain('administrator')
    expect(listWrapper.text()).toContain('staff.penjualan')
    expect(listWrapper.text()).toContain('staff.gudang')

    // -------------------------------------------------------------
    // Step 2: Search filter debounced
    // -------------------------------------------------------------
    const searchInput = listWrapper.find('input[placeholder*="Cari nama"]')
    expect(searchInput.exists()).toBe(true)
    await searchInput.setValue('staff.gudang')
    await new Promise(r => setTimeout(r, 350)) // Wait for debounce
    await flushPromises()

    expect(listWrapper.text()).toContain('staff.gudang')
    expect(listWrapper.text()).not.toContain('staff.penjualan')

    // Reset search
    await searchInput.setValue('')
    await new Promise(r => setTimeout(r, 350))
    await flushPromises()

    // -------------------------------------------------------------
    // Step 3: Filter by Role / Group
    // -------------------------------------------------------------
    const groupSelect = listWrapper.findAll('select')[0]
    await groupSelect.setValue(4) // Gudang
    await flushPromises()
    expect(listWrapper.text()).toContain('GUDANG')

    // Reset filter
    await groupSelect.setValue('all')
    await flushPromises()

    // -------------------------------------------------------------
    // Step 4: Create new user via service
    // -------------------------------------------------------------
    const createdUser = await userService.create({
      employeeId: 54, // ACHMAD
      firstName: 'Achmad Supir ERP',
      username: 'achmad.driver',
      email: 'achmad.driver@impactfurniture.co.id',
      password: 'driverpassword123',
      passwordConfirm: 'driverpassword123',
      pin: '556677',
      groupId: 6, // Co Admin / Pengiriman
      active: 1
    })

    expect(createdUser.id).toBeDefined()
    expect(createdUser.username).toBe('achmad.driver')
    expect(createdUser.employeeName).toBe('ACHMAD')

    // -------------------------------------------------------------
    // Step 5: Duplicate username validation check
    // -------------------------------------------------------------
    await expect(
      userService.create({
        employeeId: 53,
        firstName: 'Duplicate Test',
        username: 'achmad.driver', // duplicate
        email: 'other@impactfurniture.co.id',
        password: 'password123',
        pin: '123456',
        groupId: 4
      })
    ).rejects.toThrow('sudah digunakan')

    // -------------------------------------------------------------
    // Step 6: Duplicate email validation check
    // -------------------------------------------------------------
    await expect(
      userService.create({
        employeeId: 53,
        firstName: 'Duplicate Email Test',
        username: 'new.unique.user',
        email: 'achmad.driver@impactfurniture.co.id', // duplicate
        password: 'password123',
        pin: '123456',
        groupId: 4
      })
    ).rejects.toThrow('sudah terdaftar')

    // -------------------------------------------------------------
    // Step 7: Inspect UserDetailPage for the created user
    // -------------------------------------------------------------
    await router.push(`/system/users/${createdUser.id}`)
    await flushPromises()

    const detailWrapper = mount(UserDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await flushPromises()
    expect(detailWrapper.text()).toContain('Detail User: achmad.driver')
    expect(detailWrapper.text()).toContain('Achmad Supir ERP')
    expect(detailWrapper.text()).toContain('achmad.driver@impactfurniture.co.id')
    expect(detailWrapper.text()).toContain('Sudah diset') // PIN status
    expect(detailWrapper.text()).toContain('ACHMAD') // Linked employee

    // -------------------------------------------------------------
    // Step 8: STRICT SECURITY CHECK: Credentials never exposed
    // -------------------------------------------------------------
    expect(detailWrapper.text()).not.toContain('driverpassword123')
    expect(detailWrapper.text()).not.toContain('556677') // PIN
    expect(detailWrapper.html()).not.toContain('driverpassword123')
    expect(detailWrapper.html()).not.toContain('556677')

    // -------------------------------------------------------------
    // Step 9: Edit user profile while preserving password & PIN
    // -------------------------------------------------------------
    const updatedUser = await userService.update(createdUser.id, {
      firstName: 'Achmad Senior Driver',
      username: 'achmad.driver',
      email: 'achmad.senior@impactfurniture.co.id',
      groupId: 6,
      active: 1
      // password & pin omitted
    })

    expect(updatedUser.firstName).toBe('Achmad Senior Driver')
    expect(updatedUser.email).toBe('achmad.senior@impactfurniture.co.id')

    // Verify PIN remains set
    const reloadedDetail = await userService.getById(createdUser.id)
    expect(reloadedDetail.isPinSet).toBe(true)

    // -------------------------------------------------------------
    // Step 10: Reset Password execution
    // -------------------------------------------------------------
    const passResetResult = await userService.resetPassword(createdUser.id, 'brandnewpassword')
    expect(passResetResult.success).toBe(true)

    // -------------------------------------------------------------
    // Step 11: Reset PIN execution
    // -------------------------------------------------------------
    const pinResetResult = await userService.resetPin(createdUser.id, '990011')
    expect(pinResetResult.success).toBe(true)

    // -------------------------------------------------------------
    // Step 12: Toggle Status (Deactivate user)
    // -------------------------------------------------------------
    const deactivateRes = await userService.toggleStatus(createdUser.id)
    expect(deactivateRes.user.active).toBe(0)
    expect(deactivateRes.user.statusLabel).toBe('NON AKTIF')

    // -------------------------------------------------------------
    // Step 13: Enforce Login Block for Disabled User (Task 9.4)
    // -------------------------------------------------------------
    await expect(
      mockAuthService.login({
        username: 'achmad.driver',
        password: 'brandnewpassword'
      })
    ).rejects.toThrow('sedang dinonaktifkan')

    // -------------------------------------------------------------
    // Step 14: Reactivate User
    // -------------------------------------------------------------
    const reactivateRes = await userService.toggleStatus(createdUser.id)
    expect(reactivateRes.user.active).toBe(1)
    expect(reactivateRes.user.statusLabel).toBe('AKTIF')

    // -------------------------------------------------------------
    // Step 15: Superadmin Deactivation & Deletion Protection
    // -------------------------------------------------------------
    // Attempting to deactivate Superadmin (ID 1)
    await expect(userService.toggleStatus(1)).rejects.toThrow(
      'Akun Superadmin root tidak dapat dinonaktifkan.'
    )

    // Attempting to delete Superadmin (ID 1)
    await expect(userService.delete(1)).rejects.toThrow(
      'Akun Superadmin root tidak dapat dihapus.'
    )

    // -------------------------------------------------------------
    // Step 16: Delete created test user
    // -------------------------------------------------------------
    const deleteRes = await userService.delete(createdUser.id)
    expect(deleteRes.success).toBe(true)
    await expect(userService.getById(createdUser.id)).rejects.toThrow('tidak ditemukan')

    // -------------------------------------------------------------
    // Step 17: Route Registration and RBAC Verification
    // -------------------------------------------------------------
    const layoutRoute = routes.find(r => r.children && r.children.length > 0)
    const systemUsersRoute = layoutRoute?.children?.find(r => r.path === 'system/users')
    expect(systemUsersRoute).toBeDefined()
    expect(systemUsersRoute?.meta?.permission).toBe('system:read')

    const createRoute = layoutRoute?.children?.find(r => r.path === 'system/users/create')
    expect(createRoute).toBeDefined()
    expect(createRoute?.meta?.permission).toBe('system:create')

    const editRoute = layoutRoute?.children?.find(r => r.path === 'system/users/:id/edit')
    expect(editRoute).toBeDefined()
    expect(editRoute?.meta?.permission).toBe('system:update')

    const detailRoute = layoutRoute?.children?.find(r => r.path === 'system/users/:id')
    expect(detailRoute).toBeDefined()
    expect(detailRoute?.meta?.permission).toBe('system:read')
  })
})