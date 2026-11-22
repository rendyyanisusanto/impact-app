import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppUserMenu from '@/app/layouts/components/AppUserMenu.vue'
import { routes } from '@/app/router/routes'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'

describe('AppUserMenu.vue (Task 5: User Profile & Account Menu)', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    await router.push('/dashboard')
    await router.isReady()
  })

  it('renders initial avatar, username, and role from authStore', () => {
    const authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0] // Super Admin

    const wrapper = mount(AppUserMenu, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain(MOCK_USERS[0].name)
    expect(wrapper.text()).toContain(MOCK_USERS[0].roleName)
    // Check initial avatar text
    expect(wrapper.find('button[aria-label="User profile menu"]').text()).toContain('SA')
  })

  it('toggles dropdown menu on button click and closes on escape', async () => {
    const authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0]

    const wrapper = mount(AppUserMenu, {
      global: {
        plugins: [router],
        stubs: {
          transition: true
        }
      },
      attachTo: document.body
    })

    const triggerBtn = wrapper.find('button[aria-label="User profile menu"]')
    expect(triggerBtn.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    // Open dropdown
    await triggerBtn.trigger('click')
    expect(triggerBtn.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Profil Saya')
    expect(wrapper.text()).toContain('Pengaturan Akun')
    expect(wrapper.text()).toContain('Keluar (Logout)')

    // Press Escape
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(triggerBtn.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('closes dropdown when clicking outside', async () => {
    const authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0]

    const wrapper = mount(AppUserMenu, {
      global: {
        plugins: [router],
        stubs: {
          transition: true
        }
      },
      attachTo: document.body
    })

    const triggerBtn = wrapper.find('button[aria-label="User profile menu"]')
    await triggerBtn.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    // Click outside
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('handles logout process, clears session, and redirects to /login', async () => {
    const authStore = useAuthStore()
    authStore.currentUser = MOCK_USERS[0]
    authStore.isAuthenticated = true

    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(AppUserMenu, {
      global: {
        plugins: [router],
        stubs: {
          transition: true
        }
      }
    })

    // Open menu
    await wrapper.find('button[aria-label="User profile menu"]').trigger('click')
    const logoutBtn = wrapper
      .findAll('button[role="menuitem"]')
      .find(b => b.text().includes('Keluar'))
    expect(logoutBtn).toBeDefined()
    expect(logoutBtn?.attributes('disabled')).toBeUndefined()

    // Trigger logout
    await logoutBtn!.trigger('click')
    await flushPromises()

    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.currentUser).toBeNull()
    expect(pushSpy).toHaveBeenCalledWith('/login')
  })
})
