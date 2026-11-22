import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SalesOrderPrintPage from '@/modules/sales/pages/SalesOrderPrintPage.vue'
import SalesOrderInvoiceDocument from '@/modules/sales/components/SalesOrderInvoiceDocument.vue'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/sales/so-impact/:id/print',
      name: 'sales-orders-impact-print',
      component: SalesOrderPrintPage,
      props: { variant: 'impact' }
    }
  ]
})

describe('Sprint 7 — Cetak Faktur Penjualan (Invoice Document)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    salesOrderTransactionService.reset()
    await router.push('/sales/so-impact/1/print')
  })

  it('1. renders Faktur Penjualan layout matching Screenshot 4', async () => {
    const order = await salesOrderTransactionService.getById(1)
    expect(order).not.toBeNull()

    const wrapper = mount(SalesOrderInvoiceDocument, {
      props: { order: order! }
    })

    expect(wrapper.text()).toContain('FAKTUR')
    expect(wrapper.text()).toContain('IMPACT FURNITURE')
    expect(wrapper.text()).toContain(order!.kode)
    expect(wrapper.text()).toContain(order!.customer_nama)
    expect(wrapper.text()).toContain('NET / TOTAL')
  })

  it('2. contains 3-column signature blocks: Tanda Terima, Gudang, Hormat Kami', async () => {
    const order = await salesOrderTransactionService.getById(1)
    expect(order).not.toBeNull()

    const wrapper = mount(SalesOrderInvoiceDocument, {
      props: { order: order! }
    })

    expect(wrapper.text()).toContain('Tanda Terima,')
    expect(wrapper.text()).toContain('Bagian Gudang,')
    expect(wrapper.text()).toContain('Hormat Kami,')
    expect(wrapper.text()).toContain(order!.sales_nama)
  })

  it('3. renders print trigger button on SalesOrderPrintPage', async () => {
    const wrapper = mount(SalesOrderPrintPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    const printBtn = wrapper.find('button.bg-primary')
    expect(printBtn.exists()).toBe(true)
    expect(wrapper.text()).toContain('Cetak Faktur (Print)')
  })
})
