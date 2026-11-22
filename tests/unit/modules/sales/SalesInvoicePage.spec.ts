import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import SalesInvoicePage from '@/modules/sales/pages/SalesInvoicePage.vue'
import SalesInvoiceCreateModal from '@/modules/sales/components/SalesInvoiceCreateModal.vue'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'
import { salesInvoiceService } from '@/modules/sales/services/sales-invoice.service'
import { routes } from '@/app/router/routes'

describe('SalesInvoicePage Component & Legacy UI Requirements (Sprint 7)', () => {
  let router: ReturnType<typeof createRouter>
  let pinia: ReturnType<typeof createPinia>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)

    salesOrderTransactionService.reset()
    salesInvoiceService.reset()

    router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    await router.push('/sales/so-impact/1/invoices')
    await router.isReady()
  })

  it('1. renders PageHeader with Title, SO Reference subtitle, and action buttons', async () => {
    const wrapper = mount(SalesInvoicePage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router, pinia]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Sales Invoice')
    expect(wrapper.text()).toContain('SO/26/XI/0344')
    expect(wrapper.text()).toContain('Hotel Grand Pelangi')
    expect(wrapper.text()).toContain('Kembali')
    expect(wrapper.find('[data-testid="btn-create-invoice"]').exists()).toBe(true)
  })

  it('2. renders Section 1: 2-column Sales Order Information matching Screenshot 1', async () => {
    const wrapper = mount(SalesInvoicePage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router, pinia]
      }
    })

    await flushPromises()

    // Left Column
    expect(wrapper.text()).toContain('No. Sales Order:')
    expect(wrapper.text()).toContain('Tipe SO:')
    expect(wrapper.text()).toContain('Tanggal Transaksi:')
    expect(wrapper.text()).toContain('Customer:')
    expect(wrapper.text()).toContain('Salesman:')

    // Right Column
    expect(wrapper.text()).toContain('Total DPP:')
    expect(wrapper.text()).toContain('Total PPN')
    expect(wrapper.text()).toContain('Total SO:')
    expect(wrapper.text()).toContain('Sudah Invoice:')
    expect(wrapper.text()).toContain('Sisa Invoice:')
  })

  it('3. renders Section 2: Invoice DataTable with 12 sequential columns', async () => {
    const wrapper = mount(SalesInvoicePage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router, pinia]
      }
    })

    await flushPromises()

    // Table Headers
    const headers = wrapper.findAll('th').map(th => th.text())
    expect(headers).toContain('No')
    expect(headers).toContain('Kode Invoice')
    expect(headers).toContain('Tanggal')
    expect(headers).toContain('Jenis')
    expect(headers).toContain('DPP')
    expect(headers).toContain('PPN')
    expect(headers).toContain('Nominal')
    expect(headers).toContain('No. Faktur Pajak')
    expect(headers).toContain('Terbayar')
    expect(headers).toContain('Status Pembayaran')
    expect(headers).toContain('Status')
    expect(headers).toContain('Action')

    // Data rows for SO 1 (has 2 mock invoices: DP & Pelunasan)
    expect(wrapper.text()).toContain('INV/26/XI/0344-1')
    expect(wrapper.text()).toContain('INV/26/XI/0344-2')
    expect(wrapper.text()).toContain('DP')
    expect(wrapper.text()).toContain('Pelunasan')
  })

  it('4. opens Create Invoice Modal when clicking Buat Invoice button', async () => {
    // Navigate to SO 2 (which has un-invoiced amount)
    await router.push('/sales/so-impact/2/invoices')
    await router.isReady()

    const wrapper = mount(SalesInvoicePage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router, pinia]
      }
    })

    await flushPromises()

    const createBtn = wrapper.find('[data-testid="btn-create-invoice"]')
    expect(createBtn.exists()).toBe(true)
    expect(createBtn.attributes('disabled')).toBeUndefined()

    // Click button to open modal
    await createBtn.trigger('click')
    await flushPromises()

    // Check modal component prop and teleported contents in document.body
    const modal = wrapper.findComponent(SalesInvoiceCreateModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props('isOpen')).toBe(true)

    expect(document.body.querySelector('[data-testid="info-sisa-invoice"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="input-invoice-code"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="select-invoice-jenis"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="input-invoice-tanggal"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="input-total-invoice"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="btn-submit-invoice"]')).not.toBeNull()
  })

  it('5. displays Empty State when navigating to an SO without any invoices', async () => {
    // SO 4 has 0 invoices
    await router.push('/sales/so-pola/4/invoices')
    await router.isReady()

    const wrapper = mount(SalesInvoicePage, {
      props: { variant: 'pola' },
      global: {
        plugins: [router, pinia]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Belum ada invoice untuk Sales Order ini.')
    expect(wrapper.text()).toContain('Jumlah Invoice: 0')
  })

  it('6. provides Bayar and Lihat Pembayaran actions on the invoice table', async () => {
    // SO 1 has 2 invoices
    await router.push('/sales/so-impact/1/invoices')
    await router.isReady()

    const wrapper = mount(SalesInvoicePage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router, pinia]
      }
    })

    await flushPromises()

    // Find Bayar and Lihat Pembayaran buttons
    const bayarButtons = wrapper.findAll('button[title*="Bayar Tagihan"]')
    expect(bayarButtons.length).toBe(0) // All SO 1 invoices are lunas, so bayar button shows LUNAS title

    const paymentHistoryButtons = wrapper.findAll('button[title*="Lihat Riwayat Pembayaran"]')
    expect(paymentHistoryButtons.length).toBe(2)

    // For already lunas invoices in SO 1, bayar button has disabled attribute and LUNAS title
    const disabledBayar = wrapper.findAll('button[title*="LUNAS"]')
    expect(disabledBayar.length).toBe(2)
  })
})
