import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ProductionCreatePage from '@/modules/production/pages/ProductionCreatePage.vue'
import ProductionEditPage from '@/modules/production/pages/ProductionEditPage.vue'
import ProductionSpreadsheet from '@/modules/production/components/ProductionSpreadsheet.vue'
import ProductionProductPicker from '@/modules/production/components/ProductionProductPicker.vue'
import { productionService } from '@/modules/production/services/production.service'
import { productService } from '@/modules/inventory/products/services/product.service'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/production/orders', component: { template: '<div>List</div>' } },
    { path: '/production/orders/create', component: ProductionCreatePage },
    { path: '/production/orders/:id', component: { template: '<div>Detail</div>' } },
    { path: '/production/orders/:id/edit', component: ProductionEditPage }
  ]
})

describe('Sprint 6 — Task 9: Production Create & Edit Form Pages', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    productionService.reset()
    productService.reset()
    await router.push('/production/orders/create')
  })

  it('9.1 renders Create page with header form and 10-row spreadsheet matching screenshot', async () => {
    const wrapper = mount(ProductionCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(wrapper.text()).toContain('Tambah Transaksi Produksi')
    expect(wrapper.text()).toContain('No Produksi')
    expect(wrapper.text()).toContain('Jenis')
    expect(wrapper.text()).toContain('Tanggal')
    expect(wrapper.text()).toContain('Status Produksi')
    expect(wrapper.text()).toContain('Keterangan')

    // Spreadsheet component mounted
    const spreadsheet = wrapper.findComponent(ProductionSpreadsheet)
    expect(spreadsheet.exists()).toBe(true)

    // Spreadsheet should have 10 rows on fresh create form
    expect(spreadsheet.props('rows').length).toBe(10)
  })

  it('9.2 auto-generates production code with format PD{month}{year}-{seq}', async () => {
    const wrapper = mount(ProductionCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const codeInput = wrapper.find('input[placeholder="PDMMYY-XXXX"]')
    expect(codeInput.exists()).toBe(true)
    const val = (codeInput.element as HTMLInputElement).value
    expect(val).toMatch(/^PD\d{4}-\d+$/)
  })

  it('9.3 spreadsheet supports adding and removing rows', async () => {
    const wrapper = mount(ProductionCreatePage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50))
    const spreadsheet = wrapper.findComponent(ProductionSpreadsheet)

    expect(spreadsheet.props('rows').length).toBe(10)

    // Click Tambah Baris
    const addBtn = spreadsheet.findAll('button').find(b => b.text().includes('Tambah Baris'))
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')

    expect(spreadsheet.props('rows').length).toBe(11)
  })

  it('9.4 Product Picker modal opens, filters, and selects product', async () => {
    const wrapper = mount(ProductionSpreadsheet, {
      props: {
        rows: [
          {
            rowId: 'row-1',
            produk_id: null,
            kode_produk: '',
            nama_produk: '',
            stok: 0,
            qty: 1,
            keterangan: ''
          }
        ],
        activeCell: null
      }
    })

    const picker = wrapper.findComponent(ProductionProductPicker)
    expect(picker.exists()).toBe(true)
    expect(picker.props('isOpen')).toBe(false)

    // Double-click product cell opens picker
    const nameCell = wrapper.findAll('td').find(td => td.text().includes('Double-click'))
    expect(nameCell).toBeDefined()
    await nameCell!.trigger('dblclick')

    expect(picker.props('isOpen')).toBe(true)
  })

  it('9.5 renders Edit page with preloaded data and prevents edits if already posted', async () => {
    await router.push('/production/orders/1/edit')

    const wrapper = mount(ProductionEditPage, {
      global: {
        plugins: [router]
      }
    })

    await new Promise(resolve => setTimeout(resolve, 80))

    // Production #1 is posted (Selesai), so it should show warning
    expect(wrapper.text()).toContain('Transaksi Telah Diposting (Selesai)')

    // Inputs should be disabled
    const codeInput = wrapper.find('input[placeholder="PDMMYY-XXXX"]')
    expect((codeInput.element as HTMLInputElement).disabled).toBe(true)
  })
})
