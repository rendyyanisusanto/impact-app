import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PurchaseOrderCreatePage from '@/modules/procurement/purchase-orders/pages/PurchaseOrderCreatePage.vue'
import PurchaseOrderEditPage from '@/modules/procurement/purchase-orders/pages/PurchaseOrderEditPage.vue'
import { purchaseOrderService } from '@/modules/procurement/purchase-orders/services/purchase-order.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/procurement/purchase-orders', component: { template: '<div>List</div>' } },
    { path: '/procurement/purchase-orders/create', component: PurchaseOrderCreatePage },
    { path: '/procurement/purchase-orders/:id/edit', component: PurchaseOrderEditPage }
  ]
})

describe('Sprint 4 — Task 3: Purchase Order Create & Edit Form Pages', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    purchaseOrderService.reset()
    await router.push('/procurement/purchase-orders/create')
  })

  it('4.1 renders Create page with two-column header and 10-row spreadsheet', async () => {
    const wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Tambah Purchase Order')
    expect(wrapper.text()).toContain('Kode PO')
    expect(wrapper.text()).toContain('Supplier')
    expect(wrapper.text()).toContain('Tanggal PO')
    expect(wrapper.text()).toContain('Detail Bahan Baku')
    expect(wrapper.text()).toContain('Total Bayar')
    expect(wrapper.text()).toContain('Batalkan')
    expect(wrapper.text()).toContain('Total:')

    // Check spreadsheet rows
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(10)
  })

  it('4.2 displays validation error if attempting to save with no material items', async () => {
    const wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Simpan Data'))
    expect(saveBtn).toBeDefined()

    await saveBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    // Validation error banner rendered
    expect(wrapper.text()).toContain('Mohon perbaiki kesalahan berikut')
  })

  it('4.3 loads existing draft Purchase Order data on Edit page', async () => {
    await router.push('/procurement/purchase-orders/54/edit')

    const wrapper = mount(PurchaseOrderEditPage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Edit Purchase Order: ')
    expect(wrapper.text()).toContain('Simpan Perubahan')
    expect(wrapper.text()).toContain('Batalkan')
    expect(wrapper.text()).toContain('Total:')
  })

  it('4.3b blocks Edit page for approved Purchase Order and redirects to list', async () => {
    await router.push('/procurement/purchase-orders/52/edit')

    const wrapper = mount(PurchaseOrderEditPage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()

    expect(router.currentRoute.value.path).toBe('/procurement/purchase-orders')
    expect(wrapper.text()).not.toContain('Simpan Perubahan')
  })
  it('4.4 navigates back to purchase orders list when clicking Kembali button', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    const backBtn = wrapper.findAll('button').find(b => b.text().includes('Kembali'))
    expect(backBtn).toBeDefined()

    await backBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(pushSpy).toHaveBeenCalledWith('/procurement/purchase-orders')
    pushSpy.mockRestore()
  })
})
