import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SalesOrderNotaPage from '@/modules/sales/pages/SalesOrderNotaPage.vue'
import SalesOrderNotaDocument from '@/modules/sales/components/SalesOrderNotaDocument.vue'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/sales/so-impact/:id/nota',
      name: 'sales-orders-impact-nota',
      component: SalesOrderNotaPage,
      props: { variant: 'impact' }
    }
  ]
})

describe('Sprint 7 — Detail Nota Penjualan & Print Counter', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    salesOrderTransactionService.reset()
    await router.push('/sales/so-impact/1/nota')
  })

  it('1. renders Nota Penjualan layout matching Screenshot 3', async () => {
    const order = await salesOrderTransactionService.getById(1)
    expect(order).not.toBeNull()

    const wrapper = mount(SalesOrderNotaDocument, {
      props: { order: order! }
    })

    expect(wrapper.text()).toContain('NOTA PENJUALAN')
    expect(wrapper.text()).toContain('IMPACT FURNITURE')
    expect(wrapper.text()).toContain(order!.kode)
    expect(wrapper.text()).toContain(order!.customer_nama)
    expect(wrapper.text()).toContain('Biaya Tambahan')
    expect(wrapper.text()).toContain('Tanda Terima Customer')
    expect(wrapper.text()).toContain('Hormat Kami')
  })

  it('2. displays Biaya Tambahan components accurately', async () => {
    const order = await salesOrderTransactionService.getById(1)
    expect(order).not.toBeNull()
    expect(order!.biaya_tambahan.length).toBeGreaterThan(0)

    const wrapper = mount(SalesOrderNotaDocument, {
      props: { order: order! }
    })

    const costItem = order!.biaya_tambahan[0]
    expect(wrapper.text()).toContain(costItem.komponen)
  })

  it('3. displays print counter and allows resetting counter to 0', async () => {
    const wrapper = mount(SalesOrderNotaPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Dicetak:')

    // Trigger reset counter
    const resetButton = wrapper.find('button[title*="Reset counter"]')
    expect(resetButton.exists()).toBe(true)

    await resetButton.trigger('click')
    await flushPromises()

    const updated = await salesOrderTransactionService.getById(1)
    expect(updated?.count_print).toBe(0)
    expect(wrapper.text()).toContain('Dicetak: 0 kali')
  })

  it('4. increments print counter when printing nota document', async () => {
    const order = await salesOrderTransactionService.getById(1)
    const initialCount = order?.count_print || 0

    const newCount = await salesOrderTransactionService.incrementPrintCount(1)
    expect(newCount).toBe(initialCount + 1)

    const updated = await salesOrderTransactionService.getById(1)
    expect(updated?.count_print).toBe(initialCount + 1)
  })
})
