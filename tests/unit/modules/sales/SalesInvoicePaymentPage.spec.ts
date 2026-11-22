import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, type Router } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import SalesInvoicePaymentPage from '@/modules/sales/pages/SalesInvoicePaymentPage.vue'
import { salesPaymentService } from '@/modules/sales/services/sales-payment.service'
import { salesInvoiceService } from '@/modules/sales/services/sales-invoice.service'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'
import { formatCurrency } from '@/shared/utils/formatters'

describe('SalesInvoicePaymentPage Component (Sprint 7)', () => {
  let router: Router

  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    salesPaymentService.reset()
    salesInvoiceService.reset()
    salesOrderTransactionService.reset()

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/sales/so-impact/:id/invoices/:invoiceId/payments',
          name: 'sales-orders-impact-invoice-payments',
          component: SalesInvoicePaymentPage,
          props: { variant: 'impact' }
        },
        {
          path: '/sales/so-impact/:id/invoices',
          name: 'sales-orders-impact-invoices',
          component: { template: '<div>Invoices List</div>' }
        },
        {
          path: '/sales/so-impact/:id',
          name: 'sales-orders-impact-detail',
          component: { template: '<div>SO Detail</div>' }
        },
        {
          path: '/sales/so-impact',
          name: 'sales-orders-so-impact',
          component: { template: '<div>SO Impact</div>' }
        }
      ]
    })

    await router.push('/sales/so-impact/1/invoices/1001/payments')
    await router.isReady()
  })

  it('renders PageHeader with Title, Invoice reference subtitle, and action buttons', async () => {
    const wrapper = mount(SalesInvoicePaymentPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Pembayaran Sales Invoice')
    expect(wrapper.text()).toContain('INV/26/XI/0344-1')
    expect(wrapper.text()).toContain('Kembali ke Daftar Invoice')
  })

  it('renders Section 1: 3 KPI summary cards with invoice info, SO context, and financial balances', async () => {
    const wrapper = mount(SalesInvoicePaymentPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    // Card 1: Identitas Invoice
    expect(wrapper.text()).toContain('Identitas Invoice')
    expect(wrapper.text()).toContain('INV/26/XI/0344-1')
    expect(wrapper.text()).toContain('LUNAS')

    // Card 2: Referensi Sales Order
    expect(wrapper.text()).toContain('Referensi Sales Order')
    expect(wrapper.text()).toContain('SO/26/XI/0344')
    expect(wrapper.text()).toContain('Hotel Grand Pelangi')

    // Card 3: Finansial Tagihan
    expect(wrapper.text()).toContain('Finansial Tagihan')
    expect(wrapper.text()).toContain('Total Tagihan:')
    expect(wrapper.text()).toContain('Sudah Dibayar:')
  })

  it('renders Section 2: 8-column DataTable with payment list and method badges', async () => {
    const wrapper = mount(SalesInvoicePaymentPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Riwayat Pembayaran Invoice')
    expect(wrapper.text()).toContain('PAY/26/XI/0344-1/01')
    expect(wrapper.text()).toContain('TRANSFER')
    expect(wrapper.text()).toContain('BCA PT Impact')
    expect(wrapper.text()).toContain(formatCurrency(4162500))
    expect(wrapper.text()).toContain('Aktif')
  })

  it('opens Create Payment modal when clicking + Tambah Pembayaran on eligible invoice', async () => {
    // Navigate to a new invoice on SO 2 with unpaid balance
    const newInv = await salesInvoiceService.createInvoice({
      so_id: 2,
      kode: 'INV/26/XI/0345-9',
      jenis: 'DP',
      tanggal: '2026-11-01',
      total: 3000000,
      subtotal: 2702703,
      total_ppn: 297297,
      variant: 'impact'
    })

    await router.push(`/sales/so-impact/2/invoices/${newInv.id}/payments`)
    await router.isReady()

    const wrapper = mount(SalesInvoicePaymentPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Tambah Pembayaran'))
    expect(addBtn).toBeDefined()
    expect(addBtn?.attributes('disabled')).toBeUndefined()

    await addBtn?.trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent({ name: 'SalesInvoicePaymentCreateModal' })
    expect(modal.exists()).toBe(true)
    expect(modal.props('modelValue')).toBe(true)
  })

  it('displays empty state when an invoice has no recorded payments yet', async () => {
    const newInv = await salesInvoiceService.createInvoice({
      so_id: 2,
      kode: 'INV/26/XI/0345-8',
      jenis: 'DP',
      tanggal: '2026-11-01',
      total: 2000000,
      subtotal: 1801802,
      total_ppn: 198198,
      variant: 'impact'
    })

    await router.push(`/sales/so-impact/2/invoices/${newInv.id}/payments`)
    await router.isReady()

    const wrapper = mount(SalesInvoicePaymentPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Belum ada riwayat pembayaran untuk invoice ini')
    expect(wrapper.text()).toContain('BELUM BAYAR')
  })
})
