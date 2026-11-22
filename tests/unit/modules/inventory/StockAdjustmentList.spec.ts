import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import StockAdjustmentListPage from '@/modules/inventory/stock-adjustments/pages/StockAdjustmentListPage.vue'
import { stockAdjustmentService } from '@/modules/inventory/stock-adjustments/services/stock-adjustment.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/inventory/stock-adjustments', component: StockAdjustmentListPage },
    {
      path: '/inventory/stock-adjustments/create',
      component: { template: '<div>Create Adjustment</div>' }
    },
    {
      path: '/inventory/stock-adjustments/:id',
      component: { template: '<div>Detail Adjustment</div>' }
    },
    {
      path: '/inventory/stock-adjustments/:id/edit',
      component: { template: '<div>Edit Adjustment</div>' }
    }
  ]
})

describe('Sprint 5 — Fitur 2: Stock Adjustment (Penyesuaian Stok Bahan) List Page', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    stockAdjustmentService.reset()
    await router.push('/inventory/stock-adjustments')
  })

  it('1.1 renders PageHeader, action toolbar buttons, and filters WITHOUT Import button', async () => {
    const wrapper = mount(StockAdjustmentListPage, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Penyesuaian Stok Bahan')
    expect(wrapper.text()).toContain('Tambah Penyesuaian')
    expect(wrapper.text()).toContain('Export Excel')
    expect(wrapper.text()).toContain('Export PDF')
    expect(wrapper.text()).toContain('Cetak')

    // CRITICAL: Stock adjustment MUST NOT have an Import Excel button
    expect(wrapper.text()).not.toContain('Impor')
    expect(wrapper.text()).not.toContain('Import Excel')
    expect(wrapper.find('[data-test="import-button"]').exists()).toBe(false)
  })

  it('1.2 renders list of adjustments with correct columns and status badge', async () => {
    const wrapper = mount(StockAdjustmentListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('PS/2026/10/1')
    expect(wrapper.text()).toContain('PS/2026/10/2')
    expect(wrapper.text()).toContain('PS/2026/11/1')
    expect(wrapper.text()).toContain('Selesai')
    expect(wrapper.text()).toContain('Draft')
  })

  it('1.3 filters items by search query', async () => {
    const wrapper = mount(StockAdjustmentListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const searchInput = wrapper.find('input[placeholder*="Cari kode"]')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('finishing')
    await searchInput.trigger('keydown.enter')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('PS/2026/10/2')
    expect(wrapper.text()).not.toContain('PS/2026/10/1')
  })

  it('1.4 navigates to create page when Tambah Penyesuaian clicked', async () => {
    const wrapper = mount(StockAdjustmentListPage, {
      global: {
        plugins: [router]
      }
    })

    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Tambah Penyesuaian'))
    expect(createBtn).toBeDefined()
    await createBtn!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(router.currentRoute.value.path).toBe('/inventory/stock-adjustments/create')
  })
})
