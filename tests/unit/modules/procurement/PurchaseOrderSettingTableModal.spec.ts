import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PurchaseOrderHeaderForm from '@/modules/procurement/purchase-orders/components/PurchaseOrderHeaderForm.vue'
import PurchaseOrderSettingTableModal from '@/modules/procurement/purchase-orders/components/PurchaseOrderSettingTableModal.vue'
import { purchaseOrderService } from '@/modules/procurement/purchase-orders/services/purchase-order.service'

vi.mock('@/shared/composables/usePermission', () => ({
  usePermission: () => ({
    hasPermission: vi.fn(() => true)
  })
}))

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('@/shared/composables/useToast', () => ({
  useToast: () => mockToast
}))

describe('Sprint 15 — Fitur Baru: Setting Table Purchase Order', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    purchaseOrderService.reset()
  })

  it('1. renders Setting Table button next to Generate button on PurchaseOrderHeaderForm', () => {
    const wrapper = mount(PurchaseOrderHeaderForm, {
      attachTo: document.body,
      props: {
        header: {
          kode: 'PO/0001',
          suplier_id: null,
          tanggal: '2026-11-18',
          keterangan: '',
          is_ppn: false,
          ppn_id: null,
          status_transaksi_id: 1,
          status: 0,
          diskon_persen: 0
        }
      }
    })

    const buttons = wrapper.findAll('button')
    const generateBtn = buttons.find(b => b.text().includes('Generate'))
    const settingTableBtn = buttons.find(b => b.text().includes('Setting Table'))

    expect(generateBtn).toBeDefined()
    expect(settingTableBtn).toBeDefined()
    expect(settingTableBtn?.html()).toContain('Setting Table')
  })

  it('2. opens PurchaseOrderSettingTableModal when Setting Table button is clicked', async () => {
    const wrapper = mount(PurchaseOrderHeaderForm, {
      attachTo: document.body,
      props: {
        header: {
          kode: 'PO/0001',
          suplier_id: null,
          tanggal: '2026-11-18',
          keterangan: '',
          is_ppn: false,
          ppn_id: null,
          status_transaksi_id: 1,
          status: 0,
          diskon_persen: 0
        }
      }
    })

    const settingTableBtn = wrapper.findAll('button').find(b => b.text().includes('Setting Table'))
    expect(settingTableBtn).toBeDefined()

    await settingTableBtn?.trigger('click')

    const modal = wrapper.findComponent(PurchaseOrderSettingTableModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props('modelValue')).toBe(true)
  })

  it('3. PurchaseOrderSettingTableModal renders supported placeholders and preview', async () => {
    mount(PurchaseOrderSettingTableModal, {
      attachTo: document.body,
      props: {
        modelValue: true
      }
    })

    // Wait for fetchSettings to resolve
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(document.body.textContent).toContain('Pengaturan Format Kode Purchase Order')
    expect(document.body.textContent).toContain('{last_number}')
    expect(document.body.textContent).toContain('{year}')
    expect(document.body.textContent).toContain('{month}')
    expect(document.body.textContent).toContain('{date}')
    expect(document.body.textContent).toContain('Preview Hasil Kode Real-time')
  })

  it('4. clicking a placeholder token appends it to template input', async () => {
    mount(PurchaseOrderSettingTableModal, {
      attachTo: document.body,
      props: {
        modelValue: true
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const buttons = Array.from(document.body.querySelectorAll('button'))
    const monthTokenBtn = buttons.find(b => b.textContent?.includes('{month}'))
    expect(monthTokenBtn).toBeDefined()

    monthTokenBtn?.click()
    await new Promise(resolve => setTimeout(resolve, 20))

    const input = document.body.querySelector('input')
    expect(input?.value).toContain('{month}')
  })

  it('5. saves updated template and emits saved event', async () => {
    const updateSpy = vi.spyOn(purchaseOrderService, 'updateSettingTable')

    const wrapper = mount(PurchaseOrderSettingTableModal, {
      attachTo: document.body,
      props: {
        modelValue: true
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const input = document.body.querySelector('input')
    expect(input).not.toBeNull()
    if (input) {
      input.value = 'PO/{year}/{last_number}'
      input.dispatchEvent(new Event('input'))
    }

    const buttons = Array.from(document.body.querySelectorAll('button'))
    const saveBtn = buttons.find(b => b.textContent?.includes('Simpan Pengaturan'))
    expect(saveBtn).toBeDefined()

    saveBtn?.click()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(updateSpy).toHaveBeenCalledWith('PO/{year}/{last_number}')
    expect(mockToast.success).toHaveBeenCalledWith(
      expect.stringContaining('berhasil disimpan')
    )
    expect(wrapper.emitted('saved')).toBeTruthy()
  })

  it('6. validates and prevents saving empty template', async () => {
    mount(PurchaseOrderSettingTableModal, {
      attachTo: document.body,
      props: {
        modelValue: true
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const input = document.body.querySelector('input')
    expect(input).not.toBeNull()
    if (input) {
      input.value = '   '
      input.dispatchEvent(new Event('input'))
    }

    const buttons = Array.from(document.body.querySelectorAll('button'))
    const saveBtn = buttons.find(b => b.textContent?.includes('Simpan Pengaturan'))
    saveBtn?.click()
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(mockToast.error).toHaveBeenCalledWith('Template format kode tidak boleh kosong.')
  })
})
