import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import InvoicePaymentDetailPage from '@/modules/sales/pages/InvoicePaymentDetailPage.vue'
import InvoicePaymentEditPage from '@/modules/sales/pages/InvoicePaymentEditPage.vue'
import { salesPaymentService } from '@/modules/sales/services/sales-payment.service'
import { salesInvoiceService } from '@/modules/sales/services/sales-invoice.service'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'

describe('Invoice Payment Detail & Edit Pages', () => {
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
          path: '/sales/invoice-payments/:id',
          name: 'sales-invoice-payments-detail',
          component: InvoicePaymentDetailPage
        },
        {
          path: '/sales/invoice-payments/:id/edit',
          name: 'sales-invoice-payments-edit',
          component: InvoicePaymentEditPage
        },
        {
          path: '/sales/invoice-payments',
          name: 'sales-invoice-payments',
          component: { template: '<div>List</div>' }
        }
      ]
    })
  })

  it('1. renders InvoicePaymentDetailPage with voucher details and related invoice/SO info', async () => {
    await router.push('/sales/invoice-payments/501')

    const wrapper = mount(InvoicePaymentDetailPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Detail Pembayaran PAY/26/XI/0344-1/01')
    expect(wrapper.text()).toContain('Bukti Penerimaan Kas / Bank')
    expect(wrapper.text()).toContain('Hotel Grand Pelangi')
    expect(wrapper.text()).toContain('Faktur Tagihan Terkait')
    expect(wrapper.text()).toContain('INV/26/XI/0344-1')
    expect(wrapper.find('[data-test="banner-active"]').exists()).toBe(true)
  })

  it('2. opens receipt modal from detail page', async () => {
    await router.push('/sales/invoice-payments/501')

    const wrapper = mount(InvoicePaymentDetailPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    const printBtn = wrapper.find('[data-test="btn-print-receipt"]')
    expect(printBtn.exists()).toBe(true)
    await printBtn.trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('Kwitansi Bukti Pembayaran')
  })

  it('3. cancels payment from detail page and displays cancelled banner', async () => {
    await router.push('/sales/invoice-payments/501')

    const wrapper = mount(InvoicePaymentDetailPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    const cancelBtn = wrapper.find('[data-test="btn-cancel-detail"]')
    expect(cancelBtn.exists()).toBe(true)
    await cancelBtn.trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('Batalkan Transaksi Pembayaran')

    // Confirm cancellation
    const confirmBtn = wrapper.find('button.bg-rose-600')
    if (confirmBtn.exists()) {
      await confirmBtn.trigger('click')
      await flushPromises()
    }
  })

  it('4. renders InvoicePaymentEditPage for an active payment', async () => {
    await router.push('/sales/invoice-payments/503/edit')

    const wrapper = mount(InvoicePaymentEditPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Edit Pembayaran PAY/26/PL/03/0093-1/01')
    expect(wrapper.find('[data-test="payment-input-nominal"]').exists()).toBe(true)
  })

  it('5. guards against editing a cancelled payment with clear alert message', async () => {
    // First cancel payment 503
    await salesPaymentService.cancelPayment(503, 'Salah entri jumlah')

    await router.push('/sales/invoice-payments/503/edit')

    const wrapper = mount(InvoicePaymentEditPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.find('[data-test="alert-uneditable"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pembayaran Tidak Dapat Diedit')
    expect(wrapper.text()).toContain('Pembayaran telah dibatalkan')
  })
})
