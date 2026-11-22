import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import InvoicePicker from '@/modules/sales/components/InvoicePicker.vue'
import { salesPaymentService } from '@/modules/sales/services/sales-payment.service'
import { salesInvoiceService } from '@/modules/sales/services/sales-invoice.service'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'

describe('InvoicePicker Component', () => {
  beforeEach(() => {
    salesPaymentService.reset()
    salesInvoiceService.reset()
    salesOrderTransactionService.reset()
  })

  it('1. renders modal and loads eligible invoices with remaining balance when isOpen is true', async () => {
    const wrapper = mount(InvoicePicker, {
      props: {
        isOpen: true,
        modelValue: null
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Pilih Invoice Tagihan Penjualan')
    const items = wrapper.findAll('[data-test="invoice-picker-item"]')
    expect(items.length).toBeGreaterThan(0)
  })

  it('2. filters invoices based on search query', async () => {
    const wrapper = mount(InvoicePicker, {
      props: {
        isOpen: true,
        modelValue: null
      }
    })

    await flushPromises()

    const searchInput = wrapper.find('[data-test="invoice-picker-search"]')
    expect(searchInput.exists()).toBe(true)

    // Search for POLA
    await searchInput.setValue('POLA')
    await flushPromises()

    const items = wrapper.findAll('[data-test="invoice-picker-item"]')
    expect(items.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Bank Artha')
  })

  it('3. displays empty state when search finds no matching invoice', async () => {
    const wrapper = mount(InvoicePicker, {
      props: {
        isOpen: true,
        modelValue: null
      }
    })

    await flushPromises()

    const searchInput = wrapper.find('[data-test="invoice-picker-search"]')
    await searchInput.setValue('NON_EXISTENT_QUERY_XYZ_123')
    await flushPromises()

    expect(wrapper.find('[data-test="invoice-picker-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Tidak ada invoice tagihan yang siap dibayar')
  })

  it('4. emits select and update:modelValue when an invoice item is clicked', async () => {
    const wrapper = mount(InvoicePicker, {
      props: {
        isOpen: true,
        modelValue: null
      }
    })

    await flushPromises()

    const items = wrapper.findAll('[data-test="invoice-picker-item"]')
    expect(items.length).toBeGreaterThan(0)

    await items[0].trigger('click')
    await flushPromises()

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('5. supports keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)', async () => {
    const wrapper = mount(InvoicePicker, {
      props: {
        isOpen: true,
        modelValue: null
      }
    })

    await flushPromises()

    const searchInput = wrapper.find('[data-test="invoice-picker-search"]')

    // Down arrow
    await searchInput.trigger('keydown', { key: 'ArrowDown' })
    // Enter key selects
    await searchInput.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.emitted('select')).toBeTruthy()

    // Escape closes
    await searchInput.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
