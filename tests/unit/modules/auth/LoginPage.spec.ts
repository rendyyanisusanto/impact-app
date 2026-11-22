import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginPage from '@/modules/auth/pages/LoginPage.vue'
import { useAuthStore } from '@/stores/auth.store'

describe('Sprint 2 — Task 1: Login Page UI & UX', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', component: { template: '<div>Login</div>' } },
        { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
        { path: '/sales/orders', component: { template: '<div>Orders</div>' } }
      ]
    })
    await router.push('/login')
    await router.isReady()
  })

  it('1. Renders split-screen branding panel and login form elements', () => {
    const wrapper = mount(LoginPage, {
      global: { plugins: [router] }
    })

    // Branding checks
    expect(wrapper.text()).toContain('IMPACT FURNITURE')
    expect(wrapper.text()).toContain('Management Information System')
    expect(wrapper.text()).toContain('Sistem Informasi Manajemen Terintegrasi')

    // Form checks
    expect(wrapper.text()).toContain('Selamat Datang')
    expect(wrapper.text()).toContain('Masuk ke akun Anda')
    expect(wrapper.find('input[autocomplete="username"]').exists()).toBe(true)
    expect(wrapper.find('input[autocomplete="current-password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('2. Validates required username with trimmed spaces', async () => {
    const wrapper = mount(LoginPage, {
      global: { plugins: [router] }
    })

    const usernameInput = wrapper.find('input[autocomplete="username"]')
    const passwordInput = wrapper.find('input[autocomplete="current-password"]')

    // Enter only whitespace
    await usernameInput.setValue('   ')
    await passwordInput.setValue('secret123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Username wajib diisi.')
  })

  it('3. Validates required password without trimming characters', async () => {
    const wrapper = mount(LoginPage, {
      global: { plugins: [router] }
    })

    const usernameInput = wrapper.find('input[autocomplete="username"]')
    const passwordInput = wrapper.find('input[autocomplete="current-password"]')

    await usernameInput.setValue('superadmin')
    await passwordInput.setValue('')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Password wajib diisi.')
  })

  it('4. Toggles password visibility correctly with accessible label', async () => {
    const wrapper = mount(LoginPage, {
      global: { plugins: [router] }
    })

    const passwordInput = wrapper.find('input[autocomplete="current-password"]')
    expect(passwordInput.attributes('type')).toBe('password')

    // Find visibility toggle button
    const toggleBtn = wrapper.find('button[aria-label="Tampilkan password"]')
    expect(toggleBtn.exists()).toBe(true)
    expect(toggleBtn.attributes('type')).toBe('button')

    // Click toggle to reveal password
    await toggleBtn.trigger('click')
    expect(passwordInput.attributes('type')).toBe('text')
    expect(wrapper.find('button[aria-label="Sembunyikan password"]').exists()).toBe(true)

    // Click toggle again to hide password
    await toggleBtn.trigger('click')
    expect(passwordInput.attributes('type')).toBe('password')
  })

  it('5. Handles successful login and navigation to dashboard', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(LoginPage, {
      global: { plugins: [router] }
    })

    await wrapper.find('input[autocomplete="username"]').setValue('superadmin')
    await wrapper.find('input[autocomplete="current-password"]').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    // Auth state should be authenticated
    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(true)
    expect(pushSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('6. Displays authentication error when invalid credentials are provided', async () => {
    const wrapper = mount(LoginPage, {
      global: { plugins: [router] }
    })

    await wrapper.find('input[autocomplete="username"]').setValue('nonexistent_user')
    await wrapper.find('input[autocomplete="current-password"]').setValue('wrongpass')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Username atau password tidak valid')
  })

  it('7. Handles login for different role credentials', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    const authStore = useAuthStore()
    await authStore.logout()

    const wrapper = mount(LoginPage, {
      global: { plugins: [router] }
    })

    await wrapper.find('input[autocomplete="username"]').setValue('staff.penjualan')
    await wrapper.find('input[autocomplete="current-password"]').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.currentUser?.username).toBe('staff.penjualan')
    expect(pushSpy).toHaveBeenCalledWith('/dashboard')
  })
})
