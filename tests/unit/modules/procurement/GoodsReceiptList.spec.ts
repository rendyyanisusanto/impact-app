import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import GoodsReceiptListPage from '@/modules/procurement/goods-receipts/pages/GoodsReceiptListPage.vue'
import { goodsReceiptService } from '@/modules/procurement/goods-receipts/services/goods-receipt.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/procurement/goods-receipts', component: { template: '<div>List</div>' } },
    { path: '/procurement/goods-receipts/create', component: { template: '<div>Create</div>' } },
    { path: '/procurement/goods-receipts/:id/edit', component: { template: '<div>Edit</div>' } },
    { path: '/procurement/goods-receipts/:id', component: { template: '<div>Detail</div>' } }
  ]
})

describe('Sprint 4 — Task 6: Goods Receipt (Penerimaan Barang) List Page & DataTable', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    goodsReceiptService.reset()
    await router.push('/procurement/goods-receipts')
  })

  it('6.1 renders PageHeader, action buttons, and filter controls without Import button', async () => {
    const wrapper = mount(GoodsReceiptListPage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    // Title and Breadcrumb
    expect(wrapper.text()).toContain('Penerimaan Barang')

    // Toolbar buttons
    expect(wrapper.text()).toContain('Tambah Penerimaan')
    expect(wrapper.text()).toContain('Ekspor Excel')
    expect(wrapper.text()).toContain('Ekspor PDF')

    // SCOPE CORRECTION: No Import button
    expect(wrapper.text()).not.toContain('Impor Excel')
    expect(wrapper.text()).not.toContain('Import Excel')

    // Filter controls
    expect(wrapper.text()).toContain('Pencarian')
    expect(wrapper.text()).toContain('Supplier')
    expect(wrapper.text()).toContain('Gudang')
    expect(wrapper.text()).toContain('Status')
  })

  it('6.2 populates datatable with goods receipts from repository', async () => {
    const wrapper = mount(GoodsReceiptListPage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    // Seeded data rendered
    expect(wrapper.text()).toContain('PB/30-12-24-0001')
    expect(wrapper.text()).toContain('SJ-JTI-8891')
    expect(wrapper.text()).toContain('CV Kayu Jati Perkasa')
    expect(wrapper.text()).toContain('Gudang Utama')
    expect(wrapper.text()).toContain('Diterima')
  })

  it('6.3 filters data by search keyword', async () => {
    const wrapper = mount(GoodsReceiptListPage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    const searchInput = wrapper.find('input[type="text"]')
    expect(searchInput.exists()).toBe(true)

    // Search for SJ-BMA-4421 (PB 2)
    await searchInput.setValue('SJ-BMA')
    await searchInput.trigger('keyup.enter')
    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('PB/31-12-24-0002')
    expect(wrapper.text()).not.toContain('PB/30-12-24-0001')
  })

  it('6.4 opens confirmation dialog when clicking delete button', async () => {
    const wrapper = mount(GoodsReceiptListPage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    const deleteBtn = wrapper
      .findAll('button')
      .find(b => b.attributes('title')?.includes('Batalkan'))
    expect(deleteBtn).toBeDefined()

    await deleteBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    const dialog = wrapper.findComponent({ name: 'AppConfirmDialog' })
    expect(dialog.exists()).toBe(true)
    expect(dialog.props('modelValue')).toBe(true)
  })
})
