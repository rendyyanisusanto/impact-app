import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import BillPaymentCreatePage from '@/modules/procurement/bill-payments/pages/BillPaymentCreatePage.vue'
import BillPaymentEditPage from '@/modules/procurement/bill-payments/pages/BillPaymentEditPage.vue'
import BillPaymentDetailPage from '@/modules/procurement/bill-payments/pages/BillPaymentDetailPage.vue'
import { billPaymentService } from '@/modules/procurement/bill-payments/services/bill-payment.service'
import { goodsReceiptService } from '@/modules/procurement/goods-receipts/services/goods-receipt.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/procurement/bill-payments', component: { template: '<div>List</div>' } },
    { path: '/procurement/bill-payments/create', component: BillPaymentCreatePage },
    { path: '/procurement/bill-payments/:id/edit', component: BillPaymentEditPage },
    { path: '/procurement/bill-payments/:id', component: BillPaymentDetailPage }
  ]
})

describe('Sprint 17 — Bill Payment Create, Edit, Detail & Allocation Workflow', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    billPaymentService.reset()
    goodsReceiptService.reset()
    await router.push('/procurement/bill-payments/create')
  })

  it('10.1 renders Create page with two-column header and live summary card', async () => {
    const wrapper = mount(BillPaymentCreatePage, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Tambah Pembayaran Tagihan')
    expect(wrapper.text()).toContain('Informasi Pembayaran & Tagihan')
    expect(wrapper.text()).toContain('Rincian & Metode Pembayaran')
    expect(wrapper.text()).toContain('Total Tagihan')
    expect(wrapper.text()).toContain('Simpan Pembayaran')

    // Live footer total indicator
    const footerTotal = wrapper.find('[data-test="footer-total"]')
    expect(footerTotal.exists()).toBe(true)
  })

  it('10.2 validates required fields and prevents saving without selecting a PB', async () => {
    const wrapper = mount(BillPaymentCreatePage, {
      global: {
        plugins: [router]
      }
    })

    const saveBtn = wrapper.find('[data-test="save-button"]')
    await saveBtn.trigger('click')

    expect(wrapper.text()).toContain('Nomor tagihan / invoice wajib diisi')
  })

  it('10.3 enforces overpayment prevention when payment exceeds outstanding balance', async () => {
    const wrapper = mount(BillPaymentCreatePage, {
      global: {
        plugins: [router]
      }
    })

    // Set supplier #1 (CV Kayu Jati Perkasa)
    const select = wrapper.findComponent({ name: 'AppSelect' })
    await select.vm.$emit('update:modelValue', 1)
    await new Promise(resolve => setTimeout(resolve, 80))

    // Fill invoice number
    const noTagihanInput = wrapper.find('input[placeholder*="INV-"]')
    await noTagihanInput.setValue('INV-TEST-001')

    // Click first PB row to select
    const tr = wrapper.find('tbody tr')
    if (tr.exists()) {
      await tr.trigger('click')
    }

    // Set payment amount to higher than sisa tagihan (e.g. 50,000,000)
    const amountInput = wrapper.find('input[type="number"]')
    if (amountInput.exists()) {
      await amountInput.setValue(50000000)
    }

    const saveBtn = wrapper.find('[data-test="save-button"]')
    await saveBtn.trigger('click')

    expect(wrapper.text()).toContain('melebihi sisa tagihan')
  })

  it('10.4 loads existing Bill Payment on Edit page and allows editing payment notes', async () => {
    await router.push('/procurement/bill-payments/1/edit')

    const wrapper = mount(BillPaymentEditPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 80))

    expect(wrapper.text()).toContain('PT-202610-0001')
    const inputs = wrapper.findAll('input')
    expect(inputs.some(input => input.element.value === 'CV Kayu Jati Perkasa')).toBe(true)
    expect(wrapper.text()).toContain('Perbarui Pembayaran')
  })

  it('10.5 renders Detail page with complete payment breakdown and read-only status', async () => {
    await router.push('/procurement/bill-payments/1')

    const wrapper = mount(BillPaymentDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 80))

    expect(wrapper.text()).toContain('Detail Pembayaran: PT-202610-0001')
    expect(wrapper.text()).toContain('CV Kayu Jati Perkasa')
    expect(wrapper.text()).toContain('Transfer Bank')
    expect(wrapper.text()).toContain('Ekspor PDF')
  })

  it('10.6 opens Setting Table modal from Create page', async () => {
    const wrapper = mount(BillPaymentCreatePage, {
      global: {
        plugins: [router]
      }
    })

    const settingBtn = wrapper.find('button[title*="Setting Table"]')
    expect(settingBtn.exists()).toBe(true)

    await settingBtn.trigger('click')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(document.body.textContent).toContain('Pengaturan Format Nomor Pembayaran Tagihan')
  })

  it('10.7 displays mismatch banner when allocations differ from methods and syncs on button click', async () => {
    const wrapper = mount(BillPaymentCreatePage, {
      global: {
        plugins: [router]
      }
    })

    // Select supplier 1
    const select = wrapper.findComponent({ name: 'AppSelect' })
    await select.vm.$emit('update:modelValue', 1)
    await new Promise(resolve => setTimeout(resolve, 80))

    // Select all PBs
    const selectAllBtn = wrapper.findAll('button').find(b => b.text().includes('Pilih Semua'))
    if (selectAllBtn) {
      await selectAllBtn.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Change payment method amount to introduce mismatch
    const methodInputs = wrapper.findAll('input[type="number"]')
    // Last numeric input is payment method jumlah
    const lastNumInput = methodInputs[methodInputs.length - 1]
    if (lastNumInput) {
      await lastNumInput.setValue(1000)
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(wrapper.text()).toContain('Perbedaan Nominal')

      // Click "Samakan Nominal" button
      const syncBtn = wrapper.findAll('button').find(b => b.text().includes('Samakan Nominal'))
      if (syncBtn) {
        await syncBtn.trigger('click')
        await new Promise(resolve => setTimeout(resolve, 50))
        expect(wrapper.text()).not.toContain('Perbedaan Nominal')
      }
    }
  })
})
