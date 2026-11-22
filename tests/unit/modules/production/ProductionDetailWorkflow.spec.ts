import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ProductionDetailPage from '@/modules/production/pages/ProductionDetailPage.vue'
import ProductionPrintDocument from '@/modules/production/components/ProductionPrintDocument.vue'
import { productionService } from '@/modules/production/services/production.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/production/orders', component: { template: '<div>List</div>' } },
    { path: '/production/orders/:id', component: ProductionDetailPage },
    { path: '/production/orders/:id/edit', component: { template: '<div>Edit</div>' } }
  ]
})

describe('Sprint 6 — Task 10: Production Detail & Workflow', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    productionService.reset()
    await router.push('/production/orders/1')
  })

  it('10.1 renders read-only Detail page with header info, products, and BoM preview', async () => {
    const wrapper = mount(ProductionDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 60))

    expect(wrapper.text()).toContain('Surat Perintah Kerja')
    expect(wrapper.text()).toContain('PD0824-0001')
    expect(wrapper.text()).toContain('Pesanan')
    expect(wrapper.text()).toContain('Produksi Selesai')
    expect(wrapper.text()).toContain('Rincian Produk yang Diproduksi')

    // Print document component exists
    const printDoc = wrapper.findComponent(ProductionPrintDocument)
    expect(printDoc.exists()).toBe(true)
  })

  it('10.2 executes workflow transition from Pending to Proses', async () => {
    // Production #3 is Pending (0)
    await router.push('/production/orders/3')

    const wrapper = mount(ProductionDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 60))

    // Action button "Mulai Pengerjaan" should be visible
    expect(wrapper.text()).toContain('Mulai Pengerjaan')

    // Update status to Proses (1)
    await productionService.updateProductionStatus(3, 1)
    const updated = await productionService.getProductionById(3)
    expect(updated!.status_produksi).toBe(1)
  })

  it('10.3 executes workflow transition from Proses to Selesai with stock posting', async () => {
    // Production #2 is Proses (1)
    await router.push('/production/orders/2')

    const wrapper = mount(ProductionDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 60))

    expect(wrapper.text()).toContain('Selesaikan & Posting Stok')

    // Transition to Selesai (2)
    const res = await productionService.updateProductionStatus(2, 2)
    expect(res.status_produksi).toBe(2)
    expect(res.is_posted).toBe(true)
    expect(productionService.isProductionPosted(2)).toBe(true)
  })

  it('10.4 triggers window.print when clicking Cetak SPK button', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    const wrapper = mount(ProductionDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 60))

    const printBtn = wrapper.findAll('button').find(b => b.text().includes('Cetak SPK'))
    expect(printBtn).toBeDefined()
    await printBtn!.trigger('click')

    expect(printSpy).toHaveBeenCalled()
    printSpy.mockRestore()
  })
})
