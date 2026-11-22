import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ProductionListPage from '@/modules/production/pages/ProductionListPage.vue'
import { productionService } from '@/modules/production/services/production.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/production/orders', component: ProductionListPage },
    { path: '/production/orders/create', component: { template: '<div>Create</div>' } },
    { path: '/production/orders/:id', component: { template: '<div>Detail</div>' } },
    { path: '/production/orders/:id/edit', component: { template: '<div>Edit</div>' } }
  ]
})

describe('Sprint 6 — Task 8: Production List Page & DataTable', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    productionService.reset()
    await router.push('/production/orders')
  })

  it('8.1 renders Production List page with header, KPIs, and DataTable', async () => {
    const wrapper = mount(ProductionListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 60))

    expect(wrapper.text()).toContain('Proses Produksi')
    expect(wrapper.text()).toContain('Tambah Produksi')

    // KPI cards
    expect(wrapper.text()).toContain('Total Produksi')
    expect(wrapper.text()).toContain('Produksi Pending')
    expect(wrapper.text()).toContain('Dalam Pengerjaan')
    expect(wrapper.text()).toContain('Selesai (Posted)')
  })

  it('8.2 STRICT SCOPE: does NOT contain any Import Excel button', async () => {
    const wrapper = mount(ProductionListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text().toLowerCase())
    expect(buttonTexts.some(t => t.includes('import'))).toBe(false)
  })

  it('8.3 contains Export Excel and Export PDF buttons', async () => {
    const wrapper = mount(ProductionListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text().toLowerCase())
    expect(buttonTexts.some(t => t.includes('ekspor excel'))).toBe(true)
    expect(buttonTexts.some(t => t.includes('ekspor pdf'))).toBe(true)
  })

  it('8.4 filters production transactions by search query', async () => {
    const wrapper = mount(ProductionListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const searchInput = wrapper.find('input[placeholder*="Cari nomor produksi"]')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('PD0824-0001')
    await searchInput.trigger('keyup.enter')

    await new Promise(resolve => setTimeout(resolve, 50))
    expect(wrapper.text()).toContain('PD0824-0001')
  })

  it('8.5 filters production transactions by Jenis Produksi', async () => {
    const resPesanan = await productionService.getProductions({ jenis_produksi: 1 })
    expect(resPesanan.data.every(p => p.jenis_produksi === 1)).toBe(true)

    const resNonPesanan = await productionService.getProductions({ jenis_produksi: 0 })
    expect(resNonPesanan.data.every(p => p.jenis_produksi === 0)).toBe(true)
  })

  it('8.6 filters production transactions by Status Produksi', async () => {
    const resPending = await productionService.getProductions({ status_produksi: 0 })
    expect(resPending.data.every(p => p.status_produksi === 0)).toBe(true)

    const resSelesai = await productionService.getProductions({ status_produksi: 2 })
    expect(resSelesai.data.every(p => p.status_produksi === 2)).toBe(true)
  })
})
