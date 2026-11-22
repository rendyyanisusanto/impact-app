import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import InvoicePaymentCreatePage from '@/modules/sales/pages/InvoicePaymentCreatePage.vue'
import { salesPaymentService } from '@/modules/sales/services/sales-payment.service'
import { salesInvoiceService } from '@/modules/sales/services/sales-invoice.service'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'

describe('InvoicePaymentCreatePage Component (Sprint 13 Desktop ERP Multi-Payment)', () => {
  let router: Router

  beforeEach(async () => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.currentUser = { ...MOCK_USERS[0] }

    salesPaymentService.reset()
    salesInvoiceService.reset()
    salesOrderTransactionService.reset()

    router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/sales/invoice-payments/create',
          name: 'sales-invoice-payments-create',
          component: InvoicePaymentCreatePage
        },
        {
          path: '/sales/invoice-payments',
          name: 'sales-invoice-payments',
          component: { template: '<div>List Page</div>' }
        }
      ]
    })
  })

  it('1. loads pre-selected invoice into allocation grid when invoiceId query parameter is provided', async () => {
    await router.push('/sales/invoice-payments/create?invoiceId=1003')

    const wrapper = mount(InvoicePaymentCreatePage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Catat Pembayaran Invoice')
    expect(wrapper.text()).toContain('INV/26/PL/03/0093-1')
    expect(wrapper.find('[data-test="table-allocations"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="total-allocation-amount"]').exists()).toBe(true)
  })

  it('2. prompts user to select customer before picking invoices', async () => {
    await router.push('/sales/invoice-payments/create')

    const wrapper = mount(InvoicePaymentCreatePage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.find('[data-test="empty-no-customer"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pilih Mitra Customer Terlebih Dahulu')
  })

  it('3. adds invoices from picker to the spreadsheet allocation grid', async () => {
    await router.push('/sales/invoice-payments/create?invoiceId=1003')

    const wrapper = mount(InvoicePaymentCreatePage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    // Row exists for 1003
    expect(wrapper.findAll('tr[data-test^="allocation-row-"]').length).toBe(1)

    // Open picker
    await wrapper.find('[data-test="btn-open-picker"]').trigger('click')
    await flushPromises()

    // Find and add from picker
    const pickerItems = wrapper.findAll('[data-test="invoice-picker-item"]')
    if (pickerItems.length > 0) {
      await pickerItems[0].trigger('click')
      await flushPromises()
    }
  })

  it('4. supports quick actions: Bayar Penuh Semua and Kosongkan Alokasi', async () => {
    await router.push('/sales/invoice-payments/create?invoiceId=1003')

    const wrapper = mount(InvoicePaymentCreatePage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    const initialTotal = wrapper.find('[data-test="total-allocation-amount"]').text()
    expect(initialTotal).not.toContain('Rp 0')

    // Click Kosongkan Alokasi
    await wrapper.find('[data-test="btn-clear-allocations"]').trigger('click')
    await flushPromises()

    const clearedTotal = wrapper.find('[data-test="total-allocation-amount"]').text()
    expect(clearedTotal).toContain('0')

    // Click Bayar Penuh Semua
    await wrapper.find('[data-test="btn-pay-all-full"]').trigger('click')
    await flushPromises()

    const restoredTotal = wrapper.find('[data-test="total-allocation-amount"]').text()
    expect(restoredTotal).toBe(initialTotal)
  })

  it('5. validates overpayment inline when input exceeds remaining balance', async () => {
    await router.push('/sales/invoice-payments/create?invoiceId=1003')

    const wrapper = mount(InvoicePaymentCreatePage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    const input = wrapper.find('input[data-test="input-allocation-amount-0"]')
    expect(input.exists()).toBe(true)

    // Set an amount much higher than remaining balance
    await input.setValue(999999999)
    await input.trigger('input')
    await flushPromises()

    expect(wrapper.text()).toContain('Melebihi sisa')
    const submitBtn = wrapper.find('[data-test="btn-submit-payment"]')
    expect((submitBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('6. submits multi-invoice payment and redirects to payment list', async () => {
    await router.push('/sales/invoice-payments/create?invoiceId=1003')

    const wrapper = mount(InvoicePaymentCreatePage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    const pushSpy = vi.spyOn(router, 'push')

    // Click primary submit button
    const submitBtn = wrapper.find('[data-test="btn-submit-payment"]')
    expect(submitBtn.exists()).toBe(true)
    expect((submitBtn.element as HTMLButtonElement).disabled).toBe(false)

    await submitBtn.trigger('click')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith('/sales/invoice-payments')
  })
})
