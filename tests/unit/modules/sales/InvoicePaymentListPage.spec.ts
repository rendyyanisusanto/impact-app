import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import InvoicePaymentListPage from '@/modules/sales/pages/InvoicePaymentListPage.vue'
import { salesPaymentService } from '@/modules/sales/services/sales-payment.service'
import { salesInvoiceService } from '@/modules/sales/services/sales-invoice.service'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'
import { useAuthStore } from '@/stores/auth.store'
import { MOCK_USERS } from '@/mocks/users.mock'

describe('InvoicePaymentListPage Component (Sprint 7 Standalone Module)', () => {
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
          path: '/sales/invoice-payments',
          name: 'sales-invoice-payments',
          component: InvoicePaymentListPage
        },
        {
          path: '/sales/invoice-payments/create',
          name: 'sales-invoice-payments-create',
          component: { template: '<div>Create Page</div>' }
        },
        {
          path: '/sales/invoice-payments/:id',
          name: 'sales-invoice-payments-detail',
          component: { template: '<div>Detail Page</div>' }
        },
        {
          path: '/sales/invoices/:invoiceId/payments',
          name: 'sales-invoice-payments-direct',
          component: { template: '<div>Invoice Payments</div>' }
        }
      ]
    })

    await router.push('/sales/invoice-payments')
  })

  it('1. renders PageHeader with title and Mode Switcher tabs', async () => {
    const wrapper = mount(InvoicePaymentListPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Pembayaran Sales Invoice')
    expect(wrapper.find('[data-test="tab-mode-invoices"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="tab-mode-payments"]').exists()).toBe(true)
  })

  it('2. defaults to Mode A (Daftar Tagihan Invoice) with 13-column table and KPIs', async () => {
    const wrapper = mount(InvoicePaymentListPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    // KPI cards
    expect(wrapper.text()).toContain('Total Tagihan')
    expect(wrapper.text()).toContain('Sudah Dibayar')
    expect(wrapper.text()).toContain('Sisa Tagihan')

    // Table Mode A
    const table = wrapper.find('[data-test="table-invoices"]')
    expect(table.exists()).toBe(true)

    // Verify 13 columns headers in the thead
    const ths = table.findAll('thead th')
    expect(ths.length).toBe(13)

    const thTexts = ths.map(t => t.text().trim())
    expect(thTexts).toContain('No')
    expect(thTexts).toContain('Kode Invoice')
    expect(thTexts).toContain('No. SO')
    expect(thTexts).toContain('Jenis SO')
    expect(thTexts).toContain('Customer')
    expect(thTexts).toContain('Tanggal')
    expect(thTexts).toContain('Total Tagihan')
    expect(thTexts).toContain('Sudah Dibayar')
    expect(thTexts).toContain('Sisa Tagihan')
    expect(thTexts).toContain('Status')
    expect(thTexts).toContain('Jml Bayar')
    expect(thTexts).toContain('Aksi')
  })

  it('3. filters invoices by search query in Mode A', async () => {
    const wrapper = mount(InvoicePaymentListPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    const searchInput = wrapper.find('[data-test="input-search-invoice"]')
    await searchInput.setValue('INV/26/XI/0344')
    await flushPromises()

    const rows = wrapper.findAll('[data-test="table-invoices"] tbody tr')
    expect(rows.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('INV/26/XI/0344-1')
  })

  it('4. switches to Mode B (Riwayat Transaksi Pembayaran) with 10-column table and payment KPIs', async () => {
    const wrapper = mount(InvoicePaymentListPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    const tabPayments = wrapper.find('[data-test="tab-mode-payments"]')
    await tabPayments.trigger('click')
    await flushPromises()

    // Mode B KPIs
    expect(wrapper.text()).toContain('Total Penerimaan')
    expect(wrapper.text()).toContain('Transaksi Berhasil')
    expect(wrapper.text()).toContain('Rata-rata Pembayaran')

    // Table Mode B
    const table = wrapper.find('[data-test="table-payments"]')
    expect(table.exists()).toBe(true)

    // Verify 10 columns headers in the thead
    const ths = table.findAll('thead th')
    expect(ths.length).toBe(10)

    const thTexts = ths.map(t => t.text().trim())
    expect(thTexts).toContain('No')
    expect(thTexts).toContain('Kode Bayar')
    expect(thTexts).toContain('Tanggal Bayar')
    expect(thTexts).toContain('Kode Invoice')
    expect(thTexts).toContain('Customer')
    expect(thTexts).toContain('Metode')
    expect(thTexts).toContain('Bank / Kas')
    expect(thTexts).toContain('Nominal')
    expect(thTexts).toContain('Status')
    expect(thTexts).toContain('Aksi')
  })

  it('5. triggers cancel payment dialog and cancels payment in Mode B', async () => {
    const wrapper = mount(InvoicePaymentListPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    // Switch to Mode B
    await wrapper.find('[data-test="tab-mode-payments"]').trigger('click')
    await flushPromises()

    const cancelButtons = wrapper.findAll('[data-test="btn-cancel-payment"]')
    expect(cancelButtons.length).toBeGreaterThan(0)

    // Click cancel on first payment
    await cancelButtons[0].trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('Batalkan Transaksi Pembayaran')
  })

  it('6. navigates to payment create page when Catat Pembayaran button is clicked', async () => {
    const wrapper = mount(InvoicePaymentListPage, {
      global: { plugins: [router] }
    })
    await flushPromises()

    const pushSpy = vi.spyOn(router, 'push')
    const createBtn = wrapper.find('[data-test="btn-create-payment"]')
    await createBtn.trigger('click')

    expect(pushSpy).toHaveBeenCalledWith('/sales/invoice-payments/create')
  })
})
