import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import GoodsReceiptCreatePage from '@/modules/procurement/goods-receipts/pages/GoodsReceiptCreatePage.vue'
import GoodsReceiptEditPage from '@/modules/procurement/goods-receipts/pages/GoodsReceiptEditPage.vue'
import GoodsReceiptDetailPage from '@/modules/procurement/goods-receipts/pages/GoodsReceiptDetailPage.vue'
import { goodsReceiptService } from '@/modules/procurement/goods-receipts/services/goods-receipt.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/procurement/goods-receipts', component: { template: '<div>List</div>' } },
    { path: '/procurement/goods-receipts/create', component: GoodsReceiptCreatePage },
    { path: '/procurement/goods-receipts/:id/edit', component: GoodsReceiptEditPage },
    { path: '/procurement/goods-receipts/:id', component: GoodsReceiptDetailPage }
  ]
})

describe('Sprint 4 — Task 7: Goods Receipt Create, Edit, Detail & Spreadsheet Editor', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    goodsReceiptService.reset()
    await router.push('/procurement/goods-receipts/create')
  })

  it('7.1 renders Create page with two-column header, empty spreadsheet state, and action footer with Total', async () => {
    const wrapper = mount(GoodsReceiptCreatePage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Tambah Penerimaan Barang')
    expect(wrapper.text()).toContain('Kode PB')
    expect(wrapper.text()).toContain('Pilih Purchase Order (PO)')
    expect(wrapper.text()).toContain('Gudang Penerimaan')
    expect(wrapper.text()).toContain('Nomor Surat Jalan')
    expect(wrapper.text()).toContain('Belum ada item bahan yang dimuat')

    // Bottom action bar contains Total beside Batalkan
    expect(wrapper.text()).toContain('Total:')
    expect(wrapper.text().replace(/\u00a0/g, ' ')).toContain('Rp 0')
    expect(wrapper.text()).toContain('Batalkan')
    expect(wrapper.text()).toContain('Simpan Data')
  })

  it('7.2 selecting a Purchase Order loads items, sets supplier context, and computes total', async () => {
    const wrapper = mount(GoodsReceiptCreatePage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    // Select PO 53 (Busa density 32 - has remaining unreceived quantity)
    const selectPo = wrapper.find('select')
    expect(selectPo.exists()).toBe(true)

    await selectPo.setValue('53')
    await selectPo.trigger('change')
    await new Promise(resolve => setTimeout(resolve, 80))
    await wrapper.vm.$nextTick()

    // Supplier context appears
    expect(wrapper.text()).toContain('PT Busa Mandiri Abadi')
    expect(wrapper.text()).toContain('PO/30-12-24-1573')

    // Material row loaded
    expect(wrapper.text()).toContain('Busa Density 32')
    expect(wrapper.text()).toContain('Dus / Karton')

    // Live total is calculated
    expect(wrapper.text()).toContain('Total:')
  })

  it('7.3 displays validation error if trying to save with no selected PO or empty rows', async () => {
    const wrapper = mount(GoodsReceiptCreatePage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    const saveBtn = wrapper.findAll('button').find(b => b.text().includes('Simpan Data'))
    expect(saveBtn).toBeDefined()

    await saveBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Mohon perbaiki kesalahan berikut')
  })

  it('7.4 loads existing Goods Receipt on Edit page with pre-filled quantities and total', async () => {
    await router.push('/procurement/goods-receipts/1/edit')

    const wrapper = mount(GoodsReceiptEditPage, {
      global: {
        plugins: [router],
        stubs: {
          AppConfirmDialog: true
        }
      }
    })

    await new Promise(resolve => setTimeout(resolve, 80))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Edit Penerimaan Barang: PB/30-12-24-0001')
    const noSjInput = wrapper.find('input[placeholder*="SJ-2024"]').element as HTMLInputElement
    expect(noSjInput.value).toBe('SJ-JTI-8891')
    expect(wrapper.text()).toContain('Kayu Jati Solid Grade A')
    expect(wrapper.text()).toContain('Simpan Perubahan')
    expect(wrapper.text()).toContain('Total:')
    expect(wrapper.text()).toContain('6.750.000')
  })

  it('7.5 renders Detail page with complete read-only data, summary, and print action', async () => {
    await router.push('/procurement/goods-receipts/2')

    const wrapper = mount(GoodsReceiptDetailPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 80))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Detail Penerimaan: PB/31-12-24-0002')
    expect(wrapper.text()).toContain('SJ-BMA-4421')
    expect(wrapper.text()).toContain('PT Busa Mandiri Abadi')
    expect(wrapper.text()).toContain('Busa Density 32')
    expect(wrapper.text()).toContain('600') // Qty terima
    expect(wrapper.text()).toContain('Edit Dokumen')
    expect(wrapper.text()).toContain('Cetak')
  })

  it('7.6 generates PB code matching format PB/{year}{month}-{last_number}', async () => {
    const generated = await goodsReceiptService.generateCode('2026-11-18')
    expect(generated).toMatch(/^PB\/\d{4}-\d{4}$/)
    expect(generated).toBe('PB/2611-0001')
  })
})
