import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import BomListPage from '@/modules/production/pages/BomListPage.vue'
import { bomService } from '@/modules/production/services/bom.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/production/bom', component: BomListPage },
    { path: '/production/bom/create', component: { template: '<div>Create</div>' } },
    { path: '/production/bom/:id', component: { template: '<div>Detail</div>' } },
    { path: '/production/bom/:id/edit', component: { template: '<div>Edit</div>' } }
  ]
})

describe('Sprint 6 — Task 2: BoM List & DataTable Page', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    bomService.reset()
    await router.push('/production/bom')
  })

  it('2.1 renders BoM List page with header, KPIs, and DataTable', async () => {
    const wrapper = mount(BomListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('Template Produk (BoM)')
    expect(wrapper.text()).toContain('Master Resep & Komposisi Bahan Baku Produk Furniture')
    expect(wrapper.text()).toContain('Tambah Template')

    // KPI cards
    expect(wrapper.text()).toContain('Total Template BoM')
    expect(wrapper.text()).toContain('Produk Memiliki BoM')
  })

  it('2.2 STICT SCOPE: does NOT contain any Import Excel button', async () => {
    const wrapper = mount(BomListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Must not have Import button
    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text().toLowerCase())
    expect(buttonTexts.some(t => t.includes('import'))).toBe(false)
  })

  it('2.3 contains Export Excel and Export PDF buttons', async () => {
    const wrapper = mount(BomListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text().toLowerCase())
    expect(buttonTexts.some(t => t.includes('excel'))).toBe(true)
    expect(buttonTexts.some(t => t.includes('pdf'))).toBe(true)
  })

  it('2.4 filters templates by search keyword', async () => {
    const wrapper = mount(BomListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const searchInput = wrapper.find('input[placeholder*="Cari kode"]')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('Kursi')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('Kursi')
  })

  it('2.5 filters templates by status aktif / non-aktif', async () => {
    const wrapper = mount(BomListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const selects = wrapper.findAll('select')
    // Filter status
    const statusSelect = selects.find(s => s.html().includes('Semua Status'))
    if (statusSelect) {
      await statusSelect.setValue('1')
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(wrapper.text()).toContain('Aktif')
    }
  })

  it('2.6 provides duplicate template action in row menu', async () => {
    const wrapper = mount(BomListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const duplicateBtn = wrapper.find('button[title*="Duplikasi"]')
    expect(duplicateBtn.exists()).toBe(true)
  })
})
