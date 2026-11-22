import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppNavigationMenu from '@/app/layouts/components/AppNavigationMenu.vue'
import { routes } from '@/app/router/routes'

describe('AppNavigationMenu.vue — Active State & Interaction', () => {
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

  it('renders top navigation menu items with Dashboard active', async () => {
    const wrapper = mount(AppNavigationMenu, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Pengadaan')
    expect(wrapper.text()).toContain('Persediaan')
    expect(wrapper.text()).toContain('Produksi')
    expect(wrapper.text()).toContain('Penjualan')
    expect(wrapper.text()).toContain('Pengiriman')
    expect(wrapper.text()).toContain('Keuangan')
    expect(wrapper.text()).toContain('Laporan')
    expect(wrapper.text()).toContain('HR')
    expect(wrapper.text()).toContain('Setting')
    expect(wrapper.text()).toContain('System Setting')

    // Dashboard link should have active classes
    const dashboardLink = wrapper.findAll('a').find(a => a.text() === 'Dashboard')
    expect(dashboardLink).toBeDefined()
    expect(dashboardLink?.classes()).toContain('bg-navbar-darker')
  })

  it('toggles dropdown menu on button click', async () => {
    const wrapper = mount(AppNavigationMenu, {
      global: {
        plugins: [router]
      }
    })

    // Find Pengadaan menu button
    const buttons = wrapper.findAll('button')
    const pengadaanButton = buttons.find(b => b.text().includes('Pengadaan'))
    expect(pengadaanButton).toBeDefined()

    // Initially no dropdown menu visible
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    // Click to open Pengadaan dropdown
    await pengadaanButton?.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Master Data Suplier')
    expect(wrapper.text()).toContain('Purchase Order')
    expect(wrapper.text()).toContain('Penerimaan Barang')
    expect(wrapper.text()).toContain('Pembayaran Tagihan')

    // Click again to close
    await pengadaanButton?.trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('opens dropdown menu on mouseenter (hover)', async () => {
    const wrapper = mount(AppNavigationMenu, {
      global: {
        plugins: [router]
      }
    })

    const pengadaanItem = wrapper
      .findAll('.relative.inline-block')
      .find(el => el.text().includes('Pengadaan'))
    expect(pengadaanItem).toBeDefined()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    await pengadaanItem?.trigger('mouseenter')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Master Data Suplier')
  })

  it('highlights parent menu when on a child route', async () => {
    await router.push('/procurement/suppliers')
    await router.isReady()

    const wrapper = mount(AppNavigationMenu, {
      global: {
        plugins: [router]
      }
    })

    const pengadaanButton = wrapper.findAll('button').find(b => b.text().includes('Pengadaan'))
    expect(pengadaanButton?.classes()).toContain('bg-navbar-darker')
  })
})
