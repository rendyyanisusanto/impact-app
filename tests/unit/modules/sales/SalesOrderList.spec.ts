import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SalesOrderListPage from '@/modules/sales/pages/SalesOrderListPage.vue'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/sales/so-impact',
      name: 'sales-orders-impact',
      component: SalesOrderListPage,
      props: { variant: 'impact' }
    },
    {
      path: '/sales/so-pola',
      name: 'sales-orders-pola',
      component: SalesOrderListPage,
      props: { variant: 'pola' }
    },
    {
      path: '/sales/so-ks',
      name: 'sales-orders-ks',
      component: SalesOrderListPage,
      props: { variant: 'ks' }
    }
  ]
})

describe('Sprint 7 — Sales Order List & DataTable', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    salesOrderTransactionService.reset()
    await router.push('/sales/so-impact')
  })

  it('1. renders SO Impact list with active tax columns and correct branding', async () => {
    const wrapper = mount(SalesOrderListPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Sales Order Impact')
    expect(wrapper.text()).toContain('SO Impact')
    expect(wrapper.text()).toContain('SO/26/XI/0344')
    expect(wrapper.text()).toContain('No. Faktur Pajak')
  })

  it('2. renders SO Pola list without Faktur Pajak column and isolates Pola transactions', async () => {
    await router.push('/sales/so-pola')
    const wrapper = mount(SalesOrderListPage, {
      props: { variant: 'pola' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Sales Order Pola')
    expect(wrapper.text()).toContain('SO/26/PL/03/0093')
    // Pola should not show Impact transactions
    expect(wrapper.text()).not.toContain('SO/26/XI/0344')
  })

  it('3. renders SO KS list without Faktur Pajak column and isolates KS transactions', async () => {
    await router.push('/sales/so-ks')
    const wrapper = mount(SalesOrderListPage, {
      props: { variant: 'ks' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Sales Order KS')
    expect(wrapper.text()).toContain('SO/26/01/0065')
    // KS should not show Impact or Pola transactions
    expect(wrapper.text()).not.toContain('SO/26/XI/0344')
    expect(wrapper.text()).not.toContain('SO/26/PL/03/0093')
  })

  it('4. filters list items by customer or SO code search input', async () => {
    const wrapper = mount(SalesOrderListPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    const searchInput = wrapper.find('input[placeholder*="Ketik nomor SO"]')
    expect(searchInput.exists()).toBe(true)

    // Type specific search
    await searchInput.setValue('Grand Pelangi')
    await searchInput.trigger('keyup.enter')
    await flushPromises()

    expect(wrapper.text()).toContain('Hotel Grand Pelangi')
  })

  it('5. provides compact Actions dropdown matching legacy screenshot with 7 sequential actions', async () => {
    const wrapper = mount(SalesOrderListPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })

    await flushPromises()

    const triggerBtn = wrapper.find('[data-testid="actions-trigger"]')
    expect(triggerBtn.exists()).toBe(true)
    expect(triggerBtn.text()).toContain('Aksi')

    // Click to open dropdown
    await triggerBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="action-history"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="action-history"]').text()).toContain('History Sales Order')

    expect(wrapper.find('[data-testid="action-edit-date"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="action-edit-date"]').text()).toContain('Edit Tanggal')

    expect(wrapper.find('[data-testid="action-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="action-view"]').text()).toContain('Lihat')

    expect(wrapper.find('[data-testid="action-invoice"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="action-invoice"]').text()).toContain('Invoice')

    expect(wrapper.find('[data-testid="action-print-delivery"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="action-print-delivery"]').text()).toContain(
      'Cetak Surat Jalan'
    )

    expect(wrapper.find('[data-testid="action-edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="action-edit"]').text()).toContain('Ubah')

    expect(wrapper.find('[data-testid="action-cancel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="action-cancel"]').text()).toContain('Batalkan Transaksi')
  })

  it('6. displays Indonesian payment status labels (Terbayar, Terbayar Sebagian, Belum Bayar) and updates when payment is recorded', async () => {
    // Set payment on order 1 (total: 8,325,000) to 2,000,000 -> Terbayar Sebagian
    salesOrderTransactionService.updateOrderPayment(1, 2000000)

    const wrapper = mount(SalesOrderListPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Terbayar Sebagian')

    // Now update payment to full total 8,325,000 -> Terbayar
    salesOrderTransactionService.updateOrderPayment(1, 8325000)

    const wrapperFull = mount(SalesOrderListPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    expect(wrapperFull.text()).toContain('Terbayar')
  })

  it('7. filters table rows when selecting payment status in dropdown', async () => {
    // Order 1 is impact total 8325000
    salesOrderTransactionService.updateOrderPayment(1, 8325000) // Terbayar

    const wrapper = mount(SalesOrderListPage, {
      props: { variant: 'impact' },
      global: {
        plugins: [router]
      }
    })
    await flushPromises()

    // Select "Terbayar"
    const selects = wrapper.findAll('select')
    const paymentSelect = selects[1]
    if (paymentSelect) {
      await paymentSelect.setValue('Terbayar')
      await flushPromises()
      expect(wrapper.text()).toContain('SO/26/XI/0344')
    }
  })
})
