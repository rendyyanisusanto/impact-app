import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSalesOrderForm } from '@/modules/sales/composables/useSalesOrderForm'
import { salesOrderTransactionService } from '@/modules/sales/services/sales-order-transaction.service'
import type { Produk } from '@/modules/inventory/products/types/product.types'

describe('Sprint 7 — Sales Order Form & Spreadsheet Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    salesOrderTransactionService.reset()
  })

  it('1. initializes Create mode with exactly 10 empty rows matching Screenshot 1 UX', () => {
    const { rows, form } = useSalesOrderForm('impact', false)

    expect(rows.value.length).toBe(10)
    expect(form.status).toBe(0) // Default draft
    expect(form.is_ppn).toBe(1) // Impact defaults to active PPN
    expect(form.ppn_rate).toBe(11)

    // Check row defaults
    rows.value.forEach(row => {
      expect(row.produk_id).toBeNull()
      expect(row.qty).toBe(0)
      expect(row.harga).toBe(0)
      expect(row.subtotal).toBe(0)
      expect(row.status_produksi).toBe(0) // Ready stock default
    })
  })

  it('2. adds new rows and removes existing rows correctly', () => {
    const { rows, addRow, removeRow } = useSalesOrderForm('impact', false)

    expect(rows.value.length).toBe(10)

    addRow(1)
    expect(rows.value.length).toBe(11)

    removeRow(0)
    expect(rows.value.length).toBe(10)
  })

  it('3. selects a product and auto-calculates row subtotal and totals', () => {
    const { rows, selectProduct, totals } = useSalesOrderForm('impact', false)

    const mockProduct: Produk = {
      id: 101,
      kode: 'PRD-TEST-1',
      nama: 'Sofa Minimalis 2 Seater',
      qty: 8,
      harga: 2500000,
      kategori_barang_id: 1,
      satuan_barang_id: 1,
      gudang_id: 1,
      min_qty: 2,
      status: 1,
      keterangan: null,
      uuid: null,
      foto: null
    }

    selectProduct(0, mockProduct)

    const row0 = rows.value[0]
    expect(row0.produk_id).toBe(101)
    expect(row0.kode_produk).toBe('PRD-TEST-1')
    expect(row0.nama_produk).toBe('Sofa Minimalis 2 Seater')
    expect(row0.stok_saat_ini).toBe(8)
    expect(row0.harga).toBe(2500000)
    expect(row0.qty).toBe(1)
    expect(row0.subtotal).toBe(2500000)

    // Subtotal = 2.500.000, PPN 11% = 275.000, Grand Total = 2.775.000
    expect(totals.value.itemsSubtotal).toBe(2500000)
    expect(totals.value.totalPpn).toBe(275000)
    expect(totals.value.grandTotal).toBe(2775000)
  })

  it('4. manages Biaya Tambahan (komponen_sales_order) and includes them in grand total', () => {
    const { selectProduct, additionalCosts, addCost, updateCost, totals } = useSalesOrderForm(
      'impact',
      false
    )

    const mockProduct: Produk = {
      id: 102,
      kode: 'PRD-TEST-2',
      nama: 'Kursi Cafe Solid',
      qty: 20,
      harga: 500000,
      kategori_barang_id: 1,
      satuan_barang_id: 1,
      gudang_id: 1,
      min_qty: 5,
      status: 1,
      keterangan: null,
      uuid: null,
      foto: null
    }

    selectProduct(0, mockProduct) // 1 unit @ 500.000

    addCost()
    updateCost(0, 'komponen', 'ONGKOS ANGKUT SEMARANG')
    updateCost(0, 'jumlah', 150000)

    expect(additionalCosts.value.length).toBe(1)
    expect(additionalCosts.value[0].komponen).toBe('ONGKOS ANGKUT SEMARANG')
    expect(additionalCosts.value[0].jumlah).toBe(150000)

    // Subtotal items = 500.000
    // Total Sebelum PPN = 500.000
    // PPN 11% = 55.000 (dihitung dari Total Sebelum PPN)
    // Additional costs = 150.000
    // Grand Total = 500.000 + 150.000 + 55.000 = 705.000
    expect(totals.value.itemsSubtotal).toBe(500000)
    expect(totals.value.totalSebelumPpn).toBe(500000)
    expect(totals.value.totalAdditionalCosts).toBe(150000)
    expect(totals.value.totalPpn).toBe(55000)
    expect(totals.value.grandTotal).toBe(705000)
  })

  it('5. handles Non-PPN mode for Pola and KS with zero tax', () => {
    const { form, totals, selectProduct } = useSalesOrderForm('pola', false)

    expect(form.is_ppn).toBe(0)
    expect(form.ppn_rate).toBe(0)

    const mockProduct: Produk = {
      id: 103,
      kode: 'PRD-TEST-3',
      nama: 'Lemari Pakaian 3 Pintu',
      qty: 4,
      harga: 3000000,
      kategori_barang_id: 1,
      satuan_barang_id: 1,
      gudang_id: 1,
      min_qty: 1,
      status: 1,
      keterangan: null,
      uuid: null,
      foto: null
    }

    selectProduct(0, mockProduct)

    expect(totals.value.itemsSubtotal).toBe(3000000)
    expect(totals.value.totalPpn).toBe(0)
    expect(totals.value.grandTotal).toBe(3000000)
  })

  it('6. populates form state from existing order in Edit mode', async () => {
    const existing = await salesOrderTransactionService.getById(1)
    expect(existing).not.toBeNull()

    const { form, rows, additionalCosts, populateFromExisting } = useSalesOrderForm('impact', true)
    populateFromExisting(existing!)

    expect(form.kode).toBe(existing!.kode)
    expect(form.customer_id).toBe(existing!.customer_id)
    expect(rows.value.length).toBe(existing!.items.length)
    expect(additionalCosts.value.length).toBe(existing!.biaya_tambahan.length)
  })

  it('7. automatically sets status to 0 (Draft) when items require production and prevents setting to Selesai', () => {
    const { form, selectProduct, updateCell, hasProductionItems, validate } = useSalesOrderForm(
      'impact',
      false
    )

    const mockProduct: Produk = {
      id: 201,
      kode: 'PRD-TEST-PROD',
      nama: 'Meja Direktur Custom',
      qty: 2, // Stock is only 2
      harga: 1000000,
      kategori_barang_id: 1,
      satuan_barang_id: 1,
      gudang_id: 1,
      min_qty: 1,
      status: 1,
      keterangan: null,
      uuid: null,
      foto: null
    }

    selectProduct(0, mockProduct)
    // Initially qty is 1, which is <= 2 (ready stock)
    expect(hasProductionItems.value).toBe(false)
    form.status = 1 // User selects Selesai

    // Now update qty to 5, which exceeds stock (2) -> triggers status_produksi = 1 (Produksi)
    updateCell(0, 'qty', 5)

    expect(hasProductionItems.value).toBe(true)
    // Rule: ketika sales order ada produk yang diproduksi, statusnya otomatis draft (0)
    expect(form.status).toBe(0)

    // If user somehow tries to set status to 1:
    form.status = 1
    form.kode = 'SO/TEST/001'
    form.customer_id = 1
    form.sales_id = 1
    const valResult = validate()
    expect(valResult.isValid).toBe(false)
    expect(valResult.errors.status).toBeDefined()
    expect(valResult.errors.status).toContain('perlu diproduksi')
  })

  it('8. in Edit mode, allows setting status to Selesai (1) when production is completed', () => {
    const { form, addRow, selectProduct, updateCell, validate } = useSalesOrderForm('impact', true)
    addRow(1)

    const mockProduct: Produk = {
      id: 202,
      kode: 'PRD-TEST-PROD-2',
      nama: 'Kursi Kerja Custom',
      qty: 1,
      harga: 500000,
      kategori_barang_id: 1,
      satuan_barang_id: 1,
      gudang_id: 1,
      min_qty: 1,
      status: 1,
      keterangan: null,
      uuid: null,
      foto: null
    }

    selectProduct(0, mockProduct)
    updateCell(0, 'qty', 10)

    form.kode = 'SO/TEST/002'
    form.customer_id = 1
    form.sales_id = 1
    form.status = 1

    // Saat produksi belum selesai
    const invalidRes = validate({ isProductionCompleted: false })
    expect(invalidRes.isValid).toBe(false)
    expect(invalidRes.errors.status).toContain('belum selesai')

    // Saat produksi sudah selesai
    const validRes = validate({ isProductionCompleted: true })
    expect(validRes.isValid).toBe(true)
    expect(validRes.errors.status).toBeUndefined()
  })

  it('9. supports creating and editing Sales Order with "Tanpa Sales" (sales_id: 0)', async () => {
    // 9.1 Create SO with sales_id = 0 (Tanpa Sales)
    const { form, rows, validate: validateCreate } = useSalesOrderForm('impact', false)
    form.kode = 'SO/TEST/NO-SALES-1'
    form.customer_id = 1
    form.sales_id = 0 // Tanpa Sales
    form.status = 0
    rows.value[0].produk_id = 1
    rows.value[0].qty = 2
    rows.value[0].harga = 100000

    const valResult = validateCreate()
    expect(valResult.isValid).toBe(true)
    expect(valResult.errors.sales_id).toBeUndefined()

    const created = await salesOrderTransactionService.create('impact', form, rows.value)
    expect(created.sales_id).toBe(0)
    expect(created.sales_nama).toBe('Tanpa Sales')

    // 9.2 Edit existing order to change sales to "Tanpa Sales" (0)
    const { form: editForm, rows: editRows, populateFromExisting, validate: validateEdit } =
      useSalesOrderForm('impact', true)

    // Existing draft order #2 originally has sales_id = 119 (Dodo)
    const existing = await salesOrderTransactionService.getById(2)
    expect(existing?.sales_id).toBe(119)

    populateFromExisting(existing!)
    expect(editForm.sales_id).toBe(119)

    // Change to Tanpa Sales (0)
    editForm.sales_id = 0
    const editValResult = validateEdit()
    expect(editValResult.isValid).toBe(true)

    const updated = await salesOrderTransactionService.update(2, editForm, editRows.value)
    expect(updated.sales_id).toBe(0)
    expect(updated.sales_nama).toBe('Tanpa Sales')
  })
})
