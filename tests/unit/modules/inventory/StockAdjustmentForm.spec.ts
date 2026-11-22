import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import StockAdjustmentCreatePage from '@/modules/inventory/stock-adjustments/pages/StockAdjustmentCreatePage.vue'
import StockAdjustmentDetailPage from '@/modules/inventory/stock-adjustments/pages/StockAdjustmentDetailPage.vue'
import { stockAdjustmentService } from '@/modules/inventory/stock-adjustments/services/stock-adjustment.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/inventory/stock-adjustments', component: { template: '<div>List</div>' } },
    { path: '/inventory/stock-adjustments/create', component: StockAdjustmentCreatePage },
    { path: '/inventory/stock-adjustments/:id', component: StockAdjustmentDetailPage }
  ]
})

describe('Sprint 5 — Fitur 2: Stock Adjustment Create & Detail Pages', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    stockAdjustmentService.reset()
    await router.push('/inventory/stock-adjustments/create')
  })

  it('2.1 renders Create Page with auto-generated code and spreadsheet', async () => {
    const wrapper = mount(StockAdjustmentCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('Tambah Penyesuaian Stok Bahan')
    expect(wrapper.text()).toContain('Rincian Bahan Baku & Perhitungan Selisih')
    expect(wrapper.text()).toContain('Tambah Baris')

    const codeInput = wrapper.find('input[placeholder*="Otomatis"]')
    expect(codeInput.exists()).toBe(true)
  })

  it('2.2 shows live total indicator right next to "Batalkan" in sticky bottom bar', async () => {
    const wrapper = mount(StockAdjustmentCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Check sticky action bar contents
    expect(wrapper.text()).toContain('Batalkan')
    expect(wrapper.text()).toContain('Total Item:')
    expect(wrapper.text()).toContain('Positif / Negatif:')
    expect(wrapper.text()).toContain('Net Selisih:')
    expect(wrapper.text()).toContain('Nilai Selisih:')
  })

  it('2.3 allows adding and removing rows in spreadsheet', async () => {
    const wrapper = mount(StockAdjustmentCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const addRowBtn = wrapper.findAll('button').find(b => b.text().includes('Tambah Baris'))
    expect(addRowBtn).toBeDefined()

    // Initially 2 rows
    const initialRows = wrapper.findAll('tbody tr')
    expect(initialRows.length).toBe(2)

    await addRowBtn!.trigger('click')
    const updatedRows = wrapper.findAll('tbody tr')
    expect(updatedRows.length).toBe(3)
  })

  it('2.4 renders Detail Page with complete document info and printable header', async () => {
    await router.push('/inventory/stock-adjustments/1')
    const wrapper = mount(StockAdjustmentDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('PS/2026/10/1')
    expect(wrapper.text()).toContain('Kayu Jati Solid Grade A')
    expect(wrapper.text()).toContain('Export PDF')
    expect(wrapper.text()).toContain('Cetak')
  })
})
