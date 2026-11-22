import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PurchaseOrderListPage from '@/modules/procurement/purchase-orders/pages/PurchaseOrderListPage.vue'
import { purchaseOrderService } from '@/modules/procurement/purchase-orders/services/purchase-order.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/procurement/purchase-orders', component: { template: '<div>List</div>' } },
    { path: '/procurement/purchase-orders/create', component: { template: '<div>Create</div>' } },
    { path: '/procurement/purchase-orders/:id/edit', component: { template: '<div>Edit</div>' } }
  ]
})

describe('Sprint 4 — Task 2: Purchase Order List Page & DataTable', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    purchaseOrderService.reset()
    await router.push('/procurement/purchase-orders')
  })

  it('2.1 renders PageHeader, action toolbar buttons, and filter section', async () => {
    const wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: {
          AppImportExcelModal: true,
          AppConfirmDialog: true
        }
      }
    })

    // Wait for onMounted data load
    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Purchase Order')
    expect(wrapper.text()).toContain('Tambah PO')
    expect(wrapper.text()).not.toContain('Impor Excel')
    expect(wrapper.text()).toContain('Ekspor Excel')
    expect(wrapper.text()).toContain('Ekspor PDF')
    expect(wrapper.text()).toContain('Pencarian')
    expect(wrapper.text()).toContain('Rentang Tanggal')
  })

  it('2.2 populates datatable with purchase orders from repository', async () => {
    const wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: {
          AppImportExcelModal: true,
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    // Assert rows rendered
    expect(wrapper.text()).toContain('PO/30-12-24-3832')
    expect(wrapper.text()).toContain('PO/30-12-24-1573')
    expect(wrapper.text()).toContain('CV Kayu Jati Perkasa')
  })

  it('2.3 filters data by search keyword', async () => {
    const wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: {
          AppImportExcelModal: true,
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    // Input search keyword
    const searchInput = wrapper.find('input[placeholder*="Cari Kode PO"]')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('3832')
    await searchInput.trigger('keyup.enter')
    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('PO/30-12-24-3832')
    expect(wrapper.text()).not.toContain('PO/30-12-24-1573')
  })

  it('2.4 navigates to /create when clicking Tambah PO button', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: {
          AppImportExcelModal: true,
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    const tambahBtn = wrapper.findAll('button').find(b => b.text().includes('Tambah PO'))
    expect(tambahBtn).toBeDefined()

    await tambahBtn!.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith('/procurement/purchase-orders/create')
  })
})
