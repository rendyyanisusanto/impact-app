import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import BillPaymentListPage from '@/modules/procurement/bill-payments/pages/BillPaymentListPage.vue'
import { billPaymentService } from '@/modules/procurement/bill-payments/services/bill-payment.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/procurement/bill-payments', component: BillPaymentListPage },
    { path: '/procurement/bill-payments/create', component: { template: '<div>Create</div>' } },
    { path: '/procurement/bill-payments/:id', component: { template: '<div>Detail</div>' } },
    { path: '/procurement/bill-payments/:id/edit', component: { template: '<div>Edit</div>' } },
    { path: '/system/audit-trail', component: { template: '<div>Audit Trail</div>' } }
  ]
})

describe('Sprint 17 — Bill Payment (Pembayaran Tagihan) List & DataTable', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    billPaymentService.reset()
    await router.push('/procurement/bill-payments')
  })

  it('9.1 renders PageHeader, action toolbar buttons, and filters without Import button', async () => {
    const wrapper = mount(BillPaymentListPage, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Pembayaran Tagihan')
    expect(wrapper.text()).toContain('Tambah Pembayaran')
    expect(wrapper.text()).toContain('Ekspor Excel')
    expect(wrapper.text()).toContain('Ekspor PDF')

    // CRITICAL: Verify NO Import Excel button
    expect(wrapper.text()).not.toContain('Impor Excel')
    expect(wrapper.find('[data-test="import-button"]').exists()).toBe(false)
  })

  it('9.2 renders list of bill payments with correct schema columns', async () => {
    const wrapper = mount(BillPaymentListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('PT-202610-0001')
    expect(wrapper.text()).toContain('CV Kayu Jati Perkasa')
    expect(wrapper.text()).toContain('INV-KJP-1001')
  })

  it('9.3 filters data by search keyword', async () => {
    const wrapper = mount(BillPaymentListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const searchInput = wrapper.find('input[placeholder*="Cari Kode PT"]')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('INV-SLP')
    await searchInput.trigger('keyup.enter')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('PT-202610-0002')
    expect(wrapper.text()).not.toContain('PT-202610-0001')
  })

  it('9.4 opens cancellation confirm dialog on delete click', async () => {
    const wrapper = mount(BillPaymentListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const deleteBtn = wrapper.find('button[title="Batalkan Pembayaran"]')
    expect(deleteBtn.exists()).toBe(true)

    await deleteBtn.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(document.body.textContent).toContain('Batalkan Pembayaran Tagihan?')
  })

  it('9.5 renders Audit Trail button in row actions and navigates to audit trail', async () => {
    const wrapper = mount(BillPaymentListPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const auditBtn = wrapper.find('button[title="Lihat Audit Trail"]')
    expect(auditBtn.exists()).toBe(true)

    await auditBtn.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(router.currentRoute.value.path).toBe('/system/audit-trail')
    expect(router.currentRoute.value.query.search).toBe('PT-202610-0002')
  })
})
