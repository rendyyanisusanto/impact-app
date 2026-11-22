import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PurchaseOrderSpreadsheet from '@/modules/procurement/purchase-orders/components/PurchaseOrderSpreadsheet.vue'
import PurchaseOrderMaterialPicker from '@/modules/procurement/purchase-orders/components/PurchaseOrderMaterialPicker.vue'
import { usePurchaseOrderSpreadsheet } from '@/modules/procurement/purchase-orders/composables/usePurchaseOrderSpreadsheet'

describe('Sprint 4 — Task 3: Desktop-Style Spreadsheet Editor & Material Picker', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('3.1 initializes with 10 rows by default', () => {
    const { rows, initRows } = usePurchaseOrderSpreadsheet(10)
    initRows()
    expect(rows.value.length).toBe(10)
    expect(rows.value[0].bahan_id).toBeNull()
    expect(rows.value[0].stok).toBe(0)
    expect(rows.value[0].subtotal).toBe(0)
  })

  it('3.2 renders spreadsheet table headers and rows correctly', async () => {
    const { rows, initRows } = usePurchaseOrderSpreadsheet(10)
    initRows()

    const wrapper = mount(PurchaseOrderSpreadsheet, {
      props: {
        rows: rows.value,
        activeCell: null,
        selectedRowIndex: null,
        isPickerOpen: false,
        pickerAnchorRect: null
      }
    })

    expect(wrapper.text()).toContain('No')
    expect(wrapper.text()).toContain('Nama Bahan')
    expect(wrapper.text()).toContain('Satuan')
    expect(wrapper.text()).toContain('Stok')
    expect(wrapper.text()).toContain('Qty')
    expect(wrapper.text()).toContain('Harga (Rp)')
    expect(wrapper.text()).toContain('Diskon (%)')
    expect(wrapper.text()).toContain('Subtotal (Rp)')
    expect(wrapper.text()).toContain('Keterangan')

    // 10 table body rows rendered
    const tbodyRows = wrapper.findAll('tbody tr')
    expect(tbodyRows.length).toBe(10)
  })

  it('3.3 emits cell-double-click when double-clicking Nama Bahan cell', async () => {
    const { rows, initRows } = usePurchaseOrderSpreadsheet(10)
    initRows()

    const wrapper = mount(PurchaseOrderSpreadsheet, {
      props: {
        rows: rows.value,
        activeCell: null,
        selectedRowIndex: null,
        isPickerOpen: false,
        pickerAnchorRect: null
      }
    })

    const firstBahanCell = wrapper.find('[data-cell-id="0-nama_bahan"]')
    expect(firstBahanCell.exists()).toBe(true)

    await firstBahanCell.trigger('dblclick')
    expect(wrapper.emitted('cell-double-click')).toBeTruthy()
    expect(wrapper.emitted('cell-double-click')![0][0]).toBe(0)
    expect(wrapper.emitted('cell-double-click')![0][1]).toBe('nama_bahan')
  })

  it('3.4 opens material picker and searches materials', async () => {
    const wrapper = mount(PurchaseOrderMaterialPicker, {
      props: {
        isOpen: true,
        anchorRect: null
      }
    })

    // Wait for onMounted materials fetch
    await new Promise(resolve => setTimeout(resolve, 50))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Pilih Bahan Baku')
    expect(wrapper.text()).toContain('Kayu Jati Solid Grade A')
    expect(wrapper.text()).toContain('Busa Density 32')

    // Test filter query
    const searchInput = wrapper.find('input')
    await searchInput.setValue('Kayu')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Kayu Jati Solid Grade A')
    expect(wrapper.text()).not.toContain('Busa Density 32')
  })

  it('3.5 selecting material updates row model, unit, stock, reference price, and subtotal', () => {
    const { rows, initRows, openMaterialPicker, selectMaterialForActiveRow } =
      usePurchaseOrderSpreadsheet(10)
    initRows()

    openMaterialPicker(0)
    selectMaterialForActiveRow({
      id: 1,
      kode: 'MAT-001',
      nama: 'Kayu Jati Solid Grade A',
      qty: 25,
      satuan_beli_id: 1,
      satuan_beli_nama: 'Kubik (m3)',
      harga_satuan: 450000
    })

    const row = rows.value[0]
    expect(row.bahan_id).toBe(1)
    expect(row.nama_bahan).toBe('Kayu Jati Solid Grade A')
    expect(row.satuan_beli_id).toBe(1)
    expect(row.nama_satuan).toBe('Kubik (m3)')
    expect(row.stok).toBe(25) // Read-only stock
    expect(row.qty).toBe(1) // Default qty
    expect(row.harga).toBe(450000)
    expect(row.subtotal).toBe(450000) // 1 * 450.000
  })

  it('3.6 supports adding and removing rows', () => {
    const { rows, initRows, addRow, removeRow } = usePurchaseOrderSpreadsheet(10)
    initRows()
    expect(rows.value.length).toBe(10)

    addRow(2)
    expect(rows.value.length).toBe(12)

    removeRow(11)
    expect(rows.value.length).toBe(11)
  })

  it('3.7 navigates between cells using Arrow keys and Tab', () => {
    const { initRows, activeCell, setActiveCell, handleCellKeyDown } =
      usePurchaseOrderSpreadsheet(10)
    initRows()

    setActiveCell(0, 'qty')
    expect(activeCell.value).toEqual({ rowIndex: 0, colKey: 'qty' })

    // Arrow down
    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    handleCellKeyDown(downEvent, 0, 'qty')
    expect(activeCell.value).toEqual({ rowIndex: 1, colKey: 'qty' })

    // Tab key moves right
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' })
    handleCellKeyDown(tabEvent, 1, 'qty')
    expect(activeCell.value).toEqual({ rowIndex: 1, colKey: 'harga' })
  })
})
