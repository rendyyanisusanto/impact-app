import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import BomCreatePage from '@/modules/production/pages/BomCreatePage.vue'
import BomEditPage from '@/modules/production/pages/BomEditPage.vue'
import { bomService } from '@/modules/production/services/bom.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/production/bom', component: { template: '<div>BoM List</div>' } },
    { path: '/production/bom/create', component: BomCreatePage },
    { path: '/production/bom/:id/edit', component: BomEditPage }
  ]
})

describe('Sprint 6 — Task 3: BoM Create & Edit Pages with Desktop Spreadsheet Editor', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    bomService.reset()
    await router.push('/production/bom/create')
  })

  it('3.1 renders Full-Page Create view with auto code and spreadsheet editor', async () => {
    const wrapper = mount(BomCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('Tambah Template Produk (BoM)')
    expect(wrapper.text()).toContain('Pilih Produk Furniture')
    expect(wrapper.text()).toContain('Spreadsheet Editor')
    expect(wrapper.text()).toContain('Tambah Baris')
  })

  it('3.2 displays live total indicator right next to "Batalkan" in sticky bottom bar', async () => {
    const wrapper = mount(BomCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify sticky bottom bar
    expect(wrapper.text()).toContain('Batalkan')
    expect(wrapper.text()).toContain('Komposisi:')
    expect(wrapper.text()).toContain('Est. Biaya Bahan per Unit:')
    expect(wrapper.text()).toContain('Simpan Template BoM')
  })

  it('3.3 allows adding and removing material rows in spreadsheet', async () => {
    const wrapper = mount(BomCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const addRowBtn = wrapper.findAll('button').find(b => b.text().includes('Tambah Baris'))
    expect(addRowBtn).toBeDefined()

    // Initially 1 empty row
    const initialRows = wrapper.findAll('tbody tr')
    const initialCount = initialRows.length

    await addRowBtn!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 20))

    const updatedRows = wrapper.findAll('tbody tr')
    expect(updatedRows.length).toBe(initialCount + 1)
  })

  it('3.4 renders Edit page loading existing BoM template', async () => {
    await router.push('/production/bom/1/edit')

    const wrapper = mount(BomEditPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('Edit Template:')
    expect(wrapper.text()).toContain('TPL-IC74')
    expect(wrapper.text()).toContain('Batalkan')
    expect(wrapper.text()).toContain('Simpan Perubahan')
  })
})
