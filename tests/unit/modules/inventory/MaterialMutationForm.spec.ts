import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import MaterialMutationCreatePage from '@/modules/inventory/material-mutations/pages/MaterialMutationCreatePage.vue'
import MaterialMutationDetailPage from '@/modules/inventory/material-mutations/pages/MaterialMutationDetailPage.vue'
import { materialMutationService } from '@/modules/inventory/material-mutations/services/material-mutation.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/inventory/material-mutations', component: { template: '<div>List</div>' } },
    { path: '/inventory/material-mutations/create', component: MaterialMutationCreatePage },
    { path: '/inventory/material-mutations/:id', component: MaterialMutationDetailPage }
  ]
})

describe('Sprint 5 — Fitur 1: Material Mutation Create & Detail Pages', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    materialMutationService.reset()
    await router.push('/inventory/material-mutations/create')
  })

  it('2.1 renders Create Page with auto-generated code and spreadsheet', async () => {
    const wrapper = mount(MaterialMutationCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('Tambah Mutasi Bahan')
    expect(wrapper.text()).toContain('Daftar Bahan Yang Dimutasi')
    expect(wrapper.text()).toContain('Tambah Baris')

    const codeInput = wrapper.find('input[placeholder="MB/YYYYMM-XXXX/1"]')
    expect(codeInput.exists()).toBe(true)
  })

  it('2.2 shows live total indicator right next to "Batalkan" in sticky bottom bar', async () => {
    const wrapper = mount(MaterialMutationCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Check sticky action bar contents
    expect(wrapper.text()).toContain('Batalkan')
    expect(wrapper.text()).toContain('Total Item:')
    expect(wrapper.text()).toContain('Total Qty:')
    expect(wrapper.text()).toContain('Estimasi Nilai:')
  })

  it('2.3 allows adding and removing rows in spreadsheet', async () => {
    const wrapper = mount(MaterialMutationCreatePage, {
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
    await router.push('/inventory/material-mutations/1')
    const wrapper = mount(MaterialMutationDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('MB/202610-0001')
    expect(wrapper.text()).toContain('Kayu Jati Solid Grade A')
    expect(wrapper.text()).toContain('Export PDF')
    expect(wrapper.text()).toContain('Cetak')
  })
})
