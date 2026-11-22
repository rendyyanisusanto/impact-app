import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import MaterialMutationListPage from '@/modules/inventory/material-mutations/pages/MaterialMutationListPage.vue'
import { materialMutationService } from '@/modules/inventory/material-mutations/services/material-mutation.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/inventory/material-mutations', component: MaterialMutationListPage },
    { path: '/inventory/material-mutations/create', component: { template: '<div>Create</div>' } },
    { path: '/inventory/material-mutations/:id', component: { template: '<div>Detail</div>' } },
    { path: '/inventory/material-mutations/:id/edit', component: { template: '<div>Edit</div>' } }
  ]
})

describe('Sprint 5 — Fitur 1: Material Mutation (Mutasi Stok Bahan) List Page', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    materialMutationService.reset()
    await router.push('/inventory/material-mutations')
  })

  it('1.1 renders PageHeader, action toolbar buttons, and filters without Import button', async () => {
    const wrapper = mount(MaterialMutationListPage, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Mutasi Bahan')
    expect(wrapper.text()).toContain('Tambah Mutasi')
    expect(wrapper.text()).toContain('Excel')
    expect(wrapper.text()).toContain('PDF')
    expect(wrapper.text()).toContain('Cetak')

    // CRITICAL: Scope rule says NO Import Excel for mutations
    expect(wrapper.text()).not.toContain('Impor')
    expect(wrapper.text()).not.toContain('Import')
    expect(wrapper.find('[data-test="import-button"]').exists()).toBe(false)
  })

  it('1.2 renders list of mutations with correct columns and status badge', async () => {
    const wrapper = mount(MaterialMutationListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('MB/202610-0001')
    expect(wrapper.text()).toContain('MB/202610-0002')
    expect(wrapper.text()).toContain('MB/202611-0001')
    expect(wrapper.text()).toContain('Selesai')
    expect(wrapper.text()).toContain('Draft')
  })

  it('1.3 filters items by search query', async () => {
    const wrapper = mount(MaterialMutationListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const searchInput = wrapper.find('input[placeholder*="Cari kode"]')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('Executive')
    await searchInput.trigger('keyup.enter')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('MB/202610-0001')
    expect(wrapper.text()).not.toContain('MB/202610-0002')
  })

  it('1.4 navigates to create page when Tambah Mutasi clicked', async () => {
    const wrapper = mount(MaterialMutationListPage, {
      global: {
        plugins: [router]
      }
    })

    const createBtn = wrapper.findAll('button').find(b => b.text().includes('Tambah Mutasi'))
    expect(createBtn).toBeDefined()
    await createBtn!.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(router.currentRoute.value.path).toBe('/inventory/material-mutations/create')
  })
})
