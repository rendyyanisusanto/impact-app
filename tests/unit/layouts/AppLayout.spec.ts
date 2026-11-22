import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppLayout from '@/app/layouts/AppLayout.vue'
import AppHeader from '@/app/layouts/components/AppHeader.vue'
import AppUserMenu from '@/app/layouts/components/AppUserMenu.vue'
import AppMobileNavigation from '@/app/layouts/components/AppMobileNavigation.vue'
import ModulePlaceholderPage from '@/shared/pages/ModulePlaceholderPage.vue'
import NotFoundPage from '@/shared/pages/NotFoundPage.vue'
import { useUiStore } from '@/stores/ui.store'
import { routes } from '@/app/router/routes'

describe('Sprint 1 — Task 3: Application Layout & Interactive Shell', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    document.body.innerHTML = ''
    setActivePinia(createPinia())
    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    await router.push('/dashboard')
    await router.isReady()
  })

  it('renders AppLayout with header, navigation, breadcrumb, and container', () => {
    const wrapper = mount(AppLayout, {
      global: {
        plugins: [router],
        stubs: {
          AppToast: true,
          AppConfirmDialog: true
        }
      }
    })

    expect(wrapper.findComponent(AppHeader).exists()).toBe(true)
    expect(wrapper.text()).toContain('IMPACT FURNITURE')
    expect(wrapper.text()).toContain('Management System')
    expect(wrapper.find('main').exists()).toBe(true)
  })

  it('displays mock user info and toggles user dropdown in AppUserMenu', async () => {
    const wrapper = mount(AppUserMenu, {
      global: {
        plugins: [router]
      }
    })

    // Shows mock user initials and role
    expect(wrapper.text()).toContain('SA')
    expect(wrapper.text()).toContain('Superadmin')

    // Dropdown is initially closed
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    // Click trigger button to open
    const trigger = wrapper.find('button[aria-label="User profile menu"]')
    await trigger.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Profil Saya')
    expect(wrapper.text()).toContain('Pengaturan Akun')
    expect(wrapper.text()).toContain('Logout')

    // Press Escape to close
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('toggles mobile drawer navigation, closes on close button, and closes on Escape', async () => {
    const uiStore = useUiStore()
    expect(uiStore.isMobileNavOpen).toBe(false)

    const wrapper = mount(AppMobileNavigation, {
      global: {
        plugins: [router]
      }
    })

    // Open mobile nav via store
    uiStore.openMobileNav()
    await wrapper.vm.$nextTick()

    // Dialog should be mounted and visible in body
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.textContent).toContain('Impact Furniture')

    // Close on Escape key
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(uiStore.isMobileNavOpen).toBe(false)
  })

  it('closes mobile drawer navigation when a link is clicked', async () => {
    const uiStore = useUiStore()
    uiStore.openMobileNav()

    const wrapper = mount(AppMobileNavigation, {
      global: {
        plugins: [router]
      }
    })
    await wrapper.vm.$nextTick()

    const dashboardLink = document.querySelector('[role="dialog"] a[href="/dashboard"]')
    if (dashboardLink) {
      dashboardLink.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await wrapper.vm.$nextTick()
      expect(uiStore.isMobileNavOpen).toBe(false)
    }
  })

  it('renders ModulePlaceholderPage with title, module, and development notice', async () => {
    await router.push('/sales/orders/impact')
    await router.isReady()

    const wrapper = mount(ModulePlaceholderPage, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Sales Order (IMPACT)')
    expect(wrapper.text()).toContain('Penjualan')
    expect(wrapper.text()).toContain('/sales/orders/impact')
    expect(wrapper.text()).toContain('Halaman Dalam Antrean Pengembangan')
    expect(wrapper.text()).toContain('Kembali ke Dashboard')
  })

  it('renders NotFoundPage when navigating to an undefined route (404)', async () => {
    await router.push('/non-existent-page-xyz')
    await router.isReady()

    const wrapper = mount(NotFoundPage, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('404')
    expect(wrapper.text()).toContain('Halaman Tidak Ditemukan')
    expect(wrapper.text()).toContain('Kembali ke Dashboard')
  })
})
